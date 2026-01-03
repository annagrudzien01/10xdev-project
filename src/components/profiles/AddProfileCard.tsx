import { cn } from "@/lib/utils";
import { useCallback } from "react";

export interface AddProfileCardProps {
  disabled: boolean;
}

export default function AddProfileCard({ disabled }: AddProfileCardProps) {
  const handleClick = useCallback(() => {
    if (!disabled) {
      window.location.href = "/profiles/new";
    }
  }, [disabled]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "bg-card rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 flex flex-col items-center justify-center text-center min-h-[200px] transition-all",
        !disabled &&
          "hover:border-primary hover:bg-accent hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      role="listitem"
      aria-label={disabled ? "Osiągnięto limit 10 profili" : "Dodaj nowy profil"}
      title={disabled ? "Osiągnięto limit 10 profili" : "Dodaj nowy profil"}
    >
      {/* Plus Icon */}
      <div
        className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center text-5xl mb-4",
          !disabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        +
      </div>
      {/* Text */}
      <h3 className={cn("font-semibold text-lg", disabled ? "text-muted-foreground" : "text-foreground")}>
        Dodaj profil
      </h3>
      {disabled && <p className="text-xs text-muted-foreground mt-1">Limit profili osiągnięty</p>}
    </button>
  );
}
