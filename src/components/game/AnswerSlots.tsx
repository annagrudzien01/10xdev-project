/**
 * AnswerSlots Component
 *
 * Displays the slots for the user's answer with visual feedback.
 * Shows selected notes and remaining empty slots.
 */

import { useMemo, memo } from "react";

interface AnswerSlotsProps {
  /** Number of slots to display */
  totalSlots: number;
  /** Selected notes to display in slots */
  selectedNotes: string[];
  /** Whether the slots are disabled */
  disabled?: boolean;
}

/**
 * Maps note names to colors (matching piano key colors)
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
  B: "bg-pink-200 border-pink-400 text-pink-900",
};

function AnswerSlotsComponent({ totalSlots, selectedNotes, disabled = false }: AnswerSlotsProps) {
  // Create array of slots with notes or empty
  const slots = useMemo(() => {
    return Array.from({ length: totalSlots }, (_, index) => {
      return selectedNotes[index] || null;
    });
  }, [totalSlots, selectedNotes]);

  return (
    <div className="flex flex-row gap-2 md:gap-3 justify-center items-center" role="list" aria-label="Sloty odpowiedzi">
      {slots.map((note, index) => {
        const isEmpty = note === null;
        const colorClasses = note ? NOTE_COLORS[note] || "bg-gray-200 border-gray-400" : "bg-white border-gray-300";

        return (
          <div
            key={index}
            role="listitem"
            aria-label={isEmpty ? `Slot ${index + 1}: pusty` : `Slot ${index + 1}: nuta ${note}`}
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
            {note || <span className="text-gray-400 text-lg md:text-xl">•</span>}
          </div>
        );
      })}
    </div>
  );
}

// Memoize component for performance
export const AnswerSlots = memo(AnswerSlotsComponent);
