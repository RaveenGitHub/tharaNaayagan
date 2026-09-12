import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page
      .getByLabel(/username|email/i)
      .or(
        page.locator('input[name="username"], input[type="email"], #username'),
      );
    this.passwordInput = page
      .getByLabel(/password/i)
      .or(
        page.locator(
          'input[name="password"], input[type="password"], #password',
        ),
      );
    this.loginButton = page
      .getByRole("button", { name: /login|sign in/i })
      .or(page.locator('#loginButton, button[type="submit"]'));
    this.errorMessage = page
      .getByRole("alert")
      .or(page.locator('#errorMessage, .error, [role="alert"]'));
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async gotoLogin(): Promise<void> {
    await this.goto("/login.html");
  }
}
