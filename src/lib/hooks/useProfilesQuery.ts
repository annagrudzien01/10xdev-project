import { useQuery } from "@tanstack/react-query";
import type { PaginatedResponse, ChildProfileDTO } from "@/types";

/**
 * Profile View Model - optimized for UI display
 */
export interface ProfileVM {
  id: string;
  profileName: string;
  age: number;
  level: number;
}

/**
 * Hook result interface
 */
export interface UseProfilesQueryResult {
  profiles: ProfileVM[];
  count: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * Calculate age from date of birth string
 */
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Map ChildProfileDTO to ProfileVM
 */
function mapToProfileVM(dto: ChildProfileDTO): ProfileVM {
  return {
    id: dto.id,
    profileName: dto.profileName,
    age: calculateAge(dto.dateOfBirth),
    level: dto.currentLevelId,
  };
}

/**
 * Fetch profiles from API
 */
async function fetchProfiles(): Promise<ProfileVM[]> {
  const response = await fetch("/api/profiles?page=1&pageSize=10", {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Redirect to login on unauthorized
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to fetch profiles: ${response.statusText}`);
  }

  const data: PaginatedResponse<ChildProfileDTO> = await response.json();
  return data.data.map(mapToProfileVM);
}

/**
 * Custom hook for fetching and managing child profiles
 */
export function useProfilesQuery(): UseProfilesQueryResult {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchProfiles,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  return {
    profiles: data ?? [],
    count: data?.length ?? 0,
    isLoading,
    isError,
    refetch,
  };
}
