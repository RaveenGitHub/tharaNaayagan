import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/login.page";
import { DashboardPage } from "../../pages/dashboard.page";
import { personas } from "../../fixtures/test-data";

test.describe("Authentication & Persona Display Suite", () => {
  test("REQ-05 SCN-05: Standard user login displays the correct persona", async ({
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

  test("REQ-05 SCN-05: Guest login displays the correct persona", async ({
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

  test("REQ-03 SCN-03: Logout clears the session and returns to sign-in", async ({
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
