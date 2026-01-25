import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { navigateTo, expectVisible } from "./utils/test-helpers";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, "/");
  });

  test("should have no accessibility violations", async ({ page }) => {
    // Run axe accessibility tests
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should display main navigation", async ({ page }) => {
    // Check for common navigation elements
    const navigation = page.getByRole("navigation").first();
    await expect(navigation).toBeVisible();
  });

  test("should have working links in navigation", async ({ page }) => {
    // Test that main navigation links are present
    // Adjust selectors based on actual navigation structure
    const links = page.getByRole("navigation").first().getByRole("link");
    const linkCount = await links.count();

    expect(linkCount).toBeGreaterThan(0);
  });

  test("should navigate to demo page", async ({ page }) => {
    // Look for demo link
    const demoLink = page.getByRole("link", { name: /demo/i });

    if (await demoLink.isVisible()) {
      await demoLink.click();
      await page.waitForURL(/demo/);

      // Verify we're on the demo page
      expect(page.url()).toContain("demo");
    }
  });

  test("should navigate to login page", async ({ page }) => {
    // Look for login link
    const loginLink = page.getByRole("link", { name: /login|sign in/i });

    if (await loginLink.isVisible()) {
      await loginLink.click();
      await page.waitForURL(/login/);

      // Verify we're on the login page
      expect(page.url()).toContain("login");
    }
  });

  test("should navigate to register page", async ({ page }) => {
    // Look for register link
    const registerLink = page.getByRole("link", { name: /register|sign up/i });

    if (await registerLink.isVisible()) {
      await registerLink.click();
      await page.waitForURL(/register/);

      // Verify we're on the register page
      expect(page.url()).toContain("register");
    }
  });

  test("should take screenshot", async ({ page }) => {
    // Visual regression test
    await expect(page).toHaveScreenshot("home-page.png", {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});
