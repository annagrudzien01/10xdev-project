import type { APIRoute } from "astro";
import { updateChildProfileSchema } from "../../../lib/schemas/profile.schema";
import { ProfileService } from "../../../lib/services/profile.service";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../../lib/errors/api-errors";
import type { APIErrorResponse } from "../../../types";

export const prerender = false;

// -----------------------------------------------------------------------------
// GET /api/profiles/{id} - Get single profile
// -----------------------------------------------------------------------------
export const GET: APIRoute = async ({ params, locals }) => {
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

    const profileId = params.id;
    if (!profileId) {
      throw new ValidationError({ id: "Profile ID is required" });
    }

    const profileService = new ProfileService(supabase);
    const profile = await profileService.getChildProfile(profileId, user.id);

    return new Response(JSON.stringify(profile), {
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
    if (error instanceof NotFoundError) {
      return new Response(
        JSON.stringify({
          error: "not_found",
          message: error.message,
        } as APIErrorResponse),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.error("Unexpected error in GET /api/profiles/{id}:", {
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
// PATCH /api/profiles/{id} - Update profile
// -----------------------------------------------------------------------------
export const PATCH: APIRoute = async ({ params, request, locals }) => {
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

    const profileId = params.id;
    if (!profileId) {
      throw new ValidationError({ id: "Profile ID is required" });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateChildProfileSchema.safeParse(body);

    if (!validationResult.success) {
      const details: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path.join(".");
        details[field] = err.message;
      });
      throw new ValidationError(details);
    }

    // Ensure at least one field is provided
    if (!validationResult.data.profileName && !validationResult.data.dateOfBirth) {
      throw new ValidationError({
        body: "At least one field (profileName or dateOfBirth) must be provided",
      });
    }

    const profileService = new ProfileService(supabase);
    const profile = await profileService.updateChildProfile(
      profileId,
      user.id,
      validationResult.data
    );

    return new Response(JSON.stringify(profile), {
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
    if (error instanceof NotFoundError) {
      return new Response(
        JSON.stringify({
          error: "not_found",
          message: error.message,
        } as APIErrorResponse),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    if (error instanceof ConflictError) {
      return new Response(
        JSON.stringify({
          error: "conflict",
          message: error.message,
        } as APIErrorResponse),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    console.error("Unexpected error in PATCH /api/profiles/{id}:", {
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
// DELETE /api/profiles/{id} - Delete profile
// -----------------------------------------------------------------------------
export const DELETE: APIRoute = async ({ params, locals }) => {
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

    const profileId = params.id;
    if (!profileId) {
      throw new ValidationError({ id: "Profile ID is required" });
    }

    const profileService = new ProfileService(supabase);
    await profileService.deleteChildProfile(profileId, user.id);

    return new Response(
      JSON.stringify({ message: "Profile deleted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
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
    if (error instanceof NotFoundError) {
      return new Response(
        JSON.stringify({
          error: "not_found",
          message: error.message,
        } as APIErrorResponse),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    if (error instanceof ConflictError) {
      return new Response(
        JSON.stringify({
          error: "conflict",
          message: error.message,
        } as APIErrorResponse),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    console.error("Unexpected error in DELETE /api/profiles/{id}:", {
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

