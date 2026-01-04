# Komponent Piano - Dokumentacja

## Przegląd

Komponent `Piano` to w pełni funkcjonalne wirtualne pianino monofoniczne (jedna oktawa + wyższe C: C4-B4 + C5) z obsługą myszy i dotyku, zaprojektowane do użytku w grze muzycznej Rytmik. Używa próbek MP3 z prawdziwego pianina oraz kolorowych podświetleń dla każdej nuty. Wyświetla litery nut w notacji europejskiej (H zamiast B).

## Struktura komponentów

```
Piano (główny kontener)
├── PianoKeysContainer (kontener layoutu)
│   ├── BlackKeysRow (rząd czarnych klawiszy)
│   │   └── PianoKey × 5 (C#, D#, F#, G#, A#)
│   └── WhiteKeysRow (rząd białych klawiszy)
│       └── PianoKey × 8 (C, D, E, F, G, A, H, C) - notacja europejska
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
    // note już zawiera oktawę (np. "C4")
    setSequence((prev) => [...prev, note]);
  };

  const playSequence = () => {
    // Sekwencja do odtworzenia (musi zawierać oktawę)
    const toPlay = ["C4", "E4", "G4", "C5"];
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

- Białe klawisze: `"C4"`, `"D4"`, `"E4"`, `"F4"`, `"G4"`, `"A4"`, `"B4"` (wyświetlane jako H w UI), `"C5"`
- Czarne klawisze: `"C#4"`, `"D#4"`, `"F#4"`, `"G#4"`, `"A#4"`

**Notacja:** Klawisz B4 jest wyświetlany jako "H" (notacja europejska), ale wewnętrznie używa "B4" dla kompatybilności z Tone.js.

## Funkcje

### 🎹 Interaktywność

- Obsługa kliknięć myszą i dotyku
- Animacje wciśnięcia klawiszy (`scale-[0.98]` + `brightness-90`)
- Kolorowe podświetlanie klawiszy podczas playback (każda nuta ma unikalny kolor)
- Podświetlenie przy kliknięciu użytkownika (250ms)
- Feedback dźwiękowy przy każdym kliknięciu
- Podświetlone klawisze są w pełni widoczne nawet gdy pianino jest wyłączone (brak opacity)

### 🎵 Odtwarzanie audio

- Wykorzystuje hook `usePianoSampler` z Tone.js Sampler
- Sample-based playback (pliki MP3 z prawdziwego pianina)
- Próbki lokalne: `/public/audio/piano/` (C4.mp3, Ds4.mp3, Fs4.mp3, A4.mp3)
- Maxpolyphony: 128
- Automatyczne odtwarzanie sekwencji z synchronizacją wizualną
- Timing: interwał 500ms, podświetlenie 250ms

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
- Kolor: ciemnoszary (`bg-gray-900`) z czarną ramką
- Pozycja: absolutna (`top-0`), na górze białych klawiszy
- Brak górnej ramki: `border-t-0`
- z-index: `z-30` (zawsze na wierzchu)

### Podświetlenie

Każda nuta ma unikalny kolor podświetlenia zdefiniowany w `NOTE_HIGHLIGHT_COLORS`:

- **C**: niebieski (`bg-blue-400`)
- **C#**: ciemnoniebieski (`bg-blue-600`)
- **D**: zielony (`bg-green-400`)
- **D#**: ciemnozielony (`bg-green-600`)
- **E**: żółty (`bg-yellow-400`)
- **F**: czerwony (`bg-red-400`)
- **F#**: ciemnoczerwony (`bg-red-600`)
- **G**: fioletowy (`bg-purple-400`)
- **G#**: ciemnofioletowy (`bg-purple-600`)
- **A**: pomarańczowy (`bg-orange-400`)
- **A#**: ciemnopomarańczowy (`bg-orange-600`)
- **B/H**: różowy (`bg-pink-400`)

Efekty podświetlenia:
- Animacja: `scale-[0.98]` (zmniejszenie do 98%)
- Cień: `shadow-lg` bez przezroczystości
- Opacity: `!opacity-100` (pełna widoczność nawet gdy wyłączone)
- Czas CSS transition: `100ms`
- Czas trwania podświetlenia: `250ms` (HIGHLIGHT_DURATION)
- Interwał między nutami: `500ms` (SEQUENCE_INTERVAL)

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
    // Nuty już zawierają oktawy (np. "C4")
    addNote(note);
  };

  // sequenceBeginning już zawiera oktawy z bazy (np. ["C4", "E4", "G4"])
  const sequenceToPlay = currentTask?.sequenceBeginning || [];

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
- `piano.constants.ts` - Stałe i konfiguracja:
  - `WHITE_KEYS` - konfiguracja białych klawiszy (8 elementów)
  - `BLACK_KEYS` - konfiguracja czarnych klawiszy (5 elementów)
  - `SEQUENCE_INTERVAL` - interwał między nutami (500ms)
  - `NOTE_DURATION` - długość nuty ("6n")
  - `HIGHLIGHT_DURATION` - czas podświetlenia (250ms)
  - `NOTE_HIGHLIGHT_COLORS` - mapowanie nut na kolory
- `index.ts` - Eksporty publiczne

## Zależności

- `react` - Komponenty i hooki
- `tone` - Biblioteka audio (przez `usePianoSampler`)
- `tailwindcss` - Stylizacja

## Testowanie

Aby przetestować manualnie:

1. Otwórz stronę z komponentem Piano (np. `/game/play`)
2. Kliknij różne klawisze i sprawdź dźwięk
3. Przetestuj odtwarzanie sekwencji
4. Sprawdź responsywność na różnych ekranach
5. Przetestuj obsługę dotyku na tablecie

## Znane ograniczenia

1. Obsługuje 8 białych klawiszy (C4-B4 + C5) i 5 czarnych
2. Monofoniczne podczas interakcji użytkownika (ale polyphony 128 dla playback)
3. Wymaga obsługi audio w przeglądarce
4. Optymalizowane dla orientacji poziomej na urządzeniach mobilnych
5. Wymaga lokalnych próbek MP3 w `/public/audio/piano/`

## Przyszłe ulepszenia

- [ ] Wsparcie dla wielu oktaw
- [ ] Obsługa klawiatury komputera (QWERTY)
- [ ] Nagrywanie i odtwarzanie własnych sekwencji
- [ ] Wizualizacja fal dźwiękowych
- [ ] Różne instrumenty/sample packs
