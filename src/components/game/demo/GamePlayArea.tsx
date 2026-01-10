/**
 * GamePlayArea Component
 *
 * Thin wrapper komponujący Piano, AnswerSlots i GameControls.
 * Używany zarówno w normalnej grze jak i w trybie demo.
 */

import { memo } from "react";
import { Piano } from "@/components/game/piano/Piano";
import { AnswerSlots } from "@/components/game/AnswerSlots";
import { GameControls } from "@/components/game/GameControls";

interface GamePlayAreaProps {
  /** Sekwencja do zagrania (początek) */
  sequenceToPlay: string[];
  /** Auto-play sekwencji przy montowaniu */
  autoPlay?: boolean;
  /** Trigger do ponownego odtworzenia (zmiana wartości = play again) */
  playTrigger?: number;
  /** Całkowita liczba slotów */
  totalSlots: number;
  /** Wybrane nuty użytkownika */
  selectedNotes: string[];
  /** Czy można odtworzyć sekwencję */
  canPlaySequence: boolean;
  /** Czy można zatwierdzić odpowiedź */
  canSubmit: boolean;
  /** Czy można wyczyścić odpowiedź */
  canClear: boolean;
  /** Czy pianino jest zablokowane */
  disabled?: boolean;
  /** Czy gra jest w stanie ładowania */
  isLoading?: boolean;
  /** Handler kliknięcia klawisza */
  onKeyPress: (note: string) => void;
  /** Handler zakończenia odtwarzania sekwencji */
  onSequenceComplete?: () => void;
  /** Handler odtworzenia sekwencji ponownie */
  onPlaySequence: () => void;
  /** Handler wyczyszczenia odpowiedzi */
  onClear: () => void;
  /** Handler zatwierdzenia odpowiedzi */
  onSubmit: () => void;
  /** Tryb demo */
  demoMode?: boolean;
}

function GamePlayAreaComponent({
  sequenceToPlay,
  autoPlay = false,
  playTrigger = 0,
  totalSlots,
  selectedNotes,
  canPlaySequence,
  canSubmit,
  canClear,
  disabled = false,
  isLoading = false,
  onKeyPress,
  onSequenceComplete,
  onPlaySequence,
  onClear,
  onSubmit,
  demoMode = false,
}: GamePlayAreaProps) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto">
      {/* Answer Slots */}
      <div className="w-full flex justify-center">
        <AnswerSlots
          totalSlots={totalSlots}
          selectedNotes={selectedNotes}
          disabled={disabled || isLoading}
          onClear={canClear ? onClear : undefined}
        />
      </div>

      {/* Piano */}
      <div className="w-full" key={playTrigger}>
        <Piano
          onKeyPress={onKeyPress}
          disabled={disabled || isLoading}
          sequenceToPlay={sequenceToPlay}
          autoPlay={autoPlay}
          onSequenceComplete={onSequenceComplete}
        />
      </div>

      {/* Game Controls */}
      <div className="w-full flex justify-center">
        <GameControls
          canPlaySequence={canPlaySequence}
          canSubmit={canSubmit}
          onPlaySequence={onPlaySequence}
          onSubmit={onSubmit}
          isLoading={isLoading}
          demoMode={demoMode}
        />
      </div>
    </div>
  );
}

export const GamePlayArea = memo(GamePlayAreaComponent);
