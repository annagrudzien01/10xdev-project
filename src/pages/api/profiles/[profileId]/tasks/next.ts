/**
 * POST /api/profiles/{profileId}/tasks/next
 *
 * Generates the next puzzle/task for the player and creates an incomplete task_result record.
 * This allows the game state to be restored via GET /tasks/current.
 */

import type { APIRoute } from "astro";
import type { GeneratePuzzleDTO, APIErrorResponse } from "@/types";
import { ProfileService } from "@/lib/services/profile.service";
import { TaskService } from "@/lib/services/task.service";
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors/api-errors";
import { profileIdParamSchema } from "@/lib/schemas/task.schema";
import { z } from "zod";

// Schema for request body
const nextTaskBodySchema = z.object({
  sessionId: z.string().uuid({ message: "Invalid session ID format" }),
});

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals }) => {
  // Declare user in outer scope for error logging
  let user: { id: string } | null = null;

  try {
    // eslint-disable-next-line no-console
    console.log("POST /tasks/next called with profileId:", params.profileId);

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

    // Step 2.5: Validate request body (sessionId)
    const body = await request.json();
    const bodyValidation = nextTaskBodySchema.safeParse(body);
    if (!bodyValidation.success) {
      const details: Record<string, string> = {};
      bodyValidation.error.errors.forEach((err) => {
        const field = err.path.join(".");
        details[field] = err.message;
      });
      throw new ValidationError(details);
    }

    const { sessionId } = bodyValidation.data;

    // Step 3: Verify profile ownership
    // eslint-disable-next-line no-console
    console.log("Step 3: Verifying profile ownership...");
    const profileService = new ProfileService(supabase);
    await profileService.validateOwnership(profileId, user.id);
    // eslint-disable-next-line no-console
    console.log("Step 3: Profile ownership verified");

    // Step 4: Check if there's already an active task for this session
    // eslint-disable-next-line no-console
    console.log("Step 4: Checking for existing task...");
    const taskService = new TaskService(supabase);
    try {
      const existingTask = await taskService.getCurrentTask(profileId, sessionId);
      // eslint-disable-next-line no-console
      console.log("Step 4: Found existing task, returning it");
      return new Response(JSON.stringify(existingTask), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log("Step 4: No existing task found, will create new one");
      if (!(error instanceof NotFoundError)) {
        throw error;
      }
    }

    // Step 5: Get profile's current level
    // eslint-disable-next-line no-console
    console.log("Step 5: Getting profile current level...");
    const { data: profile, error: profileError } = await supabase
      .from("child_profiles")
      .select("current_level_id")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      // eslint-disable-next-line no-console
      console.error("Step 5: Profile error:", profileError);
      throw new NotFoundError("Profile not found");
    }

    // eslint-disable-next-line no-console
    console.log("Step 5: Profile current level:", profile.current_level_id);

    // Step 6: Get random sequence for current level
    // eslint-disable-next-line no-console
    console.log("Step 6: Getting sequences for level:", profile.current_level_id);
    const { data: sequences, error: sequencesError } = await supabase
      .from("sequence")
      .select("id, level_id, sequence_beginning, sequence_end")
      .eq("level_id", profile.current_level_id);

    if (sequencesError || !sequences || sequences.length === 0) {
      // eslint-disable-next-line no-console
      console.error("Step 6: Sequences error:", sequencesError, "Count:", sequences?.length);
      throw new NotFoundError("No sequences available for this level");
    }

    // eslint-disable-next-line no-console
    console.log("Step 6: Found", sequences.length, "sequences");

    // Select random sequence
    const randomSequence = sequences[Math.floor(Math.random() * sequences.length)];
    // eslint-disable-next-line no-console
    console.log("Step 6: Selected sequence:", randomSequence.id);

    // Step 7: Create task_result record with initial values
    // - score: 0 (not scored yet)
    // - attempts_used: 0 (no attempts yet)
    // - completed_at: null (task not completed)
    // - session_id: current session ID
    // eslint-disable-next-line no-console
    console.log("Step 7: Creating task_result record...");
    const { error: insertError } = await supabase.from("task_results").insert({
      child_id: profileId,
      level_id: randomSequence.level_id,
      sequence_id: randomSequence.id,
      session_id: sessionId, // Link task to current session
      attempts_used: 0, // Initial value: no attempts yet
      score: 0, // Initial value: not scored yet
      completed_at: null, // NULL: task is incomplete
    });

    if (insertError) {
      // eslint-disable-next-line no-console
      console.error("Step 7: Insert error:", insertError);
      if (insertError.code === "23505") {
        throw new Error("Task already exists for this sequence");
      }
      throw new Error(`Failed to create task: ${insertError.message}`);
    }

    // eslint-disable-next-line no-console
    console.log("Step 7: Task record created successfully");

    // Step 8: Calculate expected slots and return puzzle
    const endNotes = randomSequence.sequence_end.split("-");
    const expectedSlots = endNotes.length;

    const response: GeneratePuzzleDTO = {
      sequenceId: randomSequence.id,
      levelId: randomSequence.level_id,
      sequenceBeginning: randomSequence.sequence_beginning,
      expectedSlots,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 9: Handle errors with appropriate status codes

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
    console.error("Unexpected error in POST /api/profiles/{profileId}/tasks/next:", {
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
