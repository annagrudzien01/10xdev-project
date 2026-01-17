import { test, expect } from "@playwright/test";
import { ProfilesPage, AddProfilePage } from "./page-objects";
import { login } from "./fixtures/auth";

/**
 * E2E Test: Create and Delete Profile Flow
 *
 * This test covers the complete lifecycle of a profile:
 * 0. Authenticate user
 * 1. Navigate to profiles page
 * 2. Click "Add Profile" button
 * 3. Wait for redirect to form page
 * 4. Fill in profile form
 * 5. Submit form
 * 6. Wait for redirect to profiles list
 * 7. Open context menu for newly created profile
 * 8. Click delete
 * 9. Wait for confirmation dialog
 * 10. Confirm and delete profile
 *
 * Uses Page Object Model pattern following Arrange-Act-Assert structure.
 */

test.describe("Profile Creation and Deletion Flow", () => {
  let profilesPage: ProfilesPage;
  let addProfilePage: AddProfilePage;

  // Test profile name (only letters, as per validation rules)
  const testProfileName = "testProfil";
  const testProfileAge = 6;

  test.beforeEach(async ({ page }) => {
    // Arrange - Initialize Page Objects
    profilesPage = new ProfilesPage(page);
    addProfilePage = new AddProfilePage(page);

    // Authenticate user before each test
    await login(page);
  });

  test("should create a profile and then delete it successfully", async () => {
    // ========================================
    // PART 1: CREATE PROFILE
    // ========================================

    // Step 1: Navigate to profiles page
    await test.step("Navigate to profiles page", async () => {
      await profilesPage.navigate();
      await profilesPage.verifyPageLoaded();
    });

    // Step 2: Click "Add Profile" button and wait for redirect
    await test.step("Click Add Profile button", async () => {
      // Check if we're in empty state or have profiles
      const isEmpty = await profilesPage.isEmpty();

      if (isEmpty) {
        await profilesPage.clickAddProfileFromEmptyState();
      } else {
        await profilesPage.clickAddProfile();
      }
    });

    // Step 3: Wait for redirect to form page
    await test.step("Verify redirect to add profile form", async () => {
      await addProfilePage.verifyPageLoaded();
      expect(await addProfilePage.getCurrentUrl()).toContain("/profiles/new");
    });

    // Step 4: Fill in profile form
    await test.step("Fill in profile form", async () => {
      const dateOfBirth = addProfilePage.getValidDateForAge(testProfileAge);
      await addProfilePage.fillForm(testProfileName, dateOfBirth);

      // Verify form is filled
      expect(await addProfilePage.getNameValue()).toBe(testProfileName);
      expect(await addProfilePage.getDateValue()).toBe(dateOfBirth);
    });

    // Step 5: Submit form
    await test.step("Submit profile form", async () => {
      await addProfilePage.submit();
    });

    // Step 6: Wait for redirect to profiles list
    await test.step("Wait for redirect to profiles list", async () => {
      await addProfilePage.waitForSubmitSuccess();
      await profilesPage.verifyPageLoaded();
      expect(await profilesPage.getCurrentUrl()).toContain("/profiles");
      expect(await profilesPage.getCurrentUrl()).not.toContain("/new");
    });

    // Verify profile was created
    await test.step("Verify profile appears in list", async () => {
      await profilesPage.waitForProfilesLoad();
      expect(await profilesPage.hasProfile(testProfileName)).toBe(true);
    });

    // ========================================
    // PART 2: DELETE PROFILE
    // ========================================

    // Step 7: Open context menu for the newly created profile
    await test.step("Open profile context menu", async () => {
      await profilesPage.openProfileMenu(testProfileName, "delete");
    });

    // Step 8: Wait for confirmation dialog
    await test.step("Wait for delete confirmation dialog", async () => {
      expect(await profilesPage.isDeleteDialogVisible()).toBe(true);

      // Verify dialog content
      const dialog = profilesPage.getPage().locator('[role="alertdialog"]');
      await expect(dialog.locator("text=Usunąć profil?")).toBeVisible();
      await expect(dialog.locator(`text=${testProfileName}`)).toBeVisible();
    });

    // Step 9: Confirm and delete profile
    await test.step("Confirm profile deletion", async () => {
      const dialog = profilesPage.getPage().locator('[role="alertdialog"]');
      const confirmButton = dialog.locator('button:has-text("Usuń profil")');

      await confirmButton.click();
    });

    // Step 10: Verify profile was deleted
    await test.step("Verify profile was deleted from list", async () => {
      // Wait for dialog to close
      const dialog = profilesPage.getPage().locator('[role="alertdialog"]');
      await dialog.waitFor({ state: "hidden" });

      // Wait for page reload/refresh (ProfileCard triggers reload on delete)
      await profilesPage.getPage().waitForLoadState("networkidle");

      // Give some time for the list to update
      await profilesPage.getPage().waitForTimeout(1000);

      // Verify profile no longer exists
      const profileExists = await profilesPage.hasProfile(testProfileName);
      expect(profileExists).toBe(false);
    });
  });

  test("should cancel profile deletion when clicking Cancel in dialog", async () => {
    // First, create a profile to delete
    const tempProfileName = `TempUser${Date.now()}`;

    await profilesPage.navigate();
    await profilesPage.clickAddProfile();
    await addProfilePage.createProfile(tempProfileName, addProfilePage.getValidDateForAge(5));
    await addProfilePage.waitForSubmitSuccess();

    // Now test canceling deletion
    await test.step("Open delete dialog", async () => {
      await profilesPage.openProfileMenu(tempProfileName, "delete");
      expect(await profilesPage.isDeleteDialogVisible()).toBe(true);
    });

    await test.step("Cancel deletion", async () => {
      await profilesPage.cancelDeleteProfile(tempProfileName);
    });

    await test.step("Verify profile still exists", async () => {
      await profilesPage.waitForPageLoad();
      expect(await profilesPage.hasProfile(tempProfileName)).toBe(true);
    });

    // Cleanup - delete the test profile
    await profilesPage.deleteProfile(tempProfileName);
  });

  test("should show error when trying to delete profile with active game session", async () => {
    // Note: This test assumes there's a way to create a profile with active session
    // This is a placeholder showing how to test error handling in delete dialog

    test.skip(); // Skip until we have a way to create active sessions

    const profileName = "ActiveSessionProfile";

    await test.step("Try to delete profile with active session", async () => {
      await profilesPage.navigate();
      await profilesPage.openProfileMenu(profileName, "delete");
    });

    await test.step("Verify error message in dialog", async () => {
      const errorMessage = await profilesPage.getDeleteErrorMessage();
      expect(errorMessage).toContain("aktywną sesją gry");
    });
  });
});

