import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HeaderAuthenticated from "@/components/auth/HeaderAuthenticated";
import ProfileCounter from "./ProfileCounter";
import EmptyState from "./EmptyState";
import ProfileCard from "./ProfileCard";
import AddProfileCard from "./AddProfileCard";
import SkeletonProfileCard from "./SkeletonProfileCard";
import { useProfilesQuery } from "@/lib/hooks/useProfilesQuery";

// Create a client
const queryClient = new QueryClient();

/**
 * Internal component that uses the query hook
 */
function ProfilesViewContent() {
  const { profiles, count, isLoading, isError } = useProfilesQuery();
  const [userEmail, setUserEmail] = useState<string>("");

  // Fetch user email for header
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

  const canAddProfile = count < 10;

  return (
    <>
      <HeaderAuthenticated userEmail={userEmail} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Profile Counter */}
          {!isLoading && count > 0 && (
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Wybierz profil</h1>
              <ProfileCounter count={count} />
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Wybierz profil</h1>
                <div className="h-6 w-24 bg-muted animate-pulse rounded" />
              </div>
              <ul
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                aria-label="Lista profili dzieci"
              >
                {Array.from({ length: 3 }).map((_, idx) => (
                  <li key={idx}>
                    <SkeletonProfileCard />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error State */}
          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="w-32 h-32 bg-destructive/10 rounded-full flex items-center justify-center text-5xl">
                ⚠️
              </div>
              <h2 className="text-2xl font-bold">Wystąpił błąd</h2>
              <p className="text-muted-foreground">Nie udało się załadować profili. Spróbuj ponownie później.</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && count === 0 && <EmptyState />}

          {/* Profiles List */}
          {!isLoading && !isError && count > 0 && (
            <ul
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              aria-label="Lista profili dzieci"
            >
              {profiles.map((profile) => (
                <li key={profile.id}>
                  <ProfileCard profile={profile} />
                </li>
              ))}
              {canAddProfile && (
                <li>
                  <AddProfileCard disabled={!canAddProfile} />
                </li>
              )}
            </ul>
          )}

          {/* Max Profiles Reached Message */}
          {!isLoading && !isError && count >= 10 && (
            <div className="text-center text-sm text-muted-foreground mt-4">
              Osiągnięto maksymalną liczbę profili (10)
            </div>
          )}
        </div>
      </main>
    </>
  );
}

/**
 * Main ProfilesView component with QueryClientProvider
 */
export default function ProfilesView() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProfilesViewContent />
    </QueryClientProvider>
  );
}
