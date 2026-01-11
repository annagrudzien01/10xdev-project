/**
 * DTO and Command Model Type Definitions
 *
 * This file contains all Data Transfer Objects (DTOs) and Command Models
 * used by the API endpoints. All types are derived from the database entities
 * defined in src/db/database.types.ts
 */

import type { Tables } from "./db/database.types";

// ============================================================================
// Database Entity Type Aliases
// ============================================================================

/**
 * Database entity types for internal use
 */
export type LevelEntity = Tables<"levels">;
export type SequenceEntity = Tables<"sequence">;
export type ChildProfileEntity = Tables<"child_profiles">;
export type SessionEntity = Tables<"sessions">;
export type TaskResultEntity = Tables<"task_results">;

// ============================================================================
// Level DTOs
// ============================================================================

/**
 * Level DTO - Response for GET /levels and GET /levels/{levelId}
 *
 * Represents a difficulty level in the game (1-20).
 * Derived from the `levels` table with camelCase field names.
 */
export interface LevelDTO {
  /** Level identifier (1-20) */
  id: number;
  /** Length of the melody sequence */
  seqLength: number;
  /** Tempo in BPM */
  tempo: number;
  /** Whether black piano keys are used at this level */
  useBlackKeys: boolean;
  /** Optional description of the level */
  description: string | null;
}

/**
 * Helper to transform LevelEntity to LevelDTO
 */
export function toLevelDTO(entity: LevelEntity): LevelDTO {
  return {
    id: entity.id,
    seqLength: entity.seq_length,
    tempo: entity.tempo,
    useBlackKeys: entity.use_black_keys,
    description: entity.description,
  };
}

// ============================================================================
// Child Profile DTOs and Commands
// ============================================================================

/**
 * Create Child Profile Command - Request for POST /profiles
 *
 * Command model for creating a new child profile.
 * Validates profileName with regex and dateOfBirth in the past.
 */
export interface CreateChildProfileCommand {
  /** Child's display name (regex: ^[A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż\- ]+$) */
  profileName: string;
  /** Child's date of birth (must be in the past, format: YYYY-MM-DD) */
  dateOfBirth: string;
}

/**
 * Update Child Profile Command - Request for PATCH /profiles/{profileId}
 *
 * Command model for updating an existing child profile.
 * All fields are optional for partial updates.
 */
export interface UpdateChildProfileCommand {
  /** Child's display name (regex: ^[A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż\- ]+$) */
  profileName?: string;
  /** Child's date of birth (must be in the past, format: YYYY-MM-DD) */
  dateOfBirth?: string;
}

/**
 * Child Profile DTO - Response for profile operations
 *
 * Full representation of a child profile.
 * Derived from `child_profiles` table with camelCase field names.
 */
export interface ChildProfileDTO {
  /** Unique profile identifier (UUID) */
  id: string;
  /** Parent user ID (references auth.users) */
  parentId: string;
  /** Child's display name */
  profileName: string;
  /** Child's date of birth (ISO date string) */
  dateOfBirth: string;
  /** Current difficulty level (1-20) */
  currentLevelId: number;
  /** Last time this profile played (ISO timestamp or null) */
  lastPlayedAt: string | null;
  /** Cumulative score across all completed tasks */
  totalScore: number;
  /** Profile creation timestamp (ISO timestamp) */
  createdAt: string;
  /** Last update timestamp (ISO timestamp or null) */
  updatedAt: string | null;
}

/**
 * Helper to transform ChildProfileEntity to ChildProfileDTO
 */
export function toChildProfileDTO(entity: ChildProfileEntity): ChildProfileDTO {
  return {
    id: entity.id,
    parentId: entity.parent_id,
    profileName: entity.profile_name,
    dateOfBirth: entity.date_of_birth,
    currentLevelId: entity.current_level_id,
    lastPlayedAt: entity.last_played_at,
    totalScore: entity.total_score,
    createdAt: entity.created_at,
    updatedAt: entity.updated_at,
  };
}

// ============================================================================
// Session DTOs
// ============================================================================

/**
 * Session Start Response DTO - Response for POST /profiles/{profileId}/sessions
 *
 * Minimal session information returned when starting a new session.
 * Derived from `sessions` table.
 */
export interface SessionStartDTO {
  /** Session identifier (UUID) */
  sessionId: string;
  /** Session start timestamp (ISO timestamp) */
  startedAt: string;
  /** Session end timestamp (ISO timestamp, started_at + 10 minutes) */
  endedAt: string;
  /** Whether this session is currently active */
  isActive: boolean;
}

/**
 * Session DTO - Full session representation
 *
 * Complete session data for GET /profiles/{profileId}/sessions.
 * Derived from `sessions` table with camelCase field names.
 * Session status is computed based on ended_at > current_time.
 */
export interface SessionDTO {
  /** Unique session identifier (UUID) */
  id: string;
  /** Child profile ID this session belongs to */
  childId: string;
  /** Whether this session is currently active (computed: ended_at > now) */
  isActive: boolean;
  /** Session start timestamp (ISO timestamp) */
  startedAt: string;
  /** Session end timestamp (ISO timestamp, always set) */
  endedAt: string;
  /** Session creation timestamp (ISO timestamp) */
  createdAt: string;
  /** Last update timestamp (ISO timestamp or null) */
  updatedAt: string | null;
}

