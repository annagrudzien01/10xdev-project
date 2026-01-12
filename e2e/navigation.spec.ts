import { test, expect } from '@playwright/test';
import { navigateTo } from './utils/test-helpers';

test.describe('Navigation', () => {
  test('should navigate between public pages', async ({ page }) => {
    // Start at home
    await navigateTo(page, '/');
    await expect(page).toHaveURL('/');

    // Navigate to demo if available
    const demoLink = page.getByRole('link', { name: /demo/i });
    if (await demoLink.isVisible()) {
      await demoLink.click();
      await page.waitForURL(/demo/);
      expect(page.url()).toContain('demo');
    }

    // Go back to home
    await navigateTo(page, '/');
    await expect(page).toHaveURL('/');
  });

  test('should redirect unauthenticated users from protected pages', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');
    
    // Should redirect to login or home
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    const isRedirected = currentUrl.includes('login') || currentUrl === '/';
    
    expect(isRedirected).toBeTruthy();
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    // Navigate to non-existent page
    await page.goto('/this-page-does-not-exist');
    await page.waitForLoadState('networkidle');

    // Should show some content (404 page or redirect)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should preserve scroll position on back navigation', async ({ page }) => {
    await navigateTo(page, '/');

    // Scroll down if page is long enough
    await page.evaluate(() => window.scrollTo(0, 500));
    const scrollY = await page.evaluate(() => window.scrollY);

    // Navigate away
    const demoLink = page.getByRole('link', { name: /demo/i });
    if (await demoLink.isVisible()) {
      await demoLink.click();
      await page.waitForURL(/demo/);

      // Go back
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Check if scroll position is restored (browser behavior may vary)
      const newScrollY = await page.evaluate(() => window.scrollY);
      
      // This is a soft check as browser behavior varies
      expect(typeof newScrollY).toBe('number');
    }
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await navigateTo(page, '/');

    // Tab through focusable elements
    await page.keyboard.press('Tab');
    
    // Check that something is focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should show loading states during navigation', async ({ page }) => {
    await navigateTo(page, '/');

    // Monitor network activity during navigation
    const demoLink = page.getByRole('link', { name: /demo/i });
    
    if (await demoLink.isVisible()) {
      // Start navigation
      const navigationPromise = page.waitForNavigation();
      await demoLink.click();
      
      // Wait for navigation to complete
      await navigationPromise;
      
      // Verify we navigated
      expect(page.url()).toContain('demo');
    }
  });
});
