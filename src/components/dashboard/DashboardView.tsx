import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import HeaderAuthenticated from "@/components/auth/HeaderAuthenticated";
import { useDashboardQuery } from "@/lib/hooks/useDashboardQuery";
import { DashboardCard } from "./DashboardCard";
import { DashboardStats } from "./DashboardStats";
import { SkeletonDashboardCard } from "./SkeletonDashboardCard";
import { EmptyDashboardState } from "./EmptyDashboardState";
import { ErrorState } from "./ErrorState";

// Utworzenie instancji QueryClient
const queryClient = new QueryClient();

/**
 * Wewnętrzny komponent zawierający całą logikę widoku Dashboard.
 * Pobiera dane z API, zarządza stanem i renderuje odpowiednie widoki.
 */
function DashboardViewContent() {
  const [userEmail, setUserEmail] = useState<string>("");
  const { items, count, averageLevel, isLoading, isError, refetch } = useDashboardQuery();

  // Pobieranie emaila użytkownika
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setUserEmail(data.email || "");
        }
      } catch {
        // Silently fail - header will show empty email
      }
    };
    fetchUserEmail();
  }, []);

  const handleBackToProfiles = () => {
    window.location.href = "/profiles";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <HeaderAuthenticated userEmail={userEmail} />

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Tytuł */}
        <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

        {/* Stan ładowania */}
        {isLoading && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="h-32 bg-muted animate-pulse rounded-lg" />
              <div className="h-32 bg-muted animate-pulse rounded-lg" />
            </div>
            <ul
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              aria-label="Lista profili dzieci"
            >
              <SkeletonDashboardCard />
              <SkeletonDashboardCard />
              <SkeletonDashboardCard />
            </ul>
          </div>
        )}

        {/* Stan błędu */}
        {isError && !isLoading && <ErrorState onRetry={refetch} />}

        {/* Stan pusty */}
        {!isLoading && !isError && count === 0 && <EmptyDashboardState />}

        {/* Stan sukcesu */}
        {!isLoading && !isError && count > 0 && (
          <>
            {/* Statystyki */}
            <DashboardStats count={count} averageLevel={averageLevel} />

            {/* Lista kart profili */}
            <ul
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              aria-label="Lista profili dzieci"
            >
              {items.map((item) => (
                <li key={item.id}>
                  <DashboardCard item={item} />
                </li>
              ))}
            </ul>
          </>
        )}
      </main>

      {/* Footer */}
      {!isLoading && !isError && (
        <footer className="container mx-auto px-4 py-8 max-w-7xl">
          <Button onClick={handleBackToProfiles} variant="outline" size="lg" className="w-full sm:w-auto">
            Wróć do profili
          </Button>
        </footer>
      )}
    </div>
  );
}

/**
 * Główny komponent widoku Dashboard.
 * Opakowuje logikę w QueryClientProvider.
 */
export default function DashboardView() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardViewContent />
    </QueryClientProvider>
  );
}
