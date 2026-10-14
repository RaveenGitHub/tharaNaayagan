import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const trackerPath = path.join(root, "docs", "traceability-tracker.md");
const apiPlanPath = path.join(root, "docs", "api-test-plan.md");
const functionalPlanPath = path.join(root, "docs", "functional-test-plan.md");
const strategyPath = path.join(root, "docs", "test-strategy-template.md");
const testsPath = path.join(root, "tests");

function readRequiredFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Required traceability source not found: ${path.relative(root, filePath)}`,
    );
  }
  return fs.readFileSync(filePath, "utf8");
}

function tableRowsAfter(markdown, heading) {
  const headingIndex = markdown.indexOf(heading);
  if (headingIndex < 0) {
    throw new Error(`Required Markdown section not found: ${heading}`);
  }

  const lines = markdown.slice(headingIndex + heading.length).split(/\r?\n/);
  let foundHeader = false;
  let foundSeparator = false;
  const rows = [];

  for (const line of lines) {
    if (!line.trim().startsWith("|")) {
      if (foundSeparator) break;
      continue;
    }

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim().replace(/\*\*/g, "").replace(/`/g, ""));

    if (!foundHeader) {
      foundHeader = true;
      continue;
    }
    if (!foundSeparator) {
      foundSeparator = true;
      continue;
    }
    if (cells.length > 1) rows.push(cells);
  }

  if (!foundHeader || !foundSeparator) {
    throw new Error(`Markdown table is missing a header or separator: ${heading}`);
  }
  return rows;
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory()
      ? walk(entryPath)
      : entry.isFile() && entry.name.endsWith(".spec.ts")
        ? [entryPath]
        : [];
  });
}

function testCasesIn(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const syntax = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const cases = [];
  const testNames = new Set(["test"]);
  for (const statement of syntax.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const binding of bindings.elements) {
      if ((binding.propertyName || binding.name).text === "test") testNames.add(binding.name.text);
    }
  }
  function visit(node, disabled = false) {
    if (ts.isCallExpression(node)) {
      let expression = node.expression;
      const modifiers = [];
      while (ts.isPropertyAccessExpression(expression) || ts.isElementAccessExpression(expression)) {
        const name = ts.isPropertyAccessExpression(expression) ? expression.name : expression.argumentExpression;
        if (!name || (ts.isElementAccessExpression(expression) && !ts.isStringLiteral(name))) {
          modifiers.unshift("<dynamic>");
        } else {
          modifiers.unshift(name.text);
        }
        expression = expression.expression;
      }
      if (ts.isIdentifier(expression) && testNames.has(expression.text)) {
        if (modifiers.includes("<dynamic>")) {
          errors.push(`${path.relative(root, filePath)}: computed test modifiers are not supported.`);
        }
        const blocked = disabled || modifiers.some((name) => ["skip", "fixme"].includes(name));
        if (modifiers[0] === "describe") {
          ts.forEachChild(node, (child) => visit(child, blocked));
          return;
        }
        if (modifiers.length === 0 || ["only", "skip", "fixme", "fail"].includes(modifiers[0])) {
          const title = node.arguments[0];
          if (title && (ts.isStringLiteral(title) || ts.isNoSubstitutionTemplateLiteral(title))) {
            const callback = node.arguments.find((argument) =>
              ts.isArrowFunction(argument) || ts.isFunctionExpression(argument),
            );
            cases.push({ title: title.text, filePath, runnable: !blocked && !!callback });
          } else {
            errors.push(`${path.relative(root, filePath)}: test titles and skip/fixme conditions must be statically reviewable; dynamic declarations are not supported.`);
          }
        }
      }
    }
    ts.forEachChild(node, (child) => visit(child, disabled));
  }
  visit(syntax);
  return cases;
}

function strategyReferences(section) {
  const alignment = section.match(
    /\*\*Test Strategy alignment:\*\* Sections?\s+([0-9.]+(?:\s+and\s+[0-9.]+)*)/,
  );
  return alignment?.[1].match(/[0-9]+(?:\.[0-9]+)?/g) || [];
}

function validateStrategyReferences(sectionId, section, strategy, errors) {
  const references = strategyReferences(section);
  if (references.length === 0) {
    errors.push(`${sectionId}: no Test Strategy section is linked from its test-plan section.`);
    return;
  }

  for (const reference of references) {
    const escapedReference = reference.replace(".", "\\.");
    const heading = new RegExp(`^#{2,3}\\s+${escapedReference}(?:\\.|\\s|$)`, "m");
    if (!heading.test(strategy)) {
      errors.push(`${sectionId}: Test Strategy section ${reference} does not exist.`);
    }
  }
}

