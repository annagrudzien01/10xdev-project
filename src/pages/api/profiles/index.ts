import type { APIRoute } from "astro";
import { createChildProfileSchema } from "../../../lib/schemas/profile.schema";
import { paginationParamsSchema } from "../../../lib/schemas/pagination.schema";
import { ProfileService } from "../../../lib/services/profile.service";
import { ConflictError, UnauthorizedError, ValidationError } from "../../../lib/errors/api-errors";
import type { APIErrorResponse } from "../../../types";

export const prerender = false;

// -----------------------------------------------------------------------------
// GET /api/profiles - list child profiles (new implementation)
// -----------------------------------------------------------------------------
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const supabase = locals.supabase;
    if (!supabase) {
      throw new UnauthorizedError();
    }

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new UnauthorizedError();
    }

    // Validate query params
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validationResult = paginationParamsSchema.safeParse(queryParams);
    if (!validationResult.success) {
      const details: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path.join(".");
        details[field] = err.message;
      });
      throw new ValidationError(details);
    }

    const profileService = new ProfileService(supabase);
    const result = await profileService.listChildProfiles(user.id, validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({
          error: "invalid_request",
          message: error.message,
          details: error.details,
        } as APIErrorResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (error instanceof UnauthorizedError) {
      return new Response(
        JSON.stringify({
          error: "unauthenticated",
          message: error.message,
        } as APIErrorResponse),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    console.error("Unexpected error in GET /api/profiles:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: "An unexpected error occurred",
      } as APIErrorResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// -----------------------------------------------------------------------------
// POST /api/profiles - create profile (existing implementation)
// -----------------------------------------------------------------------------
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Check authentication
    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: "unauthenticated",
          message: "Authentication required",
        } as APIErrorResponse),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 2: Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: "unauthenticated",
          message: "Authentication required",
        } as APIErrorResponse),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 3: Parse and validate request body
    const body = await request.json();
    const validationResult = createChildProfileSchema.safeParse(body);

    if (!validationResult.success) {
      const details: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path.join(".");
        details[field] = err.message;
      });

      return new Response(
        JSON.stringify({
          error: "invalid_request",
          message: "Validation failed",
          details,
        } as APIErrorResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 4: Create profile via service
    const profileService = new ProfileService(supabase);
    const profile = await profileService.createChildProfile(user.id, validationResult.data);

    // Step 5: Return success response
    return new Response(JSON.stringify(profile), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 6: Handle errors
    if (error instanceof ConflictError) {
      return new Response(
        JSON.stringify({
          error: "conflict",
          message: error.message,
        } as APIErrorResponse),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    if (error instanceof UnauthorizedError) {
      return new Response(
        JSON.stringify({
          error: "unauthenticated",
          message: error.message,
        } as APIErrorResponse),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log unexpected errors (without sensitive data per GDPR)
    console.error("Unexpected error in POST /api/profiles:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: "An unexpected error occurred",
      } as APIErrorResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
