import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { validateEmail, validateLoginPassword } from "@/lib/validators/auth.validators";

interface LoginFormState {
  email: string;
  password: string;
  isSubmitting: boolean;
  errors: {
    email?: string;
    password?: string;
    general?: string;
  };
}

interface LoginFormProps {
  returnUrl?: string;
}

export default function LoginForm({ returnUrl = "/profiles" }: LoginFormProps) {
  const [formState, setFormState] = useState<LoginFormState>({
    email: "",
    password: "",
    isSubmitting: false,
    errors: {},
  });

  // Validation functions are now imported from auth.validators
  // This makes them reusable and easily testable

  const handleBlur = (field: "email" | "password") => {
    const newErrors = { ...formState.errors };

    if (field === "email") {
      const emailError = validateEmail(formState.email);
      if (emailError) {
        newErrors.email = emailError;
      } else {
        delete newErrors.email;
      }
    } else if (field === "password") {
      const passwordError = validateLoginPassword(formState.password);
      if (passwordError) {
        newErrors.password = passwordError;
      } else {
        delete newErrors.password;
      }
    }

    setFormState({ ...formState, errors: newErrors });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Reset messages
    const newErrors: LoginFormState["errors"] = {};
    setFormState({ ...formState, errors: {} });

    // Validate all fields
    const emailError = validateEmail(formState.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validateLoginPassword(formState.password);
    if (passwordError) newErrors.password = passwordError;

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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Important: sends cookies automatically
        body: JSON.stringify({ email: formState.email, password: formState.password }),
      });

      if (response.ok) {
        // Login successful - cookies are set by the server
        // Redirect to return URL or profiles page
        window.location.href = returnUrl;
      } else {
        // Handle error responses
        const data = await response.json();

        if (response.status === 401) {
          // Unauthorized - invalid credentials
          setFormState({
            ...formState,
            isSubmitting: false,
            errors: { general: data.message || "Nieprawidłowy adres e-mail lub hasło" },
          });
        } else if (response.status === 400) {
          // Validation errors
          if (data.details) {
            setFormState({
              ...formState,
              isSubmitting: false,
              errors: data.details,
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
            errors: { general: "Wystąpił błąd podczas logowania. Spróbuj ponownie później." },
          });
        }
      }
    } catch (error) {
      // Network error or other unexpected error
      setFormState({
        ...formState,
        isSubmitting: false,
        errors: { general: "Wystąpił błąd podczas logowania. Spróbuj ponownie później." },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formState.errors.general && <Alert variant="error">{formState.errors.general}</Alert>}

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
        <div className="flex items-center justify-between">
          <Label htmlFor="password" required>
            Hasło
          </Label>
          <a href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Zapomniałeś hasła?
          </a>
        </div>
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
          placeholder="Twoje hasło"
        />
        {formState.errors.password && (
          <p id="password-error" className="text-sm text-destructive">
            {formState.errors.password}
          </p>
        )}
      </div>

      <Button type="submit" disabled={formState.isSubmitting} className="w-full" size="lg">
        {formState.isSubmitting ? "Logowanie..." : "Zaloguj się"}
      </Button>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Nie masz jeszcze konta? </span>
        <a href="/register" className="font-medium text-primary hover:underline">
          Zarejestruj się
        </a>
      </div>
    </form>
  );
}
