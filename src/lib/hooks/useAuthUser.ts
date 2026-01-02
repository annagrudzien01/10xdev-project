import { useQuery } from "@tanstack/react-query";
import type { AuthUserDTO } from "@/types";

export function useAuthUser() {
  const { data } = useQuery<AuthUserDTO | null>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (res.status === 401) {
        // Not authenticated, redirect to login
        window.location.href = "/login";
        return null;
      }
      if (!res.ok) throw new Error("Failed to fetch user");
      return (await res.json()) as AuthUserDTO;
    },
    staleTime: 1000 * 60, // 1 minute
  });

  return data;
}

