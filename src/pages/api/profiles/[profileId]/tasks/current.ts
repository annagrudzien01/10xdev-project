/**
 * GET /api/profiles/{profileId}/tasks/current
 *
 * Endpoint to retrieve the currently active puzzle for a child profile.
 * This allows the frontend to resume game state after page refresh without
 * generating a new puzzle. Returns the puzzle data including the number of
 * attempts already used.
 *
 * Security:
 * - Requires authentication (Supabase JWT)
 * - Validates profile ownership (parent must own the profile)
 * - Enforces RLS on task_results table
 *
 * Response Codes:
 * - 200: Active puzzle found and returned (includes attemptsUsed field)
 * - 400: Invalid request (bad profileId format)
 * - 401: Unauthenticated
 * - 403: Profile doesn't belong to authenticated parent
 * - 404: No active puzzle found
 * - 500: Internal server error
 */

import type { APIRoute } from "astro";
import { profileIdParamSchema } from "@/lib/schemas/task.schema";
import { ProfileService } from "@/lib/services/profile.service";
import { TaskService } from "@/lib/services/task.service";
import { ValidationError, UnauthorizedError, ForbiddenError, NotFoundError } from "@/lib/errors/api-errors";
import type { APIErrorResponse, CurrentPuzzleDTO } from "@/types";

export const prerender = false;

/**
 * GET handler for retrieving current active puzzle
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Validate authentication
    const supabase = locals.supabase;
    if (!supabase) {
      throw new UnauthorizedError();
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new UnauthorizedError();
    }

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

    // Step 4: Get current task
    const taskService = new TaskService(supabase);
    const currentPuzzle: CurrentPuzzleDTO = await taskService.getCurrentTask(profileId);

    // Step 5: Return success response
    return new Response(JSON.stringify(currentPuzzle), {
      status: 200,
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
    // Log error details for debugging (without sensitive data per GDPR)
    console.error("Unexpected error in GET /api/profiles/{profileId}/tasks/current:", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: locals.supabase ? "authenticated" : "unauthenticated",
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
