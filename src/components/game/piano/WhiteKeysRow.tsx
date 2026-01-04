/**
 * WhiteKeysRow Component
 *
 * Kontener dla białych klawiszy pianina (C, D, E, F, G, A, B),
 * rozmieszczonych równomiernie w jednym rzędzie.
 */

import { PianoKey } from "./PianoKey";
import type { WhiteKeysRowProps } from "./piano.types";

export function WhiteKeysRow({ keys, onKeyClick, highlightedKeys, disabled }: WhiteKeysRowProps) {
  return (
    <div className="flex flex-row gap-0 justify-center">
      {keys.map((key) => (
        <PianoKey
          key={key.note}
          note={key.note}
          label={key.label}
          color={key.color}
          isHighlighted={highlightedKeys.includes(key.note)}
          isDisabled={disabled}
          onClick={onKeyClick}
        />
      ))}
    </div>
  );
}
