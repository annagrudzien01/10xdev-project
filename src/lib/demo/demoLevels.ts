/**
 * Demo Levels Configuration
 *
 * Statyczne dane dla trybu demo (poziomy 1-3).
 * Zawiera konfigurację poziomów oraz preset sekwencji do losowego wyboru.
 */

/**
 * Konfiguracja poziomu demo
 */
export interface DemoLevelConfig {
  /** ID poziomu (tylko 1 obecnie) */
  id: 1;
  /** Długość sekwencji */
  seqLength: number;
  /** Tempo w BPM */
  tempo: number;
  /** Czy używamy czarnych klawiszy */
  useBlackKeys: boolean;
  /** Opis poziomu */
  description: string;
}

/**
 * Struktura sekwencji demo
 */
export interface DemoSequence {
  /** Unikalne ID sekwencji */
  id: string;
  /** ID poziomu */
  levelId: 1 | 2 | 3;
  /** Początek sekwencji (grany dla użytkownika) */
  beginning: string;
  /** Koniec sekwencji (odpowiedź użytkownika) */
  end: string;
}

/**
 * Konfiguracja poziomów demo
 * UWAGA: Obecnie w bazie są tylko sekwencje dla poziomu 1
 * TODO: Dodać sekwencje dla poziomów 2 i 3
 */
export const DEMO_LEVELS: DemoLevelConfig[] = [
  {
    id: 1,
    seqLength: 4,
    tempo: 100,
    useBlackKeys: false,
    description: "Poziom 1: Podstawy - 4 nuty, tylko białe klawisze",
  },
  // Zakomentowane dopóki nie będzie sekwencji w DB
  // {
  //   id: 2,
  //   seqLength: 5,
  //   tempo: 110,
  //   useBlackKeys: false,
  //   description: "Poziom 2: Rozszerzenie - 5 nut, tylko białe klawisze",
  // },
  // {
  //   id: 3,
  //   seqLength: 6,
  //   tempo: 120,
  //   useBlackKeys: true,
  //   description: "Poziom 3: Wyzwanie - 6 nut, z czarnymi klawiszami",
  // },
];

/**
 * Preset sekwencji dla poziomu 1
 * Format: "początek-odpowiedź"
 * Długość: 2-2 (2 nuty grane, 2 do uzupełnienia)
 */
const LEVEL_1_SEQUENCES: DemoSequence[] = [
  { id: "demo-1-1", levelId: 1, beginning: "C4-E4", end: "G4-C4" },
  { id: "demo-1-2", levelId: 1, beginning: "D4-F4", end: "A4-D4" },
  { id: "demo-1-3", levelId: 1, beginning: "E4-G4", end: "C4-E4" },
  { id: "demo-1-4", levelId: 1, beginning: "F4-A4", end: "C4-F4" },
  { id: "demo-1-5", levelId: 1, beginning: "G4-C4", end: "E4-G4" },
  { id: "demo-1-6", levelId: 1, beginning: "A4-D4", end: "F4-A4" },
  { id: "demo-1-7", levelId: 1, beginning: "C4-G4", end: "E4-C4" },
  { id: "demo-1-8", levelId: 1, beginning: "D4-A4", end: "F4-D4" },
  { id: "demo-1-9", levelId: 1, beginning: "E4-C4", end: "G4-E4" },
  { id: "demo-1-10", levelId: 1, beginning: "F4-D4", end: "A4-F4" },
];

/**
 * Preset sekwencji dla poziomu 2
 * Format: 3-2 (3 nuty grane, 2 do uzupełnienia)
 */
const LEVEL_2_SEQUENCES: DemoSequence[] = [
  { id: "demo-2-1", levelId: 2, beginning: "C4-E4-G4", end: "C4-E4" },
  { id: "demo-2-2", levelId: 2, beginning: "D4-F4-A4", end: "D4-F4" },
  { id: "demo-2-3", levelId: 2, beginning: "E4-G4-C4", end: "E4-G4" },
  { id: "demo-2-4", levelId: 2, beginning: "F4-A4-C4", end: "F4-A4" },
  { id: "demo-2-5", levelId: 2, beginning: "G4-C4-E4", end: "G4-C4" },
  { id: "demo-2-6", levelId: 2, beginning: "A4-D4-F4", end: "A4-D4" },
  { id: "demo-2-7", levelId: 2, beginning: "C4-D4-E4", end: "F4-G4" },
  { id: "demo-2-8", levelId: 2, beginning: "D4-E4-F4", end: "G4-A4" },
  { id: "demo-2-9", levelId: 2, beginning: "E4-F4-G4", end: "A4-C4" },
  { id: "demo-2-10", levelId: 2, beginning: "F4-G4-A4", end: "C4-D4" },
];

/**
 * Preset sekwencji dla poziomu 3
 * Format: 3-3 (3 nuty grane, 3 do uzupełnienia)
 * Zawiera czarne klawisze
 */
const LEVEL_3_SEQUENCES: DemoSequence[] = [
  { id: "demo-3-1", levelId: 3, beginning: "C4-E4-G4", end: "C#4-F4-A4" },
  { id: "demo-3-2", levelId: 3, beginning: "D4-F#4-A4", end: "D#4-G4-C4" },
  { id: "demo-3-3", levelId: 3, beginning: "E4-G#4-C4", end: "F4-A4-C#4" },
  { id: "demo-3-4", levelId: 3, beginning: "F4-A4-C#4", end: "F#4-G4-D4" },
  { id: "demo-3-5", levelId: 3, beginning: "G4-C4-E4", end: "G#4-D4-F4" },
  { id: "demo-3-6", levelId: 3, beginning: "A4-C#4-F4", end: "A#4-D4-G4" },
  { id: "demo-3-7", levelId: 3, beginning: "C4-D#4-G4", end: "C#4-E4-A4" },
  { id: "demo-3-8", levelId: 3, beginning: "D4-F4-A#4", end: "D#4-G4-C4" },
  { id: "demo-3-9", levelId: 3, beginning: "E4-G4-C#4", end: "F4-A4-D4" },
  { id: "demo-3-10", levelId: 3, beginning: "F4-G#4-D4", end: "F#4-A4-E4" },
];

/**
 * Wszystkie sekwencje demo pogrupowane po poziomach
 */
export const DEMO_SEQUENCES_BY_LEVEL: Record<1 | 2 | 3, DemoSequence[]> = {
  1: LEVEL_1_SEQUENCES,
  2: LEVEL_2_SEQUENCES,
  3: LEVEL_3_SEQUENCES,
};

/**
 * Generuje losową sekwencję dla danego poziomu
 */
export function getRandomSequence(levelId: 1 | 2 | 3): DemoSequence {
  const sequences = DEMO_SEQUENCES_BY_LEVEL[levelId];
  const randomIndex = Math.floor(Math.random() * sequences.length);
  return sequences[randomIndex];
}

/**
 * Pobiera konfigurację poziomu (tylko poziom 1 obecnie)
 */
export function getLevelConfig(levelId: 1): DemoLevelConfig {
  return DEMO_LEVELS[0];
}

/**
 * Oblicza liczbę slotów na podstawie sekwencji końcowej
 */
export function calculateSlots(sequenceEnd: string): number {
  if (!sequenceEnd || sequenceEnd.trim() === "") {
    return 0;
  }
  return sequenceEnd.split("-").length;
}
