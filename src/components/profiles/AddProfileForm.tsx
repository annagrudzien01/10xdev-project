import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HeaderAuthenticated from "@/components/auth/HeaderAuthenticated";
import ProfileFormComponent from "./ProfileFormComponent";
import { useCreateProfileMutation } from "@/lib/hooks/useCreateProfileMutation";
import type { ProfileFormValues } from "@/lib/schemas/profile.schema";

// Create query client
const queryClient = new QueryClient();

/**
 * AddProfileFormContent - Internal component with query hooks
 *
 * Handles profile creation logic including:
 * - Fetching user email for header
 * - Form submission with inline error handling
 * - Redirect on success
 */
function AddProfileFormContent() {
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

  // Setup mutation
  const mutation = useCreateProfileMutation();

  // Handle form submission
  const handleSaveSuccess = async (data: ProfileFormValues) => {
    // Clear any previous errors
    setApiError("");
    setApiErrorField(undefined);

    try {
      await mutation.mutateAsync({
        profileName: data.profileName,
        dateOfBirth: data.dateOfBirth,
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
          // Check if it's duplicate name or limit exceeded
          if (err.message.toLowerCase().includes("limit")) {
            setApiError("Możesz mieć maksymalnie 10 profili.");
          } else {
            setApiError("Profil o tej nazwie już istnieje. Wybierz inną nazwę.");
            setApiErrorField("profileName");
          }
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
          setApiError("Nie udało się utworzyć profilu. Spróbuj ponownie później.");
        }
      } else {
        setApiError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.");
      }
    }
  };

  // Handle cancel with dirty check
  const handleCancel = () => {
    window.location.href = "/profiles";
  };

  return (
    <>
      <HeaderAuthenticated userEmail={userEmail} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Nowy profil dziecka</h1>
            <p className="text-muted-foreground">Dodaj profil dziecka, aby rozpocząć muzyczną przygodę</p>
          </div>

          {/* Form Card */}
          <ProfileFormComponent
            mode="create"
            onSaveSuccess={handleSaveSuccess}
            onCancel={handleCancel}
            isSubmitting={mutation.isPending}
            apiError={apiError}
            apiErrorField={apiErrorField}
          />
        </div>
      </main>
    </>
  );
}

/**
 * AddProfileForm - Main component with QueryClientProvider
 *
 * Form for creating a new child profile with:
 * - Profile name validation (2-50 chars, letters/spaces/hyphens only)
 * - Date of birth with age restrictions (3-18 years)
 * - Client and server-side validation
 * - Inline error messages using FormError component
 * - Dirty state checking before cancel
 */
export default function AddProfileForm() {
  return (
    <QueryClientProvider client={queryClient}>
      <AddProfileFormContent />
    </QueryClientProvider>
  );
}
