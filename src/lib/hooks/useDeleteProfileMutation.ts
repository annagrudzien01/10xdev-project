import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { APIErrorResponse } from "@/types";

interface DeleteProfileError {
  status: number;
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

interface DeleteProfileResponse {
  message: string;
}

/**
 * TanStack Query mutation hook for deleting a child profile
 *
 * Handles DELETE /api/profiles/{id}
 * Invalidates profiles list cache on success
 */
export function useDeleteProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation<DeleteProfileResponse, DeleteProfileError, string>({
    mutationFn: async (profileId: string) => {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData: APIErrorResponse = await response.json();
        throw {
          status: response.status,
          error: errorData.error,
          message: errorData.message,
          details: errorData.details,
        } as DeleteProfileError;
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate profiles list to reflect deletion
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
}
