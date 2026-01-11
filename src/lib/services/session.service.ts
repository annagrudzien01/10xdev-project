import type { SupabaseClient } from "../../db/supabase.client";
import type { SessionDTO, SessionStartDTO, PaginatedResponse, SessionListParams } from "../../types";
import { toSessionDTO, toSessionStartDTO } from "../../types";
import { NotFoundError, ForbiddenError, ValidationError } from "../errors/api-errors";

/**
 * SessionService
 *
 * Service layer for managing game sessions.
 * Handles business logic including:
 * - Automatic deactivation of previous sessions when starting new one
 * - Validation that only one active session per child exists
 * - Ownership verification for session operations
 */
export class SessionService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Starts a new game session for a child profile.
   *
   * Business logic:
   * - Automatically deactivates any previous active session for this profile
   * - Only one active session per child is allowed (enforced by DB constraint)
   * - Trigger `deactivate_last_session()` handles automatic session closure
   *
   * @param profileId - The child profile UUID
   * @param parentId - The authenticated parent's user ID (for future use)
   * @returns SessionStartDTO with new session data
   * @throws Error if database operation fails
   */
  async startSession(profileId: string, parentId: string): Promise<SessionStartDTO> {
    // Insert new session (trigger automatically deactivates previous)
    const { data, error } = await this.supabase
      .from("sessions")
      .insert({
        child_id: profileId,
        is_active: true,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to start session: ${error.message}`);
    }

    return toSessionStartDTO(data);
  }

  /**
   * Ends an active game session.
   *
   * Business logic:
   * - Verifies session belongs to profile owned by parent
   * - Prevents ending already ended sessions
   * - Sets is_active to false and ended_at to current timestamp
   *
   * @param sessionId - The session UUID to end
   * @param parentId - The authenticated parent's user ID
   * @throws NotFoundError if session doesn't exist
   * @throws ForbiddenError if session doesn't belong to parent
   * @throws ValidationError if session is already ended
   * @throws Error for other database errors
   */
  async endSession(sessionId: string, parentId: string): Promise<void> {
    // Step 1: Verify ownership and check if already ended
    const { data: session, error: fetchError } = await this.supabase
      .from("sessions")
      .select(
        `
        id,
        ended_at,
        child_profiles!inner(parent_id)
      `
      )
      .eq("id", sessionId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        throw new NotFoundError("Session not found");
      }
      throw new Error(`Failed to fetch session: ${fetchError.message}`);
    }

    // Check ownership
    const profile = session.child_profiles as unknown as { parent_id: string };
    if (profile.parent_id !== parentId) {
      throw new ForbiddenError("Session does not belong to this parent");
    }

    // Check if already ended
    if (session.ended_at !== null) {
      throw new ValidationError({ session: "Session is already ended" });
    }

    // Step 2: End the session
    const { error: updateError } = await this.supabase
      .from("sessions")
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (updateError) {
      throw new Error(`Failed to end session: ${updateError.message}`);
    }
  }

  /**
   * Lists sessions for a child profile with optional filtering and pagination.
   *
   * Business logic:
   * - Returns sessions ordered by started_at (most recent first)
   * - Supports filtering by active status
   * - Applies pagination with configurable page size (max 100)
   *
   * @param profileId - The child profile UUID
   * @param parentId - The authenticated parent's user ID (for future use)
   * @param params - Query parameters (page, pageSize, active filter)
   * @returns PaginatedResponse<SessionDTO> with session list and pagination metadata
   * @throws Error if database operation fails
   */
  async listSessions(
    profileId: string,
    parentId: string,
    params: SessionListParams
  ): Promise<PaginatedResponse<SessionDTO>> {
    // Apply defaults and constraints
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? Math.min(params.pageSize, 100) : 20;
    const offset = (page - 1) * pageSize;
    const to = offset + pageSize - 1;

    // Build query with optional active filter
    let query = this.supabase
      .from("sessions")
      .select("*", { count: "exact" })
      .eq("child_id", profileId)
      .order("started_at", { ascending: false })
      .range(offset, to);

    // Apply active filter if provided
    if (params.active !== undefined) {
      query = query.eq("is_active", params.active);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch sessions: ${error.message}`);
    }

    // Transform entities to DTOs
    const dtoData = (data ?? []).map(toSessionDTO);

    const totalItems = count ?? dtoData.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      data: dtoData,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  }
}
