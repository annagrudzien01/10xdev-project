import type { SupabaseClient } from "../../db/supabase.client";
import type { SessionDTO, SessionStartDTO, SessionRefreshDTO, PaginatedResponse, SessionListParams } from "../../types";
import { toSessionDTO, toSessionStartDTO, toSessionRefreshDTO } from "../../types";
import { NotFoundError, ForbiddenError, ValidationError } from "../errors/api-errors";

/**
 * SessionService
 *
 * Service layer for managing game sessions.
 * Handles business logic including:
 * - Automatic closing of previous active sessions (ended_at = now) when starting new one
 * - Automatic session duration: 10 minutes (ended_at = started_at + 10 min)
 * - Session refresh: extend by 2 minutes (ended_at = ended_at + 2 min)
 * - Dynamic status calculation: isActive = ended_at > now()
 * - Ownership verification for session operations
 */
export class SessionService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Starts a new game session for a child profile.
   *
   * Business logic:
   * - Automatically closes any previous active sessions (where ended_at > now())
   * - New session has 10-minute duration (ended_at = started_at + 10 min)
   * - Session can be extended using refreshSession() method
   *
   * @param profileId - The child profile UUID
   * @returns SessionStartDTO with new session data (including endedAt)
   * @throws Error if database operation fails
   */
  async startSession(profileId: string): Promise<SessionStartDTO> {
    // Step 1: Close any previous active sessions (ended_at > now())
    const now = new Date();
    await this.supabase
      .from("sessions")
      .update({ ended_at: now.toISOString() })
      .eq("child_id", profileId)
      .gt("ended_at", now.toISOString());

    // Step 2: Insert new session with 10-minute duration
    const startedAt = new Date();
    const endedAt = new Date(startedAt.getTime() + 10 * 60 * 1000); // +10 minutes

    const { data, error } = await this.supabase
      .from("sessions")
      .insert({
        child_id: profileId,
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to start session: ${error.message}`);
    }

    return toSessionStartDTO(data);
  }

  /**
   * Extends an active session by 2 minutes.
   *
   * Business logic:
   * - Only active sessions (ended_at > now) can be extended
   * - Each call adds exactly 2 minutes to ended_at
   * - Can be called multiple times
   *
   * @param sessionId - The session UUID to extend
   * @param parentId - The authenticated parent's user ID
   * @returns SessionRefreshDTO with updated endedAt
   * @throws NotFoundError if session doesn't exist
   * @throws ForbiddenError if session doesn't belong to parent
   * @throws ValidationError if session has expired
   * @throws Error for other database errors
   */
  async refreshSession(sessionId: string, parentId: string): Promise<SessionRefreshDTO> {
    // Step 1: Verify ownership and check if expired
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

    // Check if expired
    const endedAtDate = session.ended_at ? new Date(session.ended_at) : new Date(0);
    if (endedAtDate <= new Date()) {
      throw new ValidationError({ session: "Session has already expired" });
    }

    // Step 2: Extend session by 2 minutes
    const newEndedAt = new Date(endedAtDate.getTime() + 2 * 60 * 1000);

    const { data: updatedSession, error: updateError } = await this.supabase
      .from("sessions")
      .update({
        ended_at: newEndedAt.toISOString(),
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to refresh session: ${updateError.message}`);
    }

    return toSessionRefreshDTO(updatedSession);
  }

  /**
   * Verifies if a session exists and is currently active.
   *
   * @param sessionId - The session UUID to verify
   * @returns true if session exists and is active (ended_at > now), false otherwise
   */
  async verifySession(sessionId: string): Promise<boolean> {
    const { data, error } = await this.supabase.from("sessions").select("ended_at").eq("id", sessionId).single();

    if (error || !data || !data.ended_at) {
      return false;
    }

    // Session is active if ended_at is in the future
    return new Date(data.ended_at) > new Date();
  }

  /**
   * Ends an active game session.
   *
   * Business logic:
   * - Verifies session belongs to profile owned by parent
   * - Prevents ending already ended sessions (ended_at <= now)
   * - Sets ended_at to current timestamp
   *
   * @param sessionId - The session UUID to end
   * @param parentId - The authenticated parent's user ID
   * @throws NotFoundError if session doesn't exist
   * @throws ForbiddenError if session doesn't belong to parent
   * @throws ValidationError if session is already ended
   * @throws Error for other database errors
   */
  async endSession(sessionId: string, parentId: string): Promise<void> {
    // Step 1: Verify ownership and check if already expired
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

    // Check if already expired
    const endedAtDate = session.ended_at ? new Date(session.ended_at) : new Date(0);
    if (endedAtDate <= new Date()) {
      throw new ValidationError({ session: "Session is already ended" });
    }

    // Step 2: End the session immediately
    const { error: updateError } = await this.supabase
      .from("sessions")
      .update({
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
   * - Supports filtering by active status (ended_at > now)
   * - Applies pagination with configurable page size (max 100)
   * - Computes isActive dynamically for each session
   *
   * @param profileId - The child profile UUID
   * @param parentId - The authenticated parent's user ID
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
    if (params.active === true) {
      // Active: ended_at > now()
      query = query.gt("ended_at", new Date().toISOString());
    } else if (params.active === false) {
      // Inactive: ended_at <= now()
      query = query.lte("ended_at", new Date().toISOString());
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch sessions: ${error.message}`);
    }

    // Transform entities to DTOs (compute isActive dynamically)
    const dtoData = (data ?? []).map((session) => {
      const endedAtDate = session.ended_at ? new Date(session.ended_at) : new Date(0);
      return {
        ...toSessionDTO(session),
        isActive: endedAtDate > new Date(),
      };
    });

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
