/**
 * Piano Component
 *
 * Główny kontener odpowiedzialny za zarządzanie stanem pianina,
 * koordynację odtwarzania dźwięków oraz komunikację z kontekstem gry.
 * Obsługuje logikę podświetlania klawiszy podczas odtwarzania sekwencji
 * oraz przekazuje kliknięcia do komponentu rodzica.
 */

import { useEffect, useState, useCallback } from "react";
import { usePianoSampler } from "../../../lib/usePianoSampler";
import { PianoKeysContainer } from "./PianoKeysContainer";
import { BlackKeysRow } from "./BlackKeysRow";
import { WhiteKeysRow } from "./WhiteKeysRow";
import { WHITE_KEYS, BLACK_KEYS, SEQUENCE_INTERVAL, NOTE_DURATION, HIGHLIGHT_DURATION } from "./piano.constants";
import type { PianoProps } from "./piano.types";

export function Piano({
  onKeyPress,
  highlightedKeys = [],
  disabled = false,
  onSequenceComplete,
  sequenceToPlay = [],
  autoPlay = false,
}: PianoProps) {
  const { playNote, isLoaded } = usePianoSampler();
  const [localHighlightedKeys, setLocalHighlightedKeys] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Połącz zewnętrzne i lokalne podświetlenia
  const allHighlightedKeys = [...highlightedKeys, ...localHighlightedKeys];

  /**
   * Odtwarza sekwencję nut z podświetleniem
   */
  const handlePlaySequence = useCallback(
    async (sequence: string[]) => {
      if (!isLoaded) {
        setError("Dźwięki nie są jeszcze załadowane");
        return;
      }

      try {
        setIsPlaying(true);
        setError(null);

        for (let i = 0; i < sequence.length; i++) {
          const note = sequence[i];

          // Podświetl klawisz
          setLocalHighlightedKeys([note]);

          // Odtwórz dźwięk
          playNote(note, NOTE_DURATION);

          // Zgaś podświetlenie po HIGHLIGHT_DURATION
          setTimeout(() => setLocalHighlightedKeys([]), HIGHLIGHT_DURATION);

          // Czekaj na następną nutę (dłużej niż trwa podświetlenie)
          if (i < sequence.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, SEQUENCE_INTERVAL * 1000));
          }
        }

        // Czekaj chwilę po ostatniej nucie
        await new Promise((resolve) => setTimeout(resolve, SEQUENCE_INTERVAL * 1000 * 0.5));
        setLocalHighlightedKeys([]);
        setIsPlaying(false);

        // Wywołaj callback zakończenia
        onSequenceComplete?.();
      } catch (err) {
        console.error("Error playing sequence:", err);
        setError("Wystąpił błąd podczas odtwarzania sekwencji");
        setIsPlaying(false);
        setLocalHighlightedKeys([]);
      }
    },
    [isLoaded, playNote, onSequenceComplete]
  );

  /**
   * Obsługuje kliknięcie klawisza
   */
  const handleKeyPress = useCallback(
    (note: string) => {
      if (disabled || isPlaying || !isLoaded) return;

      try {
        // Odtwórz dźwięk
        playNote(note, NOTE_DURATION);

        // Podświetl klawisz na chwilę
        setLocalHighlightedKeys([note]);
        setTimeout(() => setLocalHighlightedKeys([]), HIGHLIGHT_DURATION);

        // Wywołaj callback rodzica
        onKeyPress(note);
      } catch (err) {
        console.error("Error playing note:", err);
        setError("Problem z odtwarzaniem dźwięku");
      }
    },
    [disabled, isPlaying, isLoaded, playNote, onKeyPress]
  );

  /**
   * Auto-play przy montowaniu lub zmianie sekwencji
   */
  useEffect(() => {
    if (autoPlay && sequenceToPlay.length > 0 && isLoaded && !isPlaying) {
      handlePlaySequence(sequenceToPlay);
    }
  }, [autoPlay, sequenceToPlay.join(","), isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Oblicz czy pianino jest wyłączone
  const isPianoDisabled = disabled || !isLoaded || isPlaying;

  return (
    <div className="flex flex-col items-center gap-4 w-full p-2" role="region" aria-label="Pianino" aria-busy={isPlaying}>
      {/* Komunikat ładowania */}
      {!isLoaded && <div className="text-sm text-gray-600 animate-pulse">Ładowanie dźwięków...</div>}

      {/* Komunikat błędu */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2" role="alert">
          {error}
        </div>
      )}

      {/* Kontener pianina */}
      <PianoKeysContainer>
        <BlackKeysRow
          keys={BLACK_KEYS}
          onKeyClick={handleKeyPress}
          highlightedKeys={allHighlightedKeys}
          disabled={isPianoDisabled}
        />
        <WhiteKeysRow
          keys={WHITE_KEYS}
          onKeyClick={handleKeyPress}
          highlightedKeys={allHighlightedKeys}
          disabled={isPianoDisabled}
        />
      </PianoKeysContainer>
    </div>
  );
}
