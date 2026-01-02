import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { loginSchema } from "@/lib/schemas/auth.schema";
import { AuthService } from "@/lib/services/auth.service";
import { ValidationError, UnauthorizedError } from "@/lib/errors/api-errors";
import type { APIErrorResponse, LoginResponseDTO } from "@/types";

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 * Sets httpOnly cookies with Supabase session tokens.
 *
 * @returns 200 OK with success message + Set-Cookie headers
 * @returns 400 Bad Request for validation errors
 * @returns 401 Unauthorized for invalid credentials
 * @returns 500 Internal Server Error for unexpected errors
 */
export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Create auth service with Supabase client
    const authService = new AuthService(locals.supabase);

    // Attempt login
    const { accessToken, refreshToken } = await authService.login(validatedData.email, validatedData.password);

    // Set httpOnly cookies with Supabase tokens
    // Using Supabase's default cookie names (will be auto-generated based on project)
    // These cookies will be automatically sent with subsequent requests
    cookies.set("sb-access-token", accessToken, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours (86400 seconds) - per US-002 requirement
    });

    cookies.set("sb-refresh-token", refreshToken, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days (604800 seconds)
    });

    // Return success response
    const response: LoginResponseDTO = {
      message: "Zalogowano pomyślnie",
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

    // Handle unauthorized errors (invalid credentials)
    if (error instanceof UnauthorizedError) {
      const errorResponse: APIErrorResponse = {
        error: "unauthorized",
        message: error.message,
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log unexpected errors (without sensitive data)
    console.error("Unexpected error in POST /api/auth/login:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    // Return generic error response
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
