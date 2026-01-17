import { Button } from "@/components/ui/button";

/**
 * EmptyState - Displayed when user has no profiles yet
 *
 * Shows a friendly message encouraging the user to create their first
 * child profile with a call-to-action button.
 */
export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-6" data-testid="empty-state">
      {/* Illustration placeholder */}
      <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center">🎈</div>
      <h2 className="text-2xl font-bold">Brak profili</h2>
      <p className="text-muted-foreground">Utwórz pierwszy profil, aby rozpocząć zabawę</p>
      <Button onClick={() => (window.location.href = "/profiles/new")} data-testid="empty-state-add-profile-button">
        Dodaj profil
      </Button>
    </div>
  );
}
