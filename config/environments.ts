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

  const productionTargets = [
    process.env.PROD_BASE_URL || "https://example.com",
    process.env.PROD_API_BASE_URL || "https://example.com/api",
  ];
  if (
    productionTargets.some((productionTarget) => {
      try {
        return new URL(productionTarget).origin === url.origin;
      } catch {
        return false;
      }
    })
  ) {
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

  const approvedNonLocalOrigins = [
    process.env.QA_BASE_URL || "https://qa.example.com",
    process.env.QA_API_BASE_URL || "https://qa.example.com/api",
    process.env.UAT_BASE_URL || "https://uat.example.com",
    process.env.UAT_API_BASE_URL || "https://uat.example.com/api",
  ].map((approvedTarget) => new URL(approvedTarget).origin);

  if (!approvedNonLocalOrigins.includes(url.origin)) {
    throw new Error(
      `Non-local test target ${url.origin} must match a configured QA or UAT URL.`,
    );
  }
}
