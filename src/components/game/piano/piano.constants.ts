/**
 * Piano configuration constants
 */

import type { PianoKeyData } from "./piano.types";

/**
 * White keys configuration for one octave (C4-B4)
 */
export const WHITE_KEYS: PianoKeyData[] = [
  { note: "C4", label: "C", color: "white" },
  { note: "D4", label: "D", color: "white" },
  { note: "E4", label: "E", color: "white" },
  { note: "F4", label: "F", color: "white" },
  { note: "G4", label: "G", color: "white" },
  { note: "A4", label: "A", color: "white" },
  { note: "B4", label: "H", color: "white" },
];

/**
 * Black keys configuration for one octave (C#4-A#4)
 */
export const BLACK_KEYS: PianoKeyData[] = [
  { note: "C#4", label: "C#", color: "black" },
  { note: "D#4", label: "D#", color: "black" },
  { note: "F#4", label: "F#", color: "black" },
  { note: "G#4", label: "G#", color: "black" },
  { note: "A#4", label: "A#", color: "black" },
];

/**
 * Valid notes for validation (without octave)
 */
export const VALID_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/**
 * Default octave for piano keys
 */
export const DEFAULT_OCTAVE = 4;

/**
 * Interval between notes during sequence playback (in seconds)
 */
export const SEQUENCE_INTERVAL = 0.5;

/**
 * Duration of a single note during playback
 */
export const NOTE_DURATION = "8n";
