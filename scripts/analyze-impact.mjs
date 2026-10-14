import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const searchRoots = [
  ".github/agents",
  ".github/prompts",
  "config",
  "docs",
  "fixtures",
  "locators",
  "pages",
  "public",
  "scripts",
  "tests",
  "utils",
];
const rootFiles = [
  ".env.example",
  "playwright.config.ts",
  "package.json",
  "README.md",
];
const supportedExtensions = new Set([
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);
const ids = process.argv.slice(2);

function usage() {
  console.log(
    "Usage: npm run impact:analyze -- <REQ-ID|SCN-ID|TP-ID> [additional IDs...]",
  );
}

if (
  ids.length === 0 ||
  ids.some((id) => !/^(?:REQ|SCN|TP)-[A-Z0-9-]+$/.test(id))
) {
  usage();
  console.error("Provide one or more valid requirement, scenario, or test-plan IDs.");
  process.exit(1);
}

function listFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "node_modules" ? [] : listFiles(entryPath);
    }
    return entry.isFile() &&
      supportedExtensions.has(path.extname(entry.name).toLowerCase())
      ? [entryPath]
      : [];
  });
}

const files = [
  ...searchRoots.flatMap((directory) => listFiles(path.join(root, directory))),
  ...rootFiles.map((file) => path.join(root, file)).filter(fs.existsSync),
];
let matchCount = 0;

for (const filePath of files) {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const matches = [];

  for (let index = 0; index < lines.length; index += 1) {
    const matchedIds = ids.filter((id) =>
      new RegExp(`(^|[^A-Z0-9-])${id.replaceAll("-", "\\-")}($|[^A-Z0-9-])`).test(
        lines[index],
      ),
    );
    if (matchedIds.length > 0) {
      matches.push({ line: index + 1, ids: matchedIds, text: lines[index].trim() });
    }
  }

  if (matches.length === 0) continue;
  matchCount += matches.length;
  console.log(`\n${path.relative(root, filePath).replace(/\\/g, "/")}`);
  for (const match of matches) {
    console.log(`  ${match.line}: [${match.ids.join(", ")}] ${match.text}`);
  }
}

if (matchCount === 0) {
  console.error(`No repository references found for: ${ids.join(", ")}.`);
  process.exit(1);
}

console.log(
  `\nImpact scan found ${matchCount} matching line(s) across ${ids.length} supplied ID(s). Review listed tests, plans, strategy, POMs, fixtures, utilities, and configuration before changing behavior.`,
);
