import { useQuery } from "@tanstack/react-query";
import type { DashboardItemDTO } from "@/types";

/**
 * Dashboard Item View Model - zoptymalizowany do wyświetlania w UI
 * Zawiera przetworzone dane z DashboardItemDTO
 */
export interface DashboardItemVM {
  id: string; // UUID profilu (profileId z DTO)
  profileName: string; // Imię dziecka
  level: number; // Aktualny poziom (currentLevel z DTO)
  totalScore: number; // Łączna liczba punktów
  lastPlayedAt: string | null; // Data ostatniej gry lub null
}

/**
 * Hook result interface
 */
export interface UseDashboardQueryResult {
  items: DashboardItemVM[]; // Tablica elementów dashboard
  count: number; // Liczba profili
  averageLevel: number; // Średni poziom ze wszystkich profili
  isLoading: boolean; // Czy trwa ładowanie
  isError: boolean; // Czy wystąpił błąd
  refetch: () => void; // Funkcja do ponownego pobrania danych
}

/**
 * Oblicza średni poziom z tablicy profili
 */
function calculateAverageLevel(items: DashboardItemDTO[]): number {
  if (items.length === 0) return 0;
  const sum = items.reduce((acc, item) => acc + item.currentLevel, 0);
  return Math.round((sum / items.length) * 10) / 10; // Zaokrąglenie do 1 miejsca po przecinku
}

/**
 * Mapuje DashboardItemDTO do DashboardItemVM
 */
function mapToDashboardItemVM(dto: DashboardItemDTO): DashboardItemVM {
  return {
    id: dto.profileId,
    profileName: dto.profileName,
    level: dto.currentLevel,
    totalScore: dto.totalScore,
    lastPlayedAt: dto.lastPlayedAt,
  };
}

/**
 * Pobiera dane dashboard z API
 */
async function fetchDashboard(): Promise<DashboardItemDTO[]> {
  const response = await fetch("/api/dashboard", {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Custom hook do pobierania i przetwarzania danych dashboard
 * Wykorzystuje TanStack Query do cache'owania i zarządzania stanem asynchronicznym
 */
export function useDashboardQuery(): UseDashboardQueryResult {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const items = data ? data.map(mapToDashboardItemVM) : [];
  const count = items.length;
  const averageLevel = data ? calculateAverageLevel(data) : 0;

  return {
    items,
    count,
    averageLevel,
    isLoading,
    isError,
    refetch,
  };
}
