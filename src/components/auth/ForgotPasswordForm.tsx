import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

interface ForgotPasswordFormState {
  email: string;
  isSubmitting: boolean;
  errors: {
    email?: string;
    general?: string;
  };
  successMessage?: string;
  cooldownSeconds: number; // Countdown timer for resend cooldown
}

export default function ForgotPasswordForm() {
  const [formState, setFormState] = useState<ForgotPasswordFormState>({
    email: "",
    isSubmitting: false,
    errors: {},
    cooldownSeconds: 0,
  });

  // Cooldown timer effect (60 seconds after successful submission)
  useEffect(() => {
    if (formState.cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setFormState((prev) => ({ ...prev, cooldownSeconds: prev.cooldownSeconds - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formState.cooldownSeconds]);

  const validateEmail = (email: string): string | null => {
    if (!email) return "E-mail jest wymagany";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Podaj prawidłowy adres e-mail";
    }
    return null;
  };

  const handleBlur = () => {
    const newErrors = { ...formState.errors };
    const emailError = validateEmail(formState.email);

    if (emailError) {
      newErrors.email = emailError;
    } else {
      delete newErrors.email;
    }

    setFormState({ ...formState, errors: newErrors });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Reset messages
    const newErrors: ForgotPasswordFormState["errors"] = {};
    setFormState({ ...formState, errors: {}, successMessage: undefined });

    // Validate email
    const emailError = validateEmail(formState.email);
    if (emailError) {
      newErrors.email = emailError;
      setFormState({ ...formState, errors: newErrors });
      document.getElementById("email")?.focus();
      return;
    }

    // Submit form to backend
    setFormState({ ...formState, isSubmitting: true });

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formState.email }),
      });

      if (response.ok) {
        // Success - always returned (even if email doesn't exist)
        const data = await response.json();

        setFormState({
          ...formState,
          isSubmitting: false,
          errors: {},
          successMessage: data.message,
          cooldownSeconds: 60, // Start 60 second cooldown
        });
      } else if (response.status === 400) {
        // Validation errors
        const data = await response.json();

        if (data.details?.email) {
          setFormState({
            ...formState,
            isSubmitting: false,
            errors: { email: data.details.email },
          });
        } else {
          setFormState({
            ...formState,
            isSubmitting: false,
            errors: { general: data.message || "Błąd walidacji danych" },
          });
        }
      } else {
        // Other errors (500, rate limiting, etc.)
        setFormState({
          ...formState,
          isSubmitting: false,
          errors: {
            general: "Wystąpił błąd podczas wysyłania linku. Spróbuj ponownie później.",
          },
        });
      }
    } catch {
      // Network error or other unexpected error
      setFormState({
        ...formState,
        isSubmitting: false,
        errors: {
          general: "Wystąpił błąd podczas wysyłania linku. Spróbuj ponownie później.",
        },
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
          onBlur={handleBlur}
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
        <p className="text-xs text-muted-foreground">Wyślemy Ci link do resetowania hasła na podany adres e-mail</p>
      </div>

      <Button
        type="submit"
        disabled={formState.isSubmitting || formState.cooldownSeconds > 0}
        className="w-full"
        size="lg"
      >
        {formState.isSubmitting
          ? "Wysyłanie..."
          : formState.cooldownSeconds > 0
            ? `Wyślij ponownie (${formState.cooldownSeconds}s)`
            : "Wyślij link resetujący"}
      </Button>

      <div className="text-center text-sm">
        <a href="/login" className="font-medium text-primary hover:underline">
          Wróć do logowania
        </a>
      </div>
    </form>
  );
}
