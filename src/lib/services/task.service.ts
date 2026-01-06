import type { SupabaseClient } from "../../db/supabase.client";
import type { CurrentPuzzleDTO } from "../../types";
import { calculateExpectedSlots } from "../../types";
import { NotFoundError } from "../errors/api-errors";

/**
 * TaskService
 *
 * Service layer for managing game tasks and puzzles.
 * Handles business logic for task generation, submission, and state management.
 */
export class TaskService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Gets the current active puzzle for a child profile.
   * This is used to resume game state after page refresh.
   *
   * @param profileId - The child profile UUID
   * @returns CurrentPuzzleDTO with active puzzle data
   * @throws NotFoundError if no active puzzle exists
   * @throws Error for other database errors
   */
  async getCurrentTask(profileId: string): Promise<CurrentPuzzleDTO> {
    // Query for the most recent incomplete task
    const { data, error } = await this.supabase
      .from("task_results")
      .select(
        `
        sequence_id,
        level_id,
        sequence:sequence!inner(
          sequence_beginning,
          sequence_end
        )
      `
      )
      .eq("child_id", profileId)
      .is("completed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new NotFoundError("No active puzzle found");
      }
      throw new Error(`Failed to fetch current task: ${error.message}`);
    }

    // Extract sequence data and calculate expected slots
    const sequenceData = data.sequence as unknown as {
      sequence_beginning: string;
      sequence_end: string;
    };

    return {
      sequenceId: data.sequence_id,
      levelId: data.level_id,
      sequenceBeginning: sequenceData.sequence_beginning,
      expectedSlots: calculateExpectedSlots(sequenceData.sequence_end),
    };
  }
}
