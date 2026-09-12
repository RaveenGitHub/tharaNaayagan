export const commonLocators = {
  pageTitle: 'h1, [data-testid="page-title"], [data-testid="dashboard-title"]',
  primaryButton:
    'button[type="submit"], button.primary, [data-testid="primary-btn"]',
  textInput: 'input[type="text"], input[type="email"], input[type="password"]',
  link: "a[href]",
  alert: '[role="alert"], .alert, .error-message',
  loader: '[data-testid="loader"], .loading-spinner',
  logoutButton:
    '#logoutButton, [data-testid="logout-btn"], button:has-text("Logout")',
  userDisplay: '#userName, [data-testid="user-display"]',
};
