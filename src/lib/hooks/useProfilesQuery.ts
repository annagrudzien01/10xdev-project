import { useQuery } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import type { ChildProfileDTO, PaginatedResponse } from "@/types";

export interface ProfileVM {
  id: string;
  displayName: string;
  age: number;
  level: number;
}

interface UseProfilesQueryResult {
  profiles: ProfileVM[];
  count: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

function calculateAge(dateString: string): number {
  const dob = new Date(dateString);
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff); // miliseconds from epoch
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function mapToVM(dto: ChildProfileDTO): ProfileVM {
  return {
    id: dto.id,
    displayName: dto.profileName,
    age: calculateAge(dto.dateOfBirth),
    level: dto.currentLevelId,
  };
}

export function useProfilesQuery(): UseProfilesQueryResult {
  const { data, isLoading, isError, refetch } = useQuery<{ profiles: ProfileVM[]; count: number }>({
    queryKey: ["profiles"],
    queryFn: async () => {
      const res = await fetch("/api/profiles?page=1&pageSize=10", {
        credentials: "include",
      });
      if (res.status === 401) {
        toast.error("Sesja wygasła. Zaloguj się ponownie");
        window.location.href = "/login";
        throw new Error("Unauthorized");
      }
      if (!res.ok) {
        toast.error("Wystąpił błąd serwera. Spróbuj ponownie później");
        throw new Error("Failed to fetch profiles");
      }
      const json = (await res.json()) as PaginatedResponse<ChildProfileDTO>;
      return {
        profiles: json.data.map(mapToVM),
        count: json.data.length,
      };
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  return {
    profiles: data?.profiles ?? [],
    count: data?.count ?? 0,
    isLoading,
    isError,
    refetch,
  };
}
