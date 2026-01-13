import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from '@/lib/schemas/auth.schema';
import { ZodError } from 'zod';

/**
 * Unit tests for authentication schemas
 * 
 * Coverage:
 * - Email validation (format, required)
 * - Password validation (length, complexity)
 * - Token validation
 * - Edge cases (whitespace, unicode, special chars)
 * - Error messages in Polish
 */

describe('auth.schema', () => {
  // =================================================================
  // LOGIN SCHEMA
  // =================================================================
  describe('loginSchema', () => {
    describe('valid inputs', () => {
      it('should accept valid email and password', () => {
        // Arrange
        const validInput = {
          email: 'test@example.com',
          password: 'password123',
        };

        // Act
        const result = loginSchema.safeParse(validInput);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(validInput);
        }
      });

      it('should accept password with single character', () => {
        const input = {
          email: 'user@test.pl',
          password: 'x',
        };

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(true);
      });

      it('should accept email with subdomains', () => {
        const input = {
          email: 'user@mail.example.com',
          password: 'pass',
        };

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(true);
      });

      it('should accept email with plus sign', () => {
        const input = {
          email: 'user+tag@example.com',
          password: 'pass',
        };

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(true);
      });

      it('should accept email with dots in local part', () => {
        const input = {
          email: 'first.last@example.com',
          password: 'pass',
        };

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(true);
      });
    });

    describe('invalid email', () => {
      it('should reject empty email', () => {
        const input = {
          email: '',
          password: 'password',
        };

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('E-mail jest wymagany');
        }
      });

      it('should reject email without @ symbol', () => {
        const input = {
          email: 'invalid.email.com',
          password: 'password',
        };

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Podaj prawidłowy adres e-mail');
        }
      });

      it('should reject email without domain', () => {
        const input = {
          email: 'user@',
          password: 'password',
        };

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it('should reject email without local part', () => {
        const input = {
          email: '@example.com',
          password: 'password',
        };

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it('should reject email with spaces', () => {
        const input = {
          email: 'user name@example.com',
          password: 'password',
        };

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it('should reject email without TLD', () => {
        const input = {
          email: 'user@domain',
          password: 'password',
        };

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(false);
      });
    });

    describe('invalid password', () => {
      it('should reject empty password', () => {
        const input = {
          email: 'test@example.com',
          password: '',
        };

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('Hasło jest wymagane');
        }
      });
    });

    describe('missing fields', () => {
      it('should reject when email is missing', () => {
        const input = {
          password: 'password',
        } as any;

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it('should reject when password is missing', () => {
        const input = {
          email: 'test@example.com',
        } as any;

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it('should reject empty object', () => {
        const result = loginSchema.safeParse({});

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors).toHaveLength(2);
        }
      });
    });

    describe('type inference', () => {
      it('should correctly infer LoginInput type', () => {
        const input: LoginInput = {
          email: 'test@example.com',
          password: 'password',
        };

        const result = loginSchema.parse(input);

        expect(result.email).toBe(input.email);
        expect(result.password).toBe(input.password);
      });
    });
  });

  // =================================================================
  // REGISTER SCHEMA
  // =================================================================
  describe('registerSchema', () => {
    describe('valid inputs', () => {
      it('should accept valid email and strong password', () => {
        // Arrange
        const validInput = {
          email: 'newuser@example.com',
          password: 'Strong1Pass!',
        };

        // Act
        const result = registerSchema.safeParse(validInput);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(validInput);
        }
      });

      it('should accept password with all required character types', () => {
        const input = {
          email: 'user@test.com',
          password: 'Abc123!@#',
        };

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(true);
      });

      it('should accept password with exactly 8 characters', () => {
        const input = {
          email: 'user@test.com',
          password: 'Pass123!',
        };

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(true);
      });

      it('should accept password with various special characters', () => {
        const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', ',', '.', '?', '"', ':', '{', '}', '|', '<', '>'];
        
        specialChars.forEach((char) => {
          const input = {
            email: 'user@test.com',
            password: `Pass123${char}`,
          };

          const result = registerSchema.safeParse(input);

          expect(result.success).toBe(true);
        });
      });

      it('should accept long password with all requirements', () => {
        const input = {
          email: 'user@test.com',
          password: 'VeryLongPassword123!WithManyCharacters',
        };

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(true);
      });
    });

    describe('password length validation', () => {
      it('should reject password with less than 8 characters', () => {
        const input = {
          email: 'user@test.com',
          password: 'Abc12!', // 6 characters
        };

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          const lengthError = result.error.errors.find(
            (err) => err.message === 'Hasło musi mieć co najmniej 8 znaków'
          );
          expect(lengthError).toBeDefined();
        }
      });

      it('should reject password with exactly 7 characters', () => {
        const input = {
          email: 'user@test.com',
          password: 'Pass12!', // 7 characters
        };

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it('should reject empty password', () => {
        const input = {
          email: 'user@test.com',
          password: '',
        };

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors.length).toBeGreaterThan(0);
        }
      });
    });

    describe('password uppercase letter validation', () => {
      it('should reject password without uppercase letter', () => {
        const input = {
          email: 'user@test.com',
          password: 'password123!',
        };

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          const upperError = result.error.errors.find(
            (err) => err.message === 'Hasło musi zawierać co najmniej jedną wielką literę'
          );
          expect(upperError).toBeDefined();
        }
      });

      it('should accept password with multiple uppercase letters', () => {
        const input = {
          email: 'user@test.com',
          password: 'PASSWORDabc123!', // Must have lowercase too
        };

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(true);
      });

      it('should accept password with uppercase at different positions', () => {
        const positions = ['Password123!', 'passWord123!', 'password123!P'];

        positions.forEach((password) => {
          const input = {
            email: 'user@test.com',
            password,
          };

          const result = registerSchema.safeParse(input);

          if (password.match(/[A-Z]/)) {
            expect(result.success).toBe(true);
          }
        });
      });
    });

    describe('password lowercase letter validation', () => {
      it('should reject password without lowercase letter', () => {
        const input = {
          email: 'user@test.com',
          password: 'PASSWORD123!',
        };

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          const lowerError = result.error.errors.find(
            (err) => err.message === 'Hasło musi zawierać co najmniej jedną małą literę'
          );
          expect(lowerError).toBeDefined();
        }
      });

      it('should accept password with multiple lowercase letters', () => {
        const input = {
          email: 'user@test.com',
          password: 'Abcdefgh123!',
        };

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(true);
      });
    });

    describe('password digit validation', () => {
      it('should reject password without digit', () => {
        const input = {
          email: 'user@test.com',
          password: 'Password!',
        };

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          const digitError = result.error.errors.find(
            (err) => err.message === 'Hasło musi zawierać co najmniej jedną cyfrę'
          );
          expect(digitError).toBeDefined();
        }
      });

      it('should accept password with multiple digits', () => {
        const input = {
          email: 'user@test.com',
          password: 'Pass1234!',
        };

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(true);
      });

      it('should accept password with digits at different positions', () => {
        const positions = ['1Password!', 'Pass1word!', 'Password1!'];

        positions.forEach((password) => {
          const input = {
            email: 'user@test.com',
            password,
          };

          const result = registerSchema.safeParse(input);

          expect(result.success).toBe(true);
        });
      });
    });

    describe('password special character validation', () => {
      it('should reject password without special character', () => {
        const input = {
          email: 'user@test.com',
          password: 'Password123',
        };

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          const specialError = result.error.errors.find(
            (err) => err.message === 'Hasło musi zawierać co najmniej jeden znak specjalny'
          );
          expect(specialError).toBeDefined();
        }
      });

      it('should accept password with multiple special characters', () => {
        const input = {
          email: 'user@test.com',
          password: 'Pass123!@#',
        };

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(true);
      });

      it('should reject password with only alphanumeric characters', () => {
        const input = {
          email: 'user@test.com',
          password: 'Password123',
        };

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(false);
      });
    });

    describe('combined validation failures', () => {
      it('should report multiple validation errors', () => {
        const input = {
          email: 'user@test.com',
          password: 'short', // too short, no uppercase, no digit, no special char
        };

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors.length).toBeGreaterThanOrEqual(4);
        }
      });

      it('should validate all requirements independently', () => {
        const testCases = [
          { password: 'pass', expectedErrors: 4 }, // missing: length, uppercase, digit, special
          { password: 'Password', expectedErrors: 2 }, // missing: digit, special (length is 8, OK)
          { password: 'Password1', expectedErrors: 1 }, // missing: special
          { password: 'Password1!', expectedErrors: 0 }, // valid
        ];

        testCases.forEach(({ password, expectedErrors }) => {
          const input = {
            email: 'user@test.com',
            password,
          };

          const result = registerSchema.safeParse(input);

          if (expectedErrors > 0) {
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(result.error.errors.length).toBe(expectedErrors);
            }
          } else {
            expect(result.success).toBe(true);
          }
        });
      });
    });

    describe('edge cases', () => {
      it('should handle password with unicode characters', () => {
        const input = {
          email: 'user@test.com',
          password: 'Pássw0rd!', // contains ó
        };

        const result = registerSchema.safeParse(input);

        // Should still require standard ASCII requirements
        expect(result.success).toBe(true);
      });

      it('should handle password with emojis', () => {
        const input = {
          email: 'user@test.com',
          password: 'Pass123!😀',
        };

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(true);
      });

      it('should handle very long password', () => {
        const input = {
          email: 'user@test.com',
          password: 'A'.repeat(100) + 'a1!',
        };

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(true);
      });
    });

    describe('email validation', () => {
      it('should reject invalid email in registration', () => {
        const input = {
          email: 'not-an-email',
          password: 'Password123!',
        };

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          const emailError = result.error.errors.find((err) => err.path[0] === 'email');
          expect(emailError).toBeDefined();
        }
      });

      it('should reject empty email in registration', () => {
        const input = {
          email: '',
          password: 'Password123!',
        };

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(false);
      });
    });

    describe('type inference', () => {
      it('should correctly infer RegisterInput type', () => {
        const input: RegisterInput = {
          email: 'test@example.com',
          password: 'Password123!',
        };

        const result = registerSchema.parse(input);

        expect(result.email).toBe(input.email);
        expect(result.password).toBe(input.password);
      });
    });
  });

  // =================================================================
  // FORGOT PASSWORD SCHEMA
  // =================================================================
  describe('forgotPasswordSchema', () => {
    describe('valid inputs', () => {
      it('should accept valid email', () => {
        // Arrange
        const validInput = {
          email: 'user@example.com',
        };

        // Act
        const result = forgotPasswordSchema.safeParse(validInput);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(validInput);
        }
      });

      it('should accept email with various formats', () => {
        const emails = [
          'simple@example.com',
          'user+tag@example.com',
          'user.name@example.co.uk',
          'user123@test.org',
        ];

        emails.forEach((email) => {
          const input = { email };
          const result = forgotPasswordSchema.safeParse(input);

          expect(result.success).toBe(true);
        });
      });
    });

    describe('invalid inputs', () => {
      it('should reject empty email', () => {
        const input = {
          email: '',
        };

        const result = forgotPasswordSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].message).toBe('E-mail jest wymagany');
        }
      });

      it('should reject invalid email format', () => {
        const invalidEmails = ['notanemail', 'missing@domain', '@nodomain.com', 'spaces in@email.com'];

        invalidEmails.forEach((email) => {
          const input = { email };
          const result = forgotPasswordSchema.safeParse(input);

          expect(result.success).toBe(false);
        });
      });

      it('should reject when email field is missing', () => {
        const result = forgotPasswordSchema.safeParse({});

        expect(result.success).toBe(false);
      });
    });

    describe('type inference', () => {
      it('should correctly infer ForgotPasswordInput type', () => {
        const input: ForgotPasswordInput = {
          email: 'test@example.com',
        };

        const result = forgotPasswordSchema.parse(input);

        expect(result.email).toBe(input.email);
      });
    });
  });

  // =================================================================
  // RESET PASSWORD SCHEMA
  // =================================================================
  describe('resetPasswordSchema', () => {
    describe('valid inputs', () => {
      it('should accept valid tokens and strong password', () => {
        // Arrange
        const validInput = {
          accessToken: 'valid-access-token-xyz123',
          refreshToken: 'valid-refresh-token-abc456',
          password: 'NewPass123!',
        };

        // Act
        const result = resetPasswordSchema.safeParse(validInput);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(validInput);
        }
      });

      it('should accept long token strings', () => {
        const input = {
          accessToken: 'a'.repeat(500),
          refreshToken: 'b'.repeat(500),
          password: 'Password123!',
        };

        const result = resetPasswordSchema.safeParse(input);

        expect(result.success).toBe(true);
      });

      it('should accept tokens with special characters', () => {
        const input = {
          accessToken: 'token-with-dashes_and_underscores.and.dots',
          refreshToken: 'another+token/with=special&chars',
          password: 'Password123!',
        };

        const result = resetPasswordSchema.safeParse(input);

        expect(result.success).toBe(true);
      });
    });

    describe('token validation', () => {
      it('should reject empty access token', () => {
        const input = {
          accessToken: '',
          refreshToken: 'valid-token',
          password: 'Password123!',
        };

        const result = resetPasswordSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          const tokenError = result.error.errors.find(
            (err) => err.message === 'Token dostępu jest wymagany'
          );
          expect(tokenError).toBeDefined();
        }
      });

      it('should reject empty refresh token', () => {
        const input = {
          accessToken: 'valid-token',
          refreshToken: '',
          password: 'Password123!',
        };

        const result = resetPasswordSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          const tokenError = result.error.errors.find(
            (err) => err.message === 'Token odświeżania jest wymagany'
          );
          expect(tokenError).toBeDefined();
        }
      });

      it('should reject missing access token', () => {
        const input = {
          refreshToken: 'valid-token',
          password: 'Password123!',
        } as any;

        const result = resetPasswordSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it('should reject missing refresh token', () => {
        const input = {
          accessToken: 'valid-token',
          password: 'Password123!',
        } as any;

        const result = resetPasswordSchema.safeParse(input);

        expect(result.success).toBe(false);
      });
    });

    describe('password validation', () => {
      it('should apply same password rules as registration', () => {
        const input = {
          accessToken: 'token1',
          refreshToken: 'token2',
          password: 'weak', // too short, no uppercase, no digit, no special char
        };

        const result = resetPasswordSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          // Should have errors for: length, uppercase, lowercase, digit, special char
          expect(result.error.errors.length).toBeGreaterThanOrEqual(4);
        }
      });

      it('should reject password without uppercase', () => {
        const input = {
          accessToken: 'token1',
          refreshToken: 'token2',
          password: 'password123!',
        };

        const result = resetPasswordSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it('should reject password without digit', () => {
        const input = {
          accessToken: 'token1',
          refreshToken: 'token2',
          password: 'Password!',
        };

        const result = resetPasswordSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it('should reject password without special character', () => {
        const input = {
          accessToken: 'token1',
          refreshToken: 'token2',
          password: 'Password123',
        };

        const result = resetPasswordSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it('should accept strong password meeting all criteria', () => {
        const input = {
          accessToken: 'token1',
          refreshToken: 'token2',
          password: 'MyNewPass123!',
        };

        const result = resetPasswordSchema.safeParse(input);

        expect(result.success).toBe(true);
      });
    });

    describe('combined validation', () => {
      it('should validate all fields together', () => {
        const input = {
          accessToken: '',
          refreshToken: '',
          password: 'weak',
        };

        const result = resetPasswordSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          // Should have errors for all fields
          expect(result.error.errors.length).toBeGreaterThan(5);
        }
      });

      it('should pass when all fields are valid', () => {
        const input = {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
          refreshToken: 'refresh_token_abc123def456',
          password: 'SecurePass123!',
        };

        const result = resetPasswordSchema.safeParse(input);

        expect(result.success).toBe(true);
      });
    });

    describe('type inference', () => {
      it('should correctly infer ResetPasswordInput type', () => {
        const input: ResetPasswordInput = {
          accessToken: 'token1',
          refreshToken: 'token2',
          password: 'Password123!',
        };

        const result = resetPasswordSchema.parse(input);

        expect(result.accessToken).toBe(input.accessToken);
        expect(result.refreshToken).toBe(input.refreshToken);
        expect(result.password).toBe(input.password);
      });
    });
  });

  // =================================================================
  // SECURITY & EDGE CASES
  // =================================================================
  describe('security and edge cases', () => {
    describe('whitespace handling', () => {
      it('should not trim email with leading/trailing spaces in loginSchema', () => {
        const input = {
          email: '  test@example.com  ',
          password: 'password',
        };

        const result = loginSchema.safeParse(input);

        // Zod doesn't auto-trim, so this should pass or fail based on email validator
        // Standard behavior: email validators typically reject spaces
        if (result.success) {
          expect(result.data.email).toBe(input.email);
        }
      });

      it('should handle password with whitespace characters', () => {
        const input = {
          email: 'test@example.com',
          password: '  password with spaces  ',
        };

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          // Whitespace should be preserved in password
          expect(result.data.password).toBe(input.password);
        }
      });

      it('should accept password that is only spaces for login (weak validation)', () => {
        const input = {
          email: 'test@example.com',
          password: '   ', // 3 spaces
        };

        const result = loginSchema.safeParse(input);

        // Login schema only checks min length, not actual content
        expect(result.success).toBe(true);
      });

      it('should reject password with only spaces for registration', () => {
        const input = {
          email: 'test@example.com',
          password: '        ', // 8 spaces
        };

        const result = registerSchema.safeParse(input);

        // Should fail regex validations
        expect(result.success).toBe(false);
      });
    });

    describe('null and undefined values', () => {
      it('should reject null email', () => {
        const input = {
          email: null,
          password: 'password',
        } as any;

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it('should reject undefined password', () => {
        const input = {
          email: 'test@example.com',
          password: undefined,
        } as any;

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it('should reject null object', () => {
        const result = loginSchema.safeParse(null);

        expect(result.success).toBe(false);
      });

      it('should reject undefined object', () => {
        const result = loginSchema.safeParse(undefined);

        expect(result.success).toBe(false);
      });
    });

    describe('type coercion attempts', () => {
      it('should reject numeric email', () => {
        const input = {
          email: 12345,
          password: 'password',
        } as any;

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it('should reject boolean password', () => {
        const input = {
          email: 'test@example.com',
          password: true,
        } as any;

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it('should reject array as email', () => {
        const input = {
          email: ['test@example.com'],
          password: 'password',
        } as any;

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it('should reject object as password', () => {
        const input = {
          email: 'test@example.com',
          password: { value: 'password' },
        } as any;

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(false);
      });
    });

    describe('unknown fields handling', () => {
      it('should strip unknown fields from loginSchema by default', () => {
        const input = {
          email: 'test@example.com',
          password: 'password',
          extraField: 'should be removed',
          anotherField: 123,
        } as any;

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).not.toHaveProperty('extraField');
          expect(result.data).not.toHaveProperty('anotherField');
          expect(Object.keys(result.data)).toHaveLength(2);
        }
      });

      it('should strip unknown fields from registerSchema', () => {
        const input = {
          email: 'test@example.com',
          password: 'Password123!',
          rememberMe: true,
          csrf: 'token',
        } as any;

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).not.toHaveProperty('rememberMe');
          expect(result.data).not.toHaveProperty('csrf');
        }
      });
    });

    describe('SQL injection and XSS attempts in emails', () => {
      it('should handle email with SQL injection attempt', () => {
        const input = {
          email: "admin'--@example.com",
          password: 'password',
        };

        const result = loginSchema.safeParse(input);

        // Should still validate as proper email format or reject
        // The key is that it doesn't break the validator
        expect(() => result).not.toThrow();
      });

      it('should handle email with script tags', () => {
        const input = {
          email: '<script>alert("xss")</script>@example.com',
          password: 'password',
        };

        const result = loginSchema.safeParse(input);

        // Should reject due to invalid email format
        expect(result.success).toBe(false);
      });

      it('should handle password with SQL injection attempt', () => {
        const input = {
          email: 'test@example.com',
          password: "'; DROP TABLE users; --",
        };

        const result = loginSchema.safeParse(input);

        // For login: should pass (any string is valid)
        expect(result.success).toBe(true);
        if (result.success) {
          // Password should be preserved as-is for parameterized queries
          expect(result.data.password).toBe(input.password);
        }
      });

      it('should handle password with HTML/script tags', () => {
        const input = {
          email: 'test@example.com',
          password: '<script>alert("xss")</script>',
        };

        const result = loginSchema.safeParse(input);

        // Login should accept any password
        expect(result.success).toBe(true);
      });
    });

    describe('internationalization edge cases', () => {
      it('should handle email with internationalized domain', () => {
        const input = {
          email: 'test@münchen.de',
          password: 'password',
        };

        const result = loginSchema.safeParse(input);

        // Depends on Zod's email validator implementation
        // Modern validators should support IDN
        expect(() => result).not.toThrow();
      });

      it('should handle email with cyrillic characters', () => {
        const input = {
          email: 'тест@example.com',
          password: 'password',
        };

        const result = loginSchema.safeParse(input);

        expect(() => result).not.toThrow();
      });

      it('should accept password with Polish characters', () => {
        const input = {
          email: 'test@example.com',
          password: 'Hasło123!ąćęłńóśźż',
        };

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(true);
      });

      it('should accept password with mixed language characters', () => {
        const input = {
          email: 'test@example.com',
          password: 'Pass123!中文字符',
        };

        const result = registerSchema.safeParse(input);

        expect(result.success).toBe(true);
      });
    });

    describe('maximum length validation', () => {
      it('should handle extremely long email (potential DoS)', () => {
        const input = {
          email: 'a'.repeat(10000) + '@example.com',
          password: 'password',
        };

        const result = loginSchema.safeParse(input);

        // Should either reject or handle gracefully without crashing
        expect(() => result).not.toThrow();
      });

      it('should handle extremely long password (potential DoS)', () => {
        const input = {
          email: 'test@example.com',
          password: 'A'.repeat(1000000) + 'a1!',
        };

        const result = registerSchema.safeParse(input);

        // Should not crash the validator
        expect(() => result).not.toThrow();
      });

      it('should handle extremely long tokens in resetPasswordSchema', () => {
        const input = {
          accessToken: 'a'.repeat(100000),
          refreshToken: 'b'.repeat(100000),
          password: 'Password123!',
        };

        const result = resetPasswordSchema.safeParse(input);

        expect(() => result).not.toThrow();
      });
    });

    describe('special email formats', () => {
      it('should handle quoted local part in email', () => {
        const input = {
          email: '"john..doe"@example.com',
          password: 'password',
        };

        const result = loginSchema.safeParse(input);

        expect(() => result).not.toThrow();
      });

      it('should handle IP address as domain', () => {
        const input = {
          email: 'user@[192.168.1.1]',
          password: 'password',
        };

        const result = loginSchema.safeParse(input);

        expect(() => result).not.toThrow();
      });

      it('should reject email with multiple @ symbols', () => {
        const input = {
          email: 'user@@example.com',
          password: 'password',
        };

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it('should reject email with consecutive dots in domain', () => {
        const input = {
          email: 'user@example..com',
          password: 'password',
        };

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(false);
      });
    });

    describe('newline and control characters', () => {
      it('should handle email with newline characters', () => {
        const input = {
          email: 'test\n@example.com',
          password: 'password',
        };

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it('should handle password with newline characters', () => {
        const input = {
          email: 'test@example.com',
          password: 'pass\nword',
        };

        const result = loginSchema.safeParse(input);

        // Newlines should be allowed in passwords
        expect(result.success).toBe(true);
      });

      it('should handle password with tab characters', () => {
        const input = {
          email: 'test@example.com',
          password: 'pass\tword',
        };

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(true);
      });

      it('should handle email with null byte', () => {
        const input = {
          email: 'test\0@example.com',
          password: 'password',
        };

        const result = loginSchema.safeParse(input);

        expect(result.success).toBe(false);
      });
    });
  });

  // =================================================================
  // CROSS-SCHEMA CONSISTENCY
  // =================================================================
  describe('cross-schema consistency', () => {
    it('should use same email validation across all schemas', () => {
      const validEmail = 'test@example.com';
      const invalidEmail = 'not-an-email';

      // Test valid email
      expect(loginSchema.safeParse({ email: validEmail, password: 'pass' }).success).toBe(true);
      expect(registerSchema.safeParse({ email: validEmail, password: 'Pass123!' }).success).toBe(true);
      expect(forgotPasswordSchema.safeParse({ email: validEmail }).success).toBe(true);

      // Test invalid email
      expect(loginSchema.safeParse({ email: invalidEmail, password: 'pass' }).success).toBe(false);
      expect(registerSchema.safeParse({ email: invalidEmail, password: 'Pass123!' }).success).toBe(false);
      expect(forgotPasswordSchema.safeParse({ email: invalidEmail }).success).toBe(false);
    });

    it('should use same strong password validation in register and reset schemas', () => {
      const weakPassword = 'weak';
      const strongPassword = 'Strong123!';

      // Test weak password
      expect(
        registerSchema.safeParse({ email: 'test@test.com', password: weakPassword }).success
      ).toBe(false);
      expect(
        resetPasswordSchema.safeParse({
          accessToken: 'token',
          refreshToken: 'token',
          password: weakPassword,
        }).success
      ).toBe(false);

      // Test strong password
      expect(
        registerSchema.safeParse({ email: 'test@test.com', password: strongPassword }).success
      ).toBe(true);
      expect(
        resetPasswordSchema.safeParse({
          accessToken: 'token',
          refreshToken: 'token',
          password: strongPassword,
        }).success
      ).toBe(true);
    });

    it('should have consistent Polish error messages', () => {
      const schemas = [
        loginSchema.safeParse({ email: '', password: 'pass' }),
        registerSchema.safeParse({ email: '', password: 'Pass123!' }),
        forgotPasswordSchema.safeParse({ email: '' }),
      ];

      schemas.forEach((result) => {
        expect(result.success).toBe(false);
        if (!result.success) {
          const emailError = result.error.errors.find((err) => err.path[0] === 'email');
          expect(emailError?.message).toBe('E-mail jest wymagany');
        }
      });
    });
  });
});
