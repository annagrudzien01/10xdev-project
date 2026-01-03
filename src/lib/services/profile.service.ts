import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateChildProfileCommand, UpdateChildProfileCommand, ChildProfileDTO, PaginatedResponse, PaginationParams } from "../../types";
import { toChildProfileDTO } from "../../types";
import { ConflictError, NotFoundError } from "../errors/api-errors";

/**
 * ProfileService
 *
 * Service layer for managing child profiles.
 * Handles business logic including validation of profile limits and name uniqueness.
 */
export class ProfileService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Lists child profiles for a parent with pagination support.
   *
   * @param parentId - The authenticated parent's user ID
   * @param params - Pagination parameters (page, pageSize)
   * @returns PaginatedResponse<ChildProfileDTO>
   */
  async listChildProfiles(
    parentId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<ChildProfileDTO>> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = params.pageSize && params.pageSize > 0 ? params.pageSize : 20;

    const offset = (page - 1) * pageSize;
    const to = offset + pageSize - 1;

    // Step 1: Fetch paginated data
    const { data, error, count } = await this.supabase
      .from("child_profiles")
      .select("*", { count: "exact" })
      .eq("parent_id", parentId)
      .order("created_at", { ascending: true })
      .range(offset, to);

    if (error) {
      throw new Error(`Failed to fetch profiles: ${error.message}`);
    }

    // Transform entities to DTOs
    const dtoData = (data ?? []).map(toChildProfileDTO);

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

  /**
   * Creates a new child profile for a parent
   *
   * Business rules:
   * - Maximum 10 profiles per parent
   * - Profile names must be unique per parent
   * - New profiles start at level 1 with 0 total score
   *
   * @param parentId - The authenticated parent's user ID
   * @param command - Profile creation data (profileName, dateOfBirth)
   * @returns Created profile as ChildProfileDTO
   * @throws ConflictError if profile limit exceeded or duplicate name
   * @throws Error for other database errors
   */
  async createChildProfile(parentId: string, command: CreateChildProfileCommand): Promise<ChildProfileDTO> {
    // Step 1: Check profile count to enforce 10 profile limit
    const { count, error: countError } = await this.supabase
      .from("child_profiles")
      .select("*", { count: "exact", head: true })
      .eq("parent_id", parentId);

    if (countError) {
      throw new Error(`Failed to check profile count: ${countError.message}`);
    }

    if (count !== null && count >= 10) {
      throw new ConflictError("Parent already has 10 child profiles (maximum allowed)");
    }

    // Step 2: Insert new profile
    const { data, error } = await this.supabase
      .from("child_profiles")
      .insert({
        parent_id: parentId,
        profile_name: command.profileName,
        date_of_birth: command.dateOfBirth,
        current_level_id: 1,
        total_score: 0,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (duplicate profile name for this parent)
      if (error.code === "23505") {
        throw new ConflictError("A profile with this name already exists for this parent");
      }
      throw new Error(`Failed to create profile: ${error.message}`);
    }

    // Step 3: Transform database entity to DTO
    return toChildProfileDTO(data);
  }

  /**
   * Gets a single child profile by ID
   *
   * @param profileId - The profile UUID
   * @param parentId - The authenticated parent's user ID
   * @returns Profile as ChildProfileDTO
   * @throws NotFoundError if profile doesn't exist or doesn't belong to parent
   * @throws Error for other database errors
   */
  async getChildProfile(profileId: string, parentId: string): Promise<ChildProfileDTO> {
    const { data, error } = await this.supabase
      .from("child_profiles")
      .select("*")
      .eq("id", profileId)
      .eq("parent_id", parentId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new NotFoundError("Profile not found or access denied");
      }
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    return toChildProfileDTO(data);
  }

  /**
   * Updates a child profile
   *
   * Business rules:
   * - Can only update profileName and/or dateOfBirth
   * - Profile name must be unique per parent if changed
   * - Must verify parent ownership
   *
   * @param profileId - The profile UUID
   * @param parentId - The authenticated parent's user ID
   * @param command - Update data (profileName and/or dateOfBirth)
   * @returns Updated profile as ChildProfileDTO
   * @throws NotFoundError if profile doesn't exist or doesn't belong to parent
   * @throws ConflictError if new name duplicates another profile name
   * @throws Error for other database errors
   */
  async updateChildProfile(
    profileId: string,
    parentId: string,
    command: UpdateChildProfileCommand
  ): Promise<ChildProfileDTO> {
    // Step 1: Verify profile exists and belongs to parent
    const { data: existingProfile, error: fetchError } = await this.supabase
      .from("child_profiles")
      .select("id")
      .eq("id", profileId)
      .eq("parent_id", parentId)
      .single();

    if (fetchError || !existingProfile) {
      throw new NotFoundError("Profile not found or access denied");
    }

    // Step 2: Build update object with only provided fields
    const updateData: Record<string, string> = {};
    if (command.profileName !== undefined) {
      updateData.profile_name = command.profileName;
    }
    if (command.dateOfBirth !== undefined) {
      updateData.date_of_birth = command.dateOfBirth;
    }

    // Step 3: Update profile
    const { data, error } = await this.supabase
      .from("child_profiles")
      .update(updateData)
      .eq("id", profileId)
      .eq("parent_id", parentId)
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (duplicate profile name for this parent)
      if (error.code === "23505") {
        throw new ConflictError("A profile with this name already exists for this parent");
      }
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return toChildProfileDTO(data);
  }

  /**
   * Deletes a child profile
   *
   * Business rules:
   * - Cannot delete if profile has an active session
   * - Must verify parent ownership
   *
   * @param profileId - The profile UUID
   * @param parentId - The authenticated parent's user ID
   * @throws NotFoundError if profile doesn't exist or doesn't belong to parent
   * @throws ConflictError if profile has an active session
   * @throws Error for other database errors
   */
  async deleteChildProfile(profileId: string, parentId: string): Promise<void> {
    // Step 1: Verify profile exists and belongs to parent
    const { data: existingProfile, error: fetchError } = await this.supabase
      .from("child_profiles")
      .select("id")
      .eq("id", profileId)
      .eq("parent_id", parentId)
      .single();

    if (fetchError || !existingProfile) {
      throw new NotFoundError("Profile not found or access denied");
    }

    // Step 2: Check for active sessions
    const { data: activeSessions, error: sessionError } = await this.supabase
      .from("sessions")
      .select("id")
      .eq("child_id", profileId)
      .eq("is_active", true)
      .limit(1);

    if (sessionError) {
      throw new Error(`Failed to check active sessions: ${sessionError.message}`);
    }

    if (activeSessions && activeSessions.length > 0) {
      throw new ConflictError("Cannot delete profile with an active session");
    }

    // Step 3: Delete profile
    const { error } = await this.supabase
      .from("child_profiles")
      .delete()
      .eq("id", profileId)
      .eq("parent_id", parentId);

    if (error) {
      throw new Error(`Failed to delete profile: ${error.message}`);
    }
  }
}
