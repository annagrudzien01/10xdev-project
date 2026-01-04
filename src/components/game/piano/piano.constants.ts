/**
 * Piano configuration constants
 */

import type { PianoKeyData } from "./piano.types";

/**
 * White keys configuration for one octave (C4-B4) + C5
 */
export const WHITE_KEYS: PianoKeyData[] = [
  { note: "C4", label: "C", color: "white" },
  { note: "D4", label: "D", color: "white" },
  { note: "E4", label: "E", color: "white" },
  { note: "F4", label: "F", color: "white" },
  { note: "G4", label: "G", color: "white" },
  { note: "A4", label: "A", color: "white" },
  { note: "B4", label: "H", color: "white" }, // B4 w Tone.js = H w notacji europejskiej
  { note: "C5", label: "C", color: "white" }, // Wyższe C
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
export const NOTE_DURATION = "6n";

/**
 * Duration of key highlight animation (in milliseconds)
 */
export const HIGHLIGHT_DURATION = 250;

/**
 * Color mapping for note highlights during playback
 * Maps note names (without octave) to Tailwind color classes
 */
export const NOTE_HIGHLIGHT_COLORS: Record<string, string> = {
  C: "!bg-blue-400 !border-blue-600 shadow-lg shadow-blue-400 !text-white",
  "C#": "!bg-blue-600 !border-blue-800 shadow-lg shadow-blue-600 !text-white",
  D: "!bg-green-400 !border-green-600 shadow-lg shadow-green-400 !text-white",
  "D#": "!bg-green-600 !border-green-800 shadow-lg shadow-green-600 !text-white",
  E: "!bg-yellow-400 !border-yellow-600 shadow-lg shadow-yellow-400 !text-gray-900",
  F: "!bg-red-400 !border-red-600 shadow-lg shadow-red-400 !text-white",
  "F#": "!bg-red-600 !border-red-800 shadow-lg shadow-red-600 !text-white",
  G: "!bg-purple-400 !border-purple-600 shadow-lg shadow-purple-400 !text-white",
  "G#": "!bg-purple-600 !border-purple-800 shadow-lg shadow-purple-600 !text-white",
  A: "!bg-orange-400 !border-orange-600 shadow-lg shadow-orange-400 !text-white",
  "A#": "!bg-orange-600 !border-orange-800 shadow-lg shadow-orange-600 !text-white",
  B: "!bg-pink-400 !border-pink-600 shadow-lg shadow-pink-400 !text-white",
};
