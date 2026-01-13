import { Page } from "@playwright/test";

/**
 * Test user credentials for E2E tests
 */
export const TEST_USER = {
  email: "test@example.com",
  password: "TestPassword123!",
  displayName: "Test User",
};

/**
 * Login helper for E2E tests
 */
export async function login(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  // Fill in login form
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);

  // Submit form
  await page.getByRole("button", { name: /sign in|login|log in/i }).click();

  // Wait for navigation to complete
  await page.waitForURL(/dashboard|\/$/);
  await page.waitForLoadState("networkidle");
}

/**
 * Logout helper for E2E tests
 */
export async function logout(page: Page) {
  // Look for logout button (might be in a dropdown menu)
  const logoutButton = page.getByRole("button", { name: /logout|log out|sign out/i });

  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  } else {
    // Try to open user menu first
    const userMenu = page.getByRole("button", { name: /user|account|profile/i });
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.getByRole("menuitem", { name: /logout|log out|sign out/i }).click();
    }
  }

  // Wait for redirect to home or login page
  await page.waitForURL(/login|\/$/);
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for elements that only appear when authenticated
    const dashboardLink = page.getByRole("link", { name: /dashboard/i });
    return await dashboardLink.isVisible({ timeout: 1000 });
  } catch {
    return false;
  }
}
