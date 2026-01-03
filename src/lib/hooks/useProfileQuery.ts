import { useQuery } from "@tanstack/react-query";
import type { ChildProfileDTO, APIErrorResponse } from "@/types";

interface ProfileError {
  status: number;
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * TanStack Query hook for fetching a single child profile by ID
 *
 * Handles GET /api/profiles/{id}
 * Cache key: ['profiles', id]
 */
export function useProfileQuery(profileId: string) {
  return useQuery<ChildProfileDTO, ProfileError>({
    queryKey: ["profiles", profileId],
    queryFn: async () => {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData: APIErrorResponse = await response.json();
        throw {
          status: response.status,
          error: errorData.error,
          message: errorData.message,
          details: errorData.details,
        } as ProfileError;
      }

      return response.json();
    },
    retry: (failureCount, error) => {
      // Don't retry on 404 Not Found
      if (error.status === 404) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
  });
}
