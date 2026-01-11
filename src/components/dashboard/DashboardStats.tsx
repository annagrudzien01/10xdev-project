import { Users, TrendingUp } from "lucide-react";

/**
 * Props dla komponentu DashboardStats
 */
interface DashboardStatsProps {
  count: number;
  averageLevel: number;
}

/**
 * Komponent wyświetlający ogólne statystyki dla wszystkich profili.
 * Pokazuje liczbę profili oraz średni poziom.
 */
export function DashboardStats({ count, averageLevel }: DashboardStatsProps) {
  const displayAverageLevel = count === 0 ? "0.0" : averageLevel.toFixed(1);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      {/* Karta: Liczba profili */}
      <div className="bg-card border rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Users className="w-6 h-6 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Liczba profili</p>
            <p className="text-3xl font-bold">{count}</p>
          </div>
        </div>
      </div>

      {/* Karta: Średni poziom */}
      <div className="bg-card border rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary/10 p-3">
            <TrendingUp className="w-6 h-6 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Średni poziom</p>
            <p className="text-3xl font-bold">{displayAverageLevel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
