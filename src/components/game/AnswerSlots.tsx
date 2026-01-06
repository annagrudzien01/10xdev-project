/**
 * AnswerSlots Component
 *
 * Displays the slots for the user's answer with visual feedback.
 * Shows selected notes and remaining empty slots.
 * Includes a clear button to reset the answer.
 */

import { useMemo, memo } from "react";
import { Button } from "@/components/ui/button";

interface AnswerSlotsProps {
  /** Number of slots to display */
  totalSlots: number;
  /** Selected notes to display in slots */
  selectedNotes: string[];
  /** Whether the slots are disabled */
  disabled?: boolean;
  /** Handler for clearing selected notes */
  onClear?: () => void;
}

/**
 * Maps note names (from Tone.js) to display labels (Polish notation)
 */
const NOTE_TO_LABEL: Record<string, string> = {
  C: "C",
  "C#": "C#",
  D: "D",
  "D#": "D#",
  E: "E",
  F: "F",
  "F#": "F#",
  G: "G",
  "G#": "G#",
  A: "A",
  "A#": "A#",
  B: "H", // B w Tone.js = H w notacji polskiej
};

/**
 * Maps display labels to colors (matching piano key colors)
 */
const NOTE_COLORS: Record<string, string> = {
  C: "bg-blue-200 border-blue-400 text-blue-900",
  "C#": "bg-gray-700 border-gray-900 text-white",
  D: "bg-green-200 border-green-400 text-green-900",
  "D#": "bg-gray-700 border-gray-900 text-white",
  E: "bg-yellow-200 border-yellow-400 text-yellow-900",
  F: "bg-red-200 border-red-400 text-red-900",
  "F#": "bg-gray-700 border-gray-900 text-white",
  G: "bg-purple-200 border-purple-400 text-purple-900",
  "G#": "bg-gray-700 border-gray-900 text-white",
  A: "bg-orange-200 border-orange-400 text-orange-900",
  "A#": "bg-gray-700 border-gray-900 text-white",
  H: "bg-pink-200 border-pink-400 text-pink-900", // H = B w notacji europejskiej
};

function AnswerSlotsComponent({ totalSlots, selectedNotes, disabled = false, onClear }: AnswerSlotsProps) {
  // Create array of slots with notes or empty
  const slots = useMemo(() => {
    return Array.from({ length: totalSlots }, (_, index) => {
      return selectedNotes[index] || null;
    });
  }, [totalSlots, selectedNotes]);

  const hasSelectedNotes = selectedNotes.length > 0;
  const canClear = hasSelectedNotes && !disabled && onClear;

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
      <div
        className="flex flex-row gap-2 md:gap-3 justify-center items-center"
        role="list"
        aria-label="Sloty odpowiedzi"
      >
        {slots.map((note, index) => {
          const isEmpty = note === null;
          // Usuń oktawę (C4 -> C, B4 -> B)
          const noteWithoutOctave = note ? note.replace(/\d+$/, "") : null;
          // Konwertuj na label (B -> H)
          const displayLabel = noteWithoutOctave ? NOTE_TO_LABEL[noteWithoutOctave] || noteWithoutOctave : null;
          const colorClasses = displayLabel
            ? NOTE_COLORS[displayLabel] || "bg-gray-200 border-gray-400"
            : "bg-white border-gray-300";

          return (
            <div
              key={index}
              role="listitem"
              aria-label={isEmpty ? `Slot ${index + 1}: pusty` : `Slot ${index + 1}: nuta ${displayLabel}`}
              className={`
                w-12 h-12 md:w-16 md:h-16
                rounded-lg border-2
                flex items-center justify-center
                font-bold text-sm md:text-base
                transition-all duration-200
                ${colorClasses}
                ${isEmpty ? "border-dashed" : "border-solid shadow-md"}
                ${disabled ? "opacity-50" : ""}
              `}
            >
              {displayLabel || <span className="text-gray-400 text-lg md:text-xl">•</span>}
            </div>
          );
        })}
      </div>

      {/* Clear button next to slots */}
      {onClear && (
        <Button
          onClick={onClear}
          disabled={!canClear}
          variant="outline"
          size="sm"
          className="shrink-0"
          aria-label="Wyczyść odpowiedź"
        >
          🗑️ Wyczyść
        </Button>
      )}
    </div>
  );
}

// Memoize component for performance
export const AnswerSlots = memo(AnswerSlotsComponent);
