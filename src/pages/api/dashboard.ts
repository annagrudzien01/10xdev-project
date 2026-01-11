/**
 * GET /api/dashboard
 *
 * Returns a summary of all child profiles for the authenticated parent.
 * Includes profile ID, name, current level, total score, and last played timestamp.
 *
 * @route GET /api/dashboard
 * @auth Required (JWT token)
 * @returns {DashboardItemDTO[]} 200 - Array of dashboard items
 * @returns {APIErrorResponse} 401 - Unauthorized (no/invalid token)
 * @returns {APIErrorResponse} 500 - Internal server error
 *
 * @example
 * // Success response:
 * [
 *   {
 *     "profileId": "550e8400-e29b-41d4-a716-446655440000",
 *     "profileName": "Anna",
 *     "currentLevel": 4,
 *     "totalScore": 320,
 *     "lastPlayedAt": "2025-12-31T09:50:00Z"
 *   }
 * ]
 */

import type { APIRoute } from "astro";
import type { DashboardItemDTO, APIErrorResponse } from "@/types";
import { ProfileService } from "@/lib/services/profile.service";
import { UnauthorizedError } from "@/lib/errors/api-errors";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
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

    // Step 2: Fetch child profiles through ProfileService
    const profileService = new ProfileService(supabase);
    const paginatedResult = await profileService.listChildProfiles(user.id, {
      page: 1,
      pageSize: 10, // Max 10 profiles per parent (enforced by database)
    });

    // Step 3: Transform ChildProfileDTO[] to DashboardItemDTO[]
    const dashboardData: DashboardItemDTO[] = paginatedResult.data.map((profile) => ({
      profileId: profile.id,
      profileName: profile.profileName,
      currentLevel: profile.currentLevelId,
      totalScore: profile.totalScore,
      lastPlayedAt: profile.lastPlayedAt,
    }));

    // Step 4: Return success response
    return new Response(JSON.stringify(dashboardData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 5: Handle errors with appropriate status codes

    // Handle authentication errors
    if (error instanceof UnauthorizedError) {
      return new Response(
        JSON.stringify({
          error: "unauthenticated",
          message: error.message,
        } as APIErrorResponse),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle unexpected errors (log without sensitive data per GDPR)
    console.error("Unexpected error in GET /api/dashboard:", {
      error: error instanceof Error ? error.message : "Unknown error",
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
