import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { analyzeImpact } from "./analyze-impact.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("scenario analysis includes dependencies, metadata, strategy, and validation without unrelated API scope", () => {
  const report = analyzeImpact(root, ["SCN-01"]);
  assert.deepEqual(report.unmatched, []);
  for (const name of ["pages/login.page.ts", "pages/base.page.ts", "pages/dashboard.page.ts",
    "fixtures/test-data.ts", "utils/auth.ts", "docs/functional-test-plan.md", "docs/test-strategy-template.md"]) {
    assert.ok(report.artifacts.includes(name), name);
  }
  assert.deepEqual(report.tests, ["tests/functional/smoke.spec.ts"]);
  assert.ok(report.strategySections.includes("2.5"));
  assert.ok(report.approvalRequired);
});

test("changed POM uses reverse imports and does not widen into API tests", () => {
  const report = analyzeImpact(root, ["pages/login.page.ts"]);
  assert.equal(report.tests.length, 4);
  assert.ok(report.tests.every((name) => name.startsWith("tests/functional/")));
});

test("shared fixture and configuration changes identify all browser suites", () => {
  for (const name of ["fixtures/test-data.ts", "playwright.config.ts", "package.json", ".github/workflows/playwright.yml"]) {
    const report = analyzeImpact(root, [name]);
    assert.equal(report.tests.length, 5, name);
    assert.equal(report.severity, "High");
    assert.ok(report.testDataReview.includes("fixtures/test-data.ts"));
  }
});

test("canonical IDs avoid substring matches and preserve deferred scenarios", () => {
  assert.deepEqual(analyzeImpact(root, ["SCN-08"]).tests, []);
  assert.deepEqual(analyzeImpact(root, ["SCN-08"]).scenarios, ["SCN-08"]);
  const report = analyzeImpact(root, ["SCN-01", "SCN-999"]);
  assert.deepEqual(report.unmatched, ["SCN-999"]);
  assert.ok(report.artifacts.length > 0);
});

test("unknown and outside-root inputs are explicitly unmatched", () => {
  for (const input of ["invalid", "../package.json", "tests/missing.spec.ts"]) {
    assert.deepEqual(analyzeImpact(root, [input]).unmatched, [input]);
  }
  assert.throws(() => analyzeImpact(root, []), /at least one/);
});

test("CLI emits valid JSON and fails partial/unmatched inputs", () => {
  const result = spawnSync(process.execPath, ["scripts/analyze-impact.mjs", "SCN-01", "SCN-999", "--json"], {
    cwd: root, encoding: "utf8",
  });
  assert.ifError(result.error);
  assert.equal(result.status, 1);
  assert.deepEqual(JSON.parse(result.stdout).unmatched, ["SCN-999"]);
});

test("human-readable CLI exposes risk, actions, approval, and bounded scan metrics", () => {
  const result = spawnSync(process.execPath, ["scripts/analyze-impact.mjs", "SCN-01"], {
    cwd: root, encoding: "utf8",
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0);
  for (const label of ["Registered risks:", "Required actions:", "Approval:", "Validation:", "Scan:"]) {
    assert.ok(result.stdout.includes(label), label);
  }
  assert.ok(!result.stdout.includes("Admin@123"));
  assert.ok(!result.stdout.includes("Authorization"));
});

test("alias resolution, cyclic imports, and unresolved dependencies are bounded", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "impact-regression-"));
  try {
    const write = (name, source) => {
      const target = path.join(directory, name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, source);
    };
    write("tsconfig.json", JSON.stringify({ compilerOptions: {
      baseUrl: ".", paths: { "@pages/*": ["pages/*"] }, moduleResolution: "Bundler",
    } }));
    write("pages/first.ts", 'import "./second"; import "./missing"; import("./runtime");');
    write("pages/second.ts", 'export * from "./first";');
    write("tests/functional/demo.spec.ts", 'import "@pages/first";');
    const report = analyzeImpact(directory, ["pages/second.ts"]);
    assert.deepEqual(report.tests, ["tests/functional/demo.spec.ts"]);
    assert.ok(report.artifacts.includes("pages/first.ts"));
    assert.ok(report.unresolved.some((message) => message.includes("missing")));
    assert.ok(report.unresolved.some((message) => message.includes("dynamic import")));
    write("tsconfig.json", '{"compilerOptions": ');
    assert.throws(() => analyzeImpact(directory, ["pages/second.ts"]), /Invalid tsconfig.json/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("scenario ID matching excludes longer IDs in test source", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "impact-exact-"));
  try {
    fs.mkdirSync(path.join(directory, "docs"));
    fs.mkdirSync(path.join(directory, "tests"));
    fs.writeFileSync(path.join(directory, "docs", "traceability-tracker.md"),
      "| REQ-01 | Login | TP-01 | SCN-01 | Demo | High | Automated |\n");
    fs.writeFileSync(path.join(directory, "tests", "demo.spec.ts"), 'test("SCN-010", () => {});');
    const report = analyzeImpact(directory, ["SCN-01"]);
    assert.deepEqual(report.tests, []);
    assert.deepEqual(report.scenarios, ["SCN-01"]);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
