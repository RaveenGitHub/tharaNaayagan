import type { Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const AUTH_DIR = ".auth";

export async function loginAs(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  await page.goto("/login.html");
  await page
    .locator('input[name="username"], input[type="email"], #username')
    .fill(username);
  await page
    .locator('input[name="password"], input[type="password"], #password')
    .fill(password);
  await page
    .locator('button[type="submit"], #loginButton, button:has-text("Login")')
    .click();
  await page.waitForURL(/\/\?user=/);
}

export async function saveSessionState(
  page: Page,
  username: string,
): Promise<string> {
  const authDir = path.resolve(process.cwd(), AUTH_DIR);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  const storagePath = path.join(
    authDir,
    `${username.replace(/[^a-z0-9]/gi, "_")}.json`,
  );
  await page.context().storageState({ path: storagePath });
  return storagePath;
}

export async function loginWithSession(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  const storageState = path.join(
    path.resolve(process.cwd(), AUTH_DIR),
    `${username.replace(/[^a-z0-9]/gi, "_")}.json`,
  );

  if (fs.existsSync(storageState)) {
    await page.goto("/login.html");
    await loginAs(page, username, password);
    await saveSessionState(page, username);
    return;
  }

  await loginAs(page, username, password);
  await saveSessionState(page, username);
}

export async function logout(page: Page): Promise<void> {
  const logoutBtn = page.locator(
    '#logoutButton, [data-testid="logout-btn"], button:has-text("Logout")',
  );
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForURL(/\/login\.html/);
  }
}
