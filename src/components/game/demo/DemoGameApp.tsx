/**
 * DemoGameApp Component
 *
 * Główny komponent orkiestrujący tryb demo gry.
 * Łączy wszystkie części: banner, header, game play area, modal rejestracyjny.
 */

import { useCallback, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDemoGame } from "@/lib/hooks/useDemoGame";
import { DemoBanner } from "./DemoBanner";
import { GameHeader } from "@/components/game/GameHeader";
import { GamePlayArea } from "./GamePlayArea";
import { RegistrationPromptModal } from "./RegistrationPromptModal";

// Create a query client
const queryClient = new QueryClient();

/**
 * Internal component with hooks
 */
function DemoGameContent() {
  const {
    // State
    level,
    score,
    currentTask,
    selectedNotes,
    attemptsLeft,
    showPrompt,
    promptVariant,
    levelConfig,
    feedback,

    // Loading states
    isLoadingSequences,
    sequencesError,

    // Actions
    addNote,
    clearNotes,
    submitAnswer,
    closePrompt,

    // Computed
    canSubmit,
    canClear,
  } = useDemoGame();

  // Lokalny stan dla kontroli odtwarzania sekwencji
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [playSequenceTrigger, setPlaySequenceTrigger] = useState(0);

  /**
   * Handler kliknięcia klawisza pianina
   */
  const handleKeyPress = useCallback(
    (note: string) => {
      addNote(note);
    },
    [addNote]
  );

  /**
   * Handler zakończenia odtwarzania sekwencji
   */
  const handleSequenceComplete = useCallback(() => {
    setIsPlayingSequence(false);
  }, []);

  /**
   * Handler ponownego odtworzenia sekwencji
   */
  const handlePlaySequence = useCallback(() => {
    setIsPlayingSequence(true);
    setPlaySequenceTrigger((prev) => prev + 1); // Trigger re-play
  }, []);

  /**
   * Handler zatwierdzenia odpowiedzi
   */
  const handleSubmit = useCallback(() => {
    submitAnswer();
  }, [submitAnswer]);

  /**
   * Handler zamknięcia promptu rejestracyjnego
   */
  const handleClosePrompt = useCallback(() => {
    closePrompt();
  }, [closePrompt]);

  // Przygotuj sekwencję do odtworzenia
  const sequenceToPlay = currentTask ? currentTask.beginning.split("-") : [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Demo Banner */}
      <DemoBanner />

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Game Header */}
        {currentTask && (
          <GameHeader level={level} score={score} attemptsLeft={attemptsLeft} demoMode={true} />
        )}

        {/* Level Info */}
        {levelConfig && (
          <div className="text-center">
            <p className="text-sm text-gray-600">{levelConfig.description}</p>
          </div>
        )}

        {/* Game Play Area */}
        {currentTask && (
          <>
            <GamePlayArea
              sequenceToPlay={sequenceToPlay}
              autoPlay={true}
              playTrigger={playSequenceTrigger}
              totalSlots={currentTask.expectedSlots}
              selectedNotes={selectedNotes}
              canPlaySequence={!isPlayingSequence}
              canSubmit={canSubmit && !isPlayingSequence}
              canClear={canClear}
              disabled={isPlayingSequence}
              isLoading={false}
              onKeyPress={handleKeyPress}
              onSequenceComplete={handleSequenceComplete}
              onPlaySequence={handlePlaySequence}
              onClear={clearNotes}
              onSubmit={handleSubmit}
              demoMode={true}
            />

            {/* Feedback po sprawdzeniu */}
            {feedback?.show && (
              <div
                className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 
                  px-8 py-6 rounded-2xl shadow-2xl text-center animate-in fade-in zoom-in duration-300
                  ${feedback.isCorrect ? "bg-green-500" : "bg-red-500"} text-white`}
              >
                <div className="text-6xl mb-4">{feedback.isCorrect ? "✓" : "✗"}</div>
                <div className="text-3xl font-bold mb-2">
                  {feedback.isCorrect ? "Dobrze!" : "Spróbuj ponownie"}
                </div>
                {feedback.isCorrect && feedback.score > 0 && (
                  <div className="text-2xl font-semibold">+{feedback.score} pkt</div>
                )}
              </div>
            )}
          </>
        )}

        {/* Loading state */}
        {(isLoadingSequences || !currentTask) && !sequencesError && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">
              {isLoadingSequences ? "Ładowanie sekwencji z bazy danych..." : "Przygotowywanie gry..."}
            </p>
          </div>
        )}

        {/* Error state */}
        {sequencesError && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="text-red-600 text-4xl">⚠️</div>
            <p className="text-red-600 font-semibold">Błąd ładowania sekwencji</p>
            <p className="text-gray-600 text-sm">
              {sequencesError instanceof Error ? sequencesError.message : "Nieznany błąd"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Spróbuj ponownie
            </button>
          </div>
        )}
      </div>

      {/* Registration Prompt Modal */}
      <RegistrationPromptModal isOpen={showPrompt} variant={promptVariant} onClose={handleClosePrompt} />
    </div>
  );
}

/**
 * Wrapper with QueryClientProvider
 */
export function DemoGameApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <DemoGameContent />
    </QueryClientProvider>
  );
}