function sectionContent(markdown, heading) {
  const headingIndex = markdown.indexOf(heading);
  if (headingIndex < 0) return undefined;
  const contentStart = markdown.indexOf("\n", headingIndex) + 1;
  const nextHeading = markdown.indexOf("\n## ", contentStart);
  return markdown.slice(contentStart, nextHeading < 0 ? undefined : nextHeading);
}

const tracker = readRequiredFile(trackerPath);
const apiPlan = readRequiredFile(apiPlanPath);
const functionalPlan = readRequiredFile(functionalPlanPath);
const strategy = readRequiredFile(strategyPath);
const trackerRows = tableRowsAfter(tracker, "## Current traceability matrix");
const apiScenarioRows = tableRowsAfter(apiPlan, "## 4. API Scenario Test Matrix");

const trackerMappings = new Map();
const trackerPlanIds = new Map();
const trackerStatuses = new Map();
for (const row of trackerRows) {
  const [requirementId, , planId, scenarioId] = row;
  if (!/^REQ-[A-Z0-9-]+$/.test(requirementId) || !/^SCN-[A-Z0-9-]+$/.test(scenarioId)) {
    throw new Error(`Invalid requirement/scenario ID in tracker row: ${row.join(" | ")}`);
  }
  if (trackerMappings.has(scenarioId)) {
    throw new Error(`Duplicate scenario ID in tracker matrix: ${scenarioId}`);
  }
  trackerMappings.set(scenarioId, requirementId);
  trackerPlanIds.set(scenarioId, planId);
  if (!row[1]) throw new Error(`${scenarioId}: module/area is missing.`);
  trackerStatuses.set(scenarioId, row[9]);
}

const errors = [];
const functionalPlanSections = new Map();
let currentFunctionalPlanId;
let currentFunctionalPlanLines = [];
function saveFunctionalPlanSection() {
  if (!currentFunctionalPlanId) return;
  const content = currentFunctionalPlanLines.join("\n");
  if (functionalPlanSections.has(currentFunctionalPlanId)) {
    errors.push(`Duplicate functional test plan section: ${currentFunctionalPlanId}.`);
  }
  functionalPlanSections.set(currentFunctionalPlanId, content);
  validateStrategyReferences(currentFunctionalPlanId, content, strategy, errors);
}

