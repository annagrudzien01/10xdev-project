/**
 * GamePlayView Component
 *
 * Main game view that integrates all game components:
 * - GameHeader (level, score, attempts)
 * - AnswerSlots (visual feedback of selected notes)
 * - Piano (interactive keyboard)
 * - GameControls (play, clear, submit buttons)
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
    addNote,
    clearNotes,
    submitAnswer,
    setIsPlayingSequence,
    loadNextTask,
  } = useGame();

  const [isLoadingTask, setIsLoadingTask] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [replayTrigger, setReplayTrigger] = useState(0);

  /**
   * Load initial task on mount
   */
  useEffect(() => {
    const initializeGame = async () => {
      setIsLoadingTask(true);
      try {
        await loadNextTask();
      } catch (error) {
        console.error("Failed to load initial task:", error);
        toast.error("Nie udało się załadować zagadki. Spróbuj ponownie.");
      } finally {
        setIsLoadingTask(false);
      }
    };

    initializeGame();
  }, []);

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
    setFeedbackMessage(null);
  }, [clearNotes]);

  /**
   * Handle submitting answer
   */
  const handleSubmit = useCallback(async () => {
    try {
      const result = await submitAnswer();

      if (result) {
        // Show feedback
        if (result.score > 0) {
          setFeedbackMessage(`Świetnie! Zdobyłeś ${result.score} punktów! 🎉`);
          toast.success(`Brawo! +${result.score} punktów`);

          if (result.levelCompleted) {
            toast.success(`Ukończyłeś poziom ${currentLevel}! Przechodzisz na poziom ${result.nextLevel}! 🎊`);
          }

          // Load next task after a delay
          setTimeout(async () => {
            setFeedbackMessage(null);
            setIsLoadingTask(true);
            try {
              await loadNextTask();
            } catch (error) {
              console.error("Failed to load next task:", error);
              toast.error("Nie udało się załadować kolejnej zagadki");
            } finally {
              setIsLoadingTask(false);
            }
          }, 2000);
        } else {
          setFeedbackMessage(
            `Spróbuj ponownie! Pozostało prób: ${result.attemptsUsed < 3 ? 3 - result.attemptsUsed : 0}`
          );
          toast.error("Nieprawidłowa odpowiedź. Spróbuj ponownie!");
        }
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
      toast.error("Nie udało się sprawdzić odpowiedzi");
    }
  }, [submitAnswer, currentLevel, loadNextTask]);

  // Prepare sequence for piano (nuty już zawierają oktawy z bazy)
  const sequenceToPlay = currentTask ? currentTask.sequenceBeginning : [];

  // Calculate control button states
  const canPlaySequence = !isPlayingSequence && !isLoadingTask && currentTask !== null;
  const canClear = selectedNotes.length > 0 && !isPlayingSequence && !isSubmitting;
  const canSubmit =
    selectedNotes.length === currentTask?.expectedSlots && !isPlayingSequence && !isSubmitting && !isLoadingTask;

  // Show loading state
  if (isLoadingTask && !currentTask) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie zagadki...</p>
        </div>
      </div>
    );
  }

  // Show error if no task loaded
  if (!currentTask && !isLoadingTask) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center max-w-md mx-auto p-6">
          <p className="text-xl text-gray-800 mb-4">Nie udało się załadować zagadki 😕</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Spróbuj ponownie
          </button>
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

          {/* Answer slots */}
          <div className="flex flex-col items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase">Twoja odpowiedź</h3>
            <AnswerSlots
              totalSlots={currentTask?.expectedSlots || 0}
              selectedNotes={selectedNotes}
              disabled={isPlayingSequence || isSubmitting}
            />
          </div>

          {/* Feedback message */}
          {feedbackMessage && (
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-800">{feedbackMessage}</p>
            </div>
          )}

          {/* Piano */}
          <div className="flex justify-center">
            <Piano
              key={replayTrigger} // Force re-mount on replay
              onKeyPress={handleKeyPress}
              disabled={isPlayingSequence || isSubmitting || isLoadingTask}
              sequenceToPlay={sequenceToPlay}
              autoPlay={true}
              onSequenceComplete={handleSequenceComplete}
            />
          </div>

          {/* Game controls */}
          <GameControls
            canPlaySequence={canPlaySequence}
            canClear={canClear}
            canSubmit={canSubmit}
            onPlaySequence={handlePlaySequence}
            onClear={handleClear}
            onSubmit={handleSubmit}
            isLoading={isSubmitting || isLoadingTask}
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
