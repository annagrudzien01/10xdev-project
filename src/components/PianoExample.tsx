import { usePianoSampler } from "@/lib/usePianoSampler";

export default function PianoExample() {
  const { playNote, playSequence, isLoaded } = usePianoSampler();

  const notes = [
    { note: "C4", label: "C" },
    { note: "C#4", label: "C#" },
    { note: "D4", label: "D" },
    { note: "D#4", label: "D#" },
    { note: "E4", label: "E" },
    { note: "F4", label: "F" },
    { note: "F#4", label: "F#" },
    { note: "G4", label: "G" },
    { note: "G#4", label: "G#" },
    { note: "A4", label: "A" },
    { note: "A#4", label: "A#" },
    { note: "B4", label: "B" },
    { note: "C5", label: "C" },
  ];

  const exampleSequence = ["C4", "E4", "G4", "C5"];

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <h1 className="text-2xl font-bold">Piano Sampler Example</h1>

      {!isLoaded && <div className="text-yellow-600 font-semibold">Ładowanie sampli pianina...</div>}

      {isLoaded && <div className="text-green-600 font-semibold">✓ Pianino gotowe do gry</div>}

      <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
        {notes.map(({ note, label }) => (
          <button
            key={note}
            onClick={() => playNote(note)}
            disabled={!isLoaded}
            className="px-4 py-8 bg-white border-2 border-gray-800 rounded-lg 
                     hover:bg-gray-100 active:bg-gray-300 disabled:opacity-50 
                     disabled:cursor-not-allowed transition-colors font-semibold
                     min-w-[60px]"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => playSequence(exampleSequence)}
          disabled={!isLoaded}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg 
                   hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 
                   disabled:cursor-not-allowed transition-colors font-semibold"
        >
          Zagraj sekwencję (C-E-G-C)
        </button>

        <button
          onClick={() => playSequence(["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"], "8n", 0.3)}
          disabled={!isLoaded}
          className="px-6 py-3 bg-green-600 text-white rounded-lg 
                   hover:bg-green-700 active:bg-green-800 disabled:opacity-50 
                   disabled:cursor-not-allowed transition-colors font-semibold"
        >
          Zagraj gamę C-dur
        </button>
      </div>
    </div>
  );
}
