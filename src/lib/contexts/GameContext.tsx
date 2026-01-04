/**
 * GameContext - Context for managing game state
 *
 * Provides game state and methods for:
 * - Managing current task/puzzle
 * - Handling user's answer (selected notes)
 * - Submitting answers and receiving feedback
 * - Playing sequences
 * - Level progression
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { GeneratePuzzleDTO, SubmitAnswerResponseDTO } from "@/types";

/**
 * Current task state
 */
export interface CurrentTask {
  sequenceId: string;
  levelId: number;
  sequenceBeginning: string[];
  expectedSlots: number;
}

/**
 * Game state interface
 */
export interface GameState {
  // Current state
  currentLevel: number;
  totalScore: number;
  attemptsLeft: number;
  completedTasksInLevel: number;
  currentTask: CurrentTask | null;
  selectedNotes: string[];
  isPlayingSequence: boolean;
  isSubmitting: boolean;

  // Methods
  addNote: (note: string) => void;
  removeLastNote: () => void;
  clearNotes: () => void;
  submitAnswer: () => Promise<void>;
  playSequence: () => void;
  setIsPlayingSequence: (isPlaying: boolean) => void;
  loadNextTask: () => Promise<void>;
  resetGame: () => void;
}

/**
 * Props for GameProvider
 */
interface GameProviderProps {
  children: ReactNode;
  profileId: string;
  initialLevel: number;
  initialScore: number;
}

const GameContext = createContext<GameState | undefined>(undefined);

/**
 * GameProvider Component
 *
 * Manages the game state and provides methods for game interactions
 */
export function GameProvider({ children, profileId, initialLevel, initialScore }: GameProviderProps) {
  // Game state
  const [currentLevel, setCurrentLevel] = useState(initialLevel);
  const [totalScore, setTotalScore] = useState(initialScore);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [completedTasksInLevel, setCompletedTasksInLevel] = useState(0);
  const [currentTask, setCurrentTask] = useState<CurrentTask | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Adds a note to the user's answer
   */
  const addNote = useCallback(
    (note: string) => {
      if (!currentTask) return;

      // Note już zawiera oktawę (np. "C4") - używamy bez zmian

      // Only add if we haven't filled all slots
      if (selectedNotes.length < currentTask.expectedSlots) {
        setSelectedNotes((prev) => [...prev, note]);
      }
    },
    [currentTask, selectedNotes.length]
  );

  /**
   * Removes the last note from the user's answer
   */
  const removeLastNote = useCallback(() => {
    setSelectedNotes((prev) => prev.slice(0, -1));
  }, []);

  /**
   * Clears all selected notes
   */
  const clearNotes = useCallback(() => {
    setSelectedNotes([]);
  }, []);

  /**
   * Loads the next task from the API
   */
  const loadNextTask = useCallback(async () => {
    try {
      const response = await fetch(`/api/profiles/${profileId}/tasks/next`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to load task");
      }

      const data: GeneratePuzzleDTO = await response.json();
      
      // Parse sequence beginning - już zawiera oktawy (format: "C4-E4-G4")
      const sequenceArray = data.sequenceBeginning.split("-");
      
      setCurrentTask({
        sequenceId: data.sequenceId,
        levelId: data.levelId,
        sequenceBeginning: sequenceArray,
        expectedSlots: data.expectedSlots,
      });

      // Reset attempts and selected notes for new task
      setAttemptsLeft(3);
      setSelectedNotes([]);

      return data;
    } catch (error) {
      console.error("Error loading next task:", error);
      throw error;
    }
  }, [profileId]);

  /**
   * Submits the user's answer to the API
   */
  const submitAnswer = useCallback(async () => {
    if (!currentTask || selectedNotes.length === 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      
      // Convert notes array to string format (["A4", "B4", "C5"] -> "A4-B4-C5")
      const answerString = selectedNotes.join("-");

      const response = await fetch(`/api/profiles/${profileId}/tasks/${currentTask.sequenceId}/submit`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answer: answerString }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit answer");
      }

      const result: SubmitAnswerResponseDTO = await response.json();

      // Update game state based on result
      setTotalScore((prev) => prev + result.score);
      setAttemptsLeft(3 - result.attemptsUsed);

      if (result.levelCompleted) {
        setCompletedTasksInLevel(0);
        setCurrentLevel(result.nextLevel);
      } else {
        setCompletedTasksInLevel((prev) => prev + 1);
      }

      // Clear selected notes after successful submit
      setSelectedNotes([]);

      return result;
    } catch (error) {
      console.error("Error submitting answer:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [currentTask, selectedNotes, profileId, isSubmitting]);

  /**
   * Triggers sequence playback (sets state for Piano component)
   */
  const playSequence = useCallback(() => {
    if (!currentTask) return;
    setIsPlayingSequence(true);
  }, [currentTask]);

  /**
   * Resets the game state
   */
  const resetGame = useCallback(() => {
    setCurrentTask(null);
    setSelectedNotes([]);
    setAttemptsLeft(3);
    setCompletedTasksInLevel(0);
    setIsPlayingSequence(false);
    setIsSubmitting(false);
  }, []);

  const value: GameState = {
    currentLevel,
    totalScore,
    attemptsLeft,
    completedTasksInLevel,
    currentTask,
    selectedNotes,
    isPlayingSequence,
    isSubmitting,
    addNote,
    removeLastNote,
    clearNotes,
    submitAnswer,
    playSequence,
    setIsPlayingSequence,
    loadNextTask,
    resetGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

/**
 * Hook to access game context
 * Must be used within GameProvider
 */
export function useGame(): GameState {
  const context = useContext(GameContext);

  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }

  return context;
}
