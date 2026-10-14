import assert from "node:assert/strict";
import fs from "node:fs";
import { test, beforeEach, afterEach } from "node:test";
import ts from "typescript";

// Transpile the actual sources in memory; no network or generated repository files.
function moduleUrl(source) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
}
const environmentUrl = moduleUrl(
  fs.readFileSync(new URL("../config/environments.ts", import.meta.url), "utf8")
    .replace('import "dotenv/config";', ""),
);
const devVariables = ["BASE_URL", "API_BASE_URL"];
const initialDevValues = devVariables.map((name) => process.env[name]);
for (const name of devVariables) delete process.env[name];
let policy;
try {
  policy = await import(environmentUrl);
} finally {
  devVariables.forEach((name, index) => {
    if (initialDevValues[index] === undefined) delete process.env[name];
    else process.env[name] = initialDevValues[index];
  });
}
const clientSource = fs.readFileSync(new URL("../utils/api-client.ts", import.meta.url), "utf8")
  .replace('"../config/environments"', JSON.stringify(environmentUrl));
const { ApiClient } = await import(moduleUrl(clientSource));
const variables = [
  "ALLOW_NON_LOCAL_TEST_TARGET", "PROD_BASE_URL", "PROD_API_BASE_URL",
  "QA_BASE_URL", "QA_API_BASE_URL", "UAT_BASE_URL", "UAT_API_BASE_URL",
  "E2E_ADMIN_USER", "E2E_ADMIN_PASSWORD", "E2E_USER_USER", "E2E_USER_PASSWORD",
  "E2E_GUEST_USER", "E2E_GUEST_PASSWORD", "E2E_API_USER", "E2E_API_PASSWORD",
];
let previous;
beforeEach(() => {
  previous = Object.fromEntries(variables.map((name) => [name, process.env[name]]));
  for (const name of variables) delete process.env[name];
});
afterEach(() => {
  for (const name of variables) {
    if (previous[name] === undefined) delete process.env[name];
    else process.env[name] = previous[name];
  }
});

test("loopback browser targets require neither opt-in nor credentials", () => {
  for (const target of ["http://localhost:4173", "http://127.0.0.1:4173", "http://[::1]:4173"]) {
    assert.doesNotThrow(() => policy.assertBrowserTestTargetAllowed(target));
  }
});

test("invalid URL, unsupported protocol, and embedded credentials are rejected", () => {
  for (const [target, message] of [
    ["invalid", /Invalid test target/],
    ["file:///demo", /Unsupported test target protocol/],
    ["https://username:password@qa.example.com", /embed credentials/],
  ]) assert.throws(() => policy.assertTestTargetAllowed(target), message);
});

test("configured production origins are denied even with opt-in or loopback", () => {
  process.env.ALLOW_NON_LOCAL_TEST_TARGET = "true";
  process.env.PROD_BASE_URL = "http://127.0.0.1:4173";
  process.env.PROD_API_BASE_URL = "https://production.invalid/api";
  for (const url of ["http://127.0.0.1:4173/login", "https://production.invalid/v1"]) {
    assert.throws(() => policy.assertTestTargetAllowed(url), /Production targets/);
  }
});

test("non-local targets require HTTPS, opt-in, and an exact approved origin", () => {
  assert.throws(() => policy.assertTestTargetAllowed("http://qa.example.com"), /HTTPS/);
  assert.throws(() => policy.assertTestTargetAllowed("https://qa.example.com"), /blocked/);
  process.env.ALLOW_NON_LOCAL_TEST_TARGET = "true";
  for (const url of ["https://qa.example.com", "https://uat.example.com/api"]) {
    assert.doesNotThrow(() => policy.assertTestTargetAllowed(url));
  }
  for (const url of ["https://unknown.invalid", "https://qa.example.com:444", "https://qa.example.com.evil.invalid"]) {
    assert.throws(() => policy.assertTestTargetAllowed(url), /must match/);
  }
});

for (const variable of variables.filter((name) => name.endsWith("_URL"))) {
  test(`invalid ${variable} fails explicitly even for local requests`, () => {
    process.env[variable] = "invalid";
    assert.throws(() => policy.assertTestTargetAllowed("http://localhost:4173"), new RegExp(variable));
  });
}

test("configured targets reject unsupported protocols, embedded credentials, and empty values", () => {
  for (const value of ["file:///demo", "https://user:password@qa.example.com", ""]) {
    process.env.QA_BASE_URL = value;
    assert.throws(() => policy.assertTestTargetAllowed("http://localhost:4173"), /QA_BASE_URL/);
  }
});

test("non-local browsers require all dedicated persona credentials", () => {
  process.env.ALLOW_NON_LOCAL_TEST_TARGET = "true";
  assert.throws(() => policy.assertBrowserTestTargetAllowed("https://qa.example.com"), /Missing: E2E_ADMIN_USER/);
  for (const name of variables.filter((name) => name.startsWith("E2E_"))) {
    process.env[name] = `dedicated-${name}`;
  }
  assert.doesNotThrow(() => policy.assertBrowserTestTargetAllowed("https://qa.example.com"));
  process.env.E2E_ADMIN_PASSWORD = " Admin@123 ";
  assert.throws(() => policy.assertBrowserTestTargetAllowed("https://qa.example.com"), /local demo defaults present: E2E_ADMIN_PASSWORD/);
  process.env.E2E_ADMIN_PASSWORD = " ";
  assert.throws(() => policy.assertBrowserTestTargetAllowed("https://qa.example.com"), /Missing: E2E_ADMIN_PASSWORD/);
});

test("API methods preserve request options and reject unsafe URLs before dispatch", async () => {
  const calls = [];
  const response = { status: () => 200 };
  const request = Object.fromEntries(["get", "post", "put", "delete"].map((method) => [
    method, async (url, options) => { calls.push({ method, url, options }); return response; },
  ]));
  const client = new ApiClient(request, "dev");
  for (const method of ["get", "post", "put", "delete"]) {
    const result = await client[method]("/v1/profile", {
      token: "local-test-token", headers: { Accept: "application/problem+json" },
      params: { active: true }, data: { name: "demo" }, timeout: 1234,
    });
    assert.equal(result, response);
    const call = calls.at(-1);
    assert.equal(call.url, `${policy.ENVIRONMENTS.dev.apiUrl}/v1/profile`);
    assert.equal(call.options.headers.Accept, "application/problem+json");
    assert.equal(call.options.headers.Authorization, "Bearer local-test-token");
    assert.match(call.options.headers["X-Request-ID"], /^req-/);
    assert.equal(call.options.timeout, 1234);
    assert.deepEqual(call.options.params, { active: true });
    if (method !== "get") assert.deepEqual(call.options.data, { name: "demo" });
    await assert.rejects(client[method]("https://unknown.invalid"), /blocked/);
  }
  assert.equal(calls.length, 4);
  await client.get("http://127.0.0.1:4173/absolute");
  assert.equal(calls.at(-1).url, "http://127.0.0.1:4173/absolute");
  assert.equal(calls.at(-1).options.timeout, 15_000);
  assert.equal(calls.at(-1).options.headers.Authorization, undefined);
});
