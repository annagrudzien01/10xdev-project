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

    // Submit form (placeholder - backend will be implemented later)
    setFormState({ ...formState, isSubmitting: true });

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: formState.email, password: formState.password }),
      // });

      // Simulate success for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setFormState({
        ...formState,
        isSubmitting: false,
        successMessage: "Konto zostało utworzone! Za chwilę zostaniesz przekierowany do strony logowania.",
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
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
