/**
 * useDemoGame Hook
 *
 * Hook zarządzający stanem gry w trybie demo.
 * Używa lokalnego state (useReducer) bez integracji z backend dla postępów,
 * ale pobiera prawdziwe sekwencje z bazy danych.
 */

import { useReducer, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLevelConfig, calculateSlots } from "@/lib/demo/demoLevels";

/**
 * DTO dla sekwencji demo z API
 */
interface DemoSequenceDTO {
  id: string;
  levelId: number;
  sequenceBeginning: string;
  sequenceEnd: string;
}

/**
 * Typy dla stanu gry demo
 */
export interface DemoGameState {
  /** Aktualny poziom (tylko 1 w demo - TODO: dodać 2-3 gdy będą sekwencje) */
  level: 1;
  /** Liczba ukończonych zadań w sesji */
  taskCount: number;
  /** Liczba ukończonych zadań w aktualnym poziomie */
  completedTasksInLevel: number;
  /** Wynik */
  score: number;
  /** Aktualne zadanie */
  currentTask: DemoTask | null;
  /** Wybrane nuty (odpowiedź użytkownika) */
  selectedNotes: string[];
  /** Liczba prób dla aktualnego zadania (1-3) */
  attemptsLeft: number;
  /** Czy pokazać prompt rejestracyjny */
  showPrompt: boolean;
  /** Wariant promptu */
  promptVariant: "early" | "final";
  /** Czy prompt był już zamknięty (nie pokazuj więcej w sesji) */
  promptDismissed: boolean;
  /** Czy gra się kończy (pokazać modal końcowy) */
  isGameEnding: boolean;
  /** Feedback po sprawdzeniu odpowiedzi */
  feedback: {
    show: boolean;
    isCorrect: boolean;
    score: number;
  } | null;
}

/**
 * Struktura zadania demo
 */
export interface DemoTask {
  /** UUID zadania */
  id: string;
  /** Poziom zadania (tylko 1 obecnie) */
  levelId: 1;
  /** Początek sekwencji (nuty do zagrania) */
  beginning: string;
  /** Liczba slotów do wypełnienia */
  expectedSlots: number;
  /** Poprawna odpowiedź (do walidacji) */
  correctAnswer: string;
}

/**
 * Akcje reducera
 */
type DemoGameAction =
  | { type: "START_TASK"; task: DemoTask }
  | { type: "ADD_NOTE"; note: string }
  | { type: "CLEAR_NOTES" }
  | { type: "SUBMIT_ANSWER"; isCorrect: boolean; score: number }
  | { type: "HIDE_FEEDBACK" }
  | { type: "NEXT_TASK" }
  | { type: "LEVEL_UP" }
  | { type: "SHOW_PROMPT"; variant: "early" | "final" }
  | { type: "CLOSE_PROMPT" }
  | { type: "DISMISS_PROMPT" }
  | { type: "END_GAME" };

/**
 * Stan początkowy
 */
const initialState: DemoGameState = {
  level: 1,
  taskCount: 0,
  completedTasksInLevel: 0,
  score: 0,
  currentTask: null,
  selectedNotes: [],
  attemptsLeft: 3,
  showPrompt: false,
  promptVariant: "early",
  promptDismissed: false,
  isGameEnding: false,
  feedback: null,
};

/**
 * Reducer stanu gry
 */
