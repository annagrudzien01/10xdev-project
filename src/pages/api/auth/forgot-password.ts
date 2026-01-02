import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { forgotPasswordSchema } from "@/lib/schemas/auth.schema";
import { AuthService } from "@/lib/services/auth.service";
import { ValidationError } from "@/lib/errors/api-errors";
import type { APIErrorResponse, ForgotPasswordResponseDTO } from "@/types";

/**
 * POST /api/auth/forgot-password
 *
 * Sends a password reset email to the user.
 * ALWAYS returns 200 OK (even if email doesn't exist) to prevent user enumeration attacks.
 *
 * The reset link will redirect to /reset-password with access_token and refresh_token as query params.
 *
 * @returns 200 OK with generic success message (always)
 * @returns 400 Bad Request for validation errors
 * @returns 500 Internal Server Error for unexpected errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    // Get origin from request headers for redirect URL
    // This allows the endpoint to work in both dev and production
    const origin = request.headers.get("origin") || "http://localhost:4321";
    const redirectUrl = `${origin}/reset-password`;

    // Create auth service with Supabase client
    const authService = new AuthService(locals.supabase);

    // Send password reset email
    // Note: This method doesn't throw error if email doesn't exist (by design)
    await authService.sendPasswordResetEmail(validatedData.email, redirectUrl);

    // ALWAYS return success (even if email doesn't exist)
    // This prevents user enumeration attacks
    const response: ForgotPasswordResponseDTO = {
      message: "Jeśli podany adres e-mail istnieje w naszej bazie, wyślemy na niego link do resetowania hasła",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const validationError = new ValidationError("Validation failed", error.errors);
      const errorResponse: APIErrorResponse = {
        error: "invalid_request",
        message: validationError.message,
        details: validationError.details,
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log unexpected errors (without sensitive data)
    console.error("Unexpected error in POST /api/auth/forgot-password:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    // Return generic error response
    // Note: We still don't reveal if email exists or not
    const errorResponse: APIErrorResponse = {
      error: "internal_error",
      message: "An unexpected error occurred",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Disable prerendering for this API route
export const prerender = false;
