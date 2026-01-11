/**
 * Komponent skeleton wyświetlany podczas ładowania danych.
 * Imituje strukturę DashboardCard z animowanymi placeholderami.
 */
export function SkeletonDashboardCard() {
  return (
    <div className="bg-card rounded-lg border shadow-sm p-6 animate-pulse" aria-hidden="true">
      {/* Skeleton avatara */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>

      {/* Skeleton statystyk */}
      <div className="space-y-3 mb-4">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-5/6" />
        <div className="h-3 bg-muted rounded w-4/6" />
      </div>

      {/* Skeleton przycisku */}
      <div className="h-10 bg-muted rounded w-full" />
    </div>
  );
}
