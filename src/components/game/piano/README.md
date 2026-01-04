# Komponent Piano - Dokumentacja

## Przegląd

Komponent `Piano` to w pełni funkcjonalne wirtualne pianino monofoniczne (jedna oktawa: C4-B4) z obsługą myszy i dotyku, zaprojektowane do użytku w grze muzycznej Rytmik.

## Struktura komponentów

```
Piano (główny kontener)
├── PianoKeysContainer (kontener layoutu)
│   ├── BlackKeysRow (rząd czarnych klawiszy)
│   │   └── PianoKey × 5 (C#, D#, F#, G#, A#)
│   └── WhiteKeysRow (rząd białych klawiszy)
│       └── PianoKey × 7 (C, D, E, F, G, A, B)
```

## Użycie

### Podstawowe użycie

```tsx
import { Piano } from "@/components/game/piano";

function GameView() {
  const handleKeyPress = (note: string) => {
    console.log("Wybrano nutę:", note);
    // note ma format: "C4", "D#4", etc.
  };

  return <Piano onKeyPress={handleKeyPress} />;
}
```

### Zaawansowane użycie z odtwarzaniem sekwencji

```tsx
import { Piano } from "@/components/game/piano";
import { useState } from "react";

function GameView() {
  const [sequence, setSequence] = useState<string[]>([]);

  const handleKeyPress = (note: string) => {
    // Usuń oktawę jeśli potrzeba (C4 → C)
    const noteWithoutOctave = note.replace(/\d+$/, "");
    setSequence((prev) => [...prev, noteWithoutOctave]);
  };

  const playSequence = () => {
    // Sekwencja do odtworzenia (musi zawierać oktawę)
    const toPlay = ["C4", "E4", "G4"];
    setSequence(toPlay);
  };

  return (
    <Piano
      onKeyPress={handleKeyPress}
      sequenceToPlay={sequence}
      autoPlay={true}
      onSequenceComplete={() => {
        console.log("Sekwencja zakończona");
      }}
    />
  );
}
```

## API

### Props komponentu Piano

| Prop                 | Typ                      | Domyślna     | Opis                                                                                             |
| -------------------- | ------------------------ | ------------ | ------------------------------------------------------------------------------------------------ |
| `onKeyPress`         | `(note: string) => void` | **wymagany** | Callback wywoływany gdy użytkownik kliknie klawisz. Otrzymuje nutę w formacie Tone.js (np. "C4") |
| `highlightedKeys`    | `string[]`               | `[]`         | Tablica nut do podświetlenia (opcjonalnie, do zewnętrznej kontroli)                              |
| `disabled`           | `boolean`                | `false`      | Czy pianino jest wyłączone                                                                       |
| `onSequenceComplete` | `() => void`             | `undefined`  | Callback wywoływany po zakończeniu odtwarzania sekwencji                                         |
| `sequenceToPlay`     | `string[]`               | `[]`         | Sekwencja nut do automatycznego odtworzenia                                                      |
| `autoPlay`           | `boolean`                | `false`      | Czy automatycznie odtworzyć sekwencję po zamontowaniu/zmianie                                    |

### Format nut

Komponenty pianina używają formatu nut Tone.js:

- Białe klawisze: `"C4"`, `"D4"`, `"E4"`, `"F4"`, `"G4"`, `"A4"`, `"B4"`
- Czarne klawisze: `"C#4"`, `"D#4"`, `"F#4"`, `"G#4"`, `"A#4"`

## Funkcje

### 🎹 Interaktywność

- Obsługa kliknięć myszą i dotyku
- Animacje wciśnięcia klawiszy
- Podświetlanie klawiszy podczas playback
- Feedback dźwiękowy przy każdym kliknięciu

### 🎵 Odtwarzanie audio

- Wykorzystuje hook `usePianoSampler` z Tone.js
- Monofoniczne odtwarzanie (jedna nuta na raz)
- Automatyczne odtwarzanie sekwencji z synchronizacją wizualną

### 📱 Responsywność

- Dostosowanie do różnych rozmiarów ekranu (tablet, desktop)
- Klasy Tailwind dla responsywnych rozmiarów klawiszy
- Optymalizacja dla orientacji poziomej na tabletach

