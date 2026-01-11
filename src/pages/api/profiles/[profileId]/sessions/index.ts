/**
 * POST /api/profiles/{profileId}/sessions
 * GET /api/profiles/{profileId}/sessions
 *
 * Manages game sessions for a child profile.
 * POST: Starts a new session (10 min duration), automatically closing previous active sessions
 * GET: Lists sessions with optional filtering and pagination
 */

import type { APIRoute } from "astro";
import type { SessionStartDTO, SessionDTO, PaginatedResponse, APIErrorResponse } from "@/types";
import { ProfileService } from "@/lib/services/profile.service";
import { SessionService } from "@/lib/services/session.service";
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors/api-errors";
import { profileIdParamSchema, sessionListParamsSchema } from "@/lib/schemas/session.schema";

export const prerender = false;

export const POST: APIRoute = async ({ params, locals }) => {
  // Declare user in outer scope for error logging
  let user: { id: string } | null = null;

  try {
    // Step 1: Validate authentication
    const supabase = locals.supabase;
    if (!supabase) {
      throw new UnauthorizedError();
    }

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      throw new UnauthorizedError();
    }

    user = authUser;

    // Step 2: Validate path parameters
    const validationResult = profileIdParamSchema.safeParse(params);
    if (!validationResult.success) {
      const details: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path.join(".");
        details[field] = err.message;
      });
      throw new ValidationError(details);
    }

    const { profileId } = validationResult.data;

    // Step 3: Verify profile ownership
    const profileService = new ProfileService(supabase);
    await profileService.validateOwnership(profileId, user.id);

    // Step 4: Start new session
    const sessionService = new SessionService(supabase);
    const session: SessionStartDTO = await sessionService.startSession(profileId);

    // Step 5: Return success response
    return new Response(JSON.stringify(session), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 6: Handle errors with appropriate status codes

    // Validation errors (400)
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

    // Authentication errors (401)
    if (error instanceof UnauthorizedError) {
      return new Response(
        JSON.stringify({
          error: "unauthenticated",
          message: error.message,
        } as APIErrorResponse),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Authorization errors (403)
    if (error instanceof ForbiddenError) {
      return new Response(
        JSON.stringify({
          error: "forbidden",
          message: error.message,
        } as APIErrorResponse),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Not found errors (404)
    if (error instanceof NotFoundError) {
      return new Response(
        JSON.stringify({
          error: "not_found",
          message: error.message,
        } as APIErrorResponse),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Unexpected errors (500)
    // eslint-disable-next-line no-console
    console.error("Unexpected error in POST /api/profiles/{profileId}/sessions:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      userId: user?.id || "unauthenticated",
      profileId: params.profileId,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: "An unexpected error occurred",
        // Include error details in development
        ...(import.meta.env.DEV && {
          details: error instanceof Error ? error.message : String(error),
        }),
      } as APIErrorResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * GET /api/profiles/{profileId}/sessions
 *
 * Lists all sessions for a child profile with optional filtering and pagination.
 * Supports filtering by active status and pagination parameters.
 */
export const GET: APIRoute = async ({ params, url, locals }) => {
  // Declare user in outer scope for error logging
  let user: { id: string } | null = null;

  try {
    // Step 1: Validate authentication
    const supabase = locals.supabase;
    if (!supabase) {
      throw new UnauthorizedError();
    }

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      throw new UnauthorizedError();
    }

    user = authUser;

    // Step 2: Validate path parameters
    const paramsValidation = profileIdParamSchema.safeParse(params);
    if (!paramsValidation.success) {
      const details: Record<string, string> = {};
      paramsValidation.error.errors.forEach((err) => {
        const field = err.path.join(".");
        details[field] = err.message;
      });
      throw new ValidationError(details);
    }

    // Step 3: Validate query parameters
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const queryValidation = sessionListParamsSchema.safeParse(queryParams);
    if (!queryValidation.success) {
      const details: Record<string, string> = {};
      queryValidation.error.errors.forEach((err) => {
        const field = err.path.join(".");
        details[field] = err.message;
      });
      throw new ValidationError(details);
    }

    const { profileId } = paramsValidation.data;

    // Step 4: Verify profile ownership
    const profileService = new ProfileService(supabase);
    await profileService.validateOwnership(profileId, user.id);

    // Step 5: List sessions with filters and pagination
    const sessionService = new SessionService(supabase);
    const result: PaginatedResponse<SessionDTO> = await sessionService.listSessions(
      profileId,
      user.id,
      queryValidation.data
    );

    // Step 6: Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 7: Handle errors with appropriate status codes

    // Validation errors (400)
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

    // Authentication errors (401)
    if (error instanceof UnauthorizedError) {
      return new Response(
        JSON.stringify({
          error: "unauthenticated",
          message: error.message,
        } as APIErrorResponse),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Authorization errors (403)
    if (error instanceof ForbiddenError) {
      return new Response(
        JSON.stringify({
          error: "forbidden",
          message: error.message,
        } as APIErrorResponse),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Not found errors (404)
    if (error instanceof NotFoundError) {
      return new Response(
        JSON.stringify({
          error: "not_found",
          message: error.message,
        } as APIErrorResponse),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Unexpected errors (500)
    // eslint-disable-next-line no-console
    console.error("Unexpected error in GET /api/profiles/{profileId}/sessions:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      userId: user?.id || "unauthenticated",
      profileId: params.profileId,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: "An unexpected error occurred",
        // Include error details in development
        ...(import.meta.env.DEV && {
          details: error instanceof Error ? error.message : String(error),
        }),
      } as APIErrorResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
