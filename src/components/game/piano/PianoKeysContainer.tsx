/**
 * PianoKeysContainer Component
 *
 * Kontener layoutu dla klawiszy pianina, odpowiedzialny za prawidłowe
 * rozmieszczenie białych i czarnych klawiszy w dwóch rzędach,
 * imitując układ prawdziwego pianina.
 */

import type { PianoKeysContainerProps } from "./piano.types";

export function PianoKeysContainer({ children, className = "" }: PianoKeysContainerProps) {
  return (
    <div
      className={`
        relative w-full max-w-4xl mx-auto
        ${className}
      `
        .trim()
        .replace(/\s+/g, " ")}
    >
      {children}
    </div>
  );
}
