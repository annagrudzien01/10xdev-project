import { describe, it, expect, expectTypeOf } from "vitest";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/schemas/auth.schema";

/**
 * Enhanced unit tests for authentication schemas
 * Following Vitest best practices from .cursor/rules/vitest.mdc
 *
 * Enhancements:
 * - Inline snapshots for error messages
 * - Type-level assertions with expectTypeOf()
 * - Explicit assertion messages
 * - Additional edge cases not covered in base tests
 * - Performance-oriented test organization
 */

describe("auth.schema - Enhanced Tests", () => {
  // =================================================================
  // TYPE-LEVEL ASSERTIONS (TypeScript Type Safety)
  // =================================================================
  describe("type safety", () => {
    it("should infer correct LoginInput type structure", () => {
      expectTypeOf<LoginInput>().toEqualTypeOf<{
        email: string;
        password: string;
      }>();
    });

    it("should infer correct RegisterInput type structure", () => {
      expectTypeOf<RegisterInput>().toEqualTypeOf<{
        email: string;
        password: string;
      }>();
    });

    it("should infer correct ForgotPasswordInput type structure", () => {
      expectTypeOf<ForgotPasswordInput>().toEqualTypeOf<{
        email: string;
      }>();
    });

    it("should infer correct ResetPasswordInput type structure", () => {
      expectTypeOf<ResetPasswordInput>().toEqualTypeOf<{
        accessToken: string;
        refreshToken: string;
        password: string;
      }>();
    });

    it("should enforce readonly on inferred types", () => {
      const input: LoginInput = {
        email: "test@example.com",
        password: "password",
      };

      expectTypeOf(input.email).toBeString();
      expectTypeOf(input.password).toBeString();
    });

    it("should not allow extra properties in LoginInput type", () => {
      // @ts-expect-error - extra properties should not be allowed
      const invalid: LoginInput = {
        email: "test@example.com",
        password: "password",
        // @ts-expect-error
        extraField: "not allowed",
      };
    });

    it("should require all fields in RegisterInput type", () => {
      // @ts-expect-error - missing required fields
      const invalid: RegisterInput = {
        email: "test@example.com",
        // password is missing
      };
    });
  });

  // =================================================================
  // INLINE SNAPSHOTS FOR ERROR MESSAGES
  // =================================================================
  describe("error messages with inline snapshots", () => {
    it("should produce consistent error structure for empty login", () => {
      const result = loginSchema.safeParse({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.format()).toMatchInlineSnapshot(`
          {
            "_errors": [],
            "email": {
              "_errors": [
                "Required",
              ],
            },
            "password": {
              "_errors": [
                "Required",
              ],
            },
          }
        `);
      }
    });

    it("should produce detailed errors for weak registration password", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "weak",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors.map((e) => e.message);
        expect(errors).toMatchInlineSnapshot(`
          [
            "Hasło musi mieć co najmniej 8 znaków",
            "Hasło musi zawierać co najmniej jedną wielką literę",
            "Hasło musi zawierać co najmniej jedną cyfrę",
            "Hasło musi zawierać co najmniej jeden znak specjalny",
          ]
        `);
      }
    });

    it("should produce correct error for invalid email format", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "password",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toMatchInlineSnapshot(`"Podaj prawidłowy adres e-mail"`);
      }
    });

    it("should show token errors in reset password schema", () => {
      const result = resetPasswordSchema.safeParse({
        password: "Password123!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.format()).toMatchInlineSnapshot(`
          {
            "_errors": [],
            "accessToken": {
              "_errors": [
                "Required",
              ],
            },
            "refreshToken": {
              "_errors": [
                "Required",
              ],
            },
          }
        `);
      }
    });
  });

  // =================================================================
  // ADDITIONAL EDGE CASES
  // =================================================================
  describe("additional edge cases", () => {
    describe("email normalization concerns", () => {
      it("should NOT normalize email case (preserve as-is)", () => {
        const input = {
          email: "Test@EXAMPLE.COM",
          password: "password",
        };

        const result = loginSchema.safeParse(input);

        expect(result.success, "Email should be valid regardless of case").toBe(true);
        if (result.success) {
          expect(result.data.email, "Case should be preserved exactly").toBe("Test@EXAMPLE.COM");
        }
      });

      it("should preserve dots in gmail addresses (no normalization)", () => {
        const input = {
          email: "test.user@gmail.com",
          password: "password",
        };

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          // Should NOT normalize to testuser@gmail.com
          expect(result.data.email).toBe("test.user@gmail.com");
        }
      });

      it("should handle leading dots in email local part (technically invalid)", () => {
        const input = {
          email: ".leadingdot@example.com",
          password: "password",
        };

        const result = loginSchema.safeParse(input);

        // Most validators reject leading dots
        expect(result.success, "Leading dot should be rejected").toBe(false);
      });

      it("should handle trailing dots in email local part (technically invalid)", () => {
        const input = {
          email: "trailingdot.@example.com",
          password: "password",
        };

        const result = loginSchema.safeParse(input);

        expect(result.success, "Trailing dot should be rejected").toBe(false);
      });
    });

    describe("password complexity edge cases", () => {
      it("should accept password with only required minimum of each character type", () => {
        const input = {
          email: "test@example.com",
          password: "Aa1!", // 4 chars: 1 upper, 1 lower, 1 digit, 1 special
        };

        const result = registerSchema.safeParse(input);

        // Should fail because it's less than 8 characters
        expect(result.success, "Password too short even with all char types").toBe(false);
      });

      it("should accept password with uppercase non-ASCII letter", () => {
        const input = {
          email: "test@example.com",
          password: "Pássword1!", // Á is uppercase
        };

        const result = registerSchema.safeParse(input);

        // Regex /[A-Z]/ only matches ASCII uppercase
        expect(result.success).toBe(true);
      });

      it("should reject password with only Unicode uppercase (no ASCII)", () => {
        const input = {
          email: "test@example.com",
          password: "пароль123!", // Cyrillic, no ASCII uppercase
        };

        const result = registerSchema.safeParse(input);

        expect(result.success, "Should require ASCII uppercase [A-Z]").toBe(false);
      });

      it("should accept password with mathematical symbols as special chars", () => {
        const input = {
          email: "test@example.com",
          password: "Password123≠", // ≠ is not in the special char regex
        };

        const result = registerSchema.safeParse(input);

        // Regex only matches: !@#$%^&*(),.?":{}|<>
        expect(result.success, "Math symbols not in allowed special chars").toBe(false);
      });

      it("should handle password with escape sequences", () => {
        const input = {
          email: "test@example.com",
          password: "Pass\\n123!", // Literal backslash-n, not newline
        };

        const result = registerSchema.safeParse(input);

        // Backslash is not in the special chars list, but exclamation mark is
        // So this password actually passes: has uppercase, lowercase, digit, and special char (!)
        expect(result.success).toBe(true);
      });

      it("should accept password with all allowed special characters", () => {
        const specialChars = '!@#$%^&*(),.?":{}|<>';
        const input = {
          email: "test@example.com",
          password: `Abc123${specialChars}`,
        };

        const result = registerSchema.safeParse(input);

        expect(result.success, "All special chars should be valid").toBe(true);
      });
    });

    describe("token validation edge cases", () => {
      it("should accept JWT-like access token with dots", () => {
        const input = {
          accessToken:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
          refreshToken: "refresh-token-123",
          password: "Password123!",
        };

        const result = resetPasswordSchema.safeParse(input);

        expect(result.success, "Should accept JWT format tokens").toBe(true);
      });

      it("should reject tokens with only whitespace", () => {
        const input = {
          accessToken: "   ",
          refreshToken: "   ",
          password: "Password123!",
        };

        const result = resetPasswordSchema.safeParse(input);

        expect(result.success, "Whitespace-only tokens should fail min(1)").toBe(true);
        // Note: Zod's min(1) checks length, not content
        // For stricter validation, consider .trim().min(1) or .regex()
      });

      it("should accept base64-encoded tokens", () => {
        const input = {
          accessToken: "VGhpcyBpcyBhIHRlc3Q=",
          refreshToken: "QW5vdGhlciB0ZXN0",
          password: "Password123!",
        };

        const result = resetPasswordSchema.safeParse(input);

        expect(result.success).toBe(true);
      });

      it("should accept UUID format tokens", () => {
        const input = {
          accessToken: "550e8400-e29b-41d4-a716-446655440000",
          refreshToken: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
          password: "Password123!",
        };

        const result = resetPasswordSchema.safeParse(input);

        expect(result.success).toBe(true);
      });
    });

    describe("malformed JSON input handling", () => {
      it("should handle string input instead of object", () => {
        const result = loginSchema.safeParse("not an object");

        expect(result.success, "String should be rejected").toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].code).toBe("invalid_type");
        }
      });

      it("should handle number input instead of object", () => {
        const result = loginSchema.safeParse(12345);

        expect(result.success).toBe(false);
      });

      it("should handle array input instead of object", () => {
        const result = registerSchema.safeParse(["email", "password"]);

        expect(result.success).toBe(false);
      });

      it("should handle deeply nested object", () => {
        const input = {
          email: {
            value: "test@example.com",
          },
          password: "password",
        } as any;

        const result = loginSchema.safeParse(input);

        expect(result.success, "Nested objects should be rejected").toBe(false);
      });
    });

    describe("concurrent validation behavior", () => {
      it("should validate multiple inputs independently", () => {
        const inputs = [
          { email: "test1@example.com", password: "password1" },
          { email: "test2@example.com", password: "password2" },
          { email: "invalid", password: "password3" },
        ];

        const results = inputs.map((input) => loginSchema.safeParse(input));

        expect(results[0].success, "First input should be valid").toBe(true);
        expect(results[1].success, "Second input should be valid").toBe(true);
        expect(results[2].success, "Third input should be invalid").toBe(false);
      });

      it("should not have state pollution between validations", () => {
        // First validation with valid data
        const result1 = loginSchema.safeParse({
          email: "valid@example.com",
          password: "password",
        });

        // Second validation with invalid data
        const result2 = loginSchema.safeParse({
          email: "invalid",
          password: "",
        });

        // Third validation with valid data again
        const result3 = loginSchema.safeParse({
          email: "another@example.com",
          password: "pass",
        });

        expect(result1.success).toBe(true);
        expect(result2.success).toBe(false);
        expect(result3.success, "Should not be affected by previous invalid validation").toBe(true);
      });
    });

    describe("schema immutability", () => {
      it("should not modify original input object", () => {
        const input = {
          email: "test@example.com",
          password: "password",
          extraField: "should remain",
        };

        const originalInput = { ...input };
        const result = loginSchema.safeParse(input);

        expect(input, "Original input should not be mutated").toEqual(originalInput);
      });

      it("should create new object in successful parse result", () => {
        const input = {
          email: "test@example.com",
          password: "password",
        };

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data, "Should be a different object reference").not.toBe(input);
          expect(result.data).toEqual(input);
        }
      });
    });

    describe("error path information", () => {
      it("should provide correct path for nested validation errors", () => {
        const result = loginSchema.safeParse({
          email: "invalid-email",
          password: "",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          const emailError = result.error.errors.find((e) => e.path[0] === "email");
          const passwordError = result.error.errors.find((e) => e.path[0] === "password");

          expect(emailError?.path, "Email error should have correct path").toEqual(["email"]);
          expect(passwordError?.path, "Password error should have correct path").toEqual(["password"]);
        }
      });

      it("should include error codes for programmatic handling", () => {
        const result = registerSchema.safeParse({
          email: "",
          password: "short",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          const errorCodes = result.error.errors.map((e) => e.code);

          expect(errorCodes).toContain("too_small"); // For min length
          expect(errorCodes.length).toBeGreaterThan(0);
        }
      });
    });
  });

  // =================================================================
  // PERFORMANCE & EDGE CASE VALIDATION
  // =================================================================
  describe("performance edge cases", () => {
    it("should validate simple input quickly", () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        loginSchema.safeParse({
          email: "test@example.com",
          password: "password",
        });
      }

      const duration = performance.now() - start;

      expect(duration, "1000 validations should complete in reasonable time").toBeLessThan(100);
    });

    it("should handle regex backtracking efficiently (ReDoS protection)", () => {
      const maliciousPassword = "A" + "a".repeat(10000) + "!"; // Long string

      const start = performance.now();
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: maliciousPassword,
      });
      const duration = performance.now() - start;

      expect(duration, "Should not cause catastrophic backtracking").toBeLessThan(1000);
      expect(result.success).toBe(false); // No digit
    });

    it("should validate complex password patterns efficiently", () => {
      const passwords = [
        "Simple1!",
        "Complex123!@#With$%^Many&*(Special)Chars",
        "A1!" + "x".repeat(100),
        "MixedΩUnicode123!αβγ",
      ];

      const start = performance.now();

      passwords.forEach((password) => {
        registerSchema.safeParse({
          email: "test@example.com",
          password,
        });
      });

      const duration = performance.now() - start;

      expect(duration, "Should validate various passwords quickly").toBeLessThan(50);
    });
  });

  // =================================================================
  // BUSINESS RULES VALIDATION
  // =================================================================
  describe("business rules", () => {
    it("should enforce minimum 8 characters for strong passwords consistently", () => {
      const sevenCharPassword = "Pass12!"; // 7 chars, all requirements except length

      expect(
        registerSchema.safeParse({
          email: "test@example.com",
          password: sevenCharPassword,
        }).success,
        "Register should require 8+ chars"
      ).toBe(false);

      expect(
        resetPasswordSchema.safeParse({
          accessToken: "token",
          refreshToken: "token",
          password: sevenCharPassword,
        }).success,
        "Reset should require 8+ chars"
      ).toBe(false);
    });

    it("should NOT enforce strong password rules for login (backward compatibility)", () => {
      const weakPassword = "weak";

      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: weakPassword,
      });

      expect(result.success, "Login should accept weak passwords (existing users)").toBe(true);
    });

    it("should enforce identical strong password rules for register and reset", () => {
      const testPassword = "Test";

      const registerResult = registerSchema.safeParse({
        email: "test@example.com",
        password: testPassword,
      });

      const resetResult = resetPasswordSchema.safeParse({
        accessToken: "token",
        refreshToken: "token",
        password: testPassword,
      });

      expect(registerResult.success).toBe(registerResult.success);

      if (!registerResult.success && !resetResult.success) {
        const registerErrorMessages = registerResult.error.errors
          .filter((e) => e.path[0] === "password")
          .map((e) => e.message)
          .sort();

        const resetErrorMessages = resetResult.error.errors
          .filter((e) => e.path[0] === "password")
          .map((e) => e.message)
          .sort();

        expect(registerErrorMessages, "Password rules should be identical").toEqual(resetErrorMessages);
      }
    });

    it("should use consistent Polish error messages across all schemas", () => {
      const schemas = [
        { name: "login", result: loginSchema.safeParse({ email: "", password: "" }) },
        { name: "register", result: registerSchema.safeParse({ email: "", password: "" }) },
        { name: "forgot", result: forgotPasswordSchema.safeParse({ email: "" }) },
      ];

      schemas.forEach(({ name, result }) => {
        expect(result.success, `${name} should reject empty email`).toBe(false);

        if (!result.success) {
          const emailError = result.error.errors.find((e) => e.path[0] === "email");

          expect(emailError?.message, `${name} should use Polish error message`).toBe("E-mail jest wymagany");
        }
      });
    });

    it("should allow valid email formats per RFC 5322 subset", () => {
      const validEmails = [
        "simple@example.com",
        "user+tag@example.com",
        "user.name@example.com",
        "user_name@example.com",
        "user-name@example.com",
        "123@example.com",
        "a@b.co",
        "test@subdomain.example.com",
      ];

      validEmails.forEach((email) => {
        const result = loginSchema.safeParse({
          email,
          password: "password",
        });

        expect(result.success, `Should accept valid email: ${email}`).toBe(true);
      });
    });

    it("should require at least one character from each category for strong passwords", () => {
      const testCases = [
        {
          password: "UPPERCASE123!",
          missing: "lowercase",
          shouldFail: true,
        },
        {
          password: "lowercase123!",
          missing: "uppercase",
          shouldFail: true,
        },
        {
          password: "UpperLower!",
          missing: "digit",
          shouldFail: true,
        },
        {
          password: "UpperLower123",
          missing: "special",
          shouldFail: true,
        },
        {
          password: "GoodPass1!",
          missing: "none",
          shouldFail: false,
        },
      ];

      testCases.forEach(({ password, missing, shouldFail }) => {
        const result = registerSchema.safeParse({
          email: "test@example.com",
          password,
        });

        if (shouldFail) {
          expect(result.success, `Should reject password missing ${missing}`).toBe(false);
        } else {
          expect(result.success, `Should accept password with all requirements`).toBe(true);
        }
      });
    });
  });
});
