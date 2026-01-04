/**
 * Type definitions for Piano components
 */

/**
 * Dane opisujące pojedynczy klawisz pianina
 */
export interface PianoKeyData {
  /** Nuta w formacie Tone.js (np. "C4", "C#4") */
  note: string;

  /** Litera wyświetlana na klawiszu (np. "C", "C#") */
  label: string;

  /** Kolor klawisza */
  color: "white" | "black";
}

/**
 * Typ koloru klawisza
 */
export type PianoKeyColor = "white" | "black";

/**
 * Stan pojedynczego klawisza
 */
export type PianoKeyState = "default" | "highlighted" | "pressed" | "disabled";

/**
 * Propsy komponentu Piano
 */
export interface PianoProps {
  /** Callback wywoływany gdy użytkownik kliknie klawisz */
  onKeyPress: (note: string) => void;

  /** Tablica nut do podświetlenia (podczas playback) */
  highlightedKeys?: string[];

  /** Czy pianino jest wyłączone (podczas playback lub ładowania) */
  disabled?: boolean;

  /** Callback wywoływany po zakończeniu odtwarzania sekwencji */
  onSequenceComplete?: () => void;

  /** Sekwencja do automatycznego odtworzenia (jeśli podana) */
  sequenceToPlay?: string[];

  /** Czy automatycznie odtworzyć sekwencję po zamontowaniu */
  autoPlay?: boolean;
}

/**
 * Propsy komponentu PianoKey
 */
export interface PianoKeyProps {
  /** Nuta w formacie Tone.js (np. "C4", "C#4") */
  note: string;

  /** Litera wyświetlana na klawiszu (np. "C", "C#") */
  label: string;

  /** Kolor klawisza */
  color: "white" | "black";

  /** Czy klawisz jest podświetlony (podczas playback) */
  isHighlighted: boolean;

  /** Czy klawisz jest wyłączony */
  isDisabled: boolean;

  /** Callback wywoływany po kliknięciu */
  onClick: (note: string) => void;

  /** Callback do odtworzenia dźwięku */
  onPlaySound?: (note: string) => void;
}

/**
 * Propsy komponentu PianoKeysContainer
 */
export interface PianoKeysContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Propsy komponentu BlackKeysRow
 */
export interface BlackKeysRowProps {
  keys: PianoKeyData[];
  onKeyClick: (note: string) => void;
  highlightedKeys: string[];
  disabled: boolean;
}

/**
 * Propsy komponentu WhiteKeysRow
 */
export interface WhiteKeysRowProps {
  keys: PianoKeyData[];
  onKeyClick: (note: string) => void;
  highlightedKeys: string[];
  disabled: boolean;
}
