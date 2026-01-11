import { Trophy, Star, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardItemVM } from "@/lib/hooks/useDashboardQuery";

/**
 * Props dla komponentu DashboardCard
 */
interface DashboardCardProps {
  item: DashboardItemVM;
}

/**
 * Formatuje datę ISO do czytelnego formatu polskiego
 */
function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return "Data nieznana";
    }
    return new Intl.DateTimeFormat("pl-PL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "Data nieznana";
  }
}

/**
 * Formatuje score z separatorem tysięcy
 */
function formatScore(score: number): string {
  return new Intl.NumberFormat("pl-PL").format(score);
}

/**
 * Karta pojedynczego profilu wyświetlająca avatar, podstawowe informacje,
 * statystyki postępu oraz przycisk akcji.
 */
export function DashboardCard({ item }: DashboardCardProps) {
  const handleViewProfile = () => {
    window.location.href = `/game/play?profileId=${item.id}`;
  };

  const displayLastPlayed = item.lastPlayedAt ? formatDate(item.lastPlayedAt) : "Nigdy";

  // Pierwszy znak imienia dla avatara
  const avatarLetter = item.profileName.charAt(0).toUpperCase();

  return (
    <div className="bg-card border rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow" role="listitem">
      {/* Avatar i informacje podstawowe */}
      <div className="flex items-center gap-4 mb-4">
        {/* Avatar */}
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold">
          {avatarLetter}
        </div>

        {/* Imię */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold truncate">{item.profileName}</h3>
        </div>
      </div>

      {/* Statystyki */}
      <div className="space-y-3 mb-4">
        {/* Poziom */}
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-yellow-500" aria-hidden="true" />
          <span className="text-sm text-muted-foreground">Poziom:</span>
          <span className="font-semibold ml-auto">{item.level}</span>
        </div>

        {/* Punkty */}
        <div className="flex items-center gap-3">
          <Star className="w-5 h-5 text-amber-500" aria-hidden="true" />
          <span className="text-sm text-muted-foreground">Punkty:</span>
          <span className="font-semibold ml-auto">{formatScore(item.totalScore)}</span>
        </div>

        {/* Ostatnia gra */}
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-500" aria-hidden="true" />
          <span className="text-sm text-muted-foreground">Ostatnia gra:</span>
          <span className="font-semibold ml-auto text-xs">{displayLastPlayed}</span>
        </div>
      </div>

      {/* Przycisk akcji */}
      <Button onClick={handleViewProfile} className="w-full" variant="default">
        Zobacz profil
      </Button>
    </div>
  );
}
