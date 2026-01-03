import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
  const [apiError, setApiError] = useState<string>("");
  const [apiErrorField, setApiErrorField] = useState<"profileName" | "dateOfBirth" | undefined>(undefined);

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
    // Clear any previous errors
    setApiError("");
    setApiErrorField(undefined);

    try {
      await updateMutation.mutateAsync({
        profileId,
        data: {
          profileName: data.profileName,
          dateOfBirth: data.dateOfBirth,
        },
      });

      // Redirect to profiles list on success
      window.location.href = "/profiles";
    } catch (error) {
      // Error handling
      if (error && typeof error === "object" && "status" in error) {
        const err = error as { status: number; message: string; details?: Record<string, unknown> };

        if (err.status === 400) {
          setApiError(err.message || "Sprawdź poprawność wprowadzonych danych.");
        } else if (err.status === 409) {
          setApiError("Profil o tej nazwie już istnieje. Wybierz inną nazwę.");
          setApiErrorField("profileName");
        } else if (err.status === 404) {
          setApiError("Ten profil nie istnieje lub został usunięty.");
        } else if (err.status === 422 && err.details) {
          // Try to map validation errors to specific fields
          const details = err.details;
          if (details.profileName) {
            setApiError(String(details.profileName));
            setApiErrorField("profileName");
          } else if (details.dateOfBirth) {
            setApiError(String(details.dateOfBirth));
            setApiErrorField("dateOfBirth");
          } else {
            const errorMessages = Object.values(details).join(", ");
            setApiError(errorMessages);
          }
        } else {
          setApiError("Nie udało się zaktualizować profilu. Spróbuj ponownie później.");
        }
      } else {
        setApiError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.");
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
            apiError={apiError}
            apiErrorField={apiErrorField}
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
 * - Inline error messages using FormError component
 * - Protection against deleting profiles with active sessions
 */
export default function EditProfilePage({ profileId }: EditProfilePageProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <EditProfilePageContent profileId={profileId} />
    </QueryClientProvider>
  );
}
