import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import HeaderAuthenticated from "@/components/auth/HeaderAuthenticated";
import { ProfileFormComponent } from "./ProfileFormComponent";
import { useProfileQuery } from "@/lib/hooks/useProfileQuery";
import { useUpdateProfileMutation } from "@/lib/hooks/useUpdateProfileMutation";
import type { ProfileFormValues } from "@/lib/schemas/profile.schema";

// Create query client
const queryClient = new QueryClient();

interface EditProfilePageContentProps {
  /** Profile ID from URL parameter */
  profileId: string;
}

/**
 * EditProfilePageContent - Internal component with query hooks
 */
function EditProfilePageContent({ profileId }: EditProfilePageContentProps) {
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

  // Fetch profile data
  const { data: profile, isLoading, isError, error } = useProfileQuery(profileId);

  // Setup mutation
  const updateMutation = useUpdateProfileMutation();

  // Handle form save
  const handleSaveSuccess = async (data: ProfileFormValues) => {
    try {
      await updateMutation.mutateAsync({
        profileId,
        data: {
          profileName: data.profileName,
          dateOfBirth: data.dateOfBirth,
        },
      });

      toast.success("Profil zaktualizowany", {
        description: `Zmiany w profilu ${data.profileName} zostały zapisane.`,
      });

      // Redirect to profiles list after short delay
      setTimeout(() => {
        window.location.href = "/profiles";
      }, 1000);
    } catch (error) {
      // Error handling
      if (error && typeof error === "object" && "status" in error) {
        const err = error as { status: number; message: string; details?: Record<string, unknown> };

        if (err.status === 400) {
          toast.error("Nieprawidłowe dane", {
            description: err.message || "Sprawdź poprawność wprowadzonych danych.",
          });
        } else if (err.status === 409) {
          toast.error("Profil już istnieje", {
            description: "Profil o tej nazwie już istnieje. Wybierz inną nazwę.",
          });
        } else if (err.status === 404) {
          toast.error("Profil nie znaleziony", {
            description: "Ten profil nie istnieje lub został usunięty.",
          });
        } else if (err.status === 422 && err.details) {
          const errorMessages = Object.values(err.details).join("\n");
          toast.error("Błąd walidacji", {
            description: errorMessages,
          });
        } else {
          toast.error("Wystąpił błąd", {
            description: "Nie udało się zaktualizować profilu. Spróbuj ponownie później.",
          });
        }
      } else {
        toast.error("Wystąpił nieoczekiwany błąd", {
          description: "Spróbuj ponownie później.",
        });
      }
    }
  };

  // Handle cancel
  const handleCancel = () => {
    window.location.href = "/profiles";
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <HeaderAuthenticated userEmail={userEmail} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="h-9 bg-muted rounded w-64 mb-2 animate-pulse" />
              <div className="h-5 bg-muted rounded w-96 animate-pulse" />
            </div>
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="h-5 bg-muted rounded w-32 animate-pulse" />
                  <div className="h-10 bg-muted rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 bg-muted rounded w-32 animate-pulse" />
                  <div className="h-10 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Error state - 404
  if (isError && error?.status === 404) {
    return (
      <>
        <HeaderAuthenticated userEmail={userEmail} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card border rounded-lg p-6 shadow-sm text-center">
              <h2 className="text-xl font-semibold mb-2">Profil nie znaleziony</h2>
              <p className="text-muted-foreground mb-4">Ten profil nie istnieje lub został usunięty.</p>
              <a
                href="/profiles"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Powrót do listy profili
              </a>
            </div>
          </div>
        </main>
      </>
    );
  }

  // General error state
  if (isError) {
    return (
      <>
        <HeaderAuthenticated userEmail={userEmail} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card border rounded-lg p-6 shadow-sm text-center">
              <h2 className="text-xl font-semibold mb-2">Wystąpił błąd</h2>
              <p className="text-muted-foreground mb-4">Nie udało się załadować profilu. Spróbuj ponownie później.</p>
              <a
                href="/profiles"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Powrót do listy profili
              </a>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Success state - render form
  if (!profile) {
    return null;
  }

  return (
    <>
      <HeaderAuthenticated userEmail={userEmail} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Edytuj profil</h1>
            <p className="text-muted-foreground">Zaktualizuj dane profilu {profile.profileName}</p>
          </div>

          {/* Profile Form */}
          <ProfileFormComponent
            mode="edit"
            defaultValues={{
              profileName: profile.profileName,
              dateOfBirth: profile.dateOfBirth,
            }}
            onSaveSuccess={handleSaveSuccess}
            onCancel={handleCancel}
            isSubmitting={updateMutation.isPending}
          />
        </div>
      </main>
    </>
  );
}

interface EditProfilePageProps {
  /** Profile ID from URL parameter */
  profileId: string;
}

/**
 * EditProfilePage - Main component with QueryClientProvider
 *
 * Page for editing an existing child profile with:
 * - Profile name and date of birth editing
 * - Profile deletion with confirmation dialog
 * - Loading and error states
 * - Toast notifications for success/error states
 * - Protection against deleting profiles with active sessions
 */
export default function EditProfilePage({ profileId }: EditProfilePageProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <EditProfilePageContent profileId={profileId} />
    </QueryClientProvider>
  );
}
