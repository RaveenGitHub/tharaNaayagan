import "dotenv/config";

export type EnvironmentName = "dev" | "qa" | "uat" | "prod";

export const ENVIRONMENTS: Record<
  EnvironmentName,
  { baseUrl: string; apiUrl: string }
> = {
  dev: {
    baseUrl: process.env.BASE_URL || "http://127.0.0.1:4173",
    apiUrl: process.env.API_BASE_URL || "http://127.0.0.1:4173/api",
  },
  qa: {
    baseUrl: process.env.QA_BASE_URL || "https://qa.example.com",
    apiUrl: process.env.QA_API_BASE_URL || "https://qa.example.com/api",
  },
  uat: {
    baseUrl: process.env.UAT_BASE_URL || "https://uat.example.com",
    apiUrl: process.env.UAT_API_BASE_URL || "https://uat.example.com/api",
  },
  prod: {
    baseUrl: process.env.PROD_BASE_URL || "https://example.com",
    apiUrl: process.env.PROD_API_BASE_URL || "https://example.com/api",
  },
};

export function getEnvironment(name: EnvironmentName = "qa") {
  return ENVIRONMENTS[name];
}

export function isLocalTestTarget(target: string): boolean {
  const hostname = new URL(target).hostname;
  return ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
}

function configuredOrigin(name: string, fallback: string): string {
  const target = process.env[name] ?? fallback;
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    throw new Error(`Invalid configured test target URL: ${name}.`);
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error(`Configured test target ${name} must be an HTTP(S) URL without embedded credentials.`);
  }
  return url.origin;
}

export function assertTestTargetAllowed(target: string): void {
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    throw new Error("Invalid test target URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`Unsupported test target protocol: ${url.protocol}`);
  }
  if (url.username || url.password) {
    throw new Error(
      "Do not embed credentials in test target URLs; use environment variables.",
    );
  }

  const productionOrigins = [
    configuredOrigin("PROD_BASE_URL", "https://example.com"),
    configuredOrigin("PROD_API_BASE_URL", "https://example.com/api"),
  ];
  const approvedNonLocalOrigins = [
    configuredOrigin("QA_BASE_URL", "https://qa.example.com"),
    configuredOrigin("QA_API_BASE_URL", "https://qa.example.com/api"),
    configuredOrigin("UAT_BASE_URL", "https://uat.example.com"),
    configuredOrigin("UAT_API_BASE_URL", "https://uat.example.com/api"),
  ];
  if (productionOrigins.includes(url.origin)) {
    throw new Error("Production targets are not permitted for automated tests.");
  }

  if (isLocalTestTarget(target)) return;

  if (url.protocol !== "https:") {
    throw new Error("Non-local test targets must use HTTPS.");
  }

  if (process.env.ALLOW_NON_LOCAL_TEST_TARGET !== "true") {
    throw new Error(
      `Non-local test target is blocked: ${url.origin}. Set ALLOW_NON_LOCAL_TEST_TARGET=true only for an approved non-production test environment.`,
    );
  }

  if (!approvedNonLocalOrigins.includes(url.origin)) {
    throw new Error(
      `Non-local test target ${url.origin} must match a configured QA or UAT URL.`,
    );
  }
}

export function assertBrowserTestTargetAllowed(target: string): void {
  assertTestTargetAllowed(target);
  if (isLocalTestTarget(target)) return;

  const credentials = {
    E2E_ADMIN_USER: "admin@example.com",
    E2E_ADMIN_PASSWORD: "Admin@123",
    E2E_USER_USER: "user@example.com",
    E2E_USER_PASSWORD: "User@123",
    E2E_GUEST_USER: "guest@example.com",
    E2E_GUEST_PASSWORD: "Guest@123",
    E2E_API_USER: "api.client@example.com",
    E2E_API_PASSWORD: "Api@123",
  };
  const names = Object.keys(credentials);
  const demoValues = new Set(Object.values(credentials));
  const missing = names.filter((name) => !process.env[name]?.trim());
  const defaults = names.filter((name) => demoValues.has(process.env[name]?.trim() ?? ""));
  if (missing.length || defaults.length) {
    throw new Error(
      `Non-local test targets require environment-specific credentials for every persona. Missing: ${missing.join(", ") || "none"}; local demo defaults present: ${defaults.join(", ") || "none"}.`,
    );
  }
}
