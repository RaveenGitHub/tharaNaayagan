import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";
import {
  assertTestTargetAllowed,
  isLocalTestTarget,
} from "./config/environments";

const baseURL = process.env.BASE_URL || "http://127.0.0.1:4173";
assertTestTargetAllowed(baseURL);

if (!isLocalTestTarget(baseURL)) {
  const credentialVariables = [
    "E2E_ADMIN_USER",
    "E2E_ADMIN_PASSWORD",
    "E2E_USER_USER",
    "E2E_USER_PASSWORD",
    "E2E_GUEST_USER",
    "E2E_GUEST_PASSWORD",
    "E2E_API_USER",
    "E2E_API_PASSWORD",
  ];
  const missingCredentials = credentialVariables.filter(
    (name) => !process.env[name]?.trim(),
  );
  const demoCredentialValues = new Set([
    "admin@example.com",
    "Admin@123",
    "user@example.com",
    "User@123",
    "guest@example.com",
    "Guest@123",
    "api.client@example.com",
    "Api@123",
  ]);
  const defaultCredentials = credentialVariables.filter((name) =>
    demoCredentialValues.has(process.env[name] ?? ""),
  );

  if (missingCredentials.length > 0 || defaultCredentials.length > 0) {
    throw new Error(
      `Non-local test targets require environment-specific credentials for every persona. Missing: ${missingCredentials.join(", ") || "none"}; local demo defaults present: ${defaultCredentials.join(", ") || "none"}.`,
    );
  }
}

const reporters: Array<[string] | [string, Record<string, unknown>]> = [
  ["list"],
  ["html", { open: "never", outputFolder: "playwright-report" }],
  ["allure-playwright", { resultsDir: "allure-results" }],
];

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: { animations: "disabled" },
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 4 : undefined,
  reporter: reporters,
  outputDir: "test-results",
  use: {
    baseURL,
    headless: true,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    ignoreHTTPSErrors: false,
    locale: "en-US",
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "npm run serve:demo",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
