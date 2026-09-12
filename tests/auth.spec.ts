import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/login.page";
import { DashboardPage } from "../pages/dashboard.page";
import { personas } from "../fixtures/test-data";

test.describe("Authentication & Role-Based Access Suite", () => {
  test("standard user login displays user role on dashboard", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.gotoLogin();
    await loginPage.login(personas.user.username, personas.user.password);

    await expect(page).toHaveURL(/\/\?user=User/);
    await expect(dashboardPage.title).toBeVisible();
    await expect(dashboardPage.userDisplay).toHaveText("User");
  });

  test("guest user login succeeds with guest role privileges", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.gotoLogin();
    await loginPage.login(personas.guest.username, personas.guest.password);

    await expect(page).toHaveURL(/\/\?user=Guest/);
    await expect(dashboardPage.title).toBeVisible();
    await expect(dashboardPage.userDisplay).toHaveText("Guest");
  });

  test("logout clears user session and redirects back to login page", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.gotoLogin();
    await loginPage.login(personas.admin.username, personas.admin.password);
    await expect(page).toHaveURL(/\/\?user=Admin/);

    await dashboardPage.logout();
    await expect(page).toHaveURL(/\/login\.html/);
    await expect(loginPage.usernameInput).toBeVisible();

    // Verify session token was cleared from sessionStorage
    const sessionToken = await page.evaluate(() =>
      sessionStorage.getItem("auth_session"),
    );
    expect(sessionToken).toBeNull();
  });
});
