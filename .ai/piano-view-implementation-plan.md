# Plan implementacji widoku Wirtualnego Pianina

## 1. Przegląd

Widok wirtualnego pianina jest kluczowym komponentem interfejsu gry Rytmik. Stanowi główny element interakcji użytkownika z aplikacją, umożliwiając dziecku odtwarzanie melodii i wprowadzanie odpowiedzi na zagadki muzyczne. Pianino jest monofoniczne (jedna nuta na raz), obejmuje jedną oktawę (12 klawiszy: 7 białych + 5 czarnych), obsługuje interakcję myszą i dotykiem, oraz wyświetla litery nut i kolory odpowiadające prawdziwemu pianinu.

Pianino jest integralną częścią ekranu gry (`/game/play`), gdzie użytkownik:

- Słucha odtwarzanej sekwencji początkowej z podświetlonymi klawiszami
- Wprowadza swoją odpowiedź klikając odpowiednie klawisze
- Otrzymuje natychmiastowy feedback wizualny i dźwiękowy
- Może swobodnie eksperymentować z dźwiękami między zagadkami

## 2. Routing widoku

Widok pianina nie jest samodzielną stroną, lecz komponentem React używanym w ramach strony `/game/play?profileId={id}`. Jest to chroniona ścieżka (protected route), wymagająca:

- Zalogowanego użytkownika (rodzica)
- Prawidłowego `profileId` w parametrach URL
- Aktywnej sesji gry dla wybranego profilu

Komponent pianina będzie renderowany w centralnej sekcji ekranu gry, pomiędzy panelem informacyjnym (górą) a przyciskami kontroli (dołem).

## 3. Struktura komponentów

```
Piano (główny kontener)
├── PianoKeysContainer (kontener klawiszy)
│   ├── BlackKeysRow (rząd czarnych klawiszy)
│   │   ├── PianoKey (C#, color: black)
│   │   ├── PianoKey (D#, color: black)
│   │   ├── Spacer (puste miejsce)
│   │   ├── PianoKey (F#, color: black)
│   │   ├── PianoKey (G#, color: black)
│   │   └── PianoKey (A#, color: black)
│   └── WhiteKeysRow (rząd białych klawiszy)
│       ├── PianoKey (C, color: white)
│       ├── PianoKey (D, color: white)
│       ├── PianoKey (E, color: white)
│       ├── PianoKey (F, color: white)
│       ├── PianoKey (G, color: white)
│       ├── PianoKey (A, color: white)
```

## 4. Szczegóły komponentów

### 4.1 Piano (główny kontener)

**Opis komponentu:**
Główny kontener odpowiedzialny za zarządzanie stanem pianina, koordynację odtwarzania dźwięków oraz komunikację z kontekstem gry. Obsługuje logikę podświetlania klawiszy podczas odtwarzania sekwencji oraz przekazuje kliknięcia do komponentu rodzica.

**Główne elementy HTML i komponenty dzieci:**

- `<div>` z klasami Tailwind dla layoutu (flex, responsywność)
- `<PianoKeysContainer>` - kontener zawierający wszystkie klawisze
- Wykorzystuje hook `usePianoSampler` do zarządzania audio

**Obsługiwane zdarzenia:**

- `onKeyPress(note: string)` - callback wywoływany gdy użytkownik kliknie klawisz
- `onSequenceComplete()` - callback wywoływany po zakończeniu odtwarzania sekwencji
- Wewnętrzna obsługa animacji podświetlania podczas playback

**Warunki walidacji:**

- Klawisze są wyłączone (`disabled`) podczas odtwarzania sekwencji (`isPlayingSequence === true`)
- Klawisze są wyłączone jeśli audio nie jest załadowane (`isLoaded === false`)
- Klawisze są aktywne tylko gdy gra jest w trybie wprowadzania odpowiedzi

**Typy:**

- `PianoProps` - interfejs propsów komponentu
- `PianoKeyData` - typ opisujący pojedynczy klawisz (nota, kolor, label)
- Wykorzystuje typy z `usePianoSampler` hook

**Propsy komponentu:**

```typescript
interface PianoProps {
  /** Callback wywoływany gdy użytkownik kliknie klawisz */
  onKeyPress: (note: string) => void;

  /** Tablica nut do podświetlenia (podczas playback) */
  highlightedKeys?: string[];

  /** Czy pianino jest wyłączone (podczas playback lub ładowania) */
  disabled?: boolean;

  /** Callback wywoływany po zakończeniu odtwarzania sekwencji */
  onSequenceComplete?: () => void;

  /** Sekwencja do automatycznego odtworzenia (jeśli podana) */
  sequenceToPlay?: string[];

  /** Czy automatycznie odtworzyć sekwencję po zamontowaniu */
  autoPlay?: boolean;
}
```

### 4.2 PianoKeysContainer

**Opis komponentu:**
Kontener layoutu dla klawiszy pianina, odpowiedzialny za prawidłowe rozmieszczenie białych i czarnych klawiszy w dwóch rzędach, imitując układ prawdziwego pianina.

