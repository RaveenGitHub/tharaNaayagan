import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/login.page";
import { DashboardPage } from "../../pages/dashboard.page";
import { personas, loginScenarios } from "../../fixtures/test-data";
import { loginAs } from "../../utils/auth";

test.describe("Smoke Suite - Critical Path Validation", () => {
  test("landing page loads and login form is accessible", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();
    await expect(page).toHaveURL(/\/login\.html/);
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test("admin login succeeds with valid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    await loginPage.gotoLogin();
    await loginPage.login(personas.admin.username, personas.admin.password);
    await expect(page).toHaveURL(/\/\?user=Admin/);
    await expect(dashboardPage.title).toBeVisible();
    await expect(dashboardPage.userDisplay).toHaveText(/admin/i);
  });

  test("invalid login displays accessible error alert", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const invalidUser = loginScenarios.find(
      (scenario) => scenario.name === "invalid-password",
    );

    if (!invalidUser) {
      throw new Error("Invalid password scenario is not defined.");
    }

    await loginPage.gotoLogin();
    await loginPage.login(invalidUser.user.username, invalidUser.user.password);
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText(/invalid/i);
  });

  test("helper authentication utility performs direct session login", async ({
    page,
  }) => {
    const dashboardPage = new DashboardPage(page);
    await loginAs(page, personas.user.username, personas.user.password);
    await expect(page).toHaveURL(/\/\?user=User/);
    await expect(dashboardPage.title).toBeVisible();
  });
});
