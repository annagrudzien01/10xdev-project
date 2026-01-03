import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import HeaderAuthenticated from "@/components/auth/HeaderAuthenticated";
import { ProfileFormComponent } from "./ProfileFormComponent";
import { useCreateProfileMutation } from "@/lib/hooks/useCreateProfileMutation";
import type { ProfileFormValues } from "@/lib/schemas/profile.schema";

// Create query client
const queryClient = new QueryClient();

/**
 * Helper function to calculate date boundaries for age restrictions
 */
function getDateBoundaries() {
  const today = new Date();

  // Max date: 3 years ago (minimum age)
  const maxDate = new Date(today);
  maxDate.setFullYear(today.getFullYear() - 3);

  // Min date: 18 years ago (maximum age)
  const minDate = new Date(today);
  minDate.setFullYear(today.getFullYear() - 18);

  return {
    min: minDate.toISOString().split("T")[0],
    max: maxDate.toISOString().split("T")[0],
  };
}

/**
 * ProfileForm Content Component - Internal component using the mutation hook
 */
function ProfileFormContent() {
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

  // Setup mutation
  const mutation = useCreateProfileMutation();

  // Handle form submission
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await mutation.mutateAsync({
        profileName: data.profileName,
        dateOfBirth: data.dateOfBirth,
      });

      // Success toast
      toast.success("Profil został utworzony", {
        description: `Profil ${data.profileName} został pomyślnie dodany.`,
      });

      // Redirect to profiles list
      setTimeout(() => {
        window.location.href = "/profiles";
      }, 1000);
    } catch (error) {
      // Error handling based on status code
      if (error && typeof error === "object" && "status" in error) {
        const err = error as { status: number; message: string; details?: Record<string, unknown> };

        if (err.status === 400) {
          toast.error("Nieprawidłowe dane", {
            description: err.message || "Sprawdź poprawność wprowadzonych danych.",
          });
        } else if (err.status === 409) {
          // Check if it's duplicate name or limit exceeded
          if (err.message.toLowerCase().includes("limit")) {
            toast.error("Osiągnięto limit profili", {
              description: "Możesz mieć maksymalnie 10 profili.",
            });
          } else {
            toast.error("Profil już istnieje", {
              description: "Profil o tej nazwie już istnieje. Wybierz inną nazwę.",
            });
          }
        } else if (err.status === 422 && err.details) {
          // Validation errors from server
          const errorMessages = Object.values(err.details).join("\n");
          toast.error("Błąd walidacji", {
            description: errorMessages,
          });
        } else {
          toast.error("Wystąpił błąd", {
            description: "Nie udało się utworzyć profilu. Spróbuj ponownie później.",
          });
        }
      } else {
        toast.error("Wystąpił nieoczekiwany błąd", {
          description: "Spróbuj ponownie później.",
        });
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
            onSaveSuccess={onSubmit}
            onCancel={handleCancel}
            isSubmitting={mutation.isPending}
          />
        </div>
      </main>
    </>
  );
}

/**
 * ProfileForm - Main component with QueryClientProvider
 *
 * Form for creating a new child profile with:
 * - Profile name validation (2-50 chars, letters/spaces/hyphens only)
 * - Date of birth with age restrictions (3-18 years)
 * - Client and server-side validation
 * - Toast notifications for success/error states
 * - Dirty state checking before cancel
 */
export default function ProfileForm() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProfileFormContent />
    </QueryClientProvider>
  );
}
