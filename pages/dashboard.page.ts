import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";

export class DashboardPage extends BasePage {
  readonly title: Locator;
  readonly userDisplay: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page
      .getByRole("heading", { name: /dashboard/i })
      .or(page.locator('[data-testid="dashboard-title"], h1'));
    this.userDisplay = page.locator('#userName, [data-testid="user-display"]');
    this.logoutButton = page
      .getByRole("button", { name: /logout/i })
      .or(page.locator('#logoutButton, [data-testid="logout-btn"]'));
  }

  async gotoDashboard(userParam?: string): Promise<void> {
    const url = userParam ? `/?user=${encodeURIComponent(userParam)}` : "/";
    await this.goto(url);
  }

  async logout(): Promise<void> {
    await this.click(this.logoutButton);
  }

  async getUserName(): Promise<string> {
    return (await this.userDisplay.textContent()) || "";
  }
}
