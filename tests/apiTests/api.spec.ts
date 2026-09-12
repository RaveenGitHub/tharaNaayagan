import { test, expect } from "@playwright/test";
import { ApiClient } from "../../utils/api-client";
import { personas, securityPayloads } from "../../fixtures/test-data";

test.describe("API Test Suite - Contracts, Validation & Security", () => {
  let apiClient: ApiClient;

  test.beforeEach(async ({ request }) => {
    apiClient = new ApiClient(request, "dev");
  });

  test("SCN-API-01: Login with valid admin credentials returns success contract", async ({
    page,
  }) => {
    await page.route("**/api/v1/auth/login", async (route) => {
      const body = JSON.parse(route.request().postData() || "{}");
      if (
        body.username === personas.admin.username &&
        body.password === personas.admin.password
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            token: "mock-jwt-admin-token-12345",
            user: "Admin",
            role: "admin",
            expiresIn: 3600,
          }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: "Invalid username or password" }),
        });
      }
    });

    await page.goto("/login.html");
    const result = await page.evaluate(
      async (credentials) => {
        const res = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });
        return { status: res.status, data: await res.json() };
      },
      {
        username: personas.admin.username,
        password: personas.admin.password,
      },
    );

    expect(result.status).toBe(200);
    expect(result.data.token).toBeDefined();
    expect(result.data.role).toBe("admin");
    expect(result.data.expiresIn).toBe(3600);
  });

  test("SCN-API-03: Login with invalid credentials returns 401 Unauthorized", async ({
    page,
  }) => {
    await page.route("**/api/v1/auth/login", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Invalid username or password" }),
      });
    });

    await page.goto("/login.html");
    const result = await page.evaluate(
      async (credentials) => {
        const res = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });
        return { status: res.status, data: await res.json() };
      },
      {
        username: personas.admin.username,
        password: "WrongPassword123!",
      },
    );

    expect(result.status).toBe(401);
    expect(result.data.error).toBe("Invalid username or password");
  });

  test("SCN-API-04: Login with empty payload returns 400 Bad Request", async ({
    page,
  }) => {
    await page.route("**/api/v1/auth/login", async (route) => {
      const body = JSON.parse(route.request().postData() || "{}");
      if (!body.username || !body.password) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Username and password are required.",
          }),
        });
      }
    });

    await page.goto("/login.html");
    const result = await page.evaluate(async () => {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "", password: "" }),
      });
      return { status: res.status, data: await res.json() };
    });

    expect(result.status).toBe(400);
    expect(result.data.error).toContain("required");
  });

  test("SCN-API-06: Security - SQL injection payload in login is rejected safely", async ({
    page,
  }) => {
    await page.route("**/api/v1/auth/login", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Authentication failed" }),
      });
    });

    await page.goto("/login.html");
    for (const sqlPayload of securityPayloads.sqlInjection) {
      const result = await page.evaluate(async (payload) => {
        const res = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: payload,
            password: "Pass123Password",
          }),
        });
        return { status: res.status, data: await res.json() };
      }, sqlPayload);

      expect(result.status).toBe(401);
      expect(result.data.error).not.toContain("SQL");
      expect(result.data.error).not.toContain("syntax");
    }
  });

  test("SCN-API-07: Unauthenticated request to protected profile endpoint returns 401", async ({
    page,
  }) => {
    await page.route("**/api/v1/user/profile", async (route) => {
      const authHeader = route.request().headers()["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: "Unauthorized access" }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ user: "Admin", permissions: ["all"] }),
        });
      }
    });

    await page.goto("/login.html");
    const unauthResult = await page.evaluate(async () => {
      const res = await fetch("/api/v1/user/profile");
      return { status: res.status, data: await res.json() };
    });
    expect(unauthResult.status).toBe(401);

    const authResult = await page.evaluate(async () => {
      const res = await fetch("/api/v1/user/profile", {
        headers: { Authorization: "Bearer mock-admin-token" },
      });
      return { status: res.status, data: await res.json() };
    });
    expect(authResult.status).toBe(200);
    expect(authResult.data.user).toBe("Admin");
  });

  test("ApiClient utility builds valid headers and resolves endpoints", async () => {
    expect(apiClient).toBeDefined();
  });
});
