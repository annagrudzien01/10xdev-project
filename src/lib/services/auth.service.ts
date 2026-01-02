import type { SupabaseClient } from "@/db/supabase.client";
import type { User } from "@supabase/supabase-js";
import { ConflictError, UnauthorizedError } from "@/lib/errors/api-errors";

/**
 * Authentication Service
 *
 * Encapsulates authentication business logic and communication with Supabase Auth.
 * Transforms Supabase errors into internal error types for consistent error handling.
 */
export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Register a new user
   *
   * @param email - User email address
   * @param password - User password
   * @throws ConflictError if user already exists
   * @throws Error for other errors
   */
  async register(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        throw new ConflictError("Użytkownik z tym adresem e-mail już istnieje");
      }
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  /**
   * Login user
   *
   * @param email - User email address
   * @param password - User password
   * @returns Session with access and refresh tokens
   * @throws UnauthorizedError if credentials are invalid
   * @throws Error for other errors
   */
  async login(
    email: string,
    password: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedError("Nieprawidłowy adres e-mail lub hasło");
    }

    if (!data.session) {
      throw new Error("No session returned from Supabase");
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  /**
   * Logout user
   *
   * Signs out the current user from Supabase Auth.
   */
  async logout(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  /**
   * Send password reset email
   *
   * @param email - User email address
   * @param redirectUrl - URL to redirect after clicking reset link
   *
   * Note: Always succeeds (doesn't throw error if email doesn't exist)
   * to prevent user enumeration attacks.
   */
  async sendPasswordResetEmail(email: string, redirectUrl: string): Promise<void> {
    await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    // Always success (don't throw error even if email doesn't exist)
  }

  /**
   * Reset password with token
   *
   * @param accessToken - Access token from reset email
   * @param refreshToken - Refresh token from reset email
   * @param newPassword - New password
   * @throws UnauthorizedError if token is invalid or expired
   * @throws Error for other errors
   */
  async resetPassword(accessToken: string, refreshToken: string, newPassword: string): Promise<void> {
    // Create client with tokens
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseWithToken = createClient(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    const { error } = await supabaseWithToken.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      if (error.message.includes("expired") || error.message.includes("invalid")) {
        throw new UnauthorizedError("Link resetujący wygasł lub jest nieprawidłowy");
      }
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  /**
   * Get current authenticated user
   *
   * @returns User object or null if not authenticated
   */
  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  }
}
