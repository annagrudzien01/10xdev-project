import { Page, expect } from "@playwright/test";

/**
 * Helper functions for E2E tests
 */

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForLoadState("domcontentloaded");
}

/**
 * Navigate to a route and wait for it to load
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await waitForPageLoad(page);
}

/**
 * Check if element is visible
 */
export async function expectVisible(page: Page, selector: string) {
  await expect(page.locator(selector)).toBeVisible();
}

/**
 * Check if element has text
 */
export async function expectText(page: Page, selector: string, text: string | RegExp) {
  await expect(page.locator(selector)).toContainText(text);
}

/**
 * Fill form field
 */
export async function fillField(page: Page, label: string, value: string) {
  await page.getByLabel(label).fill(value);
}

/**
 * Click button by text
 */
export async function clickButton(page: Page, text: string | RegExp) {
  await page.getByRole("button", { name: text }).click();
}

/**
 * Click link by text
 */
export async function clickLink(page: Page, text: string | RegExp) {
  await page.getByRole("link", { name: text }).click();
}

/**
 * Wait for navigation after action
 */
export async function waitForNavigation(page: Page, action: () => Promise<void>) {
  await Promise.all([page.waitForNavigation(), action()]);
}

/**
 * Take screenshot with name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}

/**
 * Check for console errors
 */
export function setupConsoleErrorListener(page: Page) {
  const errors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  return {
    getErrors: () => errors,
    hasErrors: () => errors.length > 0,
  };
}

/**
 * Mock API response
 */
export async function mockApiResponse(page: Page, url: string | RegExp, response: any, status = 200) {
  await page.route(url, (route) => {
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}
