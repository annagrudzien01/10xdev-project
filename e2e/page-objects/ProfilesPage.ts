import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * ProfilesPage - Page Object Model for the profiles list page (/profiles)
 *
 * Handles interactions with:
 * - Profile list and cards
 * - Add profile button
 * - Empty state
 * - Loading and error states
 */
export class ProfilesPage extends BasePage {
  // Page URL
  readonly path = "/profiles";

  // Main page elements
  readonly pageTitle: Locator;
  readonly profilesList: Locator;
  readonly addProfileCard: Locator;
  readonly profileCounter: Locator;

  // State elements
  readonly loadingState: Locator;
  readonly errorState: Locator;
  readonly emptyState: Locator;
  readonly emptyStateAddButton: Locator;
  readonly maxLimitMessage: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.pageTitle = this.getByTestId("profiles-page-title");
    this.profilesList = this.getByTestId("profiles-list");
    this.addProfileCard = this.getByTestId("add-profile-card");
    this.profileCounter = page.locator('[aria-label*="Utworzone profile"]');

    // States
    this.loadingState = this.getByTestId("profiles-loading-state");
    this.errorState = this.getByTestId("profiles-error-state");
    this.emptyState = this.getByTestId("empty-state");
    this.emptyStateAddButton = this.getByTestId("empty-state-add-profile-button");
    this.maxLimitMessage = this.getByTestId("profiles-max-limit-message");
  }

  /**
   * Get access to page for complex operations
   */
  getPage(): Page {
    return this.page;
  }

  /**
   * Navigate to profiles page
   */
  async navigate(): Promise<void> {
    await this.goto(this.path);
    await this.waitForPageLoad();
    // Wait for React to hydrate
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Click "Add Profile" card button
   */
  async clickAddProfile(): Promise<void> {
    await this.addProfileCard.click();
    await this.waitForNavigation();
  }

  /**
   * Click "Add Profile" button in empty state
   */
  async clickAddProfileFromEmptyState(): Promise<void> {
    await this.emptyStateAddButton.click();
    await this.waitForNavigation();
  }

  /**
   * Get all profile cards on the page
   */
  async getProfileCards(): Promise<Locator[]> {
    const cards = await this.profilesList.locator("li").all();
    // Filter out the "Add Profile" card
    return cards.filter(async (card) => {
      const testId = await card.getAttribute("data-testid");
      return testId !== "add-profile-card";
    });
  }

  /**
   * Get count of profiles from counter
   */
  async getProfileCount(): Promise<number> {
    const text = await this.profileCounter.textContent();
    const match = text?.match(/(\d+)\/10/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Click on a specific profile card by name
   * @param profileName - Name of the profile to click
   */
  async clickProfileByName(profileName: string): Promise<void> {
    const profile = this.page.locator(`text=${profileName}`).first();
    await profile.click();
  }

  /**
   * Check if a profile exists by name
   * @param profileName - Name of the profile to check
   */
  async hasProfile(profileName: string): Promise<boolean> {
    const profile = this.page.locator(`text=${profileName}`).first();
    return await profile.isVisible();
  }

  /**
   * Wait for profiles list to load
   */
  async waitForProfilesLoad(): Promise<void> {
    await this.loadingState.waitFor({ state: "hidden" });
    await expect(this.profilesList).toBeVisible();
  }

  /**
   * Check if loading state is visible
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingState.isVisible();
  }

  /**
   * Check if error state is visible
   */
  async hasError(): Promise<boolean> {
    return await this.errorState.isVisible();
  }

  /**
   * Check if empty state is visible
   */
  async isEmpty(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  /**
   * Check if max profiles limit message is visible
   */
  async isAtMaxLimit(): Promise<boolean> {
    return await this.maxLimitMessage.isVisible();
  }

  /**
   * Verify page is displayed correctly
   */
  async verifyPageLoaded(): Promise<void> {
    // Wait for either the title (with profiles) or empty state
    const titleOrEmpty = this.page.locator('[data-testid="profiles-page-title"], [data-testid="empty-state"]');
    await titleOrEmpty.first().waitFor({ state: "visible", timeout: 10000 });

    // If we have profiles, verify the title
    if (await this.pageTitle.isVisible()) {
      await expect(this.pageTitle).toHaveText("Wybierz profil");
    }
  }

  /**
   * Open profile context menu and select action
   * @param profileName - Name of the profile
   * @param action - Action to perform: "edit" or "delete"
   */
  async openProfileMenu(profileName: string, action: "edit" | "delete"): Promise<void> {
    const profileCard = this.page.locator(`text=${profileName}`).locator("..").locator("..");
    const menuButton = profileCard.locator('button[aria-label*="Opcje profilu"]');
    await menuButton.click();

    const menuItem = action === "edit" ? this.page.locator("text=Edytuj") : this.page.locator("text=Usuń");
    await menuItem.click();
  }

  /**
   * Delete a profile by name
   * Opens context menu, clicks delete, confirms in dialog
   * @param profileName - Name of the profile to delete
   */
  async deleteProfile(profileName: string): Promise<void> {
    // Open context menu and click delete
    await this.openProfileMenu(profileName, "delete");

    // Wait for confirmation dialog
    const dialog = this.page.locator('[role="alertdialog"]');
    await expect(dialog).toBeVisible();

    // Verify dialog content
    const dialogTitle = dialog.locator("text=Usunąć profil?");
    await expect(dialogTitle).toBeVisible();

    // Click confirm button
    const confirmButton = dialog.locator('button:has-text("Usuń profil")');
    await confirmButton.click();

    // Wait for dialog to close and profile to be removed
    await dialog.waitFor({ state: "hidden" });
  }

  /**
   * Cancel profile deletion in confirmation dialog
   * @param profileName - Name of the profile
   */
  async cancelDeleteProfile(profileName: string): Promise<void> {
    // Open context menu and click delete
    await this.openProfileMenu(profileName, "delete");

    // Wait for confirmation dialog
    const dialog = this.page.locator('[role="alertdialog"]');
    await expect(dialog).toBeVisible();

    // Click cancel button
    const cancelButton = dialog.locator('button:has-text("Anuluj")');
    await cancelButton.click();

    // Wait for dialog to close
    await dialog.waitFor({ state: "hidden" });
  }

  /**
   * Check if delete confirmation dialog is visible
   */
  async isDeleteDialogVisible(): Promise<boolean> {
    const dialog = this.page.locator('[role="alertdialog"]');
    return await dialog.isVisible();
  }

  /**
   * Get delete confirmation dialog error message
   * Returns error message if visible, empty string otherwise
   */
  async getDeleteErrorMessage(): Promise<string> {
    const dialog = this.page.locator('[role="alertdialog"]');
    const errorMessage = dialog.locator('[role="alert"]');

    try {
      return (await errorMessage.textContent()) || "";
    } catch {
      return "";
    }
  }
}
