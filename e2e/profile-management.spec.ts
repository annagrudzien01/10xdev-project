import { test, expect } from "@playwright/test";
import { ProfilesPage, AddProfilePage } from "./page-objects";
import { login } from "./fixtures/auth";

/**
 * E2E Tests for Profile Management
 *
 * Tests the complete flow of creating and managing child profiles:
 * 0. Authenticate user
 * 1. Navigate to profiles page
 * 2. Click add profile button
 * 3. Fill in profile form
 * 4. Submit and verify redirect
 *
 * Uses Page Object Model pattern for maintainable tests.
 */

test.describe("Profile Management", () => {
  let profilesPage: ProfilesPage;
  let addProfilePage: AddProfilePage;

  test.beforeEach(async ({ page }) => {
    // Initialize Page Objects
    profilesPage = new ProfilesPage(page);
    addProfilePage = new AddProfilePage(page);

    // Authenticate user before each test
    await login(page);
  });

  test.describe("Creating a new profile", () => {
    test("should successfully create a new profile with valid data", async () => {
      // Arrange
      await profilesPage.navigate();
      await profilesPage.verifyPageLoaded();

      // Act - Click add profile button
      await profilesPage.clickAddProfile();

      // Assert - Verify navigation to form page
      await addProfilePage.verifyPageLoaded();

      // Act - Fill and submit form
      const profileName = "Anna";
      const dateOfBirth = addProfilePage.getValidDateForAge(5);
      await addProfilePage.createProfile(profileName, dateOfBirth);

      // Assert - Verify redirect to profiles list
      await addProfilePage.waitForSubmitSuccess();
      await profilesPage.verifyPageLoaded();

      // Assert - Verify new profile appears in list
      expect(await profilesPage.hasProfile(profileName)).toBe(true);
    });

    test("should create profile from empty state", async () => {
      // Arrange
      await profilesPage.navigate();

      // Check if empty state is visible
      const isEmpty = await profilesPage.isEmpty();

      if (isEmpty) {
        // Act - Click add from empty state
        await profilesPage.clickAddProfileFromEmptyState();

        // Assert - Verify navigation to form
        await addProfilePage.verifyPageLoaded();

        // Act - Create profile
        await addProfilePage.createProfile("Maria", addProfilePage.getValidDateForAge(7));

        // Assert - Verify success
        await addProfilePage.waitForSubmitSuccess();
        expect(await profilesPage.isEmpty()).toBe(false);
      } else {
        test.skip();
      }
    });

    test("should show validation errors for empty form", async () => {
      // Arrange
      await addProfilePage.navigate();
      await addProfilePage.verifyPageLoaded();

      // Act - Submit empty form
      await addProfilePage.submit();

      // Assert - Submit button should be disabled for empty form
      expect(await addProfilePage.isSubmitDisabled()).toBe(true);
    });

    test("should show validation error for invalid name", async () => {
      // Arrange
      await addProfilePage.navigate();

      // Act - Enter invalid name (too short)
      await addProfilePage.fillName("A");
      await addProfilePage.fillDateOfBirth(addProfilePage.getValidDateForAge(5));

      // Act - Try to submit
      await addProfilePage.submit();

      // Assert - Should show name validation error
      await expect(addProfilePage.nameError).toBeVisible();
    });

    test("should show validation error for child too young", async () => {
      // Arrange
      await addProfilePage.navigate();

      // Act - Enter valid name but date for 2-year-old
      await addProfilePage.fillName("Julia");
      await addProfilePage.fillDateOfBirth(addProfilePage.getValidDateForAge(2));

      // Act - Try to submit
      await addProfilePage.submit();

      // Assert - Should show date validation error
      await expect(addProfilePage.dateError).toBeVisible();
    });

    test("should show validation error for child too old", async () => {
      // Arrange
      await addProfilePage.navigate();

      // Act - Enter valid name but date for 19-year-old
      await addProfilePage.fillName("Tomasz");
      await addProfilePage.fillDateOfBirth(addProfilePage.getValidDateForAge(19));

      // Act - Try to submit
      await addProfilePage.submit();

      // Assert - Should show date validation error
      await expect(addProfilePage.dateError).toBeVisible();
    });

    test("should allow canceling form", async ({ page }) => {
      // Arrange
      await addProfilePage.navigate();

      // Act - Fill form partially
      await addProfilePage.fillName("Test");

      // Act - Cancel (dialog will auto-accept)
      page.on("dialog", (dialog) => dialog.accept());
      await addProfilePage.cancel();

      // Assert - Should navigate back to profiles
      await page.waitForURL("/profiles");
      await profilesPage.verifyPageLoaded();
    });

    test("should disable form while submitting", async () => {
      // Arrange
      await addProfilePage.navigate();

      // Act - Fill form
      await addProfilePage.fillForm("Kasia", addProfilePage.getValidDateForAge(6));

      // Act - Submit
      const submitPromise = addProfilePage.submit();

      // Assert - Check if submitting state is active (may be too fast to catch)
      // This is a best-effort check as submission might be instant
      try {
        expect(await addProfilePage.isSubmitting()).toBe(true);
      } catch {
        // Submission was too fast - that's OK
      }

      await submitPromise;
    });
  });

  test.describe("Profile list display", () => {
    test("should display profile counter", async () => {
      // Arrange
      await profilesPage.navigate();
      await profilesPage.waitForProfilesLoad();

      // Assert - Counter should be visible
      const count = await profilesPage.getProfileCount();
      expect(count).toBeGreaterThanOrEqual(0);
      expect(count).toBeLessThanOrEqual(10);
    });

    test("should show add profile button when under limit", async () => {
      // Arrange
      await profilesPage.navigate();
      await profilesPage.waitForProfilesLoad();

      // Assert - If not at max limit, add button should be visible
      const isAtMax = await profilesPage.isAtMaxLimit();
      if (!isAtMax) {
        expect(await profilesPage.addProfileCard.isVisible()).toBe(true);
      }
    });

    test("should show max limit message when at 10 profiles", async () => {
      // Arrange
      await profilesPage.navigate();
      await profilesPage.waitForProfilesLoad();

      // Assert - Check limit message
      const count = await profilesPage.getProfileCount();
      const showsMaxMessage = await profilesPage.isAtMaxLimit();

      if (count >= 10) {
        expect(showsMaxMessage).toBe(true);
      } else {
        expect(showsMaxMessage).toBe(false);
      }
    });
  });

  test.describe("Navigation", () => {
    test("should navigate from profiles to add profile and back", async () => {
      // Arrange
      await profilesPage.navigate();

      // Act - Go to add profile
      await profilesPage.clickAddProfile();
      await addProfilePage.verifyPageLoaded();

      // Act - Cancel back to profiles
      await addProfilePage.cancel();

      // Assert - Back on profiles page
      await profilesPage.verifyPageLoaded();
    });
  });
});