**Główne elementy HTML i komponenty dzieci:**

- `<div>` z klasami dla pozycjonowania względnego
- `<BlackKeysRow>` - rząd czarnych klawiszy (pozycjonowany absolutnie, z góry)
- `<WhiteKeysRow>` - rząd białych klawiszy (pozycjonowany normalnie, na dole)

**Obsługiwane zdarzenia:**

- Brak bezpośrednich zdarzeń (przekazuje propsy do dzieci)

**Warunki walidacji:**

- Brak (komponent layoutu)

**Typy:**

- `PianoKeysContainerProps` - interfejs propsów

**Propsy komponentu:**

```typescript
interface PianoKeysContainerProps {
  children: React.ReactNode;
  className?: string;
}
```

### 4.3 BlackKeysRow

**Opis komponentu:**
Kontener dla czarnych klawiszy pianina (C#, D#, F#, G#, A#), z odpowiednimi spacerami imitującymi układ prawdziwego pianina (brak czarnego klawisza między E-F i B-C).

**Główne elementy HTML i komponenty dzieci:**

- `<div>` z klasami flex i pozycjonowaniem absolutnym
- 5 komponentów `<PianoKey>` dla czarnych klawiszy
- Spacery (puste `<div>`) dla prawidłowego rozmieszczenia

**Obsługiwane zdarzenia:**

- Brak (przekazuje zdarzenia do PianoKey)

**Warunki walidacji:**

- Brak

**Typy:**

- `BlackKeysRowProps`

**Propsy komponentu:**

```typescript
interface BlackKeysRowProps {
  keys: PianoKeyData[];
  onKeyClick: (note: string) => void;
  highlightedKeys: string[];
  disabled: boolean;
}
```

### 4.4 WhiteKeysRow

**Opis komponentu:**
Kontener dla białych klawiszy pianina (C, D, E, F, G, A, B), rozmieszczonych równomiernie w jednym rzędzie.

**Główne elementy HTML i komponenty dzieci:**

- `<div>` z klasami flex
- 7 komponentów `<PianoKey>` dla białych klawiszy

**Obsługiwane zdarzenia:**

- Brak (przekazuje zdarzenia do PianoKey)

**Warunki walidacji:**

- Brak

**Typy:**

- `WhiteKeysRowProps`

**Propsy komponentu:**

```typescript
interface WhiteKeysRowProps {
  keys: PianoKeyData[];
  onKeyClick: (note: string) => void;
  highlightedKeys: string[];
  disabled: boolean;
}
```

### 4.5 PianoKey

**Opis komponentu:**
Pojedynczy klawisz pianina. Reprezentuje jedną nutę, wyświetla jej literę, obsługuje kliknięcia, podświetlenia i animacje. Stylizowany zgodnie z kolorem (biały/czarny) i stanem (normalny, podświetlony, wciśnięty, wyłączony).

**Główne elementy HTML i komponenty dzieci:**

- `<button>` z odpowiednimi klasami Tailwind
- `<span>` dla wyświetlenia litery nuty
- Wykorzystuje `aria-label` dla dostępności
- Wykorzystuje `aria-pressed` dla stanu podświetlenia

**Obsługiwane zdarzenia:**

- `onClick` - odtworzenie dźwięku i wywołanie callback z rodzica
- `onMouseDown` / `onMouseUp` - animacja wciśnięcia
- `onTouchStart` / `onTouchEnd` - obsługa dotyku (mobile/tablet)

**Warunki walidacji:**

- Wyłączony gdy `disabled === true`
- Wyłączony gdy audio nie jest załadowane
- Animacja wciśnięcia tylko gdy klawisz aktywny

**Typy:**

- `PianoKeyProps`
- `PianoKeyColor` - typ enum dla koloru ('white' | 'black')

**Propsy komponentu:**

```typescript
interface PianoKeyProps {
  /** Nuta w formacie Tone.js (np. "C4", "C#4") */
  note: string;

  /** Litera wyświetlana na klawiszu (np. "C", "C#") */
  label: string;

  /** Kolor klawisza */
  color: "white" | "black";

  /** Czy klawisz jest podświetlony (podczas playback) */
  isHighlighted: boolean;

  /** Czy klawisz jest wyłączony */
  isDisabled: boolean;

  /** Callback wywoływany po kliknięciu */
  onClick: (note: string) => void;

  /** Callback do odtworzenia dźwięku */
  onPlaySound?: (note: string) => void;
}
```

## 5. Typy

### 5.1 Typy komponentów pianina

```typescript
/**
 * Dane opisujące pojedynczy klawisz pianina
 */
interface PianoKeyData {
  /** Nuta w formacie Tone.js (np. "C4", "C#4") */
  note: string;

  /** Litera wyświetlana na klawiszu (np. "C", "C#") */
  label: string;

  /** Kolor klawisza */
  color: "white" | "black";
}

/**
 * Typ koloru klawisza
 */
type PianoKeyColor = "white" | "black";

/**
 * Stan pojedynczego klawisza
 */
type PianoKeyState = "default" | "highlighted" | "pressed" | "disabled";

/**
 * Konfiguracja oktawy pianina
 */
interface PianoOctaveConfig {
  /** Numer oktawy (np. 4 dla C4-B4) */
  octave: number;

  /** Tablica klawiszy w oktawie */
  keys: PianoKeyData[];
}
```

### 5.2 Typy z usePianoSampler hook

```typescript
/**
 * Opcje dla hooka usePianoSampler
 */
interface UsePianoSamplerOptions {
  oscillator?: Tone.OmniOscillatorOptions;
}

/**
 * Zwracany typ z hooka usePianoSampler
 */
interface UsePianoSamplerReturn {
  /** Funkcja do odtworzenia pojedynczej nuty */
  playNote: (note: string, duration?: string) => void;

  /** Funkcja do odtworzenia sekwencji nut */
  playSequence: (notes: string[], duration?: string, interval?: number) => void;

  /** Czy audio jest załadowane i gotowe */
  isLoaded: boolean;
}
```

### 5.3 Typy z kontekstu gry (GameContext)

```typescript
/**
 * Stan gry (z GameContext)
 */
interface GameState {
  currentLevel: number;
  totalScore: number;
  attemptsLeft: number;
  completedTasksInLevel: number;
  currentTask: CurrentTask | null;
  selectedNotes: string[];
  isPlayingSequence: boolean;

  // Metody
  addNote: (note: string) => void;
  clearNotes: () => void;
  submitAnswer: () => Promise<void>;
  playSequence: () => Promise<void>;
  resetTask: () => void;
}

/**
 * Aktualne zadanie
 */
interface CurrentTask {
  sequenceId: string;
  levelId: number;
  sequenceBeginning: string[];
  expectedSlots: number;
}
```

### 5.4 Typy DTO z API (z src/types.ts)

```typescript
/**
 * Odpowiedź z endpointu generowania zagadki
 */
interface GeneratePuzzleDTO {
  sequenceId: string;
  levelId: number;
  sequenceBeginning: string;
  expectedSlots: number;
}

/**
 * Odpowiedź z endpointu submitu odpowiedzi
 */
interface SubmitAnswerResponseDTO {
  score: number;
  attemptsUsed: number;
  levelCompleted: boolean;
  nextLevel: number;
}
```

## 6. Zarządzanie stanem

### 6.1 Stan lokalny komponentu Piano

Komponent `Piano` zarządza własnym stanem lokalnym:

```typescript
const [isPressed, setIsPressed] = useState<string | null>(null); // aktualnie wciśnięty klawisz
const [highlightSequence, setHighlightSequence] = useState<string[]>([]); // sekwencja do podświetlenia
const [currentHighlightIndex, setCurrentHighlightIndex] = useState<number>(-1); // indeks aktualnie podświetlonego klawisza
```

### 6.2 Stan z hooka usePianoSampler

```typescript
const { playNote, playSequence, isLoaded } = usePianoSampler();
```

Hook `usePianoSampler` zarządza:

- Instancją Tone.js PolySynth
- Stanem załadowania audio (`isLoaded`)
- Metodami do odtwarzania dźwięków

### 6.3 Stan z GameContext

Komponent `Piano` konsumuje stan z `GameContext`:

```typescript
const { isPlayingSequence, currentTask, addNote, selectedNotes } = useGame();
```

`GameContext` dostarcza:

- `isPlayingSequence` - czy aktualnie odtwarzana jest sekwencja (pianino wyłączone)
- `currentTask` - aktualne zadanie z sekwencją początkową
- `addNote(note)` - metoda do dodania nuty do odpowiedzi użytkownika
- `selectedNotes` - tablica wybranych nut przez użytkownika

### 6.4 Przepływ stanu

1. **Montowanie komponentu:**
   - Hook `usePianoSampler` inicjalizuje Tone.js
   - Stan `isLoaded` zmienia się na `true` po załadowaniu
   - Pianino jest wyłączone dopóki `isLoaded === false`

2. **Odtwarzanie sekwencji (playback):**
   - `GameContext` ustawia `isPlayingSequence = true`
   - Komponent `Piano` otrzymuje `sequenceToPlay` z `currentTask.sequenceBeginning`
   - Wywołuje `playSequence()` z hooka
   - Podświetla klawisze synchronicznie z dźwiękiem
   - Po zakończeniu wywołuje `onSequenceComplete()`, `GameContext` ustawia `isPlayingSequence = false`

3. **Wprowadzanie odpowiedzi:**
   - Użytkownik klika klawisz
   - `PianoKey` wywołuje `onClick(note)`
   - `Piano` wywołuje `playNote(note)` (dźwięk)
   - `Piano` wywołuje `onKeyPress(note)` (callback do rodzica)
   - Rodzic wywołuje `addNote(note)` z `GameContext`
   - `GameContext` dodaje nutę do `selectedNotes`
   - Sloty odpowiedzi aktualizują się (komponent `AnswerSlots`)

4. **Czyszczenie odpowiedzi:**
   - Użytkownik klika "Wyczyść"
   - `GameContext.clearNotes()` czyści `selectedNotes`
   - Sloty odpowiedzi są puste

5. **Submit odpowiedzi:**
   - Użytkownik klika "Sprawdź"
   - `GameContext.submitAnswer()` wysyła request do API
   - Otrzymuje `SubmitAnswerResponseDTO`
   - Aktualizuje stan gry (score, attempts, level)
   - Wyświetla feedback (animacje, dźwięki)

## 7. Integracja API

Komponent `Piano` **nie komunikuje się bezpośrednio z API**. Cała komunikacja odbywa się przez `GameContext`, który wykorzystuje TanStack Query mutations.

### 7.1 Pobieranie zadania

**Endpoint:** `POST /api/profiles/{profileId}/tasks/next`

**Typ żądania:** Brak body (POST bez parametrów)

**Typ odpowiedzi:** `GeneratePuzzleDTO`

```typescript
interface GeneratePuzzleDTO {
  sequenceId: string;
  levelId: number;
  sequenceBeginning: string; // format: "C-E-G" (nuty oddzielone myślnikiem)
  expectedSlots: number;
}
```

**Wykorzystanie w komponencie:**

- `GameContext` wywołuje mutation po zamontowaniu `/game/play`
- Parsuje `sequenceBeginning` na tablicę nut: `"C-E-G".split("-")` → `["C", "E", "G"]`
- Przekazuje do komponentu `Piano` jako `sequenceToPlay`
- Komponent automatycznie odtwarza sekwencję (`autoPlay={true}`)

### 7.2 Wysyłanie odpowiedzi

**Endpoint:** `POST /api/profiles/{profileId}/tasks/{sequenceId}/submit`

**Typ żądania:** `SubmitAnswerCommand`

```typescript
interface SubmitAnswerCommand {
  answer: string; // format: "A-B-C" (nuty oddzielone myślnikiem)
}
```

**Typ odpowiedzi:** `SubmitAnswerResponseDTO`

```typescript
interface SubmitAnswerResponseDTO {
  score: number;
  attemptsUsed: number;
  levelCompleted: boolean;
  nextLevel: number;
}
```

**Wykorzystanie w komponencie:**

- Użytkownik wypełnia sloty klikając klawisze pianina
- `GameContext.selectedNotes` zawiera tablicę: `["A", "B", "C"]`
- Użytkownik klika "Sprawdź"
- `GameContext.submitAnswer()` konwertuje tablicę na string: `selectedNotes.join("-")` → `"A-B-C"`
- Wysyła request z `SubmitAnswerCommand`
- Otrzymuje `SubmitAnswerResponseDTO`
- Aktualizuje stan gry i wyświetla feedback

## 8. Interakcje użytkownika

### 8.1 Kliknięcie klawisza (tryb wprowadzania odpowiedzi)

**Akcja użytkownika:** Kliknięcie myszą lub dotknięcie klawisza pianina

**Przepływ:**

1. Użytkownik klika klawisz "C"
2. `PianoKey` wywołuje `onClick("C4")`
3. Animacja wciśnięcia klawisza (scale down, zmiana koloru)
4. `Piano` wywołuje `playNote("C4")` - odtworzenie dźwięku
5. `Piano` wywołuje `onKeyPress("C4")` - callback do rodzica
6. Rodzic (`GamePlayView`) wywołuje `GameContext.addNote("C")`
7. Nuta dodana do `selectedNotes`
8. Komponent `AnswerSlots` aktualizuje się, wypełniając kolejny slot literą "C" i kolorem

**Warunki:**

- Pianino nie jest wyłączone (`disabled === false`)
- Audio jest załadowane (`isLoaded === true`)
- Nie trwa odtwarzanie sekwencji (`isPlayingSequence === false`)
- Sloty nie są pełne (liczba `selectedNotes < expectedSlots`)

**Feedback:**

- Wizualny: Animacja wciśnięcia klawisza, wypełnienie slotu
- Dźwiękowy: Odtworzenie nuty
- Haptyczny (opcjonalnie): Wibracja na urządzeniach mobilnych

### 8.2 Odtworzenie sekwencji (playback)

**Akcja użytkownika:** Automatyczne po załadowaniu zadania lub kliknięcie "Odtwórz ponownie"

**Przepływ:**

1. Użytkownik klika "Odtwórz ponownie" lub zadanie się ładuje
2. `GameContext` ustawia `isPlayingSequence = true`
3. Pianino otrzymuje `sequenceToPlay = ["C", "E", "G"]`
4. Komponent `Piano` wywołuje `playSequence(["C4", "E4", "G4"], "8n", 0.5)`
5. Dla każdej nuty w sekwencji (z opóźnieniem 0.5s):
   - Podświetlenie odpowiedniego klawisza (`isHighlighted = true`)
   - Odtworzenie dźwięku
   - Usunięcie podświetlenia po zakończeniu nuty
6. Po zakończeniu sekwencji:
   - Wywołanie `onSequenceComplete()`
   - `GameContext` ustawia `isPlayingSequence = false`
   - Pianino staje się aktywne, użytkownik może wprowadzać odpowiedź

**Warunki:**

- Audio jest załadowane (`isLoaded === true`)
- Sekwencja jest dostępna (`sequenceToPlay.length > 0`)

**Feedback:**

- Wizualny: Podświetlenie klawiszy synchronicznie z dźwiękiem
- Dźwiękowy: Odtworzenie sekwencji melodii
- Stan UI: Pianino wyłączone, przyciski "Odtwórz ponownie" i "Sprawdź" wyłączone

### 8.3 Free play (swobodne granie)

**Akcja użytkownika:** Kliknięcie klawiszy poza trybem wprowadzania odpowiedzi

**Przepływ:**

1. Użytkownik klika dowolny klawisz
2. Odtworzenie dźwięku (jak w 8.1)
3. **Brak** dodawania nuty do `selectedNotes` (tryb free play)
4. Użytkownik może eksperymentować z dźwiękami

**Warunki:**

- Pianino nie jest w trybie wprowadzania odpowiedzi (np. między zadaniami)
- Lub rodzic włączył tryb free play

**Feedback:**

- Tylko dźwiękowy i wizualny (animacja klawisza)
- Brak wypełniania slotów

### 8.4 Obsługa błędów interakcji

**Scenariusz 1: Kliknięcie podczas playback**

- Kliknięcie ignorowane (klawisze wyłączone)
- Brak dźwięku, brak animacji
- Opcjonalnie: Subtelny komunikat "Poczekaj na zakończenie melodii"

**Scenariusz 2: Kliknięcie gdy audio nie załadowane**

- Kliknięcie ignorowane
- Komunikat: "Ładowanie dźwięków..."

**Scenariusz 3: Próba dodania więcej nut niż slotów**

- Kliknięcie ignorowane
- Opcjonalnie: Subtelna animacja shake na slotach
- Komunikat: "Wszystkie sloty wypełnione. Kliknij 'Sprawdź' lub 'Wyczyść'"

## 9. Warunki i walidacja

### 9.1 Warunki wyłączenia pianina

**Komponent:** `Piano`

**Warunek 1: Audio nie załadowane**

```typescript
disabled = !isLoaded;
```

- Wszystkie klawisze wyłączone
- Wyświetlany komunikat: "Ładowanie dźwięków..."
- Kolor klawiszy: przygaszony (opacity-50)

**Warunek 2: Odtwarzanie sekwencji**

```typescript
disabled = isPlayingSequence;
```

- Wszystkie klawisze wyłączone
- Klawisze podświetlane synchronicznie z odtwarzaniem
- Brak reakcji na kliknięcia

**Warunek 3: Sloty pełne**

```typescript
disabled = selectedNotes.length >= expectedSlots;
```

- Klawisze wyłączone (opcjonalnie)
- Lub kliknięcia ignorowane w logice `onKeyPress`
- Użytkownik musi kliknąć "Sprawdź" lub "Wyczyść"

### 9.2 Warunki podświetlenia klawiszy

**Komponent:** `PianoKey`

**Warunek: Klawisz w sekwencji playback**

```typescript
isHighlighted = highlightedKeys.includes(note);
```

- Klawisz podświetlony jasnym kolorem
- Synchronizacja z odtwarzanym dźwiękiem
- Animacja fade-in/fade-out

### 9.3 Walidacja formatu nut

**Komponent:** `Piano`

**Warunek: Prawidłowy format nuty**

- Nuty z API w formacie: `"C"`, `"C#"`, `"D"`, etc. (bez oktawy)
- Konwersja do formatu Tone.js: `note + "4"` → `"C4"`, `"C#4"`
- Walidacja: Nuta musi być w zakresie C-B (z opcjonalnymi #)

```typescript
const isValidNote = (note: string): boolean => {
  const validNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#"];
  return validNotes.includes(note);
};
```

### 9.4 Warunki responsywności

**Komponent:** `Piano`, `PianoKey`

**Warunek: Rozmiar ekranu**

- Tablet landscape (≥768px): Pełny rozmiar klawiszy
- Desktop (≥1024px): Większe klawisze, więcej przestrzeni
- Mobile (<768px): Komunikat o preferowanej orientacji poziomej

**Implementacja:**

```typescript
// Tailwind classes
className="
  w-full max-w-4xl mx-auto
  md:scale-100 lg:scale-110
  px-4 md:px-8
"
```

## 10. Obsługa błędów

### 10.1 Błąd ładowania audio

**Scenariusz:** Tone.js nie może zainicjalizować audio context lub wystąpił błąd podczas ładowania

**Obsługa:**

1. Hook `usePianoSampler` ustawia `isLoaded = false`
2. Komponent `Piano` wyświetla komunikat błędu:
   ```
   "Nie udało się załadować dźwięków pianina.
   Sprawdź połączenie i odśwież stronę."
   ```
3. Przycisk "Spróbuj ponownie" wywołuje ponowną inicjalizację
4. Przycisk "Wróć do profili" przekierowuje do `/profiles`

**Implementacja:**

```typescript
useEffect(() => {
  try {
    // inicjalizacja Tone.js
  } catch (error) {
    console.error("Piano audio initialization failed:", error);
    setIsLoaded(false);
    setError("Nie udało się załadować dźwięków pianina.");
  }
}, []);
```

### 10.2 Błąd odtwarzania dźwięku

**Scenariusz:** Pojedynczy dźwięk nie może być odtworzony (np. problem z audio context)

**Obsługa:**

1. Metoda `playNote()` zawiera try-catch
2. Błąd logowany w konsoli (nie blokuje UI)
3. Użytkownik może kontynuować (inne nuty mogą działać)
4. Jeśli błąd się powtarza, wyświetl toast: "Problem z odtwarzaniem dźwięku"

**Implementacja:**

```typescript
const playNote = (note: string, duration = "8n") => {
  try {
    if (!synthRef.current || !isLoaded) return;
    synthRef.current.triggerAttackRelease(note, duration);
  } catch (error) {
    console.error(`Failed to play note ${note}:`, error);
    // Opcjonalnie: toast.error("Problem z odtwarzaniem dźwięku");
  }
};
```

### 10.3 Błąd synchronizacji playback

**Scenariusz:** Podświetlenie klawiszy nie jest zsynchronizowane z dźwiękiem

**Obsługa:**

1. Użyj `Tone.now()` dla precyzyjnego timingu
2. Synchronizuj podświetlenie z harmonogramem Tone.js
3. Jeśli desynchronizacja, użytkownik może kliknąć "Odtwórz ponownie"

**Implementacja:**

```typescript
const playSequenceWithHighlights = (notes: string[], interval = 0.5) => {
  const now = Tone.now();
  notes.forEach((note, index) => {
    const time = now + index * interval;

    // Zaplanuj dźwięk
    synthRef.current?.triggerAttackRelease(note, "8n", time);

    // Zaplanuj podświetlenie (synchronicznie)
    setTimeout(
      () => {
        setHighlightedKeys([note]);
        setTimeout(() => setHighlightedKeys([]), interval * 1000 * 0.8);
      },
      index * interval * 1000
    );
  });
};
```

### 10.4 Błąd interakcji na urządzeniach mobilnych

**Scenariusz:** Problemy z obsługą dotyku (touch events)

**Obsługa:**

1. Użyj zarówno `onClick` jak i `onTouchStart`/`onTouchEnd`
2. Zapobiegaj duplikowaniu zdarzeń (`preventDefault` na touch)
3. Testuj na różnych urządzeniach

**Implementacja:**

```typescript
const handleKeyInteraction = (note: string) => {
  playNote(note);
  onKeyPress(note);
};

<button
  onClick={handleKeyInteraction}
  onTouchStart={(e) => {
    e.preventDefault();
    handleKeyInteraction(note);
  }}
  // ...
>
```

### 10.5 Przypadki brzegowe

**Przypadek 1: Szybkie wielokrotne kliknięcia**

- Debounce kliknięć (np. 50ms)
- Lub pozwól na wielokrotne kliknięcia (polifoniczny synth obsłuży)

**Przypadek 2: Użytkownik opuszcza stronę podczas playback**

- Cleanup w `useEffect` (dispose Tone.js)
- Zatrzymaj wszystkie zaplanowane dźwięki

**Przypadek 3: Zmiana zadania podczas playback**

- Anuluj aktualny playback
- Wyczyść podświetlenia
- Rozpocznij nowy playback dla nowego zadania

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

1. Utwórz folder `src/components/game/piano/`
2. Utwórz pliki:
   - `Piano.tsx` (główny komponent)
   - `PianoKeysContainer.tsx`
   - `PianoKey.tsx`
   - `BlackKeysRow.tsx`
   - `WhiteKeysRow.tsx`
   - `piano.types.ts` (typy)
   - `piano.constants.ts` (stałe, konfiguracja klawiszy)

### Krok 2: Implementacja typów i stałych

1. W `piano.types.ts` zdefiniuj wszystkie interfejsy:
   - `PianoProps`
   - `PianoKeyProps`
   - `PianoKeyData`
   - `PianoKeyColor`
   - `PianoKeyState`
2. W `piano.constants.ts` zdefiniuj konfigurację klawiszy:

   ```typescript
   export const WHITE_KEYS: PianoKeyData[] = [
     { note: "C4", label: "C", color: "white" },
     { note: "D4", label: "D", color: "white" },
     // ... pozostałe
   ];

   export const BLACK_KEYS: PianoKeyData[] = [
     { note: "C#4", label: "C#", color: "black" },
     { note: "D#4", label: "D#", color: "black" },
     // ... pozostałe
   ];
   ```

### Krok 3: Implementacja komponentu PianoKey

1. Utwórz podstawową strukturę komponentu z `<button>`
2. Zaimplementuj propsy i typy
3. Dodaj style Tailwind dla białych i czarnych klawiszy:
   - Białe: `bg-white border-gray-800 h-32 w-16`
   - Czarne: `bg-gray-900 text-white h-20 w-12`
4. Dodaj stany wizualne:
   - Default: normalne kolory
   - Highlighted: `bg-yellow-200` (białe), `bg-yellow-600` (czarne)
   - Pressed: `scale-95 bg-gray-200` (animacja)
   - Disabled: `opacity-50 cursor-not-allowed`
5. Zaimplementuj obsługę zdarzeń:
   - `onClick` → wywołaj `onClick(note)`
   - `onMouseDown` → ustaw stan pressed
   - `onMouseUp` → usuń stan pressed
   - `onTouchStart` / `onTouchEnd` → obsługa dotyku
6. Dodaj atrybuty dostępności:
   - `aria-label={`Klawisz ${label}`}`
   - `aria-pressed={isHighlighted}`
   - `disabled={isDisabled}`
7. Dodaj animacje CSS (Tailwind):
   - `transition-all duration-150 ease-in-out`
   - `active:scale-95`

### Krok 4: Implementacja komponentów rzędów klawiszy

1. **WhiteKeysRow:**
   - Kontener flex: `flex flex-row gap-1 justify-center`
   - Mapuj `WHITE_KEYS` na komponenty `<PianoKey>`
   - Przekaż propsy: `onKeyClick`, `highlightedKeys`, `disabled`

2. **BlackKeysRow:**
   - Kontener flex z pozycjonowaniem absolutnym: `absolute top-0 left-0 right-0 flex flex-row justify-around`
   - Mapuj `BLACK_KEYS` z spacerami:
     ```typescript
     const layout = [
       BLACK_KEYS[0], // C#
       BLACK_KEYS[1], // D#
       null, // spacer (brak klawisza między E-F)
       BLACK_KEYS[2], // F#
       BLACK_KEYS[3], // G#
       BLACK_KEYS[4], // A#
     ];
     ```
   - Renderuj `<PianoKey>` lub `<div className="w-12" />` dla spacera

### Krok 5: Implementacja kontenera PianoKeysContainer

1. Utwórz kontener z pozycjonowaniem względnym:
   ```typescript
   <div className="relative w-full max-w-4xl mx-auto">
     {children}
   </div>
   ```
2. Renderuj `<BlackKeysRow>` i `<WhiteKeysRow>`

### Krok 6: Implementacja głównego komponentu Piano

1. Zaimportuj hook `usePianoSampler`:
   ```typescript
   const { playNote, playSequence, isLoaded } = usePianoSampler();
   ```
2. Zdefiniuj stan lokalny:
   ```typescript
   const [highlightedKeys, setHighlightedKeys] = useState<string[]>([]);
   const [isPlaying, setIsPlaying] = useState(false);
   ```
3. Zaimplementuj funkcję `handleKeyPress`:
   ```typescript
   const handleKeyPress = (note: string) => {
     if (disabled || isPlaying) return;
     playNote(note);
     onKeyPress(note);
   };
   ```
4. Zaimplementuj funkcję `handlePlaySequence`:

   ```typescript
   const handlePlaySequence = async (sequence: string[]) => {
     setIsPlaying(true);
     const interval = 0.5; // 500ms między nutami

     for (let i = 0; i < sequence.length; i++) {
       const note = sequence[i];
       setHighlightedKeys([note]);
       playNote(note);
       await new Promise((resolve) => setTimeout(resolve, interval * 1000));
     }

     setHighlightedKeys([]);
     setIsPlaying(false);
     onSequenceComplete?.();
   };
   ```

5. Dodaj `useEffect` dla auto-play:
   ```typescript
   useEffect(() => {
     if (autoPlay && sequenceToPlay && sequenceToPlay.length > 0) {
       handlePlaySequence(sequenceToPlay);
     }
   }, [autoPlay, sequenceToPlay]);
   ```
6. Renderuj strukturę:
   ```typescript
   return (
     <div className="flex flex-col items-center gap-4">
       {!isLoaded && <div>Ładowanie dźwięków...</div>}
       <PianoKeysContainer>
         <BlackKeysRow
           keys={BLACK_KEYS}
           onKeyClick={handleKeyPress}
           highlightedKeys={highlightedKeys}
           disabled={disabled || !isLoaded || isPlaying}
         />
         <WhiteKeysRow
           keys={WHITE_KEYS}
           onKeyClick={handleKeyPress}
           highlightedKeys={highlightedKeys}
           disabled={disabled || !isLoaded || isPlaying}
         />
       </PianoKeysContainer>
     </div>
   );
   ```

### Krok 7: Integracja z GameContext

1. W komponencie rodzica (`GamePlayView` lub podobny):

   ```typescript
   const { addNote, isPlayingSequence, currentTask } = useGame();

   const handleKeyPress = (note: string) => {
     // Usuń oktawę z nuty (C4 → C)
     const noteWithoutOctave = note.replace(/\d+$/, "");
     addNote(noteWithoutOctave);
   };

   const sequenceToPlay = currentTask?.sequenceBeginning.split("-").map((n) => n + "4");
   ```

2. Renderuj komponent `Piano`:
   ```typescript
   <Piano
     onKeyPress={handleKeyPress}
     disabled={isPlayingSequence}
     sequenceToPlay={sequenceToPlay}
     autoPlay={true}
     onSequenceComplete={() => {
       // Zaktualizuj stan w GameContext
     }}
   />
   ```

### Krok 8: Stylizacja i responsywność

1. Dodaj responsywne klasy Tailwind:
   - Klawisze białe: `h-24 w-12 md:h-32 md:w-16 lg:h-40 lg:w-20`
   - Klawisze czarne: `h-16 w-8 md:h-20 md:w-12 lg:h-24 lg:w-14`
2. Dodaj animacje:
   - Hover: `hover:brightness-110`
   - Active: `active:scale-95 active:brightness-90`
   - Highlight: `animate-pulse` (opcjonalnie)
3. Dodaj cienie dla głębi:
   - Białe: `shadow-md hover:shadow-lg`
   - Czarne: `shadow-lg`
4. Zaokrąglenie rogów:
   - Białe: `rounded-b-lg`
   - Czarne: `rounded-b-md`

### Krok 9: Dodanie obsługi błędów

1. Dodaj try-catch w `handleKeyPress` i `handlePlaySequence`
2. Dodaj stan błędu:
   ```typescript
   const [error, setError] = useState<string | null>(null);
   ```
3. Wyświetl komunikat błędu jeśli wystąpi:
   ```typescript
   {error && (
     <Alert variant="destructive">
       <AlertTitle>Błąd</AlertTitle>
       <AlertDescription>{error}</AlertDescription>
     </Alert>
   )}
   ```

### Krok 10: Dodanie atrybutów dostępności

1. Dodaj `role="region"` i `aria-label="Pianino"` do głównego kontenera
2. Dodaj `aria-live="polite"` do obszaru komunikatów
3. Dodaj `aria-busy={isPlaying}` podczas playback
4. Testuj nawigację klawiaturą (Tab, Enter, Space)
5. Testuj ze screen readerem (NVDA/JAWS)

### Krok 11: Testowanie

1. **Test jednostkowy (opcjonalnie):**
   - Test renderowania komponentu
   - Test kliknięcia klawisza
   - Test odtwarzania sekwencji
2. **Test integracyjny:**
   - Test z `GameContext`
   - Test z `usePianoSampler`
3. **Test manualny:**
   - Kliknięcie wszystkich klawiszy (dźwięk + animacja)
   - Odtworzenie sekwencji (podświetlenia + dźwięk)
   - Wprowadzenie odpowiedzi (wypełnienie slotów)
   - Wyłączenie podczas playback
   - Responsywność (tablet, desktop)
   - Obsługa dotyku (tablet)
4. **Test dostępności:**
   - Lighthouse accessibility audit
   - Nawigacja klawiaturą
   - Screen reader

### Krok 12: Optymalizacja wydajności

1. Memoizacja komponentów:
   ```typescript
   export const PianoKey = React.memo(PianoKeyComponent);
   ```
2. Użyj `useCallback` dla handlerów:
   ```typescript
   const handleKeyPress = useCallback(
     (note: string) => {
       // ...
     },
     [disabled, isPlaying, onKeyPress]
   );
   ```
3. Debounce szybkich kliknięć (opcjonalnie)
4. Lazy load Tone.js (już zaimplementowane w `usePianoSampler`)

### Krok 13: Dokumentacja

1. Dodaj JSDoc komentarze do wszystkich komponentów
2. Dodaj przykłady użycia w komentarzach
3. Zaktualizuj README projektu (jeśli istnieje)

### Krok 14: Integracja z resztą aplikacji

1. Zaimportuj komponent `Piano` w widoku gry (`/game/play`)
2. Przetestuj pełny przepływ gry:
   - Załadowanie zadania
   - Odtworzenie sekwencji
   - Wprowadzenie odpowiedzi
   - Submit i feedback
   - Następne zadanie
3. Przetestuj z prawdziwymi danymi z API

### Krok 15: Finalne poprawki

1. Sprawdź linter errors: `npm run lint`
2. Popraw wszystkie błędy TypeScript
3. Sprawdź formatowanie: `npm run format`
4. Commit zmian z opisowym komunikatem:

   ```
   feat(game): implement virtual piano component

   - Add Piano, PianoKey, and layout components
   - Integrate with usePianoSampler hook
   - Add keyboard and touch support
   - Implement sequence playback with highlights
   - Add accessibility attributes (ARIA)
   - Add responsive styles for tablet/desktop
   ```

---

**Koniec planu implementacji**

Ten plan zapewnia kompleksowe wytyczne do implementacji widoku wirtualnego pianina w aplikacji Rytmik. Komponent jest zaprojektowany jako reużywalny, dostępny, responsywny i zintegrowany z resztą architektury aplikacji (GameContext, usePianoSampler, TanStack Query).
