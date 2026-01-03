import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateChildProfileCommand, ChildProfileDTO, APIErrorResponse } from "@/types";

interface UpdateProfileError {
  status: number;
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

interface UpdateProfileParams {
  profileId: string;
  data: UpdateChildProfileCommand;
}

/**
 * TanStack Query mutation hook for updating an existing child profile
 *
 * Handles PATCH /api/profiles/{id}
 * Invalidates both profiles list and specific profile cache on success
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation<ChildProfileDTO, UpdateProfileError, UpdateProfileParams>({
    mutationFn: async ({ profileId, data }: UpdateProfileParams) => {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData: APIErrorResponse = await response.json();
        throw {
          status: response.status,
          error: errorData.error,
          message: errorData.message,
          details: errorData.details,
        } as UpdateProfileError;
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate specific profile query
      queryClient.invalidateQueries({ queryKey: ["profiles", variables.profileId] });
      // Invalidate profiles list to reflect updated data
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
}
