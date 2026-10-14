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

console.log(
  `Traceability event logged: ${record.eventId} | ${record.objectType} | ${record.operation} | ${record.entityId} | ${record.statusAfter}`,
);
