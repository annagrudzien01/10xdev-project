import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";

interface UsePianoSamplerOptions {
  oscillator?: Tone.OmniOscillatorOptions;
}

export function usePianoSampler(options?: UsePianoSamplerOptions) {
  const samplerRef = useRef<Tone.Sampler | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Inicjalizacja audio context
    const initAudio = async () => {
      await Tone.start();
      console.log("Audio context started");
    };

    // Użyj Sampler z lokalnymi plikami MP3
    samplerRef.current = new Tone.Sampler({
      urls: {
        C4: "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        A4: "A4.mp3",
      },
      release: 1,
      baseUrl: "/audio/piano/", // Lokalne pliki w public/audio/piano
      onload: () => {
        console.log("Piano samples loaded");
        setIsLoaded(true);
      },
    }).toDestination();

    initAudio();

    return () => {
      samplerRef.current?.dispose();
      samplerRef.current = null;
    };
  }, []);

  const playNote = (note: string, duration = "4n") => {
    if (!samplerRef.current || !isLoaded) {
      return;
    }

    try {
      // Sampler automatycznie zarządza głosami - bez problemów z polyphony!
      samplerRef.current.triggerAttackRelease(note, "0.5", Tone.now());
    } catch (error) {
      console.error("Error playing note:", error);
    }
  };

  const playSequence = (notes: string[], duration = "4n", interval = 0.5) => {
    if (!samplerRef.current || !isLoaded) {
      return;
    }

    notes.forEach((note, index) => {
      setTimeout(
        () => {
          playNote(note);
        },
        index * interval * 1000
      );
    });
  };

  return {
    playNote,
    playSequence,
    isLoaded,
  };
}
