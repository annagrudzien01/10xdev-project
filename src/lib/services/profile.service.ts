import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateChildProfileCommand, ChildProfileDTO, PaginatedResponse, PaginationParams } from "../../types";
import { toChildProfileDTO } from "../../types";
import { ConflictError } from "../errors/api-errors";

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
}
