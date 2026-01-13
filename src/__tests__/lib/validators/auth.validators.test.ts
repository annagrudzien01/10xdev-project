import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validateLoginPassword,
  validateStrongPassword,
  validateStrongPasswordAllErrors,
  isValidEmail,
  isStrongPassword,
} from "@/lib/validators/auth.validators";

/**
 * Unit tests for authentication validators
 *
 * Coverage:
 * - Email validation (format, required, edge cases)
 * - Login password validation (minimal - only required)
 * - Strong password validation (length, complexity, multiple errors)
 * - Type guard functions
 * - Edge cases (whitespace, unicode, special characters)
 * - Security considerations
 */

describe("auth.validators", () => {
  // =================================================================
  // VALIDATE EMAIL
  // =================================================================
  describe("validateEmail", () => {
    describe("valid emails", () => {
      it("should return null for valid simple email", () => {
        // Arrange
        const email = "user@example.com";

        // Act
        const result = validateEmail(email);

        // Assert
        expect(result).toBeNull();
      });

      it("should accept email with subdomain", () => {
        const result = validateEmail("user@mail.example.com");
        expect(result).toBeNull();
      });

      it("should accept email with plus sign", () => {
        const result = validateEmail("user+tag@example.com");
        expect(result).toBeNull();
      });

      it("should accept email with dots in local part", () => {
        const result = validateEmail("first.last@example.com");
        expect(result).toBeNull();
      });

      it("should accept email with numbers", () => {
        const result = validateEmail("user123@example.com");
        expect(result).toBeNull();
      });

      it("should accept email with dash in local part", () => {
        const result = validateEmail("user-name@example.com");
        expect(result).toBeNull();
      });

      it("should accept email with underscore", () => {
        const result = validateEmail("user_name@example.com");
        expect(result).toBeNull();
      });

      it("should accept email with short TLD", () => {
        const result = validateEmail("user@example.io");
        expect(result).toBeNull();
      });

      it("should accept email with long TLD", () => {
        const result = validateEmail("user@example.museum");
        expect(result).toBeNull();
      });

      it("should accept email with numbers in domain", () => {
        const result = validateEmail("user@123domain.com");
        expect(result).toBeNull();
      });
    });

    describe("invalid emails - required", () => {
      it("should return error for empty string", () => {
        // Arrange
        const email = "";

        // Act
        const result = validateEmail(email);

        // Assert
        expect(result).toBe("E-mail jest wymagany");
      });

      it("should return Polish error message for empty email", () => {
        const result = validateEmail("");
        expect(result).toMatch(/wymagany/i);
      });
    });

    describe("invalid emails - format", () => {
      it("should reject email without @ symbol", () => {
        // Arrange
        const email = "userexample.com";

        // Act
        const result = validateEmail(email);

        // Assert
        expect(result).toBe("Podaj prawidłowy adres e-mail");
      });

      it("should reject email without domain", () => {
        const result = validateEmail("user@");
        expect(result).toBe("Podaj prawidłowy adres e-mail");
      });

      it("should reject email without local part", () => {
        const result = validateEmail("@example.com");
        expect(result).toBe("Podaj prawidłowy adres e-mail");
      });

      it("should reject email without TLD", () => {
        const result = validateEmail("user@domain");
        expect(result).toBe("Podaj prawidłowy adres e-mail");
      });

      it("should reject email with spaces", () => {
        const result = validateEmail("user name@example.com");
        expect(result).toBe("Podaj prawidłowy adres e-mail");
      });

      it("should reject email with multiple @ symbols", () => {
        const result = validateEmail("user@@example.com");
        expect(result).toBe("Podaj prawidłowy adres e-mail");
      });

      it("should accept email with # character (simple regex is liberal)", () => {
        // Note: Current simple regex is liberal and allows this
        const result = validateEmail("user#name@example.com");
        expect(result).toBeNull();
      });

      it("should return Polish error message for invalid format", () => {
        const result = validateEmail("invalid");
        expect(result).toMatch(/prawidłowy.*e-mail/i);
      });
    });

    describe("edge cases", () => {
      it("should reject email with only whitespace (treated as invalid format)", () => {
        // Whitespace-only string is not empty but fails format check
        const result = validateEmail("   ");
        expect(result).toBe("Podaj prawidłowy adres e-mail");
      });

      it("should NOT trim leading/trailing spaces (preserve as-is)", () => {
        const result = validateEmail("  user@example.com  ");
        // Should fail because of spaces
        expect(result).toBe("Podaj prawidłowy adres e-mail");
      });

      it("should accept email starting with dot (simple regex allows it)", () => {
        // Note: RFC 5322 doesn't allow this, but our simple regex does
        const result = validateEmail(".user@example.com");
        expect(result).toBeNull();
      });

      it("should accept email ending with dot before @ (simple regex allows it)", () => {
        // Note: RFC 5322 doesn't allow this, but our simple regex does
        const result = validateEmail("user.@example.com");
        expect(result).toBeNull();
      });

      it("should accept email with consecutive dots (simple regex allows it)", () => {
        // Note: RFC 5322 doesn't allow this, but our simple regex does
        const result = validateEmail("user..name@example.com");
        expect(result).toBeNull();
      });

      it("should accept email with consecutive dots in domain (simple regex allows it)", () => {
        // Note: RFC 5322 doesn't allow this, but our simple regex does
        const result = validateEmail("user@example..com");
        expect(result).toBeNull();
      });

      it("should reject email with newline character", () => {
        const result = validateEmail("user\n@example.com");
        expect(result).toBe("Podaj prawidłowy adres e-mail");
      });

      it("should reject email with tab character", () => {
        const result = validateEmail("user\t@example.com");
        expect(result).toBe("Podaj prawidłowy adres e-mail");
      });

      it("should handle very long email", () => {
        const longEmail = "a".repeat(100) + "@example.com";
        const result = validateEmail(longEmail);
        expect(result).toBeNull(); // Should be valid if format is correct
      });

      it("should reject empty local part with valid domain", () => {
        const result = validateEmail("@valid-domain.com");
        expect(result).toBe("Podaj prawidłowy adres e-mail");
      });
    });

    describe("case sensitivity", () => {
      it("should accept uppercase letters in local part", () => {
        const result = validateEmail("USER@example.com");
        expect(result).toBeNull();
      });

      it("should accept uppercase letters in domain", () => {
        const result = validateEmail("user@EXAMPLE.COM");
        expect(result).toBeNull();
      });

      it("should accept mixed case", () => {
        const result = validateEmail("UsEr@ExAmPlE.CoM");
        expect(result).toBeNull();
      });
    });

    describe("internationalization", () => {
      it("should accept unicode characters (simple regex allows them)", () => {
        // Current regex uses [^\s@] which allows unicode
        const result = validateEmail("użytkownik@example.com");
        expect(result).toBeNull();
      });

      it("should accept international domain", () => {
        // Current regex allows unicode in domain
        const result = validateEmail("user@münchen.de");
        expect(result).toBeNull();
      });
    });
  });

  // =================================================================
  // VALIDATE LOGIN PASSWORD
  // =================================================================
  describe("validateLoginPassword", () => {
    describe("valid passwords", () => {
      it("should return null for any non-empty password", () => {
        // Arrange
        const password = "password";

        // Act
        const result = validateLoginPassword(password);

        // Assert
        expect(result).toBeNull();
      });

      it("should accept single character password", () => {
        const result = validateLoginPassword("x");
        expect(result).toBeNull();
      });

      it("should accept password with spaces", () => {
        const result = validateLoginPassword("pass word");
        expect(result).toBeNull();
      });

      it("should accept password with special characters", () => {
        const result = validateLoginPassword("p@ssw0rd!");
        expect(result).toBeNull();
      });

      it("should accept very long password", () => {
        const result = validateLoginPassword("a".repeat(10000));
        expect(result).toBeNull();
      });

      it("should accept password with unicode", () => {
        const result = validateLoginPassword("пароль123");
        expect(result).toBeNull();
      });

      it("should accept password with emojis", () => {
        const result = validateLoginPassword("password😀");
        expect(result).toBeNull();
      });

      it("should accept weak password (no complexity check for login)", () => {
        const result = validateLoginPassword("weak");
        expect(result).toBeNull();
      });
    });

    describe("invalid passwords", () => {
      it("should return error for empty string", () => {
        // Arrange
        const password = "";

        // Act
        const result = validateLoginPassword(password);

        // Assert
        expect(result).toBe("Hasło jest wymagane");
      });

      it("should return Polish error message for empty password", () => {
        const result = validateLoginPassword("");
        expect(result).toMatch(/wymagane/i);
      });
    });

    describe("edge cases", () => {
      it("should accept password with only spaces (not empty)", () => {
        const result = validateLoginPassword("   ");
        expect(result).toBeNull();
      });

      it("should accept password with newlines", () => {
        const result = validateLoginPassword("pass\nword");
        expect(result).toBeNull();
      });

      it("should accept password with tabs", () => {
        const result = validateLoginPassword("pass\tword");
        expect(result).toBeNull();
      });

      it("should accept SQL injection attempt (for login)", () => {
        const result = validateLoginPassword("'; DROP TABLE users; --");
        expect(result).toBeNull();
      });

      it("should accept HTML/script tags (for login)", () => {
        const result = validateLoginPassword('<script>alert("xss")</script>');
        expect(result).toBeNull();
      });
    });

    describe("vs strong password validation", () => {
      it("should NOT check for length (unlike strong password)", () => {
        const result = validateLoginPassword("abc");
        expect(result).toBeNull();
      });

      it("should NOT check for uppercase (unlike strong password)", () => {
        const result = validateLoginPassword("lowercase");
        expect(result).toBeNull();
      });

      it("should NOT check for digits (unlike strong password)", () => {
        const result = validateLoginPassword("nodigits");
        expect(result).toBeNull();
      });

      it("should NOT check for special chars (unlike strong password)", () => {
        const result = validateLoginPassword("nospecial");
        expect(result).toBeNull();
      });
    });
  });

  // =================================================================
  // VALIDATE STRONG PASSWORD
  // =================================================================
  describe("validateStrongPassword", () => {
    describe("valid strong passwords", () => {
      it("should return null for password meeting all requirements", () => {
        // Arrange
        const password = "Password123!";

        // Act
        const result = validateStrongPassword(password);

        // Assert
        expect(result).toBeNull();
      });

      it("should accept password with exactly 8 characters", () => {
        const result = validateStrongPassword("Pass123!");
        expect(result).toBeNull();
      });

      it("should accept password with multiple special characters", () => {
        const result = validateStrongPassword("Pass123!@#$%");
        expect(result).toBeNull();
      });

      it("should accept password with all allowed special characters", () => {
        const specials = '!@#$%^&*(),.?":{}|<>';
        const result = validateStrongPassword(`Abc123${specials}`);
        expect(result).toBeNull();
      });

      it("should accept very long strong password", () => {
        const result = validateStrongPassword("Password123!".repeat(100));
        expect(result).toBeNull();
      });

      it("should accept password with uppercase at any position", () => {
        const passwords = ["Password123!", "passworD123!", "password123!P"];
        passwords.forEach((pwd) => {
          const result = validateStrongPassword(pwd);
          expect(result).toBeNull();
        });
      });
    });

    describe("invalid - empty", () => {
      it("should return error for empty password", () => {
        // Arrange
        const password = "";

        // Act
        const result = validateStrongPassword(password);

        // Assert
        expect(result).toBe("Hasło jest wymagane");
      });

      it("should return Polish error for empty", () => {
        const result = validateStrongPassword("");
        expect(result).toMatch(/wymagane/i);
      });
    });

    describe("invalid - length", () => {
      it("should reject password with less than 8 characters", () => {
        // Arrange
        const password = "Pass12!"; // 7 chars

        // Act
        const result = validateStrongPassword(password);

        // Assert
        expect(result).toBe("Hasło musi mieć co najmniej 8 znaków");
      });

      it("should reject password with exactly 7 characters", () => {
        const result = validateStrongPassword("Abc123!");
        expect(result).toBe("Hasło musi mieć co najmniej 8 znaków");
      });

      it("should reject single character even with all types", () => {
        const result = validateStrongPassword("A");
        expect(result).toBe("Hasło musi mieć co najmniej 8 znaków");
      });

      it("should return Polish error for length", () => {
        const result = validateStrongPassword("Short1!");
        expect(result).toMatch(/co najmniej 8 znaków/i);
      });
    });

    describe("invalid - no uppercase", () => {
      it("should reject password without uppercase letter", () => {
        // Arrange
        const password = "password123!";

        // Act
        const result = validateStrongPassword(password);

        // Assert
        expect(result).toBe("Hasło musi zawierać co najmniej jedną wielką literę");
      });

      it("should return Polish error for no uppercase", () => {
        const result = validateStrongPassword("lowercase123!");
        expect(result).toMatch(/wielką literę/i);
      });
    });

    describe("invalid - no lowercase", () => {
      it("should reject password without lowercase letter", () => {
        // Arrange
        const password = "PASSWORD123!";

        // Act
        const result = validateStrongPassword(password);

        // Assert
        expect(result).toBe("Hasło musi zawierać co najmniej jedną małą literę");
      });

      it("should return Polish error for no lowercase", () => {
        const result = validateStrongPassword("UPPERCASE123!");
        expect(result).toMatch(/małą literę/i);
      });
    });

    describe("invalid - no digit", () => {
      it("should reject password without digit", () => {
        // Arrange
        const password = "Password!";

        // Act
        const result = validateStrongPassword(password);

        // Assert
        expect(result).toBe("Hasło musi zawierać co najmniej jedną cyfrę");
      });

      it("should return Polish error for no digit", () => {
        const result = validateStrongPassword("PasswordOnly!");
        expect(result).toMatch(/cyfrę/i);
      });
    });

    describe("invalid - no special character", () => {
      it("should reject password without special character", () => {
        // Arrange
        const password = "Password123";

        // Act
        const result = validateStrongPassword(password);

        // Assert
        expect(result).toBe("Hasło musi zawierać co najmniej jeden znak specjalny");
      });

      it("should return Polish error for no special char", () => {
        const result = validateStrongPassword("Password123");
        expect(result).toMatch(/znak specjalny/i);
      });

      it("should reject password with only alphanumeric", () => {
        const result = validateStrongPassword("Password1234");
        expect(result).toBe("Hasło musi zawierać co najmniej jeden znak specjalny");
      });

      it("should reject password with non-allowed special characters", () => {
        // Backslash, equals, etc. not in allowed list
        const result = validateStrongPassword("Password123\\");
        expect(result).toBe("Hasło musi zawierać co najmniej jeden znak specjalny");
      });
    });

    describe("edge cases", () => {
      it("should handle password with spaces (if meets other requirements)", () => {
        const result = validateStrongPassword("Pass word 123!");
        expect(result).toBeNull();
      });

      it("should reject password with only spaces", () => {
        const result = validateStrongPassword("        ");
        // Fails multiple requirements
        expect(result).not.toBeNull();
      });

      it("should handle unicode uppercase (should fail - only ASCII)", () => {
        const result = validateStrongPassword("Пароль123!");
        // П is uppercase but not [A-Z]
        expect(result).toBe("Hasło musi zawierać co najmniej jedną wielką literę");
      });

      it("should handle unicode lowercase (should fail - only ASCII)", () => {
        const result = validateStrongPassword("PASSWORD123!п");
        // п is lowercase but not [a-z]
        expect(result).toBe("Hasło musi zawierać co najmniej jedną małą literę");
      });

      it("should accept password with Polish characters (if has ASCII)", () => {
        const result = validateStrongPassword("Hasło123!ąćęłńó");
        expect(result).toBeNull();
      });

      it("should handle emoji (if other requirements met)", () => {
        const result = validateStrongPassword("Password123!😀");
        expect(result).toBeNull();
      });
    });

    describe("returns first error only", () => {
      it("should return length error first (not all errors)", () => {
        const result = validateStrongPassword("a");
        expect(result).toBe("Hasło musi mieć co najmniej 8 znaków");
      });

      it("should return uppercase error if length OK but no uppercase", () => {
        const result = validateStrongPassword("password123!");
        expect(result).toBe("Hasło musi zawierać co najmniej jedną wielką literę");
      });

      it("should check errors in order: empty > length > upper > lower > digit > special", () => {
        // Each test validates the order
        expect(validateStrongPassword("")).toBe("Hasło jest wymagane");
        expect(validateStrongPassword("short")).toBe("Hasło musi mieć co najmniej 8 znaków");
        expect(validateStrongPassword("nouppper1!")).toBe("Hasło musi zawierać co najmniej jedną wielką literę");
        expect(validateStrongPassword("NOLOWER1!")).toBe("Hasło musi zawierać co najmniej jedną małą literę");
        expect(validateStrongPassword("NoDigits!")).toBe("Hasło musi zawierać co najmniej jedną cyfrę");
        expect(validateStrongPassword("NoSpecial1")).toBe("Hasło musi zawierać co najmniej jeden znak specjalny");
      });
    });
  });

  // =================================================================
  // VALIDATE STRONG PASSWORD ALL ERRORS
  // =================================================================
  describe("validateStrongPasswordAllErrors", () => {
    describe("returns all errors", () => {
      it("should return empty array for valid password", () => {
        // Arrange
        const password = "Password123!";

        // Act
        const result = validateStrongPasswordAllErrors(password);

        // Assert
        expect(result).toEqual([]);
      });

      it("should return all 5 errors for completely weak password", () => {
        // Arrange
        const password = "WEAK"; // all uppercase, no lowercase, no digit, no special, too short

        // Act
        const result = validateStrongPasswordAllErrors(password);

        // Assert
        expect(result).toHaveLength(4); // length, lowercase, digit, special (has uppercase)
        expect(result).toContain("Hasło musi mieć co najmniej 8 znaków");
        expect(result).toContain("Hasło musi zawierać co najmniej jedną małą literę");
        expect(result).toContain("Hasło musi zawierać co najmniej jedną cyfrę");
        expect(result).toContain("Hasło musi zawierać co najmniej jeden znak specjalny");
      });

      it("should return only required error for empty password", () => {
        // Arrange
        const password = "";

        // Act
        const result = validateStrongPasswordAllErrors(password);

        // Assert
        expect(result).toEqual(["Hasło jest wymagane"]);
      });

      it("should return 2 errors for password missing only digit and special", () => {
        const password = "Password";
        const result = validateStrongPasswordAllErrors(password);

        expect(result).toHaveLength(2);
        expect(result).toContain("Hasło musi zawierać co najmniej jedną cyfrę");
        expect(result).toContain("Hasło musi zawierać co najmniej jeden znak specjalny");
      });

      it("should return errors in consistent order", () => {
        const result = validateStrongPasswordAllErrors("short");

        // Order: length, uppercase, lowercase, digit, special
        expect(result[0]).toMatch(/8 znaków/);
        expect(result[1]).toMatch(/wielką literę/);
        expect(result[2]).toMatch(/cyfrę/);
        expect(result[3]).toMatch(/znak specjalny/);
      });
    });

    describe("edge cases", () => {
      it("should handle progressively better passwords", () => {
        const tests = [
          { pwd: "a", expectedCount: 4 }, // has lowercase, missing: length, upper, digit, special
          { pwd: "Abcdefgh", expectedCount: 2 }, // length OK, upper+lower OK, no digit/special
          { pwd: "Abcdefgh1", expectedCount: 1 }, // all but special
          { pwd: "Abcdefgh1!", expectedCount: 0 }, // all OK
        ];

        tests.forEach(({ pwd, expectedCount }) => {
          const result = validateStrongPasswordAllErrors(pwd);
          expect(result).toHaveLength(expectedCount);
        });
      });
    });
  });

  // =================================================================
  // IS VALID EMAIL (Type Guard)
  // =================================================================
  describe("isValidEmail", () => {
    it("should return true for valid email", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
    });

    it("should return false for invalid email", () => {
      expect(isValidEmail("invalid")).toBe(false);
    });

    it("should return false for empty email", () => {
      expect(isValidEmail("")).toBe(false);
    });

    it("should match validateEmail logic", () => {
      const emails = ["valid@example.com", "invalid", "", "@no-local.com", "no-domain@"];

      emails.forEach((email) => {
        const isValid = isValidEmail(email);
        const validateResult = validateEmail(email);
        expect(isValid).toBe(validateResult === null);
      });
    });
  });

  // =================================================================
  // IS STRONG PASSWORD (Type Guard)
  // =================================================================
  describe("isStrongPassword", () => {
    it("should return true for strong password", () => {
      expect(isStrongPassword("Password123!")).toBe(true);
    });

    it("should return false for weak password", () => {
      expect(isStrongPassword("weak")).toBe(false);
    });

    it("should return false for empty password", () => {
      expect(isStrongPassword("")).toBe(false);
    });

    it("should match validateStrongPassword logic", () => {
      const passwords = ["Password123!", "weak", "", "NoDigits!", "NoSpecial123", "password123!"];

      passwords.forEach((password) => {
        const isStrong = isStrongPassword(password);
        const validateResult = validateStrongPassword(password);
        expect(isStrong).toBe(validateResult === null);
      });
    });
  });

  // =================================================================
  // CROSS-FUNCTION CONSISTENCY
  // =================================================================
  describe("cross-function consistency", () => {
    it("should use same email validation logic in isValidEmail", () => {
      const testEmails = ["valid@example.com", "invalid", "", "user+tag@example.com", "@nodomain.com"];

      testEmails.forEach((email) => {
        const directValidation = validateEmail(email) === null;
        const typeGuard = isValidEmail(email);
        expect(typeGuard).toBe(directValidation);
      });
    });

    it("should use same strong password logic in isStrongPassword", () => {
      const testPasswords = ["Password123!", "weak", "", "NoDigits!", "password123!"];

      testPasswords.forEach((password) => {
        const directValidation = validateStrongPassword(password) === null;
        const typeGuard = isStrongPassword(password);
        expect(typeGuard).toBe(directValidation);
      });
    });

    it("should have consistent Polish error messages", () => {
      const errors = [validateEmail(""), validateLoginPassword(""), validateStrongPassword("")];

      errors.forEach((error) => {
        expect(error).toMatch(/wymagane?|wymagany/i);
      });
    });
  });
});
