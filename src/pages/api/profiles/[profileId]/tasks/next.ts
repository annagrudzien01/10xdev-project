/**
 * POST /api/profiles/{profileId}/tasks/next
 *
 * Generates the next puzzle/task for the player.
 * This is a placeholder implementation - the actual logic should be implemented
 * according to the API plan.
 */

import type { APIRoute } from "astro";
import type { GeneratePuzzleDTO, APIErrorResponse } from "@/types";

export const POST: APIRoute = async ({ params, locals }) => {
  const { profileId } = params;

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

  if (!profileId) {
    const errorResponse: APIErrorResponse = {
      error: "invalid_request",
      message: "Brak ID profilu",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Verify profile belongs to user
    const { data: profile, error: profileError } = await supabase
      .from("child_profiles")
      .select("id, current_level_id, parent_id")
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

    // Get a random sequence for the current level
    const { data: sequences, error: sequencesError } = await supabase
      .from("sequence")
      .select("id, level_id, sequence_beginning, sequence_end")
      .eq("level_id", profile.current_level_id);

    if (sequencesError || !sequences || sequences.length === 0) {
      const errorResponse: APIErrorResponse = {
        error: "not_found",
        message: "Brak dostępnych sekwencji dla tego poziomu",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Select random sequence
    const randomSequence = sequences[Math.floor(Math.random() * sequences.length)];

    // Calculate expected slots from sequence_end
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
    console.error("Error generating puzzle:", error);

    const errorResponse: APIErrorResponse = {
      error: "internal_error",
      message: "Wystąpił błąd podczas generowania zagadki",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
