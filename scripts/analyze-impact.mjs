import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const normalize = (name) => name.replace(/\\/g, "/");
const idPattern = /^(?:REQ|SCN|TP)-[A-Z0-9-]+$/;
const globalFiles = new Set(["playwright.config.ts", "package.json", "package-lock.json", ".env.example"]);

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const name = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(name);
    return entry.isFile() && /\.(ts|mjs|html|md|json|ya?ml)$/.test(entry.name) ? [name] : [];
  });
}

export function analyzeImpact(root, inputs) {
  if (!inputs.length) throw new Error("Provide at least one registered ID or repository path.");
  root = path.resolve(root);
  const files = [...new Set([
    ...["config", "docs", "fixtures", "locators", "pages", "public", "scripts", "tests", "utils", ".github/workflows"]
      .flatMap((folder) => walk(path.join(root, folder))),
    ...[...globalFiles, "tsconfig.json"].map((name) => path.join(root, name)).filter(fs.existsSync),
  ])].sort();
  const sources = new Map(files.map((name) => [name, fs.readFileSync(name, "utf8")]));
  const tracker = sources.get(path.join(root, "docs", "traceability-tracker.md")) ?? "";
  const mappings = tracker.split(/\r?\n/).filter((line) => /^\|\s*REQ-/.test(line)).map((line) => {
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    return { requirement: cells[0], module: cells[1], plan: cells[2], scenario: cells[3], risk: cells[5] };
  });
  const dependencies = new Map();
  const unresolved = [];
  const sourceWarnings = new Map();
  let options = {};
  const configPath = path.join(root, "tsconfig.json");
  if (fs.existsSync(configPath)) {
    const configFile = ts.parseConfigFileTextToJson("tsconfig.json", fs.readFileSync(configPath, "utf8"));
    if (configFile.error) throw new Error(`Invalid tsconfig.json: ${ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n")}`);
    const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
    if (parsed.errors.length) {
      throw new Error(parsed.errors.map((error) => ts.flattenDiagnosticMessageText(error.messageText, "\n")).join("\n"));
    }
    options = parsed.options;
  } else {
    unresolved.push("Missing tsconfig.json: alias resolution requires review.");
  }
  for (const [name, source] of sources) {
    if (!/\.(ts|mjs)$/.test(name)) continue;
    const syntax = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true);
    const imports = [];
    const warnings = [];
    function visit(node) {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier &&
          ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        warnings.push(`${normalize(path.relative(root, name))}: dynamic import requires review`);
      }
      ts.forEachChild(node, visit);
    }
    visit(syntax);
    const resolved = [];
    for (const specifier of imports) {
      const target = ts.resolveModuleName(specifier, name, options, ts.sys).resolvedModule;
      if (target && !target.isExternalLibraryImport && sources.has(path.resolve(target.resolvedFileName))) {
        resolved.push(path.resolve(target.resolvedFileName));
      } else if (specifier.startsWith(".") || Object.keys(options.paths ?? {}).some((alias) => {
        const [prefix, suffix] = alias.split("*");
        return suffix === undefined ? specifier === alias : specifier.startsWith(prefix) && specifier.endsWith(suffix);
      })) {
        warnings.push(`${normalize(path.relative(root, name))}: unresolved local import ${specifier}`);
      }
    }
    dependencies.set(name, resolved);
    sourceWarnings.set(name, warnings);
  }
  const testFiles = files.filter((name) => normalize(path.relative(root, name)).startsWith("tests/") && name.endsWith(".spec.ts"));
  const seeds = new Set();
  const selectedMappings = new Map();
  const unmatched = [];
  let globalChange = false;
  for (const input of inputs) {
    if (idPattern.test(input)) {
      const matches = mappings.filter((row) => [row.requirement, row.scenario, row.plan].includes(input));
      if (!matches.length) { unmatched.push(input); continue; }
      for (const row of matches) {
        selectedMappings.set(row.scenario, row);
        const pattern = new RegExp(`\\b${row.scenario}(?![A-Z0-9-])`);
        for (const name of testFiles) if (pattern.test(sources.get(name))) seeds.add(name);
      }
    } else {
      const name = path.resolve(root, input);
      const relative = normalize(path.relative(root, name));
      if (relative.startsWith("../") || !sources.has(name)) { unmatched.push(input); continue; }
      seeds.add(name);
      if (globalFiles.has(relative) || relative === "tsconfig.json" || relative.startsWith(".github/workflows/")) {
        globalChange = true;
        testFiles.forEach((testFile) => seeds.add(testFile));
      }
      if (relative.startsWith("docs/")) {
        const ids = sources.get(name).match(/\bSCN-[A-Z0-9-]+/g) ?? [];
        for (const row of mappings.filter((mapping) => ids.includes(mapping.scenario))) {
          selectedMappings.set(row.scenario, row);
          for (const testFile of testFiles) {
            if (new RegExp(`\\b${row.scenario}(?![A-Z0-9-])`).test(sources.get(testFile))) seeds.add(testFile);
          }
        }
      }
    }
  }
  const affected = new Set(seeds);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [name, imported] of dependencies) {
      if (!affected.has(name) && imported.some((dependency) => affected.has(dependency))) {
        affected.add(name);
        changed = true;
      }
    }
  }
  const impactedTests = testFiles.filter((name) => affected.has(name));
  const artifacts = new Set(affected);
  function addDependencies(name) {
    for (const dependency of dependencies.get(name) ?? []) {
      if (!artifacts.has(dependency)) { artifacts.add(dependency); addDependencies(dependency); }
    }
  }
  for (const name of affected) addDependencies(name);
  for (const name of impactedTests) {
    for (const row of mappings) {
      if (new RegExp(`\\b${row.scenario}(?![A-Z0-9-])`).test(sources.get(name))) selectedMappings.set(row.scenario, row);
    }
  }
  const rows = [...selectedMappings.values()];
  const documents = [];
  for (const [name, source] of sources) {
    if (!normalize(path.relative(root, name)).startsWith("docs/")) continue;
    const ids = new Set(rows.flatMap((row) => [row.requirement, row.scenario, row.plan]));
    const lines = source.split(/\r?\n/);
    const matches = lines.flatMap((line, index) =>
      [...ids].some((id) => new RegExp(`\\b${id}(?![A-Z0-9-])`).test(line)) ? [index + 1] : []);
    if (matches.length) {
      documents.push({ file: normalize(path.relative(root, name)), lines: matches });
      artifacts.add(name);
    }
  }
  const strategySections = new Set();
  for (const row of rows) {
    const name = row.scenario.startsWith("SCN-API-") ? "api-test-plan.md" : "functional-test-plan.md";
    const plan = sources.get(path.join(root, "docs", name)) ?? "";
    const section = row.scenario.startsWith("SCN-API-") ? plan.split("## 4.")[1]?.split("\n## ")[0] :
      plan.split(new RegExp(`^## ${row.plan}\\b`, "m"))[1]?.split("\n## ")[0];
    const alignment = section?.match(/\*\*Test Strategy alignment:\*\* ([^\n]+)/)?.[1] ?? "";
    for (const reference of alignment.match(/\d+(?:\.\d+)?/g) ?? []) strategySections.add(reference);
  }
  if (strategySections.size) artifacts.add(path.join(root, "docs", "test-strategy-template.md"));
  for (const name of artifacts) unresolved.push(...(sourceWarnings.get(name) ?? []));
  const modules = [...new Set(rows.map((row) => row.module))].sort();
  const severity = globalChange || modules.length > 1 ? "High" : impactedTests.length ? "Medium" : "Unknown";
  const relativeFiles = [...artifacts].map((name) => normalize(path.relative(root, name))).sort();
  return {
    inputs, unmatched, severity,
    rationale: globalChange ? "Shared execution configuration affects the full suite." :
      modules.length > 1 ? "Dependency scope spans multiple registered modules; owner review required." :
      "Conservative file-level dependency scope; business severity requires owner confirmation.",
    modules, scenarios: rows.map((row) => row.scenario).sort(),
    registeredRisks: [...new Set(rows.map((row) => row.risk))].sort(),
    tests: impactedTests.map((name) => normalize(path.relative(root, name))),
    artifacts: relativeFiles, documents, strategySections: [...strategySections].sort(),
    approvalRequired: true,
    approvalReason: "Review this impact signal before material behavior, contract, target, or scope changes; analysis is not authorization.",
    requiredActions: ["Review affected tests and dependency artifacts.", "Review linked plan/strategy mappings and requirement-owner source before semantic changes."],
    testDataReview: relativeFiles.filter((name) => name.startsWith("fixtures/")),
    validation: ["npm run quality-gate", ...(impactedTests.length ?
      [`npx playwright test ${impactedTests.map((name) => normalize(path.relative(root, name))).join(" ")}`] : [])],
    unresolved,
    limitations: ["File-level scope may include sibling scenarios.", "Runtime UI/network links, computed dependencies, deleted files, and external requirement systems are not inferred."],
    scan: { files: files.length, bytes: [...sources.values()].reduce((sum, source) => sum + Buffer.byteLength(source), 0) },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const inputs = args.filter((argument) => argument !== "--json");
  if (!inputs.length) {
    console.error("Usage: npm run impact:analyze -- <REQ-ID|SCN-ID|TP-ID|repository-path> [...] [--json]");
    process.exitCode = 1;
  } else {
    const report = analyzeImpact(process.cwd(), inputs);
    if (json) console.log(JSON.stringify(report, null, 2));
    else {
      console.log(`Impact: ${report.severity} | ${report.tests.length} test files | ${report.scenarios.length} scenarios`);
      console.log(report.rationale);
      console.log(`Modules: ${report.modules.join(", ") || "unresolved"}`);
      console.log(`Scenarios: ${report.scenarios.join(", ") || "unresolved"}`);
      console.log(`Registered risks: ${report.registeredRisks.join(", ") || "unresolved"}`);
      console.log(`Artifacts:\n${report.artifacts.map((name) => `- ${name}`).join("\n")}`);
      console.log(`Strategy sections: ${report.strategySections.join(", ") || "unresolved"}`);
      console.log(`Test data review: ${report.testDataReview.join(", ") || "none identified"}`);
      console.log(`Approval: ${report.approvalReason}`);
      console.log(`Required actions:\n${report.requiredActions.map((action) => `- ${action}`).join("\n")}`);
      console.log(`Validation:\n${report.validation.join("\n")}`);
      console.log(`Limitations: ${[...report.limitations, ...report.unresolved].join("; ")}`);
      console.log(`Scan: ${report.scan.files} files | ${report.scan.bytes} bytes read`);
      if (report.unmatched.length) console.error(`Unmatched inputs: ${report.unmatched.join(", ")}`);
    }
    if (report.unmatched.length) process.exitCode = 1;
  }
}
