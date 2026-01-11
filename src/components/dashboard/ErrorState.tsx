import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Props dla komponentu ErrorState
 */
interface ErrorStateProps {
  onRetry: () => void;
}

/**
 * Komponent wyświetlany gdy wystąpi błąd podczas pobierania danych.
 * Pokazuje komunikat o błędzie i przycisk do ponownej próby.
 */
export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Ikona błędu */}
      <div className="mb-6 rounded-full bg-destructive/10 p-8">
        <AlertCircle className="w-16 h-16 text-destructive" aria-hidden="true" />
      </div>

      {/* Nagłówek */}
      <h2 className="text-2xl font-semibold mb-2">Wystąpił błąd</h2>

      {/* Opis */}
      <p className="text-muted-foreground mb-6 max-w-md">
        Nie udało się załadować danych. Sprawdź połączenie internetowe i spróbuj ponownie.
      </p>

      {/* Przycisk ponowienia */}
      <Button onClick={onRetry} variant="default">
        Spróbuj ponownie
      </Button>
    </div>
  );
}
