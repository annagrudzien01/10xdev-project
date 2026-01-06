/**
 * GameContext - Context for managing game state
 *
 * Provides game state and methods for:
 * - Managing current task/puzzle
 * - Handling user's answer (selected notes)
 * - Submitting answers and receiving feedback
 * - Playing sequences
 * - Level progression
 * - Restoring game state from active tasks (including attempts used)
 * - Manual next task loading (user-triggered after task completion)
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { GeneratePuzzleDTO, SubmitAnswerResponseDTO, CurrentPuzzleDTO } from "@/types";

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
 * Game feedback state
 */
export interface GameFeedback {
  type: "success" | "failed" | null;
  message: string;
  score: number;
}

/**
 * Task completion state
 */
export type TaskCompletionState = "in_progress" | "completed" | null;

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
  feedback: GameFeedback | null;
  taskCompletionState: TaskCompletionState;

  // Methods
  addNote: (note: string) => void;
  removeLastNote: () => void;
  clearNotes: () => void;
  submitAnswer: () => Promise<SubmitAnswerResponseDTO | undefined>;
  playSequence: () => void;
  setIsPlayingSequence: (isPlaying: boolean) => void;
  loadCurrentOrNextTask: () => Promise<CurrentPuzzleDTO | GeneratePuzzleDTO>;
  loadNextTask: () => Promise<GeneratePuzzleDTO>;
  loadNextTaskManually: () => Promise<void>;
  resetGame: () => void;
  clearFeedback: () => void;
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
  const [feedback, setFeedback] = useState<GameFeedback | null>(null);
  const [taskCompletionState, setTaskCompletionState] = useState<TaskCompletionState>(null);

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
   * Generates a new puzzle/task
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
      setTaskCompletionState(null);

      return data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error loading next task:", error);
      throw error;
    }
  }, [profileId]);

  /**
   * Loads the next task manually (triggered by user clicking button)
   * Clears feedback before loading
   */
  const loadNextTaskManually = useCallback(async () => {
    try {
      setFeedback(null);
      await loadNextTask();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to load next task:", error);
      // Show error feedback if loading fails
      setFeedback({
        type: "failed",
        message: "Nie udało się załadować nowej zagadki. Odśwież stronę.",
        score: 0,
      });
      throw error;
    }
  }, [loadNextTask]);

  /**
   * Tries to load current task, if not found loads next task
   * This ensures game state persistence after page refresh
   */
  const loadCurrentOrNextTask = useCallback(async () => {
    try {
      // First, try to get current active task
      const currentResponse = await fetch(`/api/profiles/${profileId}/tasks/current`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (currentResponse.ok) {
        // Found existing task - restore it
        const data: CurrentPuzzleDTO = await currentResponse.json();

        const sequenceArray = data.sequenceBeginning.split("-");

        setCurrentTask({
          sequenceId: data.sequenceId,
          levelId: data.levelId,
          sequenceBeginning: sequenceArray,
          expectedSlots: data.expectedSlots,
        });

        // Restore the actual attempts left based on attempts already used
        setAttemptsLeft(3 - data.attemptsUsed);
        setSelectedNotes([]);

        return data;
      } else if (currentResponse.status === 404) {
        // No current task found - generate a new one
        return await loadNextTask();
      } else {
        // Other error
        const errorData = await currentResponse.json();
        throw new Error(errorData.message || "Failed to load current task");
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error loading current or next task:", error);
      throw error;
    }
  }, [profileId, loadNextTask]);

  /**
   * Submits the user's answer to the API
   *
   * Attempts tracking (handled by API):
   * - Correct answer: attemptsUsed is NOT incremented, so attempts left stays at 3
   * - Incorrect answer: attemptsUsed increments (0→1→2→3), attempts left decreases (3→2→1→0)
   * - Scoring: 0 failed attempts = 10pts, 1 failed = 7pts, 2 failed = 5pts
   * - Task completes when: player gets points OR uses all 3 attempts
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
      // attemptsUsed is only incremented for incorrect answers (from API)
      // So we can safely calculate attempts left from attemptsUsed
      setAttemptsLeft(3 - result.attemptsUsed);

      if (result.levelCompleted) {
        setCompletedTasksInLevel(0);
        setCurrentLevel(result.nextLevel);
      } else {
        setCompletedTasksInLevel((prev) => prev + 1);
      }

      // Clear selected notes after successful submit
      setSelectedNotes([]);

      // Check if task is completed (got points or used all 3 attempts)
      const isTaskCompleted = result.score > 0 || result.attemptsUsed >= 3;

      if (isTaskCompleted) {
        // Mark task as completed
        setTaskCompletionState("completed");

        // Show feedback based on result
        if (result.score > 0) {
          // Success - got points!
          let message = "Świetnie!";
          if (result.score === 10) message = "Perfekcyjnie! 🌟";
          else if (result.score >= 7) message = "Bardzo dobrze! ⭐";
          else message = "Dobrze! ✨";

          setFeedback({
            type: "success",
            message,
            score: result.score,
          });
        } else {
          // Failed - no more attempts
          setFeedback({
            type: "failed",
            message: "Wykorzystano 3 szanse. Spróbuj ponownie!",
            score: 0,
          });
        }

        // Don't auto-load next task - user will click button
      } else {
        // Task not completed yet - just update state and return
        setTaskCompletionState("in_progress");
        return result;
      }

      return result;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error submitting answer:", error);
      // Clear feedback on error
      setFeedback(null);
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
   * Clears the feedback message
   */
  const clearFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

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
    setFeedback(null);
    setTaskCompletionState(null);
  }, []);

  // Auto-load current or next task on mount
  useEffect(() => {
    loadCurrentOrNextTask().catch((error) => {
      // eslint-disable-next-line no-console
      console.error("Failed to initialize game:", error);
    });
  }, [loadCurrentOrNextTask]);

  const value: GameState = {
    currentLevel,
    totalScore,
    attemptsLeft,
    completedTasksInLevel,
    currentTask,
    selectedNotes,
    isPlayingSequence,
    isSubmitting,
    feedback,
    taskCompletionState,
    addNote,
    removeLastNote,
    clearNotes,
    submitAnswer,
    playSequence,
    setIsPlayingSequence,
    loadCurrentOrNextTask,
    loadNextTask,
    loadNextTaskManually,
    resetGame,
    clearFeedback,
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
