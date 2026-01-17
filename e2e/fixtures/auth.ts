import { Page } from "@playwright/test";

/**
 * Test user credentials for E2E tests
 * Uses environment variables from .env.test
 */
export const TEST_USER = {
  email: process.env.E2E_USERNAME || "test@example.com",
  password: process.env.E2E_PASSWORD || "TestPassword123!",
  displayName: "Test User",
};

console.log(`[E2E Auth] Loaded credentials: email=${TEST_USER.email}, password length=${TEST_USER.password.length}`);

/**
 * Login helper for E2E tests
 * Navigates to login page, fills credentials, and waits for authentication
 */
export async function login(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  console.log(`[E2E Login] Starting login with email: ${email}`);

  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  // Wait for React to hydrate and form to be ready
  await page.waitForSelector("input#email", { state: "visible" });
  await page.waitForSelector('button[type="submit"]:not([disabled])', { state: "visible" });
  console.log("[E2E Login] Form loaded and ready");

  // Fill in login form - use type for better simulation
  await page.locator("input#email").click();
  await page.locator("input#email").fill(email);
  await page.locator("input#email").blur(); // Trigger validation

  await page.locator("input#password").click();
  await page.locator("input#password").fill(password);
  await page.locator("input#password").blur(); // Trigger validation

  console.log("[E2E Login] Form filled, waiting 500ms for validation");
  await page.waitForTimeout(500); // Wait for client-side validation

  // Check if there are any validation errors (excluding required * markers)
  const hasErrors = (await page.locator("p.text-destructive").count()) > 0;
  if (hasErrors) {
    const errorText = await page.locator("p.text-destructive").first().textContent();
    console.error(`[E2E Login] Validation error: ${errorText}`);
    throw new Error(`Form validation failed: ${errorText}`);
  }

  // Listen for response BEFORE clicking submit
  const responsePromise = page.waitForResponse(
    (resp) => resp.url().includes("/api/auth/login") && resp.request().method() === "POST",
    { timeout: 30000 }
  );

  // Submit form
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();
  console.log("[E2E Login] Form submitted, waiting for API response");

  // Wait for API response
  const response = await responsePromise;
  const status = response.status();
  console.log(`[E2E Login] API response status: ${status}`);

  if (status !== 200) {
    const body = await response.text();
    console.error(`[E2E Login] Login failed: ${body}`);
    throw new Error(`Login failed with status ${status}: ${body}`);
  }

  // Wait for navigation - URL should change from /login
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
  console.log(`[E2E Login] Navigation completed to: ${page.url()}`);

  // Wait for page to be fully loaded
  await page.waitForLoadState("domcontentloaded");
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
