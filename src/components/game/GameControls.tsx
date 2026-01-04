/**
 * GameControls Component
 *
 * Control buttons for the game: Play Again, Clear, Submit
 */

import { memo } from "react";
import { Button } from "@/components/ui/button";

interface GameControlsProps {
  /** Whether the play button is disabled */
  canPlaySequence: boolean;
  /** Whether the clear button is disabled */
  canClear: boolean;
  /** Whether the submit button is disabled */
  canSubmit: boolean;
  /** Handler for playing the sequence again */
  onPlaySequence: () => void;
  /** Handler for clearing selected notes */
  onClear: () => void;
  /** Handler for submitting the answer */
  onSubmit: () => void;
  /** Whether the game is in a loading/processing state */
  isLoading?: boolean;
}

function GameControlsComponent({
  canPlaySequence,
  canClear,
  canSubmit,
  onPlaySequence,
  onClear,
  onSubmit,
  isLoading = false,
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
        onClick={onClear}
        disabled={!canClear || isLoading}
        variant="outline"
        className="w-full sm:w-auto"
        aria-label="Wyczyść odpowiedź"
      >
        🗑️ Wyczyść
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
