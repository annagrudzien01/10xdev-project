import type { APIRoute } from "astro";
import { AuthService } from "@/lib/services/auth.service";
import type { APIErrorResponse, LogoutResponseDTO } from "@/types";

/**
 * POST /api/auth/logout
 *
 * Logs out the current user by signing them out from Supabase Auth
 * and clearing session cookies.
 *
 * @returns 200 OK with success message + Clear-Cookie headers
 * @returns 500 Internal Server Error for unexpected errors
 *
 * Note: This endpoint doesn't require authentication - it can be called
 * even without a valid token to ensure cookies are cleared.
 */
export const POST: APIRoute = async ({ locals, cookies }) => {
  try {
    // Create auth service with Supabase client
    const authService = new AuthService(locals.supabase);

    // Sign out from Supabase (invalidates the session)
    await authService.logout();

    // Clear session cookies by setting maxAge to 0
    cookies.delete("sb-access-token", {
      path: "/",
    });

    cookies.delete("sb-refresh-token", {
      path: "/",
    });

    // Return success response
    const response: LogoutResponseDTO = {
      message: "Wylogowano pomyślnie",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Log unexpected errors (without sensitive data)
    console.error("Unexpected error in POST /api/auth/logout:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    // Even if logout fails, we still clear cookies and return success
    // to ensure the user can always log out from the UI perspective
    cookies.delete("sb-access-token", {
      path: "/",
    });

    cookies.delete("sb-refresh-token", {
      path: "/",
    });

    const errorResponse: APIErrorResponse = {
      error: "internal_error",
      message: "An unexpected error occurred during logout",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Disable prerendering for this API route
export const prerender = false;
