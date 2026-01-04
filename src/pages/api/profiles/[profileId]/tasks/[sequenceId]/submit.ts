/**
 * POST /api/profiles/{profileId}/tasks/{sequenceId}/submit
 *
 * Submits the player's answer for validation and scoring.
 * This is a placeholder implementation - the actual logic should be implemented
 * according to the API plan.
 */

import type { APIRoute } from "astro";
import type { SubmitAnswerCommand, SubmitAnswerResponseDTO, APIErrorResponse } from "@/types";

export const POST: APIRoute = async ({ params, request, locals }) => {
  const { profileId, sequenceId } = params;

  // Check if user is authenticated
  const supabase = locals.supabase;

  // Get user from supabase
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    const errorResponse: APIErrorResponse = {
      error: "unauthorized",
      message: "Musisz być zalogowany aby wykonać tę akcję",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!profileId || !sequenceId) {
    const errorResponse: APIErrorResponse = {
      error: "invalid_request",
      message: "Brak wymaganych parametrów",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Parse request body
    let body: SubmitAnswerCommand;
    try {
      body = await request.json();
    } catch {
      const errorResponse: APIErrorResponse = {
        error: "invalid_request",
        message: "Nieprawidłowy format żądania",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!body.answer || typeof body.answer !== "string") {
      const errorResponse: APIErrorResponse = {
        error: "invalid_request",
        message: "Brak odpowiedzi",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify profile belongs to user
    const { data: profile, error: profileError } = await supabase
      .from("child_profiles")
      .select("id, current_level_id, parent_id, total_score")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      const errorResponse: APIErrorResponse = {
        error: "not_found",
        message: "Profil nie znaleziony",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (profile.parent_id !== user.id) {
      const errorResponse: APIErrorResponse = {
        error: "forbidden",
        message: "Nie masz dostępu do tego profilu",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the sequence
    const { data: sequence, error: sequenceError } = await supabase
      .from("sequence")
      .select("id, level_id, sequence_beginning, sequence_end")
      .eq("id", sequenceId)
      .single();

    if (sequenceError || !sequence) {
      const errorResponse: APIErrorResponse = {
        error: "not_found",
        message: "Sekwencja nie znaleziona",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate answer (compare with sequence_end)
    const correctAnswer = sequence.sequence_end;
    const userAnswer = body.answer;
    const isCorrect = correctAnswer === userAnswer;

    // Calculate score (simplified - should use attempts from session)
    // For now: correct = 10 points, incorrect = 0 points
    const score = isCorrect ? 10 : 0;
    const attemptsUsed = 1; // TODO: Track attempts in session/state

    // Count completed tasks in current level
    const { count: completedCount } = await supabase
      .from("task_results")
      .select("*", { count: "exact", head: true })
      .eq("child_id", profileId)
      .eq("level_id", profile.current_level_id);

    const tasksCompletedInLevel = (completedCount || 0) + (isCorrect ? 1 : 0);
    const levelCompleted = tasksCompletedInLevel >= 5;
    const nextLevel = levelCompleted ? Math.min(profile.current_level_id + 1, 20) : profile.current_level_id;

    // Save task result if correct
    if (isCorrect) {
      await supabase.from("task_results").insert({
        child_id: profileId,
        level_id: profile.current_level_id,
        sequence_id: sequenceId,
        attempts_used: attemptsUsed,
        score,
        completed_at: new Date().toISOString(),
      });

      // Update profile score and level
      await supabase
        .from("child_profiles")
        .update({
          total_score: profile.total_score + score,
          current_level_id: nextLevel,
          last_played_at: new Date().toISOString(),
        })
        .eq("id", profileId);
    } else {
      // Still update last_played_at
      await supabase
        .from("child_profiles")
        .update({
          last_played_at: new Date().toISOString(),
        })
        .eq("id", profileId);
    }

    const response: SubmitAnswerResponseDTO = {
      score,
      attemptsUsed,
      levelCompleted,
      nextLevel,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error submitting answer:", error);

    const errorResponse: APIErrorResponse = {
      error: "internal_error",
      message: "Wystąpił błąd podczas sprawdzania odpowiedzi",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
