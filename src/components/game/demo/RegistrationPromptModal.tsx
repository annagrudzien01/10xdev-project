/**
 * RegistrationPromptModal Component
 *
 * Modal zachęcający użytkownika do rejestracji w trybie demo.
 * Dwa warianty: "early" (po kilku zadaniach) i "final" (po ukończeniu poziomu 3).
 */

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface RegistrationPromptModalProps {
  /** Czy modal jest otwarty */
  isOpen: boolean;
  /** Wariant promptu */
  variant: "early" | "final";
  /** Handler zamknięcia (użytkownik wybiera "Kontynuuj demo") */
  onClose: () => void;
}

export function RegistrationPromptModal({ isOpen, variant, onClose }: RegistrationPromptModalProps) {
  const handleRegisterClick = () => {
    window.location.href = "/register";
  };

  const isEarly = variant === "early";
  const isFinal = variant === "final";

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent aria-describedby="prompt-description">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl">
            {isEarly && "Podobała Ci się gra? 🎹"}
            {isFinal && "Gratulacje! 🎉"}
          </AlertDialogTitle>
          <AlertDialogDescription id="prompt-description" className="text-base">
            {isEarly &&
              "Zarejestruj się, aby zapisać postępy i odblokować więcej poziomów! Gra bez limitu czasu i z dostępem do wszystkich 20 poziomów."}
            {isFinal &&
              "Ukończyłeś tryb demo! Zarejestruj się, aby kontynuować swoją przygodę muzyczną i odblokować poziomy 4-20 z jeszcze większymi wyzwaniami!"}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          {isEarly && (
            <AlertDialogCancel onClick={onClose} aria-label="Kontynuuj grę w trybie demo">
              Kontynuuj demo
            </AlertDialogCancel>
          )}

          <AlertDialogAction onClick={handleRegisterClick} aria-label="Przejdź do strony rejestracji">
            Zarejestruj się
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
