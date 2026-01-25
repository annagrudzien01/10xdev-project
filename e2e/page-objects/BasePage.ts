import { type Page, type Locator } from "@playwright/test";

/**
 * BasePage - Base class for all Page Object Models
 *
 * Provides common functionality and utilities that all pages can inherit.
 * Follows Playwright best practices for page object implementation.
 */
export class BasePage {
  protected readonly page: Page;
  protected readonly baseURL: string;

  constructor(page: Page) {
    this.page = page;
    this.baseURL = process.env.BASE_URL || "http://localhost:4321";
  }

  /**
   * Navigate to a specific path
   * @param path - Relative path from base URL
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for the page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    // Try networkidle with short timeout, but don't fail if it times out
    try {
      await this.page.waitForLoadState("networkidle", { timeout: 5000 });
    } catch {
      // Ignore - some pages have long-running requests
    }
  }

  /**
   * Get current URL
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Get element by test ID
   * @param testId - data-testid attribute value
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Check if element is visible
   * @param testId - data-testid attribute value
   */
  async isVisible(testId: string): Promise<boolean> {
    return await this.getByTestId(testId).isVisible();
  }

  /**
   * Wait for element to be visible
   * @param testId - data-testid attribute value
   */
  async waitForElement(testId: string): Promise<void> {
    await this.getByTestId(testId).waitFor({ state: "visible" });
  }

  /**
   * Take a screenshot
   * @param name - Screenshot file name
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  /**
   * Wait for a specific amount of time (use sparingly)
   * @param ms - Milliseconds to wait
   */
  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }
}
