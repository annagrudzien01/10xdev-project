import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.test
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

/**
 * Playwright configuration for E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: "./e2e",

  // Maximum time one test can run
  timeout: 30 * 1000,

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [["html"], ["list"], ["junit", { outputFile: "test-results/junit.xml" }]],

  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    // Collect trace when retrying the failed test
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure
    video: "retain-on-failure",
  },

  // Configure projects for Chromium only (as per guidelines)
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Run local dev server before starting tests
  webServer: {
    // Load .env.test and start Astro dev server
    command:
      process.platform === "win32"
        ? 'powershell -Command "$env:SUPABASE_URL=\\"$env:PUBLIC_SUPABASE_URL\\"; $env:SUPABASE_KEY=\\"$env:PUBLIC_SUPABASE_ANON_KEY\\"; npx astro dev --mode test"'
        : "SUPABASE_URL=$PUBLIC_SUPABASE_URL SUPABASE_KEY=$PUBLIC_SUPABASE_ANON_KEY npx astro dev --mode test",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      // Pass all test environment variables to the command
      ...process.env,
    },
  },
});
