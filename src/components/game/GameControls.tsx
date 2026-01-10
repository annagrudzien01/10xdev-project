/**
 * GameControls Component
 *
 * Control buttons for the game: Play Again, Submit
 */

import { memo } from "react";
import { Button } from "@/components/ui/button";

interface GameControlsProps {
  /** Whether the play button is disabled */
  canPlaySequence: boolean;
  /** Whether the submit button is disabled */
  canSubmit: boolean;
  /** Handler for playing the sequence again */
  onPlaySequence: () => void;
  /** Handler for submitting the answer */
  onSubmit: () => void;
  /** Whether the game is in a loading/processing state */
  isLoading?: boolean;
  /** Demo mode - can be used for UI adjustments */
  demoMode?: boolean;
}

function GameControlsComponent({
  canPlaySequence,
  canSubmit,
  onPlaySequence,
  onSubmit,
  isLoading = false,
  demoMode = false,
}: GameControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center w-full max-w-md">
      <Button
        onClick={onPlaySequence}
        disabled={!canPlaySequence || isLoading}
        variant="outline"
        className="w-full sm:w-auto"
        aria-label="Odtwórz melodię ponownie"
      >
        🔊 Odtwórz ponownie
      </Button>

      <Button
        onClick={onSubmit}
        disabled={!canSubmit || isLoading}
        className="w-full sm:w-auto"
        aria-label="Sprawdź odpowiedź"
      >
        {isLoading ? "Sprawdzanie..." : "✓ Sprawdź"}
      </Button>
    </div>
  );
}

// Memoize component for performance
export const GameControls = memo(GameControlsComponent);
