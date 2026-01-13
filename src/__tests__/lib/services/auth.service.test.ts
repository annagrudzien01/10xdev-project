import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '@/lib/services/auth.service';
import { ConflictError, UnauthorizedError } from '@/lib/errors/api-errors';
import type { SupabaseClient } from '@/db/supabase.client';
import type { User, AuthError } from '@supabase/supabase-js';

/**
 * Unit tests for AuthService
 *
 * Coverage:
 * - Registration (success, conflicts, errors)
 * - Login (success, invalid credentials, missing session)
 * - Logout (success)
 * - Password reset email (success, user enumeration prevention)
 * - Password reset (success, expired/invalid tokens)
 * - Get current user (authenticated, unauthenticated, errors)
 * - Edge cases and error transformations
 */

// Mock Supabase createClient for resetPassword test
vi.mock('@supabase/supabase-js', async () => {
  const actual = await vi.importActual('@supabase/supabase-js');
  return {
    ...actual,
    createClient: vi.fn(),
  };
});

describe('AuthService', () => {
  let authService: AuthService;
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>;

  // Helper to create typed mock Supabase client
  function createMockSupabaseClient() {
    return {
      auth: {
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        getUser: vi.fn(),
      },
    } as unknown as SupabaseClient;
  }

  beforeEach(() => {
    mockSupabaseClient = createMockSupabaseClient();
    authService = new AuthService(mockSupabaseClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // =================================================================
  // REGISTER
  // =================================================================
  describe('register', () => {
    const validEmail = 'newuser@example.com';
    const validPassword = 'SecurePass123!';

    describe('successful registration', () => {
      it('should register user successfully with valid credentials', async () => {
        // Arrange
        mockSupabaseClient.auth.signUp.mockResolvedValue({
          data: {
            user: { id: 'user-123', email: validEmail } as User,
            session: null,
          },
          error: null,
        });

        // Act
        await authService.register(validEmail, validPassword);

        // Assert
        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledTimes(1);
        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
          email: validEmail,
          password: validPassword,
        });
      });

      it('should not throw error when registration succeeds', async () => {
        // Arrange
        mockSupabaseClient.auth.signUp.mockResolvedValue({
          data: { user: {} as User, session: null },
          error: null,
        });

        // Act & Assert
        await expect(authService.register(validEmail, validPassword)).resolves.not.toThrow();
      });

      it('should return void on successful registration', async () => {
        // Arrange
        mockSupabaseClient.auth.signUp.mockResolvedValue({
          data: { user: {} as User, session: null },
          error: null,
        });

        // Act
        const result = await authService.register(validEmail, validPassword);

        // Assert
        expect(result).toBeUndefined();
      });
    });

    describe('conflict errors (user already exists)', () => {
      it('should throw ConflictError when user already registered', async () => {
        // Arrange
        mockSupabaseClient.auth.signUp.mockResolvedValue({
          data: { user: null, session: null },
          error: {
            message: 'User already registered',
            status: 409,
          } as AuthError,
        });

        // Act & Assert
        await expect(authService.register(validEmail, validPassword)).rejects.toThrow(ConflictError);
        await expect(authService.register(validEmail, validPassword)).rejects.toThrow(
          'Użytkownik z tym adresem e-mail już istnieje'
        );
      });

      it('should throw ConflictError when email already exists', async () => {
        // Arrange
        mockSupabaseClient.auth.signUp.mockResolvedValue({
          data: { user: null, session: null },
          error: {
            message: 'Email already exists in the system',
            status: 409,
          } as AuthError,
        });

        // Act & Assert
        await expect(authService.register(validEmail, validPassword)).rejects.toThrow(ConflictError);
      });

      it('should have correct error name for ConflictError', async () => {
        // Arrange
        mockSupabaseClient.auth.signUp.mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'User already registered' } as AuthError,
        });

        // Act
        try {
          await authService.register(validEmail, validPassword);
        } catch (error) {
          // Assert
          expect(error).toBeInstanceOf(ConflictError);
          expect((error as ConflictError).name).toBe('ConflictError');
        }
      });
    });

    describe('other registration errors', () => {
      it('should throw generic Error for non-conflict errors', async () => {
        // Arrange
        mockSupabaseClient.auth.signUp.mockResolvedValue({
          data: { user: null, session: null },
          error: {
            message: 'Database connection failed',
            status: 500,
          } as AuthError,
        });

        // Act & Assert
        await expect(authService.register(validEmail, validPassword)).rejects.toThrow(Error);
        await expect(authService.register(validEmail, validPassword)).rejects.toThrow(
          'Registration failed: Database connection failed'
        );
      });

      it('should not throw ConflictError for generic errors', async () => {
        // Arrange
        mockSupabaseClient.auth.signUp.mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'Network error' } as AuthError,
        });

        // Act & Assert
        await expect(authService.register(validEmail, validPassword)).rejects.toThrow(Error);
        await expect(authService.register(validEmail, validPassword)).rejects.not.toThrow(ConflictError);
      });

      it('should include original error message in thrown error', async () => {
        // Arrange
        const originalMessage = 'Specific validation error';
        mockSupabaseClient.auth.signUp.mockResolvedValue({
          data: { user: null, session: null },
          error: { message: originalMessage } as AuthError,
        });

        // Act & Assert
        await expect(authService.register(validEmail, validPassword)).rejects.toThrow(
          `Registration failed: ${originalMessage}`
        );
      });
    });

    describe('edge cases', () => {
      it('should handle empty string password', async () => {
        // Arrange
        mockSupabaseClient.auth.signUp.mockResolvedValue({
          data: { user: {} as User, session: null },
          error: null,
        });

        // Act
        await authService.register(validEmail, '');

        // Assert
        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
          email: validEmail,
          password: '',
        });
      });

      it('should handle special characters in email', async () => {
        // Arrange
        const specialEmail = 'user+tag@example.com';
        mockSupabaseClient.auth.signUp.mockResolvedValue({
          data: { user: {} as User, session: null },
          error: null,
        });

        // Act
        await authService.register(specialEmail, validPassword);

        // Assert
        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
          email: specialEmail,
          password: validPassword,
        });
      });

      it('should handle very long password', async () => {
        // Arrange
        const longPassword = 'A'.repeat(1000) + 'a1!';
        mockSupabaseClient.auth.signUp.mockResolvedValue({
          data: { user: {} as User, session: null },
          error: null,
        });

        // Act & Assert
        await expect(authService.register(validEmail, longPassword)).resolves.not.toThrow();
      });
    });
  });

  // =================================================================
  // LOGIN
  // =================================================================
  describe('login', () => {
    const validEmail = 'user@example.com';
    const validPassword = 'password123';
    const mockAccessToken = 'mock-access-token-xyz123';
    const mockRefreshToken = 'mock-refresh-token-abc456';

    describe('successful login', () => {
      it('should login user successfully with valid credentials', async () => {
        // Arrange
        mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
          data: {
            user: { id: 'user-123', email: validEmail } as User,
            session: {
              access_token: mockAccessToken,
              refresh_token: mockRefreshToken,
            } as any,
          },
          error: null,
        });

        // Act
        const result = await authService.login(validEmail, validPassword);

        // Assert
        expect(result).toEqual({
          accessToken: mockAccessToken,
          refreshToken: mockRefreshToken,
        });
      });

      it('should call signInWithPassword with correct parameters', async () => {
        // Arrange
        mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
          data: {
            user: {} as User,
            session: {
              access_token: mockAccessToken,
              refresh_token: mockRefreshToken,
            } as any,
          },
          error: null,
        });

        // Act
        await authService.login(validEmail, validPassword);

        // Assert
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledTimes(1);
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: validEmail,
          password: validPassword,
        });
      });

      it('should return tokens with correct structure', async () => {
        // Arrange
        mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
          data: {
            user: {} as User,
            session: {
              access_token: mockAccessToken,
              refresh_token: mockRefreshToken,
            } as any,
          },
          error: null,
        });

        // Act
        const result = await authService.login(validEmail, validPassword);

        // Assert
        expect(result).toHaveProperty('accessToken');
        expect(result).toHaveProperty('refreshToken');
        expect(typeof result.accessToken).toBe('string');
        expect(typeof result.refreshToken).toBe('string');
      });
    });

    describe('authentication errors', () => {
      it('should throw UnauthorizedError for invalid credentials', async () => {
        // Arrange
        mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
          data: { user: null, session: null },
          error: {
            message: 'Invalid login credentials',
            status: 401,
          } as AuthError,
        });

        // Act & Assert
        await expect(authService.login(validEmail, 'wrongpassword')).rejects.toThrow(UnauthorizedError);
        await expect(authService.login(validEmail, 'wrongpassword')).rejects.toThrow(
          'Nieprawidłowy adres e-mail lub hasło'
        );
      });

      it('should throw UnauthorizedError for any Supabase auth error', async () => {
        // Arrange
        mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
          data: { user: null, session: null },
          error: {
            message: 'User not found',
            status: 404,
          } as AuthError,
        });

        // Act & Assert
        await expect(authService.login(validEmail, validPassword)).rejects.toThrow(UnauthorizedError);
      });

      it('should have correct error name for UnauthorizedError', async () => {
        // Arrange
        mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'Invalid credentials' } as AuthError,
        });

        // Act
        try {
          await authService.login(validEmail, validPassword);
        } catch (error) {
          // Assert
          expect(error).toBeInstanceOf(UnauthorizedError);
          expect((error as UnauthorizedError).name).toBe('UnauthorizedError');
        }
      });
    });

    describe('missing session errors', () => {
      it('should throw Error when session is null despite no error', async () => {
        // Arrange
        mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
          data: {
            user: { id: 'user-123' } as User,
            session: null,
          },
          error: null,
        });

        // Act & Assert
        await expect(authService.login(validEmail, validPassword)).rejects.toThrow(
          'No session returned from Supabase'
        );
      });

      it('should throw generic Error (not UnauthorizedError) for missing session', async () => {
        // Arrange
        mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
          data: { user: {} as User, session: null },
          error: null,
        });

        // Act & Assert
        await expect(authService.login(validEmail, validPassword)).rejects.toThrow(Error);
        await expect(authService.login(validEmail, validPassword)).rejects.not.toThrow(UnauthorizedError);
      });
    });

    describe('edge cases', () => {
      it('should handle email with different casing', async () => {
        // Arrange
        const uppercaseEmail = 'USER@EXAMPLE.COM';
        mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
          data: {
            user: {} as User,
            session: {
              access_token: mockAccessToken,
              refresh_token: mockRefreshToken,
            } as any,
          },
          error: null,
        });

        // Act
        await authService.login(uppercaseEmail, validPassword);

        // Assert
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: uppercaseEmail,
          password: validPassword,
        });
      });

      it('should handle password with special characters', async () => {
        // Arrange
        const specialPassword = 'P@ssw0rd!#$%^&*()';
        mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
          data: {
            user: {} as User,
            session: {
              access_token: mockAccessToken,
              refresh_token: mockRefreshToken,
            } as any,
          },
          error: null,
        });

        // Act
        await authService.login(validEmail, specialPassword);

        // Assert
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: validEmail,
          password: specialPassword,
        });
      });

      it('should handle whitespace in password', async () => {
        // Arrange
        const passwordWithSpaces = '  password with spaces  ';
        mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
          data: {
            user: {} as User,
            session: {
              access_token: mockAccessToken,
              refresh_token: mockRefreshToken,
            } as any,
          },
          error: null,
        });

        // Act
        await authService.login(validEmail, passwordWithSpaces);

        // Assert
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: validEmail,
          password: passwordWithSpaces,
        });
      });
    });
  });

  // =================================================================
  // LOGOUT
  // =================================================================
  describe('logout', () => {
    it('should call signOut on Supabase client', async () => {
      // Arrange
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

      // Act
      await authService.logout();

      // Assert
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalledTimes(1);
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalledWith();
    });

    it('should not throw error on successful logout', async () => {
      // Arrange
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

      // Act & Assert
      await expect(authService.logout()).resolves.not.toThrow();
    });

    it('should return void on successful logout', async () => {
      // Arrange
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

      // Act
      const result = await authService.logout();

      // Assert
      expect(result).toBeUndefined();
    });

    it('should handle logout even when error occurs', async () => {
      // Arrange
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: { message: 'Logout failed' } as AuthError,
      });

      // Act & Assert - AuthService doesn't check for errors, so it shouldn't throw
      await expect(authService.logout()).resolves.not.toThrow();
    });
  });

  // =================================================================
  // SEND PASSWORD RESET EMAIL
  // =================================================================
  describe('sendPasswordResetEmail', () => {
    const email = 'user@example.com';
    const redirectUrl = 'https://example.com/reset-password';

    describe('successful email send', () => {
      it('should send reset email with correct parameters', async () => {
        // Arrange
        mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
          data: {},
          error: null,
        });

        // Act
        await authService.sendPasswordResetEmail(email, redirectUrl);

        // Assert
        expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledTimes(1);
        expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(email, {
          redirectTo: redirectUrl,
        });
      });

      it('should not throw error on success', async () => {
        // Arrange
        mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
          data: {},
          error: null,
        });

        // Act & Assert
        await expect(authService.sendPasswordResetEmail(email, redirectUrl)).resolves.not.toThrow();
      });

      it('should return void on success', async () => {
        // Arrange
        mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
          data: {},
          error: null,
        });

        // Act
        const result = await authService.sendPasswordResetEmail(email, redirectUrl);

        // Assert
        expect(result).toBeUndefined();
      });
    });

    describe('user enumeration prevention', () => {
      it('should NOT throw error even when email does not exist', async () => {
        // Arrange
        mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
          data: {},
          error: { message: 'User not found' } as AuthError,
        });

        // Act & Assert
        await expect(authService.sendPasswordResetEmail(email, redirectUrl)).resolves.not.toThrow();
      });

      it('should NOT throw error for any Supabase error (security)', async () => {
        // Arrange
        mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
          data: {},
          error: { message: 'Rate limit exceeded' } as AuthError,
        });

        // Act & Assert - Always succeeds to prevent user enumeration
        await expect(authService.sendPasswordResetEmail(email, redirectUrl)).resolves.not.toThrow();
      });

      it('should always succeed regardless of error', async () => {
        // Arrange
        mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
          data: {},
          error: { message: 'Database error', status: 500 } as AuthError,
        });

        // Act
        const result = await authService.sendPasswordResetEmail(email, redirectUrl);

        // Assert
        expect(result).toBeUndefined();
      });
    });

    describe('edge cases', () => {
      it('should handle URLs with query parameters', async () => {
        // Arrange
        const urlWithParams = 'https://example.com/reset?token=abc&user=123';
        mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
          data: {},
          error: null,
        });

        // Act
        await authService.sendPasswordResetEmail(email, urlWithParams);

        // Assert
        expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(email, {
          redirectTo: urlWithParams,
        });
      });

      it('should handle localhost URLs', async () => {
        // Arrange
        const localhostUrl = 'http://localhost:3000/reset';
        mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
          data: {},
          error: null,
        });

        // Act
        await authService.sendPasswordResetEmail(email, localhostUrl);

        // Assert
        expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(email, {
          redirectTo: localhostUrl,
        });
      });
    });
  });

  // =================================================================
  // RESET PASSWORD
  // =================================================================
  describe('resetPassword', () => {
    const accessToken = 'valid-access-token';
    const refreshToken = 'valid-refresh-token';
    const newPassword = 'NewSecurePass123!';

    let mockCreateClient: any;

    beforeEach(async () => {
      const { createClient } = await import('@supabase/supabase-js');
      mockCreateClient = createClient as any;
    });

    describe('successful password reset', () => {
      it('should reset password successfully with valid tokens', async () => {
        // Arrange
        const mockSupabaseWithToken = {
          auth: {
            updateUser: vi.fn().mockResolvedValue({
              data: { user: {} as User },
              error: null,
            }),
          },
        };

        mockCreateClient.mockReturnValue(mockSupabaseWithToken);

        // Act
        await authService.resetPassword(accessToken, refreshToken, newPassword);

        // Assert
        expect(mockSupabaseWithToken.auth.updateUser).toHaveBeenCalledTimes(1);
        expect(mockSupabaseWithToken.auth.updateUser).toHaveBeenCalledWith({
          password: newPassword,
        });
      });

      it('should create Supabase client with authorization header', async () => {
        // Arrange
        const mockSupabaseWithToken = {
          auth: {
            updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
          },
        };

        mockCreateClient.mockReturnValue(mockSupabaseWithToken);

        // Act
        await authService.resetPassword(accessToken, refreshToken, newPassword);

        // Assert
        expect(mockCreateClient).toHaveBeenCalledTimes(1);
        // Verify the third argument has the correct authorization header structure
        const callArgs = mockCreateClient.mock.calls[0];
        expect(callArgs[2]).toHaveProperty('global');
        expect(callArgs[2].global).toHaveProperty('headers');
        expect(callArgs[2].global.headers.Authorization).toBe(`Bearer ${accessToken}`);
      });

      it('should not throw error on successful reset', async () => {
        // Arrange
        const mockSupabaseWithToken = {
          auth: {
            updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
          },
        };

        mockCreateClient.mockReturnValue(mockSupabaseWithToken);

        // Act & Assert
        await expect(authService.resetPassword(accessToken, refreshToken, newPassword)).resolves.not.toThrow();
      });
    });

    describe('token expiration errors', () => {
      it('should throw UnauthorizedError when token is expired', async () => {
        // Arrange
        const mockSupabaseWithToken = {
          auth: {
            updateUser: vi.fn().mockResolvedValue({
              data: null,
              error: {
                message: 'Token has expired',
                status: 401,
              } as AuthError,
            }),
          },
        };

        mockCreateClient.mockReturnValue(mockSupabaseWithToken);

        // Act & Assert
        await expect(authService.resetPassword(accessToken, refreshToken, newPassword)).rejects.toThrow(
          UnauthorizedError
        );
        await expect(authService.resetPassword(accessToken, refreshToken, newPassword)).rejects.toThrow(
          'Link resetujący wygasł lub jest nieprawidłowy'
        );
      });

      it('should throw UnauthorizedError when token is invalid', async () => {
        // Arrange
        const mockSupabaseWithToken = {
          auth: {
            updateUser: vi.fn().mockResolvedValue({
              data: null,
              error: {
                message: 'invalid token signature', // lowercase to match code check
                status: 401,
              } as AuthError,
            }),
          },
        };

        mockCreateClient.mockReturnValue(mockSupabaseWithToken);

        // Act & Assert
        await expect(authService.resetPassword(accessToken, refreshToken, newPassword)).rejects.toThrow(
          UnauthorizedError
        );
      });

      it('should have correct error name for token errors', async () => {
        // Arrange
        const mockSupabaseWithToken = {
          auth: {
            updateUser: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Token expired' } as AuthError,
            }),
          },
        };

        mockCreateClient.mockReturnValue(mockSupabaseWithToken);

        // Act
        try {
          await authService.resetPassword(accessToken, refreshToken, newPassword);
        } catch (error) {
          // Assert
          expect(error).toBeInstanceOf(UnauthorizedError);
          expect((error as UnauthorizedError).name).toBe('UnauthorizedError');
        }
      });
    });

    describe('other password reset errors', () => {
      it('should throw generic Error for non-auth errors', async () => {
        // Arrange
        const mockSupabaseWithToken = {
          auth: {
            updateUser: vi.fn().mockResolvedValue({
              data: null,
              error: {
                message: 'Database connection error',
                status: 500,
              } as AuthError,
            }),
          },
        };

        mockCreateClient.mockReturnValue(mockSupabaseWithToken);

        // Act & Assert
        await expect(authService.resetPassword(accessToken, refreshToken, newPassword)).rejects.toThrow(Error);
        await expect(authService.resetPassword(accessToken, refreshToken, newPassword)).rejects.toThrow(
          'Password reset failed: Database connection error'
        );
      });

      it('should include original error message', async () => {
        // Arrange
        const originalMessage = 'Specific database error';
        const mockSupabaseWithToken = {
          auth: {
            updateUser: vi.fn().mockResolvedValue({
              data: null,
              error: { message: originalMessage } as AuthError,
            }),
          },
        };

        mockCreateClient.mockReturnValue(mockSupabaseWithToken);

        // Act & Assert
        await expect(authService.resetPassword(accessToken, refreshToken, newPassword)).rejects.toThrow(
          `Password reset failed: ${originalMessage}`
        );
      });
    });

    describe('edge cases', () => {
      it('should handle very long tokens', async () => {
        // Arrange
        const longToken = 'A'.repeat(10000);
        const mockSupabaseWithToken = {
          auth: {
            updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
          },
        };

        mockCreateClient.mockReturnValue(mockSupabaseWithToken);

        // Act & Assert
        await expect(authService.resetPassword(longToken, refreshToken, newPassword)).resolves.not.toThrow();
      });

      it('should handle password with special characters', async () => {
        // Arrange
        const specialPassword = 'P@ssw0rd!#$%^&*()';
        const mockSupabaseWithToken = {
          auth: {
            updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
          },
        };

        mockCreateClient.mockReturnValue(mockSupabaseWithToken);

        // Act
        await authService.resetPassword(accessToken, refreshToken, specialPassword);

        // Assert
        expect(mockSupabaseWithToken.auth.updateUser).toHaveBeenCalledWith({
          password: specialPassword,
        });
      });
    });
  });

  // =================================================================
  // GET CURRENT USER
  // =================================================================
  describe('getCurrentUser', () => {
    describe('authenticated user', () => {
      it('should return user when authenticated', async () => {
        // Arrange
        const mockUser = {
          id: 'user-123',
          email: 'user@example.com',
          created_at: '2024-01-01',
        } as User;

        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        // Act
        const result = await authService.getCurrentUser();

        // Assert
        expect(result).toEqual(mockUser);
        expect(result?.id).toBe('user-123');
        expect(result?.email).toBe('user@example.com');
      });

      it('should call getUser on Supabase client', async () => {
        // Arrange
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: {} as User },
          error: null,
        });

        // Act
        await authService.getCurrentUser();

        // Assert
        expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(1);
        expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith();
      });

      it('should return User type with correct properties', async () => {
        // Arrange
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: '2024-01-01',
        } as User;

        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        });

        // Act
        const result = await authService.getCurrentUser();

        // Assert
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('email');
        expect(result).toHaveProperty('created_at');
      });
    });

    describe('unauthenticated user', () => {
      it('should return null when user is not authenticated', async () => {
        // Arrange
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        // Act
        const result = await authService.getCurrentUser();

        // Assert
        expect(result).toBeNull();
      });

      it('should return null when error occurs', async () => {
        // Arrange
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: {
            message: 'No active session',
            status: 401,
          } as AuthError,
        });

        // Act
        const result = await authService.getCurrentUser();

        // Assert
        expect(result).toBeNull();
      });

      it('should return null when both user and error are present', async () => {
        // Arrange - Edge case where both exist
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-123' } as User },
          error: { message: 'Some error' } as AuthError,
        });

        // Act
        const result = await authService.getCurrentUser();

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('edge cases', () => {
      it('should handle user object with minimal data', async () => {
        // Arrange
        const minimalUser = {
          id: 'user-123',
        } as User;

        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: minimalUser },
          error: null,
        });

        // Act
        const result = await authService.getCurrentUser();

        // Assert
        expect(result).toEqual(minimalUser);
        expect(result?.id).toBe('user-123');
      });

      it('should not throw error in any scenario', async () => {
        // Arrange
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: { message: 'Critical error' } as AuthError,
        });

        // Act & Assert
        await expect(authService.getCurrentUser()).resolves.not.toThrow();
      });
    });
  });

  // =================================================================
  // CONSTRUCTOR & TYPE SAFETY
  // =================================================================
  describe('constructor and type safety', () => {
    it('should create instance with Supabase client', () => {
      // Arrange & Act
      const service = new AuthService(mockSupabaseClient);

      // Assert
      expect(service).toBeInstanceOf(AuthService);
    });

    it('should store Supabase client as private property', () => {
      // Arrange & Act
      const service = new AuthService(mockSupabaseClient);

      // Assert - Can't access private property directly, but can verify through method calls
      expect(service).toBeDefined();
      expect(typeof service.login).toBe('function');
    });

    it('should have all public methods defined', () => {
      // Arrange & Act
      const service = new AuthService(mockSupabaseClient);

      // Assert
      expect(typeof service.register).toBe('function');
      expect(typeof service.login).toBe('function');
      expect(typeof service.logout).toBe('function');
      expect(typeof service.sendPasswordResetEmail).toBe('function');
      expect(typeof service.resetPassword).toBe('function');
      expect(typeof service.getCurrentUser).toBe('function');
    });
  });
});