function demoGameReducer(state: DemoGameState, action: DemoGameAction): DemoGameState {
  switch (action.type) {
    case "START_TASK":
      return {
        ...state,
        currentTask: action.task,
        selectedNotes: [],
        attemptsLeft: 3,
      };

    case "ADD_NOTE":
      // Nie dodawaj jeśli sloty są pełne
      if (!state.currentTask || state.selectedNotes.length >= state.currentTask.expectedSlots) {
        return state;
      }
      return {
        ...state,
        selectedNotes: [...state.selectedNotes, action.note],
      };

    case "CLEAR_NOTES":
      return {
        ...state,
        selectedNotes: [],
      };

    case "SUBMIT_ANSWER": {
      const newTaskCount = action.isCorrect ? state.taskCount + 1 : state.taskCount;
      const newCompletedInLevel = action.isCorrect ? state.completedTasksInLevel + 1 : state.completedTasksInLevel;
      const newAttemptsLeft = action.isCorrect ? 3 : state.attemptsLeft - 1;

      return {
        ...state,
        score: state.score + action.score,
        taskCount: newTaskCount,
        completedTasksInLevel: newCompletedInLevel,
        attemptsLeft: newAttemptsLeft,
        // Wyczyść nuty jeśli poprawnie
        selectedNotes: action.isCorrect ? [] : state.selectedNotes,
        // Pokaż feedback
        feedback: {
          show: true,
          isCorrect: action.isCorrect,
          score: action.score,
        },
      };
    }

    case "HIDE_FEEDBACK":
      return {
        ...state,
        feedback: null,
      };

    case "NEXT_TASK":
      return {
        ...state,
        selectedNotes: [],
        attemptsLeft: 3,
        feedback: null,
      };

    case "LEVEL_UP":
      // Demo: tylko poziom 1 (dopóki nie będzie więcej sekwencji w DB)
      // const nextLevel = Math.min(state.level + 1, 3) as 1 | 2 | 3;
      return {
        ...state,
        // level: nextLevel, // Zakomentowane - zostajemy na poziomie 1
        completedTasksInLevel: 0,
        // Po "awansie" na poziomie 1, pokaż prompt końcowy
        isGameEnding: true,
        showPrompt: true,
        promptVariant: "final",
      };

    case "SHOW_PROMPT":
      return {
        ...state,
        showPrompt: true,
        promptVariant: action.variant,
      };

    case "CLOSE_PROMPT":
      return {
        ...state,
        showPrompt: false,
      };

    case "DISMISS_PROMPT":
      return {
        ...state,
        showPrompt: false,
        promptDismissed: true,
      };

    case "END_GAME":
      return {
        ...state,
        isGameEnding: true,
        showPrompt: true,
        promptVariant: "final",
      };

    default:
      return state;
  }
}

/**
 * Fetch demo sequences from API
 */
