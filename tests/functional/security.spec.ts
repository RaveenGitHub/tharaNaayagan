import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/login.page";
import { DashboardPage } from "../../pages/dashboard.page";
import { securityPayloads } from "../../fixtures/test-data";

test.describe("Input Handling & Guest Context Suite", () => {
  test("REQ-07 SCN-07: SQL injection payloads in login fields are rejected", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);

    for (const payload of securityPayloads.sqlInjection) {
      await loginPage.gotoLogin();
      await loginPage.login(payload, "RandomPass@123");
      await expect(loginPage.errorMessage).toBeVisible();
      await expect(page).toHaveURL(/\/login\.html/);
    }
  });

  test("REQ-07 SCN-11: XSS query input is displayed as inert text", async ({
    page,
  }) => {
    const dashboardPage = new DashboardPage(page);
    let dialogTriggered = false;

    page.on("dialog", async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    for (const xssPayload of securityPayloads.xssPayloads) {
      await dashboardPage.gotoDashboard(xssPayload);
      expect(dialogTriggered).toBe(false);

      const displayedText = await dashboardPage.getUserName();
      // Ensure script tags are not rendered as active elements
      expect(displayedText).not.toContain("<script>");
      expect(displayedText).not.toContain("alert(");
    }
  });

  test("REQ-05 SCN-12: Direct dashboard access defaults to Guest context", async ({
    page,
  }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto("/");
    await expect(dashboardPage.title).toBeVisible();
    const currentUser = await dashboardPage.getUserName();
    expect(currentUser).toBe("Guest");
  });
});
