/**
 * GamePlayView Component
 *
 * Main game view that integrates all game components:
 * - GameHeader (level, score, attempts)
 * - AnswerSlots (visual feedback of selected notes with clear button)
 * - Feedback section with task completion notification and "Next Task" button
 * - Piano (interactive keyboard)
 * - GameControls (play and submit buttons)
 *
 * Features:
 * - Manual task progression: "Next Task" button appears in feedback area after completion
 * - Clear button positioned next to answer slots
 * - Task completion state management
 */

import { useEffect, useCallback, useState } from "react";
import { useGame } from "@/lib/contexts/GameContext";
import { Piano } from "@/components/game/piano";
import { GameHeader } from "./GameHeader";
import { AnswerSlots } from "./AnswerSlots";
import { GameControls } from "./GameControls";
import { toast } from "sonner";

interface GamePlayViewProps {
  profileName: string;
}

export default function GamePlayView({ profileName }: GamePlayViewProps) {
  const {
    currentLevel,
    totalScore,
    attemptsLeft,
    currentTask,
    selectedNotes,
    isPlayingSequence,
    isSubmitting,
    feedback,
    taskCompletionState,
    addNote,
    clearNotes,
    submitAnswer,
    setIsPlayingSequence,
    clearFeedback,
    loadCurrentOrNextTask,
    loadNextTaskManually,
  } = useGame();

  const [replayTrigger, setReplayTrigger] = useState(0);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  /**
   * Show toast notifications when feedback changes
   */
  useEffect(() => {
    if (feedback) {
      if (feedback.type === "success") {
        toast.success(`Brawo! +${feedback.score} punktów`);
      } else {
        toast.error(feedback.message);
      }
    }
  }, [feedback]);

  /**
   * Set loading timeout - show error if task doesn't load within 10 seconds
   */
  useEffect(() => {
    if (!currentTask) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000); // 10 seconds timeout

      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [currentTask]);

  /**
   * Handle key press from piano
   */
  const handleKeyPress = useCallback(
    (note: string) => {
      // Note już ma oktawę (np. "C4") - przekazujemy bez zmian
      addNote(note);
    },
    [addNote]
  );

  /**
   * Handle playing sequence again
   */
  const handlePlaySequence = useCallback(() => {
    setIsPlayingSequence(true);
    setReplayTrigger((prev) => prev + 1); // Trigger re-render of Piano
  }, [setIsPlayingSequence]);

  /**
   * Handle sequence playback complete
   */
  const handleSequenceComplete = useCallback(() => {
    setIsPlayingSequence(false);
  }, [setIsPlayingSequence]);

  /**
   * Handle clearing selected notes
   */
  const handleClear = useCallback(() => {
    clearNotes();
    clearFeedback();
  }, [clearNotes, clearFeedback]);

  /**
   * Handle submitting answer
   */
  const handleSubmit = useCallback(async () => {
    try {
      const result = await submitAnswer();

      if (result && result.levelCompleted) {
        toast.success(`Ukończyłeś poziom ${currentLevel}! Przechodzisz na poziom ${result.nextLevel}! 🎊`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to submit answer:", error);
      toast.error("Nie udało się sprawdzić odpowiedzi");
    }
  }, [submitAnswer, currentLevel]);

  /**
   * Handle loading next task manually
   */
  const handleNextTask = useCallback(async () => {
    try {
      await loadNextTaskManually();
      toast.success("Nowe zadanie załadowane!");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to load next task:", error);
      toast.error("Nie udało się załadować nowego zadania");
    }
  }, [loadNextTaskManually]);

  // Prepare sequence for piano (nuty już zawierają oktawy z bazy)
  const sequenceToPlay = currentTask ? currentTask.sequenceBeginning : [];

  // Calculate control button states
  const isTaskCompleted = taskCompletionState === "completed";
  const canPlaySequence = !isPlayingSequence && currentTask !== null && !isTaskCompleted;
  const canSubmit =
    selectedNotes.length === currentTask?.expectedSlots && !isPlayingSequence && !isSubmitting && !isTaskCompleted;

  // Show loading/error state
  if (!currentTask) {
    if (loadingTimeout) {
      // Show error after timeout
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-xl text-gray-800 mb-2 font-semibold">Nie udało się załadować zagadki</p>
            <p className="text-gray-600 mb-6">Sprawdź połączenie internetowe i spróbuj ponownie</p>
            <button
              onClick={() => {
                setLoadingTimeout(false);
                loadCurrentOrNextTask().catch((error) => {
                  // eslint-disable-next-line no-console
                  console.error("Retry failed:", error);
                  toast.error("Nadal nie można załadować zagadki");
                });
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Spróbuj ponownie
            </button>
            <div className="mt-4">
              <a href="/profiles" className="text-gray-600 hover:text-gray-800 transition-colors">
                ← Powrót do profili
              </a>
            </div>
          </div>
        </div>
      );
    }

    // Show loading state
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie zagadki...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-6 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with game stats */}
        <GameHeader level={currentLevel} score={totalScore} attemptsLeft={attemptsLeft} profileName={profileName} />

        {/* Main game area */}
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 space-y-6">
          {/* Instructions */}
          <div className="text-center space-y-2">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
              Posłuchaj melodii i uzupełnij brakujące nuty
            </h2>
            <p className="text-sm md:text-base text-gray-600">Kliknij na klawisze pianina, aby wybrać nuty</p>
          </div>

          {/* Answer slots with clear button */}
          <div className="flex flex-col items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase">Twoja odpowiedź</h3>
            <AnswerSlots
              totalSlots={currentTask?.expectedSlots || 0}
              selectedNotes={selectedNotes}
              disabled={isPlayingSequence || isSubmitting || isTaskCompleted}
              onClear={handleClear}
            />
          </div>

          {/* Feedback message with animation and Next Task button */}
          {feedback && (
            <div
              className={`text-center py-4 px-6 rounded-lg animate-in fade-in slide-in-from-top-5 duration-300 ${
                feedback.type === "success"
                  ? "bg-green-50 border-2 border-green-200"
                  : "bg-red-50 border-2 border-red-200"
              }`}
            >
              <p className={`text-xl font-bold ${feedback.type === "success" ? "text-green-700" : "text-red-700"}`}>
                {feedback.message}
              </p>
              {feedback.score > 0 && (
                <p className="text-2xl font-extrabold text-green-600 mt-2">+{feedback.score} punktów!</p>
              )}

              {/* Next Task button - shown when task is completed */}
              {isTaskCompleted && (
                <div className="mt-4">
                  <button
                    onClick={handleNextTask}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors text-lg shadow-md hover:shadow-lg"
                  >
                    ➜ Następne zadanie
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Piano */}
          <div className="flex justify-center">
            <Piano
              key={replayTrigger} // Force re-mount on replay
              onKeyPress={handleKeyPress}
              disabled={isPlayingSequence || isSubmitting || isTaskCompleted}
              sequenceToPlay={sequenceToPlay}
              autoPlay={true}
              onSequenceComplete={handleSequenceComplete}
            />
          </div>

          {/* Game controls */}
          <GameControls
            canPlaySequence={canPlaySequence}
            canSubmit={canSubmit}
            onPlaySequence={handlePlaySequence}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
          />
        </div>

        {/* Back button */}
        <div className="text-center">
          <a href="/profiles" className="inline-block px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors">
            ← Powrót do profili
          </a>
        </div>
      </div>
    </div>
  );
}