/**
 * Session Refresh DTO - Response for extending session duration
 *
 * Returned by POST /sessions/{sessionId}/refresh.
 * Contains updated end time after extending session by 2 minutes.
 */
export interface SessionRefreshDTO {
  /** Session identifier (UUID) */
  sessionId: string;
  /** Updated session end timestamp (ISO timestamp, previous + 2 minutes) */
  endedAt: string;
  /** Confirmation message */
  message: string;
}

/**
 * Helper to transform SessionEntity to SessionDTO
 */
export function toSessionDTO(entity: SessionEntity): SessionDTO {
  return {
    id: entity.id,
    childId: entity.child_id,
    isActive: new Date(entity.ended_at) > new Date(),
    startedAt: entity.started_at,
    endedAt: entity.ended_at,
    createdAt: entity.created_at,
    updatedAt: entity.updated_at,
  };
}

/**
 * Helper to transform SessionEntity to SessionStartDTO
 */
export function toSessionStartDTO(entity: SessionEntity): SessionStartDTO {
  return {
    sessionId: entity.id,
    startedAt: entity.started_at,
    endedAt: entity.ended_at,
    isActive: new Date(entity.ended_at) > new Date(),
  };
}

/**
 * Helper to transform SessionEntity to SessionRefreshDTO
 */
export function toSessionRefreshDTO(entity: SessionEntity): SessionRefreshDTO {
  return {
    sessionId: entity.id,
    endedAt: entity.ended_at,
    message: "Session extended by 2 minutes",
  };
}

// ============================================================================
// Game Task DTOs and Commands
// ============================================================================

/**
 * Generate Puzzle Response DTO - Response for POST /profiles/{profileId}/tasks/next
 *
 * Represents a generated puzzle/task for the player to solve.
 * Derived from `sequence` table with additional calculated field.
 */
export interface GeneratePuzzleDTO {
  /** Sequence identifier (UUID) */
  sequenceId: string;
  /** Level this puzzle belongs to */
  levelId: number;
  /** The beginning part of the melody that is played to the user */
  sequenceBeginning: string;
  /** Number of notes the user needs to complete (calculated from sequence_end) */
  expectedSlots: number;
}

/**
 * Current Puzzle DTO - Response for GET /profiles/{profileId}/tasks/current
 *
 * Represents the currently active puzzle for a child profile.
 * Used to resume game state after page refresh.
 */
export interface CurrentPuzzleDTO {
  /** Sequence identifier (UUID) */
  sequenceId: string;
  /** Level this puzzle belongs to */
  levelId: number;
  /** The beginning part of the melody that is played to the user */
  sequenceBeginning: string;
  /** Number of notes the user needs to complete */
  expectedSlots: number;
  /** Number of attempts already used for this puzzle (0-3) */
  attemptsUsed: number;
}

/**
 * Helper to calculate expected slots from sequence_end
 */
export function calculateExpectedSlots(sequenceEnd: string): number {
  if (!sequenceEnd || sequenceEnd.trim() === "") {
    return 0;
  }
  return sequenceEnd.split("-").length;
}

/**
 * Helper to transform SequenceEntity to GeneratePuzzleDTO
 */
export function toGeneratePuzzleDTO(entity: SequenceEntity, expectedSlots: number): GeneratePuzzleDTO {
  return {
    sequenceId: entity.id,
    levelId: entity.level_id,
    sequenceBeginning: entity.sequence_beginning,
    expectedSlots,
  };
}

/**
 * Submit Answer Command - Request for POST /profiles/{profileId}/tasks/{sequenceId}/submit
 *
 * Command model for submitting a puzzle answer.
 */
export interface SubmitAnswerCommand {
  /** The user's answer as a string of notes (e.g., "C-E-G-G#") */
  answer: string;
}

/**
 * Submit Answer Response DTO - Response for POST /profiles/{profileId}/tasks/{sequenceId}/submit
 *
 * Result of submitting a puzzle answer.
 * Includes scoring information and level progression data.
 */
export interface SubmitAnswerResponseDTO {
  /** Score awarded for this attempt (0-10) */
  score: number;
  /** Number of attempts used so far (1-3) */
  attemptsUsed: number;
  /** Whether the current level was completed (5 successful tasks) */
  levelCompleted: boolean;
  /** The next level to play (same if not completed, incremented if completed, max 20) */
  nextLevel: number;
}

// ============================================================================
// Task Result DTOs
// ============================================================================

/**
 * Task Result DTO - Response for GET /profiles/{profileId}/tasks/history
 *
 * Represents a completed task/puzzle attempt.
 * Derived from `task_results` table with camelCase field names.
 */
