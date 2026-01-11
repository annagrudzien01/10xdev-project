import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Komponent wyświetlany gdy rodzic nie ma jeszcze żadnych profili dzieci.
 * Zawiera przyjazną ilustrację, komunikat oraz przycisk CTA.
 */
export function EmptyDashboardState() {
  const handleAddProfile = () => {
    window.location.href = "/profiles";
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Ikona dekoracyjna */}
      <div className="mb-6 rounded-full bg-muted/50 p-8">
        <Users className="w-16 h-16 text-muted-foreground" aria-hidden="true" />
      </div>

      {/* Nagłówek */}
      <h2 className="text-2xl font-semibold mb-2">Brak profili</h2>

      {/* Opis */}
      <p className="text-muted-foreground mb-6 max-w-md">
        Dodaj pierwszy profil, aby zobaczyć postępy dziecka w grze Rytmik.
      </p>

      {/* Przycisk CTA */}
      <Button onClick={handleAddProfile} size="lg">
        Dodaj pierwszy profil
      </Button>
    </div>
  );
}
