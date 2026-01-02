import { Plus } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AddProfileCardProps {
  disabled: boolean;
}

export default function AddProfileCard({ disabled }: AddProfileCardProps) {
  const handleClick = () => {
    if (disabled) return;
    window.location.href = "/profiles/new";
  };

  const cardContent = (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "border border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        disabled && "cursor-not-allowed opacity-50"
      )}
      role="listitem"
      aria-disabled={disabled}
      aria-label={disabled ? "Limit profili osiągnięty" : "Dodaj profil"}
    >
      <Plus className="w-8 h-8" />
      <span className="mt-2 font-medium">Dodaj profil</span>
    </button>
  );

  return disabled ? <Tooltip content="Możesz utworzyć maksymalnie 10 profili">{cardContent}</Tooltip> : cardContent;
}