for (const line of functionalPlan.split(/\r?\n/)) {
  const heading = line.match(/^## (TP-[A-Z0-9-]+)\b/);
  if (heading) {
    saveFunctionalPlanSection();
    currentFunctionalPlanId = heading[1];
    currentFunctionalPlanLines = [];
  } else if (line.startsWith("## ")) {
    saveFunctionalPlanSection();
    currentFunctionalPlanId = undefined;
    currentFunctionalPlanLines = [];
  } else if (currentFunctionalPlanId) {
    currentFunctionalPlanLines.push(line);
  }
}
saveFunctionalPlanSection();

const automationTargets = new Map();
for (const [planId, section] of functionalPlanSections) {
  for (const line of section.split(/\r?\n/)) {
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim().replace(/`/g, ""));
    if (!cells[1]?.startsWith("SCN-")) continue;
    const [requirementId, scenarioId, , , target] = cells;
    if (trackerMappings.get(scenarioId) !== requirementId || trackerPlanIds.get(scenarioId) !== planId) {
      errors.push(`${scenarioId}: functional plan mapping does not match the tracker.`);
    }
    if (automationTargets.has(scenarioId)) errors.push(`Duplicate functional plan scenario: ${scenarioId}.`);
    if (target?.endsWith(".spec.ts")) {
      const targetPath = path.resolve(root, target);
      if (!target.startsWith("tests/") || !fs.existsSync(targetPath)) {
        errors.push(`${scenarioId}: automation target does not exist under tests/: ${target}.`);
      }
      automationTargets.set(scenarioId, targetPath);
    }
  }
}

for (const [scenarioId, requirementId] of trackerMappings) {
  if (scenarioId.startsWith("SCN-API-")) continue;

  const planId = trackerPlanIds.get(scenarioId);
  const section = functionalPlanSections.get(planId);
  if (!section) {
    errors.push(`${scenarioId}: test plan section ${planId} does not exist in functional-test-plan.md.`);
    continue;
  }

  const scenarioRow = new RegExp(`\\|\\s*${requirementId}\\s*\\|\\s*${scenarioId}\\s*\\|`);
  if (!scenarioRow.test(section)) {
    errors.push(`${scenarioId}: requirement/scenario mapping is missing from ${planId}.`);
  }
}

const endpointRequirementMappings = new Map();
const endpointSections = apiPlan.split(/(?=^### Endpoint \d+:)/m);
for (const section of endpointSections) {
  if (!section.startsWith("### Endpoint ")) continue;
  const requirementId = section.match(/\*\*Requirement ID\*\*:\s*`(REQ-[A-Z0-9-]+)`/)?.[1];
  const endpoint = section.match(/\*\*Method & Path\*\*:\s*`(?:GET|POST|PUT|PATCH|DELETE)\s+([^`]+)`/)?.[1];
  if (requirementId && endpoint) endpointRequirementMappings.set(endpoint, requirementId);
}

const apiMappings = new Map();
for (const row of apiScenarioRows) {
  const scenarioId = row[0].match(/\bSCN-[A-Z0-9-]+\b/)?.[0];
  const endpointPath = row[1].replace(/^(?:GET|POST|PUT|PATCH|DELETE)\s+/, "");
  const requirementId = endpointRequirementMappings.get(endpointPath);
  if (!scenarioId || !requirementId) {
    throw new Error(`Cannot resolve API scenario to a requirement: ${row.join(" | ")}`);
  }
  if (apiMappings.has(scenarioId)) errors.push(`Duplicate API plan scenario: ${scenarioId}.`);
  apiMappings.set(scenarioId, requirementId);
}

for (const scenarioId of trackerMappings.keys()) {
  if (scenarioId.startsWith("SCN-API-") && !apiMappings.has(scenarioId)) {
    errors.push(`${scenarioId}: tracker scenario is missing from the API plan.`);
  }
}

for (const [scenarioId, requirementId] of apiMappings) {
  if (trackerMappings.get(scenarioId) !== requirementId) {
    errors.push(`${scenarioId}: tracker mapping does not match the API plan requirement ${requirementId}.`);
  }
  if (trackerPlanIds.get(scenarioId) !== "TP-API-01") {
    errors.push(`${scenarioId}: tracker must reference API test plan TP-API-01.`);
  }
}

const apiPlanSection = sectionContent(apiPlan, "## 4. API Scenario Test Matrix");
if (!apiPlanSection) errors.push("API test plan section 4 is missing.");
else validateStrategyReferences("TP-API-01 / API plan section 4", apiPlanSection, strategy, errors);

const allTests = walk(testsPath).flatMap(testCasesIn);
if (allTests.length === 0) errors.push("No Playwright tests were found under tests/.");

const coveredScenarios = new Set();
for (const { title, filePath, runnable } of allTests) {
  const relativePath = path.relative(root, filePath).replace(/\\/g, "/");
  const requirementIds = [...title.matchAll(/\bREQ-[A-Z0-9-]+\b/g)].map(([id]) => id);
  const scenarioIds = [...title.matchAll(/\bSCN-[A-Z0-9-]+\b/g)].map(([id]) => id);

  if (requirementIds.length !== 1 || scenarioIds.length === 0) {
    errors.push(
      `${relativePath}: test title must contain exactly one REQ-* and at least one SCN-* ID: "${title}"`,
    );
    continue;
  }

  const [requirementId] = requirementIds;
  for (const scenarioId of scenarioIds) {
    const expectedRequirement = scenarioId.startsWith("SCN-API-")
      ? apiMappings.get(scenarioId)
      : trackerMappings.get(scenarioId);

    if (!expectedRequirement) {
      errors.push(`${relativePath}: ${scenarioId} is not registered in its canonical traceability source.`);
    } else if (expectedRequirement !== requirementId) {
      errors.push(`${relativePath}: ${scenarioId} maps to ${expectedRequirement}, not ${requirementId}.`);
    }
    if (runnable && expectedRequirement === requirementId) {
      coveredScenarios.add(scenarioId);
      if (trackerStatuses.get(scenarioId) !== "Automated") {
        errors.push(`${scenarioId}: runnable test conflicts with tracker automation status ${trackerStatuses.get(scenarioId)}.`);
      }
      const target = automationTargets.get(scenarioId);
      if (target && target !== filePath) {
        errors.push(`${scenarioId}: ${relativePath} does not match its functional plan automation target.`);
      }
    }
  }
}

for (const [scenarioId, status] of trackerStatuses) {
  if (!["Not Started", "In Progress", "Automated", "Retired"].includes(status)) {
    errors.push(`${scenarioId}: invalid automation status ${status}.`);
  }
  if (status === "Automated" && !coveredScenarios.has(scenarioId)) {
    errors.push(`${scenarioId}: Automated scenario has no runnable test.`);
  }
  if (status === "Automated" && !scenarioId.startsWith("SCN-API-") && !automationTargets.has(scenarioId)) {
    errors.push(`${scenarioId}: Automated scenario has no functional plan automation target.`);
  }
}

if (errors.length > 0) {
  console.error(`Traceability validation failed (${errors.length} issue${errors.length === 1 ? "" : "s"}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Traceability validation passed: ${allTests.length} test declarations cover ${coveredScenarios.size} runnable scenarios of ${trackerMappings.size} registered; ${apiMappings.size} are defined in the API plan.`,
  );
}