export interface TaskResultDTO {
  /** Unique task result identifier (UUID) */
  id: string;
  /** Child profile ID who completed this task */
  childId: string;
  /** Level this task belonged to */
  levelId: number;
  /** Sequence/puzzle that was played */
  sequenceId: string;
  /** Number of attempts used to complete this task (1-3) */
  attemptsUsed: number;
  /** Score achieved (0-10) */
  score: number;
  /** When this task was completed (ISO timestamp) */
  completedAt: string;
  /** Task result creation timestamp (ISO timestamp) */
  createdAt: string;
  /** Last update timestamp (ISO timestamp or null) */
  updatedAt: string | null;
}

/**
 * Helper to transform TaskResultEntity to TaskResultDTO
 * Note: This should only be used for completed tasks where attempts_used, score, and completed_at are not null
 */
export function toTaskResultDTO(entity: TaskResultEntity): TaskResultDTO {
  // Guard against incomplete tasks - these fields should never be null for completed tasks
  if (entity.attempts_used === null || entity.score === null || entity.completed_at === null) {
    throw new Error("Cannot convert incomplete task result to TaskResultDTO");
  }

  return {
    id: entity.id,
    childId: entity.child_id,
    levelId: entity.level_id,
    sequenceId: entity.sequence_id,
    attemptsUsed: entity.attempts_used,
    score: entity.score,
    completedAt: entity.completed_at,
    createdAt: entity.created_at,
    updatedAt: entity.updated_at,
  };
}

// ============================================================================
// Dashboard DTOs
// ============================================================================

/**
 * Dashboard Item DTO - Response item for GET /dashboard
 *
 * Aggregated view of a child profile's progress.
 * Combines data from `child_profiles` and aggregated `task_results`.
 */
export interface DashboardItemDTO {
  /** Child profile identifier (UUID) */
  profileId: string;
  /** Child's display name */
  profileName: string;
  /** Current difficulty level (1-20) */
  currentLevel: number;
  /** Total cumulative score */
  totalScore: number;
  /** Last time this profile played (ISO timestamp or null) */
  lastPlayedAt: string | null;
}

/**
 * Helper to transform ChildProfileEntity to DashboardItemDTO
 */
export function toDashboardItemDTO(entity: ChildProfileEntity): DashboardItemDTO {
  return {
    profileId: entity.id,
    profileName: entity.profile_name,
    currentLevel: entity.current_level_id,
    totalScore: entity.total_score,
    lastPlayedAt: entity.last_played_at,
  };
}

// ============================================================================
// Authentication DTOs
// ============================================================================

/**
 * Auth User DTO - Response for GET /api/auth/me
 *
 * Minimal user information for authenticated requests.
 */
export interface AuthUserDTO {
  /** User ID from Supabase Auth */
  id: string;
  /** User email address */
  email: string;
}

/**
 * Login Response DTO - Response for POST /api/auth/login
 */
export interface LoginResponseDTO {
  /** Success message */
  message: string;
}

/**
 * Logout Response DTO - Response for POST /api/auth/logout
 */
export interface LogoutResponseDTO {
  /** Success message */
  message: string;
}

/**
 * Register Response DTO - Response for POST /api/auth/register
 */
export interface RegisterResponseDTO {
  /** Success message */
  message: string;
}

/**
 * Forgot Password Response DTO - Response for POST /api/auth/forgot-password
 */
export interface ForgotPasswordResponseDTO {
  /** Success message (always returned, even if email doesn't exist) */
  message: string;
}

/**
 * Reset Password Response DTO - Response for POST /api/auth/reset-password
 */
export interface ResetPasswordResponseDTO {
  /** Success message */
  message: string;
}

// ============================================================================
// Common API Response Types
// ============================================================================

/**
 * Paginated List Response wrapper
 *
 * Generic wrapper for paginated list endpoints.
 */
export interface PaginatedResponse<T> {
  /** Array of items for the current page */
  data: T[];
  /** Pagination metadata */
  pagination: {
    /** Current page number (1-indexed) */
    page: number;
    /** Number of items per page */
    pageSize: number;
    /** Total number of items across all pages */
    totalItems: number;
    /** Total number of pages */
    totalPages: number;
  };
}

/**
 * Standard API Error Response
 *
 * Error structure returned by all API endpoints.
 */
export interface APIErrorResponse {
  /** Error code (e.g., 'invalid_request', 'not_found') */
  error: string;
  /** Human-readable error message */
  message: string;
  /** Optional additional error details */
  details?: Record<string, unknown>;
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Common pagination query parameters
 */
export interface PaginationParams {
  /** Page number (default: 1) */
  page?: number;
  /** Items per page (default: 20, max: 100) */
  pageSize?: number;
}

/**
 * Common sorting query parameters
 */
export interface SortParams {
  /** Field to sort by */
  sort?: string;
  /** Sort direction (default: 'asc') */
  order?: "asc" | "desc";
}

/**
 * Query parameters for listing sessions
 */
export interface SessionListParams extends PaginationParams {
  /** Filter to show only active sessions */
  active?: boolean;
}

/**
 * Query parameters for task history
 */
export interface TaskHistoryParams extends PaginationParams, SortParams {
  /** Filter by level ID */
  levelId?: number;
  /** Filter by date range - start date (ISO date string) */
  startDate?: string;
  /** Filter by date range - end date (ISO date string) */
  endDate?: string;
}
