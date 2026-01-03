import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { FormError } from "@/components/ui/form-error";
import {
  createChildProfileSchema,
  updateChildProfileSchema,
  type ProfileFormValues,
} from "@/lib/schemas/profile.schema";

/**
 * Helper function to calculate date boundaries for age restrictions
 */
function getDateBoundaries(): { min: string; max: string } {
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

interface ProfileFormComponentProps {
  /** Form mode - create or edit */
  mode: "create" | "edit";
  /** Default values for form fields (used in edit mode) */
  defaultValues?: ProfileFormValues;
  /** Callback when form is successfully submitted */
  onSaveSuccess: (data: ProfileFormValues) => void;
  /** Callback when cancel button is clicked */
  onCancel: () => void;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
  /** External API error message to display */
  apiError?: string;
  /** Which field the API error relates to (if specific), or general if omitted */
  apiErrorField?: "profileName" | "dateOfBirth";
}

/**
 * ProfileFormComponent - Reusable form component for creating/editing profiles
 *
 * Can be used in two modes:
 * - "create": For creating new profiles (validation requires all fields)
 * - "edit": For editing existing profiles (validation allows partial updates)
 *
 * The component handles form validation, state management, and user interactions.
 * Business logic (API calls) is handled by the parent component with inline error display.
 */
export default function ProfileFormComponent({
  mode,
  defaultValues,
  onSaveSuccess,
  onCancel,
  isSubmitting = false,
  apiError,
  apiErrorField,
}: ProfileFormComponentProps) {
  const boundaries = getDateBoundaries();
  const minDate: string = boundaries.min;
  const maxDate: string = boundaries.max;

  // Select schema based on mode
  const schema = mode === "create" ? createChildProfileSchema : updateChildProfileSchema;

  // Setup form with react-hook-form and Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
  } = useForm<ProfileFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    mode: "onChange",
    defaultValues: defaultValues || {
      profileName: "",
      dateOfBirth: "",
    },
  });

  // Handle form submission
  const onSubmit = (data: ProfileFormValues) => {
    // Clear field-specific errors when submitting
    // (general errors are cleared by parent component)
    onSaveSuccess(data);
  };

  // Handle cancel with dirty check
  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm("Masz niezapisane zmiany. Czy na pewno chcesz anulować?");
      if (!confirmed) return;
    }
    onCancel();
  };

  const isFormDisabled = isSubmitting;
  const isSaveDisabled = mode === "create" ? !isValid || isSubmitting : !isDirty || isSubmitting;

  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* General API Error (not field-specific) */}
        {apiError && !apiErrorField && (
          <div className="rounded-lg bg-destructive/10 p-4">
            <FormError>{apiError}</FormError>
          </div>
        )}

        {/* Profile Name Field */}
        <div className="space-y-2">
          <Label htmlFor="profileName" required>
            Imię dziecka
          </Label>
          <Input
            id="profileName"
            type="text"
            placeholder="np. Anna"
            error={!!errors.profileName || apiErrorField === "profileName"}
            aria-invalid={!!errors.profileName || apiErrorField === "profileName"}
            aria-describedby={errors.profileName || apiErrorField === "profileName" ? "profileName-error" : undefined}
            disabled={isFormDisabled}
            {...register("profileName")}
          />
          {errors.profileName && <FormError id="profileName-error">{errors.profileName.message}</FormError>}
          {!errors.profileName && apiErrorField === "profileName" && apiError && (
            <FormError id="profileName-error">{apiError}</FormError>
          )}
          <p className="text-xs text-muted-foreground">
            Imię może zawierać tylko litery, spacje i myślniki (2-50 znaków)
          </p>
        </div>

        {/* Date of Birth Field */}
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth" required>
            Data urodzenia
          </Label>
          <DatePicker
            id="dateOfBirth"
            error={!!errors.dateOfBirth || apiErrorField === "dateOfBirth"}
            aria-invalid={!!errors.dateOfBirth || apiErrorField === "dateOfBirth"}
            aria-describedby={errors.dateOfBirth || apiErrorField === "dateOfBirth" ? "dateOfBirth-error" : undefined}
            disabled={isFormDisabled}
            {...register("dateOfBirth")}
            min={minDate}
            max={maxDate}
          />
          {errors.dateOfBirth && <FormError id="dateOfBirth-error">{errors.dateOfBirth.message}</FormError>}
          {!errors.dateOfBirth && apiErrorField === "dateOfBirth" && apiError && (
            <FormError id="dateOfBirth-error">{apiError}</FormError>
          )}
          <p className="text-xs text-muted-foreground">Dziecko musi mieć od 3 do 18 lat</p>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isFormDisabled} className="flex-1">
            Anuluj
          </Button>
          <Button type="submit" disabled={isSaveDisabled} className="flex-1">
            {isSubmitting ? "Zapisywanie..." : mode === "create" ? "Zapisz profil" : "Zapisz zmiany"}
          </Button>
        </div>
      </form>
    </div>
  );
}
