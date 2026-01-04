import { useState } from "react";
import { Piano } from "./game/piano";

export default function PianoExample() {
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [sequenceToPlay, setSequenceToPlay] = useState<string[]>([]);

  const handleKeyPress = (note: string) => {
    // Usuń oktawę z nuty (C4 → C)
    const noteWithoutOctave = note.replace(/\d+$/, "");
    setSelectedNotes((prev) => [...prev, noteWithoutOctave]);
  };

  const handlePlaySequence = (sequence: string[]) => {
    setSequenceToPlay(sequence);
    // Reset po zakończeniu
    setTimeout(() => setSequenceToPlay([]), sequence.length * 500 + 1000);
  };

  const clearNotes = () => {
    setSelectedNotes([]);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-8 max-w-6xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Wirtualne Pianino - Demo</h1>
        <p className="text-gray-600">Kliknij klawisze, aby usłyszeć dźwięk</p>
      </div>

      {/* Wyświetlanie wybranych nut */}
      <div className="bg-gray-100 rounded-lg p-4 min-h-[60px] w-full max-w-2xl">
        <div className="text-sm text-gray-600 mb-2">Wybrane nuty:</div>
        <div className="flex flex-wrap gap-2">
          {selectedNotes.length === 0 ? (
            <span className="text-gray-400 italic">Kliknij klawisze, aby dodać nuty</span>
          ) : (
            selectedNotes.map((note, index) => (
              <span key={index} className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm font-semibold">
                {note}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Komponent pianina */}
      <Piano
        onKeyPress={handleKeyPress}
        sequenceToPlay={sequenceToPlay}
        autoPlay={false}
        onSequenceComplete={() => {
          // Sekwencja zakończona
        }}
      />

      {/* Przyciski kontrolne */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => handlePlaySequence(["C4", "E4", "G4", "C5"])}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg 
                   hover:bg-blue-700 active:bg-blue-800 
                   transition-colors font-semibold shadow-md hover:shadow-lg"
        >
          Zagraj sekwencję (C-E-G-C)
        </button>

        <button
          onClick={() => handlePlaySequence(["C4", "D4", "E4", "F4", "G4", "A4", "B4"])}
          className="px-6 py-3 bg-green-600 text-white rounded-lg 
                   hover:bg-green-700 active:bg-green-800 
                   transition-colors font-semibold shadow-md hover:shadow-lg"
        >
          Zagraj gamę C-dur
        </button>

        <button
          onClick={clearNotes}
          disabled={selectedNotes.length === 0}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg 
                   hover:bg-gray-700 active:bg-gray-800 disabled:opacity-50 
                   disabled:cursor-not-allowed transition-colors font-semibold shadow-md hover:shadow-lg"
        >
          Wyczyść nuty
        </button>
      </div>

      {/* Instrukcje */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl w-full">
        <h3 className="font-semibold text-blue-900 mb-2">Instrukcje:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Kliknij dowolny klawisz, aby usłyszeć dźwięk</li>
          <li>Wybrane nuty są wyświetlane w panelu powyżej</li>
          <li>Użyj przycisków, aby odtworzyć przykładowe sekwencje</li>
          <li>Podczas odtwarzania sekwencji klawisze są podświetlane</li>
        </ul>
      </div>
    </div>
  );
}
