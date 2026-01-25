import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * AddProfilePage - Page Object Model for the add profile form page (/profiles/new)
 *
 * Handles interactions with:
 * - Profile form fields (name, date of birth)
 * - Form submission and cancellation
 * - Validation errors
 * - API errors
 */
export class AddProfilePage extends BasePage {
  // Page URL
  readonly path = "/profiles/new";

  // Page elements
  readonly pageTitle: Locator;
  readonly form: Locator;

  // Form fields
  readonly nameInput: Locator;
  readonly dateInput: Locator;

  // Buttons
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  // Error messages
  readonly generalError: Locator;
  readonly nameError: Locator;
  readonly dateError: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.pageTitle = this.getByTestId("add-profile-page-title");
    this.form = this.getByTestId("profile-form");

    // Form fields
    this.nameInput = this.getByTestId("profile-form-name-input");
    this.dateInput = this.getByTestId("profile-form-date-input");

    // Buttons
    this.submitButton = this.getByTestId("profile-form-submit-button");
    this.cancelButton = this.getByTestId("profile-form-cancel-button");

    // Errors
    this.generalError = this.getByTestId("profile-form-general-error");
    this.nameError = this.getByTestId("profile-form-name-error");
    this.dateError = this.getByTestId("profile-form-date-error");
  }

  /**
   * Navigate to add profile page
   */
  async navigate(): Promise<void> {
    await this.goto(this.path);
    await this.waitForPageLoad();
  }

  /**
   * Fill the profile name field
   * @param name - Profile name to enter
   */
  async fillName(name: string): Promise<void> {
    await this.nameInput.waitFor({ state: "visible", timeout: 10000 });

    // Multiple attempts to fill with verification after blur
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.nameInput.click({ force: true });
      await this.nameInput.fill(name);
      await this.nameInput.blur();

      // Wait for React to process and validate
      await this.page.waitForTimeout(500);

      const value = await this.nameInput.inputValue();
      if (value === name) {
        return; // Success
      }

      // Retry with pressSequentially for better reliability
      await this.nameInput.clear();
      await this.nameInput.pressSequentially(name, { delay: 100 });
      await this.page.waitForTimeout(300);

      const retryValue = await this.nameInput.inputValue();
      if (retryValue === name) {
        await this.nameInput.blur();
        await this.page.waitForTimeout(300);
        return;
      }
    }

    throw new Error(`Failed to fill name input with "${name}" after 3 attempts`);
  }

  /**
   * Fill the date of birth field
   * @param date - Date in YYYY-MM-DD format
   */
  async fillDateOfBirth(date: string): Promise<void> {
    await this.dateInput.waitFor({ state: "visible" });
    await this.dateInput.click();
    await this.dateInput.clear();
    await this.dateInput.fill(date);
    await this.dateInput.blur(); // Trigger validation
  }

  /**
   * Fill the entire form
   * @param name - Profile name
   * @param dateOfBirth - Date in YYYY-MM-DD format
   */
  async fillForm(name: string, dateOfBirth: string): Promise<void> {
    // Wait for form to be interactive
    await this.nameInput.waitFor({ state: "visible" });
    await this.page.waitForLoadState("domcontentloaded");

    await this.fillName(name);
    await this.fillDateOfBirth(dateOfBirth);

    // Wait for validation to complete
    await this.page.waitForTimeout(500);
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    // Wait for submit button to be enabled
    await this.submitButton.waitFor({ state: "visible", timeout: 5000 });
    await this.page.waitForTimeout(500); // Wait for validation

    // Click submit button
    await this.submitButton.click();
  }

  /**
   * Cancel form and confirm if prompted
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();

    // Handle confirmation dialog if it appears (for dirty forms)
    this.page.on("dialog", (dialog) => dialog.accept());
  }

  /**
   * Fill form and submit
   * @param name - Profile name
   * @param dateOfBirth - Date in YYYY-MM-DD format
   */
  async createProfile(name: string, dateOfBirth: string): Promise<void> {
    await this.fillForm(name, dateOfBirth);

    // Verify values before submitting
    const nameValue = await this.getNameValue();
    const dateValue = await this.getDateValue();

    if (nameValue !== name || dateValue !== dateOfBirth) {
      throw new Error(
        `Form values mismatch before submit!\n` +
          `Expected name: "${name}", got: "${nameValue}"\n` +
          `Expected date: "${dateOfBirth}", got: "${dateValue}"`
      );
    }

    await this.submit();
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Check if cancel button is disabled
   */
  async isCancelDisabled(): Promise<boolean> {
    return await this.cancelButton.isDisabled();
  }

  /**
   * Check if form is in submitting state
   */
  async isSubmitting(): Promise<boolean> {
    const text = await this.submitButton.textContent();
    return text?.includes("Zapisywanie...") ?? false;
  }

  /**
   * Get name field value
   */
  async getNameValue(): Promise<string> {
    return (await this.nameInput.inputValue()) || "";
  }

  /**
   * Get date field value
   */
  async getDateValue(): Promise<string> {
    return (await this.dateInput.inputValue()) || "";
  }

  /**
   * Check if general error is visible
   */
  async hasGeneralError(): Promise<boolean> {
    return await this.generalError.isVisible();
  }

  /**
   * Check if name error is visible
   */
  async hasNameError(): Promise<boolean> {
    return await this.nameError.isVisible();
  }

  /**
   * Check if date error is visible
   */
  async hasDateError(): Promise<boolean> {
    return await this.dateError.isVisible();
  }

  /**
   * Get general error message text
   */
  async getGeneralErrorMessage(): Promise<string> {
    return (await this.generalError.textContent()) || "";
  }

  /**
   * Get name error message text
   */
  async getNameErrorMessage(): Promise<string> {
    return (await this.nameError.textContent()) || "";
  }

  /**
   * Get date error message text
   */
  async getDateErrorMessage(): Promise<string> {
    return (await this.dateError.textContent()) || "";
  }

  /**
   * Verify page is displayed correctly
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.pageTitle).toHaveText("Nowy profil dziecka");
    await expect(this.form).toBeVisible();
  }

  /**
   * Verify form validation errors are displayed
   * @param expectedErrors - Object with error fields to check
   */
  async verifyValidationErrors(expectedErrors: { name?: boolean; date?: boolean; general?: boolean }): Promise<void> {
    if (expectedErrors.name) {
      await expect(this.nameError).toBeVisible();
    }
    if (expectedErrors.date) {
      await expect(this.dateError).toBeVisible();
    }
    if (expectedErrors.general) {
      await expect(this.generalError).toBeVisible();
    }
  }

  /**
   * Wait for form submission to complete
   * (Waits for navigation to profiles page)
   */
  async waitForSubmitSuccess(): Promise<void> {
    await this.page.waitForURL(/\/profiles/, { timeout: 10000 });
  }

  /**
   * Generate valid date of birth for given age
   * @param age - Age in years (3-18)
   */
  getValidDateForAge(age: number): string {
    const today = new Date();
    const birthYear = today.getFullYear() - age;
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${birthYear}-${month}-${day}`;
  }
}
