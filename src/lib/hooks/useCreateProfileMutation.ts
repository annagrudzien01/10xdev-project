import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateChildProfileCommand, ChildProfileDTO, APIErrorResponse } from "@/types";

interface CreateProfileError {
  status: number;
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * TanStack Query mutation hook for creating a new child profile
 *
 * Handles POST /api/profiles with validation and error mapping
 * Invalidates profiles query on success
 */
export function useCreateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation<ChildProfileDTO, CreateProfileError, CreateChildProfileCommand>({
    mutationFn: async (data: CreateChildProfileCommand) => {
      const response = await fetch("/api/profiles", {
        method: "POST",
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
        } as CreateProfileError;
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate profiles list to refetch with new profile
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
}
