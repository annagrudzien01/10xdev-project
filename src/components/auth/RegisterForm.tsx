import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

interface RegisterFormState {
  email: string;
  password: string;
  confirmPassword: string;
  isSubmitting: boolean;
  errors: {
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  };
  successMessage?: string;
}

export default function RegisterForm() {
  const [formState, setFormState] = useState<RegisterFormState>({
    email: "",
    password: "",
    confirmPassword: "",
    isSubmitting: false,
    errors: {},
  });

  const validateEmail = (email: string): string | null => {
    if (!email) return "E-mail jest wymagany";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Podaj prawidłowy adres e-mail";
    }
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return "Hasło musi mieć co najmniej 8 znaków";
    if (!/[A-Z]/.test(password)) return "Hasło musi zawierać co najmniej jedną wielką literę";
    if (!/[a-z]/.test(password)) return "Hasło musi zawierać co najmniej jedną małą literę";
    if (!/[0-9]/.test(password)) return "Hasło musi zawierać co najmniej jedną cyfrę";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Hasło musi zawierać co najmniej jeden znak specjalny (!@#$%^&*)";
    }
    return null;
  };

  const handleBlur = (field: "email" | "password" | "confirmPassword") => {
    const newErrors = { ...formState.errors };

    if (field === "email") {
      const emailError = validateEmail(formState.email);
      if (emailError) {
        newErrors.email = emailError;
      } else {
        delete newErrors.email;
      }
    } else if (field === "password") {
      const passwordError = validatePassword(formState.password);
      if (passwordError) {
        newErrors.password = passwordError;
      } else {
        delete newErrors.password;
      }
    } else if (field === "confirmPassword") {
      if (formState.password !== formState.confirmPassword) {
        newErrors.confirmPassword = "Hasła muszą być identyczne";
      } else {
        delete newErrors.confirmPassword;
      }
    }

    setFormState({ ...formState, errors: newErrors });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Reset messages
    const newErrors: RegisterFormState["errors"] = {};
    setFormState({ ...formState, errors: {}, successMessage: undefined });

    // Validate all fields
    const emailError = validateEmail(formState.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formState.password);
    if (passwordError) newErrors.password = passwordError;

    if (formState.password !== formState.confirmPassword) {
      newErrors.confirmPassword = "Hasła muszą być identyczne";
    }

    if (Object.keys(newErrors).length > 0) {
      setFormState({ ...formState, errors: newErrors });
      // Focus first error field
      const firstErrorField = Object.keys(newErrors)[0];
      document.getElementById(firstErrorField)?.focus();
      return;
    }

    // Submit form to backend
    setFormState({ ...formState, isSubmitting: true });

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formState.email, password: formState.password }),
      });

      if (response.ok) {
        // Registration successful
        setFormState({
          ...formState,
          isSubmitting: false,
          errors: {},
          successMessage: "Konto zostało utworzone! Za chwilę zostaniesz przekierowany do strony logowania.",
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        // Handle error responses
        const data = await response.json();

        if (response.status === 409) {
          // Conflict - user already exists
          // Show helpful message with link to password recovery
          setFormState({
            ...formState,
            isSubmitting: false,
            errors: {
              general: data.message || "Użytkownik z tym adresem e-mail już istnieje",
              email: "Ten adres e-mail jest już zarejestrowany",
            },
          });
        } else if (response.status === 400) {
          // Validation errors - map to form fields
          const fieldErrors: RegisterFormState["errors"] = {};

          if (data.details) {
            // Map backend validation errors to form fields
            if (data.details.email) {
              fieldErrors.email = data.details.email;
            }
            if (data.details.password) {
              fieldErrors.password = data.details.password;
            }
          }

          // If there are field-specific errors, show them
          // Otherwise show general message
          if (Object.keys(fieldErrors).length > 0) {
            setFormState({
              ...formState,
              isSubmitting: false,
              errors: fieldErrors,
            });
          } else {
            setFormState({
              ...formState,
              isSubmitting: false,
              errors: { general: data.message || "Błąd walidacji danych" },
            });
          }
        } else {
          // Other errors (500, etc.)
          setFormState({
            ...formState,
            isSubmitting: false,
            errors: { general: "Wystąpił błąd podczas rejestracji. Spróbuj ponownie później." },
          });
        }
      }
    } catch (error) {
      // Network error or other unexpected error
      setFormState({
        ...formState,
        isSubmitting: false,
        errors: { general: "Wystąpił błąd podczas rejestracji. Spróbuj ponownie później." },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formState.successMessage && <Alert variant="success">{formState.successMessage}</Alert>}
      {formState.errors.general && (
        <Alert variant="error">
          {formState.errors.general}
          {formState.errors.general.includes("już istnieje") && (
            <div className="mt-2 text-sm">
              <a href="/login" className="font-medium underline hover:no-underline">
                Przejdź do logowania
              </a>
              {" lub "}
              <a href="/forgot-password" className="font-medium underline hover:no-underline">
                odzyskaj hasło
              </a>
            </div>
          )}
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" required>
          Adres e-mail
        </Label>
        <Input
          id="email"
          type="email"
          value={formState.email}
          onChange={(e) => setFormState({ ...formState, email: e.target.value })}
          onBlur={() => handleBlur("email")}
          error={!!formState.errors.email}
          aria-invalid={!!formState.errors.email}
          aria-describedby={formState.errors.email ? "email-error" : undefined}
          disabled={formState.isSubmitting}
          placeholder="twoj@email.pl"
        />
        {formState.errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {formState.errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" required>
          Hasło
        </Label>
        <Input
          id="password"
          type="password"
          value={formState.password}
          onChange={(e) => setFormState({ ...formState, password: e.target.value })}
          onBlur={() => handleBlur("password")}
          error={!!formState.errors.password}
          aria-invalid={!!formState.errors.password}
          aria-describedby={formState.errors.password ? "password-error" : undefined}
          disabled={formState.isSubmitting}
          placeholder="Minimum 8 znaków"
        />
        {formState.errors.password && (
          <p id="password-error" className="text-sm text-destructive">
            {formState.errors.password}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Hasło musi zawierać: wielką literę, małą literę, cyfrę i znak specjalny
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" required>
          Powtórz hasło
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          value={formState.confirmPassword}
          onChange={(e) => setFormState({ ...formState, confirmPassword: e.target.value })}
          onBlur={() => handleBlur("confirmPassword")}
          error={!!formState.errors.confirmPassword}
          aria-invalid={!!formState.errors.confirmPassword}
          aria-describedby={formState.errors.confirmPassword ? "confirm-password-error" : undefined}
          disabled={formState.isSubmitting}
          placeholder="Powtórz hasło"
        />
        {formState.errors.confirmPassword && (
          <p id="confirm-password-error" className="text-sm text-destructive">
            {formState.errors.confirmPassword}
          </p>
        )}
      </div>

      <Button type="submit" disabled={formState.isSubmitting} className="w-full" size="lg">
        {formState.isSubmitting ? "Rejestrowanie..." : "Zarejestruj się"}
      </Button>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Masz już konto? </span>
        <a href="/login" className="font-medium text-primary hover:underline">
          Zaloguj się
        </a>
      </div>
    </form>
  );
}
