/**
 * POST /api/sessions/{sessionId}/refresh
 *
 * Extends an active game session by 2 minutes.
 * Can be called multiple times to keep extending the session.
 */

import type { APIRoute } from "astro";
import type { SessionRefreshDTO, APIErrorResponse } from "@/types";
import { SessionService } from "@/lib/services/session.service";
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors/api-errors";
import { sessionIdParamSchema } from "@/lib/schemas/session.schema";

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
    const validationResult = sessionIdParamSchema.safeParse(params);
    if (!validationResult.success) {
      const details: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path.join(".");
        details[field] = err.message;
      });
      throw new ValidationError(details);
    }

    const { sessionId } = validationResult.data;

    // Step 3: Refresh session (includes ownership verification)
    const sessionService = new SessionService(supabase);
    const result: SessionRefreshDTO = await sessionService.refreshSession(sessionId, user.id);

    // Step 4: Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 5: Handle errors with appropriate status codes

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
    console.error("Unexpected error in POST /api/sessions/{sessionId}/refresh:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      userId: user?.id || "unauthenticated",
      sessionId: params.sessionId,
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