### ♿ Dostępność

- Atrybuty ARIA (`aria-label`, `aria-pressed`, `aria-busy`)
- Wsparcie dla nawigacji klawiaturą
- Komunikaty o stanie (ładowanie, błędy)

### 🔒 Warunki wyłączenia

Pianino jest automatycznie wyłączane gdy:

1. Audio nie jest jeszcze załadowane (`isLoaded === false`)
2. Trwa odtwarzanie sekwencji (`isPlaying === true`)
3. Prop `disabled` jest ustawiony na `true`

## Stylizacja

### Białe klawisze

- Wysokość: `96px` (tablet), `128px` (md), `160px` (lg)
- Szerokość: `48px` (tablet), `64px` (md), `80px` (lg)
- Kolor: biały z czarną ramką
- Hover: zwiększony cień
- Active: skalowanie 95%, zmniejszona jasność

### Czarne klawisze

- Wysokość: `64px` (tablet), `80px` (md), `96px` (lg)
- Szerokość: `32px` (tablet), `48px` (md), `56px` (lg)
- Kolor: ciemnoszary z czarną ramką
- Pozycja: absolutna, na górze białych klawiszy

### Podświetlenie

- Białe klawisze: `bg-yellow-200`, `border-yellow-400`
- Czarne klawisze: `bg-yellow-600`, `border-yellow-700`

## Obsługa błędów

Komponent obsługuje następujące przypadki błędów:

1. **Audio nie załadowane**: Wyświetla komunikat "Ładowanie dźwięków..."
2. **Błąd odtwarzania**: Loguje błąd w konsoli i wyświetla komunikat użytkownikowi
3. **Kliknięcie podczas playback**: Ignoruje interakcje (klawisze wyłączone)

## Integracja z GameContext

Przykład integracji z kontekstem gry:

```tsx
function GamePlayView() {
  const { addNote, isPlayingSequence, currentTask, selectedNotes } = useGame();

  const handleKeyPress = (note: string) => {
    const noteWithoutOctave = note.replace(/\d+$/, "");
    addNote(noteWithoutOctave);
  };

  const sequenceToPlay = currentTask?.sequenceBeginning.split("-").map((n) => n + "4"); // Dodaj oktawę

  return (
    <Piano
      onKeyPress={handleKeyPress}
      disabled={isPlayingSequence}
      sequenceToPlay={sequenceToPlay}
      autoPlay={true}
      onSequenceComplete={() => {
        // Zaktualizuj stan gry
      }}
    />
  );
}
```

## Pliki komponentu

- `Piano.tsx` - Główny komponent
- `PianoKey.tsx` - Pojedynczy klawisz
- `PianoKeysContainer.tsx` - Kontener layoutu
- `BlackKeysRow.tsx` - Rząd czarnych klawiszy
- `WhiteKeysRow.tsx` - Rząd białych klawiszy
- `piano.types.ts` - Definicje typów TypeScript
- `piano.constants.ts` - Stałe i konfiguracja
- `index.ts` - Eksporty publiczne

## Zależności

- `react` - Komponenty i hooki
- `tone` - Biblioteka audio (przez `usePianoSampler`)
- `tailwindcss` - Stylizacja

## Testowanie

Przykłady testowania komponentu znajdują się w `PianoExample.tsx`.

Aby przetestować manualnie:

1. Otwórz stronę z komponentem Piano
2. Kliknij różne klawisze i sprawdź dźwięk
3. Przetestuj odtwarzanie sekwencji
4. Sprawdź responsywność na różnych ekranach
5. Przetestuj obsługę dotyku na tablecie

## Znane ograniczenia

1. Obsługuje tylko jedną oktawę (C4-B4)
2. Monofoniczne (jedna nuta na raz podczas interakcji użytkownika)
3. Wymaga obsługi audio w przeglądarce
4. Optymalizowane dla orientacji poziomej na urządzeniach mobilnych

## Przyszłe ulepszenia

- [ ] Wsparcie dla wielu oktaw
- [ ] Obsługa klawiatury komputera (QWERTY)
- [ ] Nagrywanie i odtwarzanie własnych sekwencji
- [ ] Wizualizacja fal dźwiękowych
- [ ] Różne instrumenty/sample packs
