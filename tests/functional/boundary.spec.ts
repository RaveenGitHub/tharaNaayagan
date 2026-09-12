import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/login.page";
import { securityPayloads } from "../../fixtures/test-data";

test.describe("Boundary & Input Validation Suite", () => {
  test("empty username and password submission triggers client validation error", async ({
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

  test("whitespace-only input is trimmed and rejected gracefully", async ({
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

  test("extremely long payload strings do not crash the login application", async ({
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