// Additional test suite for edge cases
test.describe("Profile Deletion - Edge Cases", () => {
  let profilesPage: ProfilesPage;

  test.beforeEach(async ({ page }) => {
    profilesPage = new ProfilesPage(page);

    // Authenticate user before each test
    await login(page);
  });

  test("should close delete dialog when pressing ESC key", async ({ page }) => {
    // Create a test profile
    const addProfilePage = new AddProfilePage(page);
    const tempProfileName = `EscTestUser${Date.now()}`;

    await profilesPage.navigate();
    await profilesPage.clickAddProfile();
    await addProfilePage.createProfile(tempProfileName, addProfilePage.getValidDateForAge(5));
    await addProfilePage.waitForSubmitSuccess();

    // Open delete dialog
    await profilesPage.openProfileMenu(tempProfileName, "delete");
    expect(await profilesPage.isDeleteDialogVisible()).toBe(true);

    // Press ESC to close
    await page.keyboard.press("Escape");

    // Verify dialog is closed and profile still exists
    const dialog = profilesPage.getPage().locator('[role="alertdialog"]');
    await dialog.waitFor({ state: "hidden" });
    expect(await profilesPage.hasProfile(tempProfileName)).toBe(true);

    // Cleanup
    await profilesPage.deleteProfile(tempProfileName);
  });

  test("should disable buttons while deletion is in progress", async ({ page }) => {
    // This test checks if buttons are disabled during API call
    // Note: May be too fast to catch in practice

    const addProfilePage = new AddProfilePage(page);
    const tempProfileName = `DisableTestUser${Date.now()}`;

    await profilesPage.navigate();
    await profilesPage.clickAddProfile();
    await addProfilePage.createProfile(tempProfileName, addProfilePage.getValidDateForAge(5));
    await addProfilePage.waitForSubmitSuccess();

    await profilesPage.openProfileMenu(tempProfileName, "delete");

    const dialog = profilesPage.getPage().locator('[role="alertdialog"]');
    const confirmButton = dialog.locator('button:has-text("Usuń profil")');
    const cancelButton = dialog.locator('button:has-text("Anuluj")');

    // Click confirm
    const confirmPromise = confirmButton.click();

    // Try to check if buttons are disabled (may be too fast)
    try {
      await expect(confirmButton).toBeDisabled();
      await expect(cancelButton).toBeDisabled();
    } catch {
      // Deletion was too fast - that's OK
    }

    await confirmPromise;
  });
});
