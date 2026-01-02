import { useState, type FormEvent } from "react";
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
}

export default function ForgotPasswordForm() {
  const [formState, setFormState] = useState<ForgotPasswordFormState>({
    email: "",
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

    // Submit form (placeholder - backend will be implemented later)
    setFormState({ ...formState, isSubmitting: true });

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/forgot-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: formState.email }),
      // });

      // Simulate success for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setFormState({
        ...formState,
        isSubmitting: false,
        successMessage: "Link do resetowania hasła został wysłany na podany adres e-mail. Sprawdź swoją skrzynkę.",
      });
    } catch (error) {
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

      <Button type="submit" disabled={formState.isSubmitting} className="w-full" size="lg">
        {formState.isSubmitting ? "Wysyłanie..." : "Wyślij link resetujący"}
      </Button>

      <div className="text-center text-sm">
        <a href="/login" className="font-medium text-primary hover:underline">
          Wróć do logowania
        </a>
      </div>
    </form>
  );
}
