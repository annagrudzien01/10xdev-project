/**
 * PianoKey Component
 *
 * Pojedynczy klawisz pianina. Reprezentuje jedną nutę, wyświetla jej literę,
 * obsługuje kliknięcia, podświetlenia i animacje.
 */

import { useState, memo } from "react";
import type { PianoKeyProps } from "./piano.types";
import { NOTE_HIGHLIGHT_COLORS } from "./piano.constants";

function PianoKeyComponent({ note, label, color, isHighlighted, isDisabled, onClick, onPlaySound }: PianoKeyProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleInteraction = () => {
    if (isDisabled) return;

    // Animacja wciśnięcia
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);

    // Odtwórz dźwięk jeśli callback jest dostępny
    onPlaySound?.(note);

    // Wywołaj callback rodzica
    onClick(note);
  };

  const handleMouseDown = () => {
    if (!isDisabled) {
      setIsPressed(true);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isDisabled) {
      e.preventDefault();
      handleInteraction();
    }
  };

  // Klasy bazowe dla białych klawiszy
  const whiteKeyClasses = `
    h-24 w-12 md:h-32 md:w-16 lg:h-40 lg:w-20
    bg-white border-2 border-gray-800
    rounded-b-lg
    shadow-md hover:shadow-lg
    flex flex-col items-center justify-end
    pb-2 md:pb-3
    transition-all duration-100 ease-in-out
    font-semibold text-xs md:text-sm
    text-gray-800
    relative z-10
  `;

  // Klasy bazowe dla czarnych klawiszy
  const blackKeyClasses = `
    h-16 w-8 md:h-20 md:w-12 lg:h-24 lg:w-14
    bg-gray-900 border-2 border-t-0 border-gray-950
    rounded-b-md
    shadow-lg
    flex flex-col items-center justify-end
    pb-1 md:pb-2
    transition-all duration-100 ease-in-out
    font-semibold text-xs
    text-white
    relative z-30
  `;

  // Pobierz kolor podświetlenia dla nuty
  const noteWithoutOctave = note.replace(/\d+$/, "");
  const highlightColorClasses =
    NOTE_HIGHLIGHT_COLORS[noteWithoutOctave] || "!bg-yellow-400 !border-yellow-600 shadow-lg shadow-yellow-400";

  // Klasy dla stanów
  const stateClasses = `
    ${isHighlighted ? `${highlightColorClasses} !opacity-100 scale-[0.98]` : ""}
    ${isPressed ? "scale-[0.98] brightness-90" : ""}
    ${isDisabled && !isHighlighted ? "opacity-50 cursor-not-allowed" : ""}
    ${!isDisabled ? "cursor-pointer hover:brightness-110 active:scale-[0.98] active:brightness-90" : "cursor-default"}
  `;

  const baseClasses = color === "white" ? whiteKeyClasses : blackKeyClasses;
  const combinedClasses = `${baseClasses} ${stateClasses}`.trim().replace(/\s+/g, " ");

  return (
    <button
      type="button"
      className={combinedClasses}
      onClick={handleInteraction}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleMouseUp}
      disabled={isDisabled}
      aria-label={`Klawisz ${label}`}
      aria-pressed={isHighlighted}
    >
      <span className="select-none pointer-events-none">{label}</span>
    </button>
  );
}

// Memoize component for performance
export const PianoKey = memo(PianoKeyComponent);
