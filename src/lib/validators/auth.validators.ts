/**
 * Authentication form validators
 *
 * Pure validation functions that can be used across different components
 * and easily unit tested.
 *
 * @module auth.validators
 */

/**
 * Email validation rules:
 * - Required (non-empty)
 * - Valid email format (RFC 5322 subset)
 *
 * @param email - Email address to validate
 * @returns Error message if invalid, null if valid
 */
export function validateEmail(email: string): string | null {
  // Check if empty
  if (!email) {
    return "E-mail jest wymagany";
  }

  // Check email format using RFC 5322 subset regex
  // Matches: local-part@domain.tld
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return "Podaj prawidłowy adres e-mail";
  }

  return null;
}

/**
 * Password validation for LOGIN form
 * Note: Login form has minimal validation (only required check)
 * For registration/reset, use validateStrongPassword
 *
 * @param password - Password to validate
 * @returns Error message if invalid, null if valid
 */
export function validateLoginPassword(password: string): string | null {
  if (!password) {
    return "Hasło jest wymagane";
  }

  return null;
}

/**
 * Strong password validation for REGISTRATION/RESET
 * Rules:
 * - Minimum 8 characters
 * - At least one uppercase letter [A-Z]
 * - At least one lowercase letter [a-z]
 * - At least one digit [0-9]
 * - At least one special character [!@#$%^&*(),.?":{}|<>]
 *
 * @param password - Password to validate
 * @returns Error message if invalid, null if valid
 */
export function validateStrongPassword(password: string): string | null {
  if (!password) {
    return "Hasło jest wymagane";
  }

  if (password.length < 8) {
    return "Hasło musi mieć co najmniej 8 znaków";
  }

  if (!/[A-Z]/.test(password)) {
    return "Hasło musi zawierać co najmniej jedną wielką literę";
  }

  if (!/[a-z]/.test(password)) {
    return "Hasło musi zawierać co najmniej jedną małą literę";
  }

  if (!/[0-9]/.test(password)) {
    return "Hasło musi zawierać co najmniej jedną cyfrę";
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return "Hasło musi zawierać co najmniej jeden znak specjalny";
  }

  return null;
}

/**
 * Validate all strong password rules and return ALL errors
 * Useful for showing all validation errors at once
 *
 * @param password - Password to validate
 * @returns Array of error messages (empty if valid)
 */
export function validateStrongPasswordAllErrors(password: string): string[] {
  const errors: string[] = [];

  if (!password) {
    errors.push("Hasło jest wymagane");
    return errors; // Return early if empty
  }

  if (password.length < 8) {
    errors.push("Hasło musi mieć co najmniej 8 znaków");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Hasło musi zawierać co najmniej jedną wielką literę");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Hasło musi zawierać co najmniej jedną małą literę");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Hasło musi zawierać co najmniej jedną cyfrę");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Hasło musi zawierać co najmniej jeden znak specjalny");
  }

  return errors;
}

/**
 * Type guard to check if value is a valid email
 *
 * @param email - Email to check
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  return validateEmail(email) === null;
}

/**
 * Type guard to check if value is a valid strong password
 *
 * @param password - Password to check
 * @returns True if meets all strong password requirements
 */
export function isStrongPassword(password: string): boolean {
  return validateStrongPassword(password) === null;
}
