import { test, expect } from "@playwright/test";
import { ApiClient } from "../../utils/api-client";
import { personas, securityPayloads } from "../../fixtures/test-data";

test.describe("Mocked API Flow Suite - Contract and Response Checks", () => {
  let apiClient: ApiClient;

  test.beforeEach(async ({ request }) => {
    apiClient = new ApiClient(request, "dev");
  });

  test("REQ-API-01 SCN-API-01: Mocked login flow returns the success contract", async ({
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

  test("REQ-API-01 SCN-API-02: Mocked standard-user login returns the user role", async ({
    page,
  }) => {
    await page.route("**/api/v1/auth/login", async (route) => {
      const body = JSON.parse(route.request().postData() || "{}");
      expect(body.username).toBe(personas.user.username);
      expect(body.password).toBe(personas.user.password);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          token: "mock-jwt-user-token-12345",
          user: "User",
          role: "user",
          expiresIn: 3600,
        }),
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
        username: personas.user.username,
        password: personas.user.password,
      },
    );

    expect(result.status).toBe(200);
    expect(result.data.token).toBeDefined();
    expect(result.data.role).toBe("user");
    expect(result.data.expiresIn).toBe(3600);
  });

  test("REQ-API-01 SCN-API-03: Mocked invalid login returns 401 Unauthorized", async ({
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

  test("REQ-API-01 SCN-API-04: Mocked empty payload returns 400 Bad Request", async ({
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

  test("REQ-API-01 SCN-API-05: Mocked login returns a validation error for a 1024-character email", async ({
    page,
  }) => {
    const longEmail = `${securityPayloads.boundaryStrings.longString.slice(0, 1012)}@example.com`;
    expect(longEmail).toHaveLength(1024);

    await page.route("**/api/v1/auth/login", async (route) => {
      const body = JSON.parse(route.request().postData() || "{}");
      expect(body.username).toBe(longEmail);

      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({ error: "Invalid email address." }),
      });
    });

    await page.goto("/login.html");
    const result = await page.evaluate(
      async ({ email, password }) => {
        const res = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: email, password }),
        });
        return { status: res.status, data: await res.json() };
      },
      { email: longEmail, password: personas.guest.password },
    );

    expect(result.status).toBe(422);
    expect(result.data.error).toBe("Invalid email address.");
    expect(result.data.error).not.toContain(longEmail);
  });

  test("REQ-API-01 SCN-API-06: Mocked login rejects SQL injection payloads", async ({
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

  test("REQ-API-02 SCN-API-07 SCN-API-08: Mocked profile enforces the authentication contract", async ({
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

  test("REQ-AUTO-01 SCN-AUTO-02: ApiClient blocks an unapproved non-local target", async ({
    request,
  }) => {
    expect(apiClient).toBeDefined();

    const originalOptIn = process.env.ALLOW_NON_LOCAL_TEST_TARGET;
    delete process.env.ALLOW_NON_LOCAL_TEST_TARGET;
    try {
      await expect(
        new ApiClient(request, "qa").get("/v1/user/profile"),
      ).rejects.toThrow(/Non-local test target is blocked/);
    } finally {
      if (originalOptIn === undefined) {
        delete process.env.ALLOW_NON_LOCAL_TEST_TARGET;
      } else {
        process.env.ALLOW_NON_LOCAL_TEST_TARGET = originalOptIn;
      }
    }
  });
});
