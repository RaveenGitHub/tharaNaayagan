import fs from "node:fs";
import path from "node:path";

const trackerPath = path.resolve(process.cwd(), "docs/traceability-tracker.md");
const logFile = path.resolve(process.cwd(), ".traceability-events.json");
const validObjectTypes = new Set(["Test Plan", "Scenario", "Automation"]);

function ensureTracker() {
  if (!fs.existsSync(trackerPath)) {
    throw new Error(
      "Traceability tracker file not found: docs/traceability-tracker.md",
    );
  }
}

function ensureLog() {
  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, JSON.stringify([], null, 2));
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function appendEvent(event) {
  const events = readJson(logFile);
  const id = `EVT-${String(events.length + 1).padStart(3, "0")}`;
  const record = {
    eventId: id,
    timestamp: new Date().toISOString(),
    ...event,
  };
  events.push(record);
  fs.writeFileSync(logFile, JSON.stringify(events, null, 2));
  return record;
}

function buildTrackerMarkdown(records) {
  const rows = records
    .slice()
    .reverse()
    .map((record) => {
      const statusAfter = record.statusAfter || "Updated";
      return `| ${record.entityId} | ${record.objectType} | ${record.entityName} | ${record.operation} | ${record.owner} | ${statusAfter} | ${record.evidence} | ${record.timestamp} |`;
    })
    .join("\n");

  return `## Live traceability registry

| Entity ID | Object Type | Entity Name | Operation | Owner | Status | Evidence | Last Updated |
| --------- | ----------- | ---------- | --------- | ----- | ------ | -------- | ------------ |
${rows || "| - | - | - | - | - | - | - | - |"}

## Lifecycle event log

| Event ID | Timestamp | Object Type | Operation | Entity ID | Entity Name | Status Before | Status After | Owner | Evidence / File | Notes |
| -------- | --------- | ---------- | --------- | --------- | ---------- | ------------- | ----------- | ----- | --------------- | ----- |
${
  records
    .slice()
    .reverse()
    .map(
      (record) =>
        `| ${record.eventId} | ${record.timestamp} | ${record.objectType} | ${record.operation} | ${record.entityId} | ${record.entityName} | ${record.statusBefore} | ${record.statusAfter} | ${record.owner} | ${record.evidence} | ${record.operation}d for traceability |`,
    )
    .join("\n") ||
  "| EVT-000 | YYYY-MM-DDTHH:MM:SSZ | - | - | - | - | - | - | - | - | - |"
}
`;
}

function syncTrackerDocument(record) {
  const markdown = fs.readFileSync(trackerPath, "utf8");
  const events = readJson(logFile);
  const registryHeading = "## Live traceability registry";
  const opRulesHeading = "## Operational rules";

  let updatedMarkdown = markdown;

  const startIndex = updatedMarkdown.indexOf(registryHeading);
  const endIndex = updatedMarkdown.indexOf(opRulesHeading);

  if (startIndex >= 0 && endIndex >= 0) {
    const before = updatedMarkdown.slice(0, startIndex);
    const after = updatedMarkdown.slice(endIndex);
    updatedMarkdown = `${before}${buildTrackerMarkdown(events).trim()}\n\n${after}`;
  } else {
    updatedMarkdown = `${updatedMarkdown.trim()}\n\n${buildTrackerMarkdown(events).trim()}\n`;
  }

  updatedMarkdown = updatedMarkdown.replace(/\n{3,}/g, "\n\n").trim() + "\n";
  fs.writeFileSync(trackerPath, updatedMarkdown);

  const summary = {
    entityId: record.entityId,
    objectType: record.objectType,
    status: record.statusAfter,
    slug: slugify(`${record.objectType}-${record.entityId}`),
  };

  return summary;
}

const [
  ,
  ,
  objectType,
  operation,
  entityId,
  entityName,
  statusBefore,
  statusAfter,
  owner,
  evidence,
] = process.argv;

if (!objectType || !operation || !entityId || !entityName) {
  console.log(
    "Usage: node scripts/traceability.mjs <objectType> <operation> <entityId> <entityName> [statusBefore] [statusAfter] [owner] [evidence]",
  );
  process.exit(1);
}

if (!validObjectTypes.has(objectType)) {
  console.log(
    `Unsupported object type: ${objectType}. Valid values: ${Array.from(validObjectTypes).join(", ")}.`,
  );
  process.exit(1);
}

ensureTracker();
ensureLog();

const record = appendEvent({
  objectType,
  operation,
  entityId,
  entityName,
  statusBefore: statusBefore || "Unknown",
  statusAfter: statusAfter || "Updated",
  owner: owner || "Unassigned",
  evidence: evidence || "N/A",
});

const syncStatus = syncTrackerDocument(record);

console.log(
  `Traceability event logged: ${record.eventId} | ${record.objectType} | ${record.operation} | ${record.entityId} | ${syncStatus.status}`,
);
