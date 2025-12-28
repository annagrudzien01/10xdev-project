import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";

interface UsePianoSamplerOptions {
  oscillator?: Tone.OmniOscillatorOptions;
}

export function usePianoSampler(options?: UsePianoSamplerOptions) {
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Użyj PolySynth z oscylatorem dla lepszego brzmienia pianina
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: options?.oscillator || {
        type: "triangle",
      },
      envelope: {
        attack: 0.005,
        decay: 0.3,
        sustain: 0.4,
        release: 1.2,
      },
    }).toDestination();

    setIsLoaded(true);

    return () => {
      synthRef.current?.dispose();
      synthRef.current = null;
    };
  }, []);

  const playNote = (note: string, duration = "8n") => {
    if (!synthRef.current || !isLoaded) {
      return;
    }
    synthRef.current.triggerAttackRelease(note, duration);
  };

  const playSequence = (notes: string[], duration = "8n", interval = 0.5) => {
    if (!synthRef.current || !isLoaded) {
      return;
    }

    const now = Tone.now();
    notes.forEach((note, index) => {
      synthRef.current?.triggerAttackRelease(note, duration, now + index * interval);
    });
  };

  return {
    playNote,
    playSequence,
    isLoaded,
  };
}
