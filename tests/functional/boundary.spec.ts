import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/login.page";
import { securityPayloads } from "../../fixtures/test-data";

test.describe("Boundary & Input Validation Suite", () => {
  test("REQ-06 SCN-06: Empty credentials trigger client validation", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();

    await loginPage.login("", "");
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toHaveText(
      "Please fill in all required fields.",
    );
  });

  test("REQ-06 SCN-09: Whitespace-only credentials are rejected", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();

    await loginPage.login("   ", "   ");
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toHaveText(
      "Please fill in all required fields.",
    );
  });

  test("REQ-06 SCN-10: Long username input does not crash the application", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.gotoLogin();

    await loginPage.login(
      securityPayloads.boundaryStrings.longString,
      "AnyPassword123!",
    );
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(page).toHaveURL(/\/login\.html/);
  });
});
