/**
 * POST /api/profiles/{profileId}/tasks/{sequenceId}/submit
 *
 * Submits the player's answer for validation and scoring.
 *
 * Logic:
 * 1. If answer is correct → update task_result with score and completed_at
 *    - attempts_used is NOT incremented for correct answers
 *    - Score based on previous failed attempts: 0 fails = 10pts, 1 fail = 7pts, 2 fails = 5pts
 * 2. If answer is incorrect → increment attempts_used
 * 3. If attempts_used reaches 3 → mark task as completed with score 0
 * 4. Update child profile total_score and recalculate level
 *
 * Level Calculation:
 * - Level = floor(total_score / 30) + 1
 * - 0-29 points → Level 1
 * - 30-59 points → Level 2
 * - 60-89 points → Level 3
 * - Max level: 20
 */

import type { APIRoute } from "astro";
import type { SubmitAnswerCommand, SubmitAnswerResponseDTO, APIErrorResponse } from "@/types";
import { ProfileService } from "@/lib/services/profile.service";
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors/api-errors";
import { profileIdParamSchema } from "@/lib/schemas/task.schema";

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals }) => {
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

    // Step 2: Validate parameters
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
    const { sequenceId } = params;

    if (!sequenceId) {
      throw new ValidationError({ sequenceId: "Sequence ID is required" });
    }

    // Step 3: Parse and validate request body
    const body: SubmitAnswerCommand = await request.json();

    if (!body.answer || typeof body.answer !== "string") {
      throw new ValidationError({ answer: "Answer is required" });
    }

    if (!body.sessionId || typeof body.sessionId !== "string") {
      throw new ValidationError({ sessionId: "Session ID is required" });
    }

    // Step 4: Verify profile ownership
    const profileService = new ProfileService(supabase);
    await profileService.validateOwnership(profileId, user.id);

    // Step 5: Get the task_result record (created by POST /tasks/next)
    // Filter by session_id to ensure we're updating the correct task for this session
    const { data: taskResult, error: taskError } = await supabase
      .from("task_results")
      .select("*")
      .eq("child_id", profileId)
      .eq("sequence_id", sequenceId)
      .eq("session_id", body.sessionId)
      .is("completed_at", null)
      .single();

    if (taskError || !taskResult) {
      throw new NotFoundError("Task not found or already completed");
    }

    // Step 6: Get the correct answer from sequence
    const { data: sequence, error: sequenceError } = await supabase
      .from("sequence")
      .select("sequence_end, level_id")
      .eq("id", sequenceId)
      .single();

    if (sequenceError || !sequence) {
      throw new NotFoundError("Sequence not found");
    }

    // Step 7: Check if answer is correct
    const isCorrect = sequence.sequence_end === body.answer;
    const currentAttempts = taskResult.attempts_used || 0;

    let score = taskResult.score || 0;
    let completedAt: string | null = null;
    let newAttempts = currentAttempts;

    if (isCorrect) {
      // Correct answer: calculate score based on previous failed attempts
      // Don't increment attempts_used for correct answer
      if (currentAttempts === 0) score = 10;
      else if (currentAttempts === 1) score = 7;
      else score = 5;

      completedAt = new Date().toISOString();
    } else {
      // Incorrect answer: increment attempts
      newAttempts = currentAttempts + 1;

      if (newAttempts >= 3) {
        // Failed after 3 attempts: complete with 0 score
        score = 0;
        completedAt = new Date().toISOString();
      }
    }

    // Step 8: Update task_result
    const updateData: {
      attempts_used: number;
      score: number;
      completed_at?: string;
    } = {
      attempts_used: newAttempts,
      score,
    };

    if (completedAt) {
      updateData.completed_at = completedAt;
    }

    await supabase.from("task_results").update(updateData).eq("id", taskResult.id);

    // Step 9: Calculate new level based on total score (only if task completed)
    let levelCompleted = false;
    let nextLevel = sequence.level_id;
    let previousLevel = sequence.level_id;

    if (completedAt) {
      // Step 10: Update profile score and calculate new level
      const { data: profile } = await supabase
        .from("child_profiles")
        .select("total_score, current_level_id")
        .eq("id", profileId)
        .single();

      const oldTotalScore = profile?.total_score || 0;
      const newTotalScore = oldTotalScore + score;

      // Calculate level: floor(total_score / 30) + 1
      // 0-29 points → level 1
      // 30-59 points → level 2
      // 60-89 points → level 3, etc.
      previousLevel = profile?.current_level_id || 1;
      nextLevel = Math.floor(newTotalScore / 30) + 1;

      // Cap at level 20
      nextLevel = Math.min(nextLevel, 20);

      // Check if level increased
      levelCompleted = nextLevel > previousLevel;

      await supabase
        .from("child_profiles")
        .update({
          total_score: newTotalScore,
          current_level_id: nextLevel,
          last_played_at: new Date().toISOString(),
        })
        .eq("id", profileId);
    }

    // Step 11: Return response
    const response: SubmitAnswerResponseDTO = {
      score,
      attemptsUsed: newAttempts,
      levelCompleted,
      nextLevel,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Error handling
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

    if (error instanceof ForbiddenError) {
      return new Response(
        JSON.stringify({
          error: "forbidden",
          message: error.message,
        } as APIErrorResponse),
        { status: 403, headers: { "Content-Type": "application/json" } }
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

    // eslint-disable-next-line no-console
    console.error("Unexpected error in POST /api/profiles/{profileId}/tasks/{sequenceId}/submit:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      userId: user?.id || "unauthenticated",
      profileId: params.profileId,
      sequenceId: params.sequenceId,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: "An unexpected error occurred",
        ...(import.meta.env.DEV && {
          details: error instanceof Error ? error.message : String(error),
        }),
      } as APIErrorResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
