import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { registerSchema } from "@/lib/schemas/auth.schema";
import { AuthService } from "@/lib/services/auth.service";
import { ValidationError, ConflictError } from "@/lib/errors/api-errors";
import type { APIErrorResponse, RegisterResponseDTO } from "@/types";

/**
 * POST /api/auth/register
 *
 * Registers a new user with email and password.
 * Does NOT automatically log in the user - they must login after registration.
 *
 * @returns 201 Created with success message
 * @returns 400 Bad Request for validation errors
 * @returns 409 Conflict if user already exists
 * @returns 500 Internal Server Error for unexpected errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Create auth service with Supabase client
    const authService = new AuthService(locals.supabase);

    // Attempt registration
    await authService.register(validatedData.email, validatedData.password);

    // Return success response
    // Note: User is NOT logged in automatically - they must login after registration
    const response: RegisterResponseDTO = {
      message: "Użytkownik został zarejestrowany pomyślnie",
    };

    return new Response(JSON.stringify(response), {
      status: 201,
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

    // Handle conflict errors (user already exists)
    if (error instanceof ConflictError) {
      const errorResponse: APIErrorResponse = {
        error: "conflict",
        message: error.message,
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log unexpected errors (without sensitive data)
    console.error("Unexpected error in POST /api/auth/register:", {
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
