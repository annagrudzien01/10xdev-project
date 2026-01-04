/**
 * BlackKeysRow Component
 *
 * Kontener dla czarnych klawiszy pianina (C#, D#, F#, G#, A#),
 * z odpowiednimi spacerami imitującymi układ prawdziwego pianina
 * (brak czarnego klawisza między E-F i B-C).
 */

import { PianoKey } from "./PianoKey";
import type { BlackKeysRowProps, PianoKeyData } from "./piano.types";

export function BlackKeysRow({ keys, onKeyClick, highlightedKeys, disabled }: BlackKeysRowProps) {
  return (
    <div className="absolute top-0 left-0 right-0 flex flex-row justify-center pointer-events-none z-20">
      <div className="flex flex-row">
        {/* C# - nachodzi na C i D */}
        <div className="relative w-12 md:w-16 lg:w-20">
          <div className="absolute right-0 top-0 translate-x-1/2 pointer-events-auto z-20">
            <PianoKey
              note={keys[0].note}
              label={keys[0].label}
              color={keys[0].color}
              isHighlighted={highlightedKeys.includes(keys[0].note)}
              isDisabled={disabled}
              onClick={onKeyClick}
            />
          </div>
        </div>

        {/* D# - nachodzi na D i E */}
        <div className="relative w-12 md:w-16 lg:w-20">
          <div className="absolute right-0 top-0 translate-x-1/2 pointer-events-auto z-20">
            <PianoKey
              note={keys[1].note}
              label={keys[1].label}
              color={keys[1].color}
              isHighlighted={highlightedKeys.includes(keys[1].note)}
              isDisabled={disabled}
              onClick={onKeyClick}
            />
          </div>
        </div>

        {/* E - brak czarnego klawisza między E-F */}
        <div className="relative w-12 md:w-16 lg:w-20" />

        {/* F# - nachodzi na F i G */}
        <div className="relative w-12 md:w-16 lg:w-20">
          <div className="absolute right-0 top-0 translate-x-1/2 pointer-events-auto z-20">
            <PianoKey
              note={keys[2].note}
              label={keys[2].label}
              color={keys[2].color}
              isHighlighted={highlightedKeys.includes(keys[2].note)}
              isDisabled={disabled}
              onClick={onKeyClick}
            />
          </div>
        </div>

        {/* G# - nachodzi na G i A */}
        <div className="relative w-12 md:w-16 lg:w-20">
          <div className="absolute right-0 top-0 translate-x-1/2 pointer-events-auto z-20">
            <PianoKey
              note={keys[3].note}
              label={keys[3].label}
              color={keys[3].color}
              isHighlighted={highlightedKeys.includes(keys[3].note)}
              isDisabled={disabled}
              onClick={onKeyClick}
            />
          </div>
        </div>

        {/* A# - nachodzi na A i B */}
        <div className="relative w-12 md:w-16 lg:w-20">
          <div className="absolute right-0 top-0 translate-x-1/2 pointer-events-auto z-20">
            <PianoKey
              note={keys[4].note}
              label={keys[4].label}
              color={keys[4].color}
              isHighlighted={highlightedKeys.includes(keys[4].note)}
              isDisabled={disabled}
              onClick={onKeyClick}
            />
          </div>
        </div>

        {/* B - brak czarnego klawisza po B */}
        <div className="relative w-12 md:w-16 lg:w-20" />
      </div>
    </div>
  );
}
