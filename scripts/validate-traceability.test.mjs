import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validator = path.join(root, "scripts", "validate-traceability.mjs");

function check(mutate, expectedError) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "traceability-regression-"));
  try {
    for (const name of ["docs", "tests"]) {
      fs.cpSync(path.join(root, name), path.join(directory, name), { recursive: true });
    }
    const edit = (name, transform) => {
      const target = path.join(directory, name);
      const source = fs.readFileSync(target, "utf8");
      const changed = transform(source);
      assert.notEqual(changed, source, `Fixture mutation did not apply: ${name}`);
      fs.writeFileSync(target, changed);
    };
    mutate(edit);
    const result = spawnSync(process.execPath, [validator], {
      cwd: directory,
      encoding: "utf8",
      timeout: 30_000,
    });
    assert.ifError(result.error);
    const output = result.stdout + result.stderr;
    if (expectedError) {
      assert.equal(result.status, 1, output);
      assert.match(output, expectedError);
    } else {
      assert.equal(result.status, 0, output);
      assert.match(output, /21 runnable scenarios of 22 registered/);
    }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

const api = path.join("tests", "apiTests", "api.spec.ts");
const functionalPlan = path.join("docs", "functional-test-plan.md");
const tracker = path.join("docs", "traceability-tracker.md");

test("baseline supports deferred scenarios, shared scenario IDs, and multiple scenarios per test", () => {
  check(() => {});
});

test("deleted scenario coverage fails", () => {
  check((edit) => edit(api, (source) => source.replace("SCN-API-05:", "SCN-API-01:")),
    /SCN-API-05: Automated scenario has no runnable test/);
});

for (const modifier of ["skip", "fixme"]) {
  test(`${modifier}-only scenario coverage fails`, () => {
    check((edit) => edit(api, (source) =>
      source.replace('test("REQ-API-01 SCN-API-02:', `test.${modifier}("REQ-API-01 SCN-API-02:`)),
    /SCN-API-02: Automated scenario has no runnable test/);
  });
}

test("skipped describe blocks do not provide runnable coverage", () => {
  check((edit) => edit(api, (source) => source.replace("test.describe(", "test.describe.skip(")),
    /Automated scenario has no runnable test/);
});

test("comments cannot provide scenario coverage", () => {
  check((edit) => edit(api, (source) =>
    `${source.replace("SCN-API-05:", "SCN-API-01:")}\n// test("REQ-API-01 SCN-API-05: comment", () => {});`),
  /SCN-API-05: Automated scenario has no runnable test/);
});

test("static template-literal titles are validated", () => {
  check((edit) => edit(api, (source) =>
    source.replace('"REQ-API-01 SCN-API-02: Mocked standard-user login returns the user role"',
      "`REQ-API-01 SCN-API-02: Mocked standard-user login returns the user role`")));
});

test("dynamic test titles fail explicitly", () => {
  check((edit) => edit(api, (source) =>
    source.replace('"REQ-API-01 SCN-API-02: Mocked standard-user login returns the user role"', "dynamicTitle")),
  /dynamic declarations are not supported/);
});

test("aliased Playwright test imports remain validated", () => {
  check((edit) => edit(api, (source) =>
    source.replace("import { test, expect }", "import { test as apiTest, expect }").replaceAll("test.", "apiTest.").replaceAll("test(", "apiTest(")));
});

test("conditional skip calls fail explicitly", () => {
  check((edit) => edit(api, (source) => source.replace("expect(result.status).toBe(200);", "test.skip(true, 'conditional');\n    expect(result.status).toBe(200);")),
    /dynamic declarations are not supported/);
});

test("computed skip modifiers do not bypass coverage validation", () => {
  check((edit) => edit(api, (source) =>
    source.replace('test("REQ-API-01 SCN-API-02:', 'test["skip"]("REQ-API-01 SCN-API-02:')),
  /SCN-API-02: Automated scenario has no runnable test/);
});

test("unregistered runnable tests fail", () => {
  check((edit) => edit(api, (source) => source.replace("SCN-API-02:", "SCN-API-999:")),
    /SCN-API-999 is not registered/);
});

test("conflicting requirement mappings fail", () => {
  check((edit) => edit(api, (source) => source.replace("REQ-API-01 SCN-API-02:", "REQ-API-02 SCN-API-02:")),
    /SCN-API-02 maps to REQ-API-01, not REQ-API-02/);
});

test("nonexistent plan targets fail", () => {
  check((edit) => edit(functionalPlan, (source) =>
    source.replace("tests/functional/smoke.spec.ts", "tests/functional/missing.spec.ts")),
  /automation target does not exist/);
});

test("existing but incorrect plan targets fail", () => {
  check((edit) => edit(functionalPlan, (source) =>
    source.replace("tests/functional/smoke.spec.ts", "tests/functional/auth.spec.ts")),
  /does not match its functional plan automation target/);
});

test("plan-only scenarios fail", () => {
  check((edit) => edit(functionalPlan, (source) =>
    source.replace("REQ-01 | SCN-01", "REQ-01 | SCN-999")),
  /functional plan mapping does not match the tracker/);
});

test("runnable tests require Automated status", () => {
  check((edit) => edit(tracker, (source) =>
    source.replace(/(\| REQ-API-01[^\n]*SCN-API-02[^\n]*?)\| Automated \|/, "$1| Not Started |")),
  /runnable test conflicts with tracker automation status Not Started/);
});

test("missing module metadata fails", () => {
  check((edit) => edit(tracker, (source) =>
    source.replace("| REQ-01 | Authentication |", "| REQ-01 |  |")),
  /module\/area is missing/);
});

test("missing strategy sections fail", () => {
  check((edit) => edit(functionalPlan, (source) => source.replace("Sections 2.5 and 5.1", "Sections 99.1 and 5.1")),
    /Test Strategy section 99.1 does not exist/);
});

test("duplicate API scenarios fail", () => {
  check((edit) => edit(path.join("docs", "api-test-plan.md"), (source) =>
    source.replace("**SCN-API-02**", "**SCN-API-01**")),
  /Duplicate API plan scenario/);
});