async function fetchDemoSequences(levelId?: number): Promise<DemoSequenceDTO[]> {
  const url = levelId ? `/api/demo/sequences?levelId=${levelId}` : "/api/demo/sequences";
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch demo sequences: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Hook publiczny
 */
export function useDemoGame() {
  const [state, dispatch] = useReducer(demoGameReducer, initialState);

  // Fetch sequences for demo level 1 (can be extended to 1-3 when more sequences available)
  const {
    data: allSequences,
    isLoading: isLoadingSequences,
    error: sequencesError,
  } = useQuery({
    queryKey: ["demoSequences", 1], // Fetch only level 1 for now
    queryFn: () => fetchDemoSequences(1), // Pass levelId = 1
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Group sequences by level for easy access (tylko poziom 1 obecnie)
  const sequencesByLevel = useMemo(() => {
    if (!allSequences) return { 1: [] };

    return allSequences.reduce(
      (acc, seq) => {
        if (seq.levelId === 1) {
          acc[1].push(seq);
        }
        return acc;
      },
      { 1: [] } as Record<1, DemoSequenceDTO[]>
    );
  }, [allSequences]);

  /**
   * Generuje nowe zadanie dla aktualnego poziomu
   */
  const generateNewTask = useCallback(() => {
    const levelSequences = sequencesByLevel[state.level];

    if (!levelSequences || levelSequences.length === 0) {
      console.error("No sequences available for level", state.level);
      return;
    }

    try {
      // Wybierz losową sekwencję z dostępnych
      const randomIndex = Math.floor(Math.random() * levelSequences.length);
      const sequence = levelSequences[randomIndex];
      const expectedSlots = calculateSlots(sequence.sequenceEnd);

      const task: DemoTask = {
        id: sequence.id,
        levelId: 1, // Tylko poziom 1 w demo
        beginning: sequence.sequenceBeginning,
        expectedSlots,
        correctAnswer: sequence.sequenceEnd,
      };

      dispatch({ type: "START_TASK", task });
    } catch (error) {
      console.error("Error generating task:", error);
    }
  }, [state.level, sequencesByLevel]);

  /**
   * Dodaje nutę do odpowiedzi
   */
  const addNote = useCallback((note: string) => {
    dispatch({ type: "ADD_NOTE", note });
  }, []);

  /**
   * Czyści wybrane nuty
   */
  const clearNotes = useCallback(() => {
    dispatch({ type: "CLEAR_NOTES" });
  }, []);

  /**
   * Waliduje odpowiedź użytkownika
   */
  const submitAnswer = useCallback(() => {
    if (!state.currentTask) return;

    const userAnswer = state.selectedNotes.join("-");
    const correctAnswer = state.currentTask.correctAnswer;
    const isCorrect = userAnswer === correctAnswer;

    // Punktacja: 10 pkt za pierwszą próbę, 5 za drugą, 2 za trzecią, 0 za błąd
    let score = 0;
    if (isCorrect) {
      if (state.attemptsLeft === 3) score = 10;
      else if (state.attemptsLeft === 2) score = 5;
      else if (state.attemptsLeft === 1) score = 2;
    }

    dispatch({ type: "SUBMIT_ANSWER", isCorrect, score });

    // Jeśli poprawna odpowiedź lub wykorzystano wszystkie próby -> następne zadanie
    if (isCorrect || state.attemptsLeft === 1) {
      setTimeout(() => {
        dispatch({ type: "NEXT_TASK" });

        // Sprawdź awans poziomu (5 zadań w poziomie)
        // Demo: tylko poziom 1, więc po 5 zadaniach kończymy grę
        const newCompletedInLevel = isCorrect ? state.completedTasksInLevel + 1 : state.completedTasksInLevel;
        if (newCompletedInLevel >= 5) {
          // Zamiast awansu, kończymy demo
          dispatch({ type: "END_GAME" });
          return;
        }

        // Sprawdź czy pokazać prompt rejestracyjny (po 7-8 zadaniach)
        const newTaskCount = isCorrect ? state.taskCount + 1 : state.taskCount;
        if (newTaskCount >= 7 && newTaskCount <= 8 && !state.promptDismissed && !state.showPrompt) {
          dispatch({ type: "SHOW_PROMPT", variant: "early" });
        }

        // Sprawdź zakończenie poziomu 1 (5 zadań)
        // W demo kończymy po 5 zadaniach na poziomie 1
        if (newCompletedInLevel >= 5) {
          dispatch({ type: "END_GAME" });
        } else {
          // Generuj następne zadanie
          generateNewTask();
        }
      }, 1500); // Delay dla animacji feedback
    }
  }, [state, generateNewTask]);

  /**
   * Zamyka prompt (użytkownik kliknął "Kontynuuj demo")
   */
  const closePrompt = useCallback(() => {
    dispatch({ type: "DISMISS_PROMPT" });
  }, []);

  /**
   * Inicjalizacja - generuje pierwsze zadanie gdy sekwencje są załadowane
   */
  useEffect(() => {
    if (!state.currentTask && allSequences && allSequences.length > 0) {
      generateNewTask();
    }
  }, [state.currentTask, allSequences, generateNewTask]);

  /**
   * Pobierz konfigurację aktualnego poziomu
   */
  const levelConfig = getLevelConfig(state.level);

  return {
    // State
    level: state.level,
    taskCount: state.taskCount,
    score: state.score,
    currentTask: state.currentTask,
    selectedNotes: state.selectedNotes,
    attemptsLeft: state.attemptsLeft,
    showPrompt: state.showPrompt,
    promptVariant: state.promptVariant,
    isGameEnding: state.isGameEnding,
    levelConfig,
    feedback: state.feedback,

    // Loading states
    isLoadingSequences,
    sequencesError,

    // Actions
    addNote,
    clearNotes,
    submitAnswer,
    closePrompt,

    // Computed
    canSubmit: state.currentTask ? state.selectedNotes.length === state.currentTask.expectedSlots : false,
    canClear: state.selectedNotes.length > 0,
  };
}
