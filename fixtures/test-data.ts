export type Persona = "admin" | "user" | "guest" | "api-client";

export interface TestUser {
  username: string;
  password: string;
  persona: Persona;
}

export interface LoginScenario {
  name: string;
  user: TestUser;
  expectedResult: "success" | "error";
  note?: string;
}

export const personas: Record<Persona, TestUser> = {
  admin: {
    username: process.env.E2E_ADMIN_USER || "admin@example.com",
    password: process.env.E2E_ADMIN_PASSWORD || "Admin@123",
    persona: "admin",
  },
  user: {
    username: process.env.E2E_USER_USER || "user@example.com",
    password: process.env.E2E_USER_PASSWORD || "User@123",
    persona: "user",
  },
  guest: {
    username: process.env.E2E_GUEST_USER || "guest@example.com",
    password: process.env.E2E_GUEST_PASSWORD || "Guest@123",
    persona: "guest",
  },
  "api-client": {
    username: process.env.E2E_API_USER || "api.client@example.com",
    password: process.env.E2E_API_PASSWORD || "Api@123",
    persona: "api-client",
  },
};

export const securityPayloads = {
  sqlInjection: [
    "' OR '1'='1",
    "admin' --",
    "' UNION SELECT 1, 'admin', 'pwd'--",
  ],
  xssPayloads: [
    "<script>alert('xss')</script>",
    "javascript:alert(1)",
    '<img src="x" onerror="alert(1)">',
  ],
  boundaryStrings: {
    empty: "",
    whitespace: "   ",
    longString: "A".repeat(1024),
    specialChars: "!@#$%^&*()_+{}|:<>?~`-=[]\\;',./",
  },
};

export const loginScenarios: LoginScenario[] = [
  {
    name: "valid-admin-login",
    user: personas.admin,
    expectedResult: "success",
    note: "Primary happy path for admin role",
  },
  {
    name: "valid-user-login",
    user: personas.user,
    expectedResult: "success",
    note: "Primary happy path for user role",
  },
  {
    name: "invalid-password",
    user: { ...personas.admin, password: "WrongPassword!1" },
    expectedResult: "error",
    note: "Negative validation for wrong credentials",
  },
  {
    name: "invalid-username",
    user: { ...personas.admin, username: "missing-user@example.com" },
    expectedResult: "error",
    note: "Negative validation for unknown user",
  },
  {
    name: "empty-credentials",
    user: { username: "", password: "", persona: "user" },
    expectedResult: "error",
    note: "Boundary validation for empty inputs",
  },
];

export const dynamicData = {
  productName: () => `Product-${Date.now()}`,
  email: () => `qa-${Date.now()}@example.com`,
  firstName: () => `QA-${Math.random().toString(36).slice(2, 8)}`,
  companyName: () => `Company-${Math.random().toString(36).slice(2, 8)}`,
};

export function buildRecord<T extends Record<string, unknown>>(
  base: T,
  overrides: Partial<T> = {},
): T {
  return { ...base, ...overrides };
}
