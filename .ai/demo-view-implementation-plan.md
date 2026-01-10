# Plan implementacji widoku Demo (/demo)

## 1. Przegląd
Widok **Demo** umożliwia użytkownikowi natychmiastowe wypróbowanie gry bez konieczności zakładania konta. Oferuje uproszczoną rozgrywkę (poziomy 1-3), lokalne przechowywanie stanu i cykliczne przypomnienia o rejestracji. Celem jest wciągnięcie gracza i zachęcenie do rejestracji, gdy zobaczy pełny potencjał aplikacji.

## 2. Routing widoku
```
/src/pages/demo.astro        ⇒ /public/demo (SSR: false)  
```
Strona publiczna, bez middleware auth.

## 3. Struktura komponentów
```
DemoPage (Astro)
└─ <DemoGameApp/> (React)
   ├─ <DemoBanner/>
   ├─ <GameHeader/>            (reuse, prop: demoMode)
   ├─ <GamePlayArea/>
   │   ├─ <Piano/>
   │   ├─ <AnswerSlots/>
   │   └─ <GameControls/>      (reuse, prop: demoMode)
   └─ <RegistrationPromptModal/>
```

## 4. Szczegóły komponentów
### DemoBanner
- **Opis**: Przyklejony pasek na górze informujący o trybie demo.
- **Elementy**: `<div class="sticky top-0 bg-yellow-400 text-black flex justify-between px-4 py-2">` z tekstem i przyciskiem „Zarejestruj się”.
- **Interakcje**: Kliknięcie przycisku → `navigate('/register')`.
- **Walidacja**: Brak (statyczny).
- **Typy**: none.
- **Propsy**: none.

### DemoGameApp
- **Opis**: Główny kontener React trzymający stan gry demo.
- **Elementy**: renderuje dzieci wg hierarchii.
- **Interakcje**:
  - Start gry, uzupełnianie slotów, zatwierdzanie odpowiedzi.
  - Po 5–10 zadaniach wyzwala okno modalne.
  - Po ukończeniu poziomu 3 wyświetla modal końcowy.
- **Walidacja**: Spójność lokalnego stanu (level 1-3, max attempts 3, etc.).
- **Typy**: `DemoGameState`, `LevelConfig`, `DemoTask`.
- **Propsy**: none.

### GameHeader (reuse)
- **Opis**: Pasek informacji (level, score).
- **Zmiany**: Prop `demoMode` ⇒ ukrywa licznik prób.

### GamePlayArea (nowy thin wrapper)
- **Opis**: Komponuje Piano, AnswerSlots, GameControls.
- **Propsy**: `puzzle`, `onAnswer`, `disabled`.

### RegistrationPromptModal
- **Opis**: Modal zachęcający do rejestracji.
- **Elementy**: Shadcn/ui `<Dialog/>` z tekstem i dwoma przyciskami.
- **Interakcje**: Primary → `navigate('/register')`, Secondary → `onClose()`.
- **Walidacja**: focus-trap, aria-label.
- **Typy**: `RegistrationPromptVariant` (early | final).
- **Propsy**: `{ variant, isOpen, onClose }`.

## 5. Typy
```ts
// Uproszczony przykład
export interface LevelConfig {
  id: 1 | 2 | 3;
  seqLength: number;
  tempo: number;
  useBlackKeys: boolean;
}

export interface DemoTask {
  id: string;        // uuid v4
  levelId: 1 | 2 | 3;
  beginning: string; // "C-E-G"
  expectedSlots: number;
}

export interface DemoGameState {
  level: 1 | 2 | 3;
  taskCount: number;         // ukończone zadania w aktualnej sesji
  score: number;
  currentTask: DemoTask;
  showPrompt: boolean;
  promptVariant: 'early' | 'final';
}
```

## 6. Zarządzanie stanem
- Lokalny hook `useDemoGame()` przechowuje `DemoGameState` w `useReducer`.
- Akcje: `START`, `SUBMIT_ANSWER`, `NEXT_TASK`, `SHOW_PROMPT`, `CLOSE_PROMPT`, `LOAD_SEQUENCES`.
- **Pobieranie sekwencji**: Hook używa TanStack Query do pobrania prawdziwych sekwencji z DB dla poziomów 1-3
- **Cache**: Sekwencje cache'owane w pamięci (TanStack Query cache)
- **Brak synchronizacji postępów**: Wyniki gry nie są zapisywane w DB; dane znikają przy odświeżeniu.

## 7. Integracja API
**Read-only API calls** (bez mutacji):
- `GET /api/demo/sequences` → Pobierz prawdziwe sekwencje z bazy danych dla poziomu 1
- **UWAGA**: Obecnie tylko poziom 1 jest dostępny w demo (15 sekwencji w DB)
- **TODO**: Dodać sekwencje dla poziomów 2-3 w przyszłości
- **Cache lokalny**: Sekwencje cache'owane przez TanStack Query (5 min stale, 10 min gc)
- **Brak mutacji**: Żadnych POST/PATCH/DELETE - postępy nie są zapisywane w DB

## 8. Interakcje użytkownika
1. Wejście na `/demo` → render.
2. Klik przycisku klawisza pianina → dźwięk + wypełnienie slotu.
3. Klik „✔︎” w GameControls → local validation, wynik w GameHeader.
4. Po 5-10 wypełnionych zadaniach → `RegistrationPromptModal`.
5. Klik „Zarejestruj się” (banner lub modal) → przejście do `/register`.
6. Po ukończeniu poziomu 3 → modal końcowy.

## 9. Warunki i walidacja
- Maks. 3 próby na zadanie (opcjonalne w demo, brak licznika UI).
- Poziom wzrasta co 5 poprawnych zadań, max 3.
- Modal wczesny po `taskCount ∈ [5,10]` i nie został wcześniej odrzucony w tej sesji.
- Modal końcowy po ukończeniu level 3.
- Klawisze pianina blokowane, gdy sloty pełne.

## 10. Obsługa błędów
- Błąd ładowania audio → toast + **Retry** (reuse logiki z Piano).
- Fallback na brak WebAudio → disable dźwięk, pokazuj komunikat.
- Guard clause w generowaniu zadań (niepoprawny preset ⇒ console.error + generate again).

## 11. Kroki implementacji
1. **Routing**: Utwórz `src/pages/demo.astro` importujący `<DemoGameApp/>` (no SSR).
2. **Statyczne dane**: Dodaj `demoLevels.ts` z presetem poziomów i sekwencji.
3. **Hook**: Zaimplementuj `useDemoGame` w `src/lib/hooks/useDemoGame.ts`.
4. **Komponent DemoBanner** w `src/components/game/demo/DemoBanner.tsx`.
5. **RegistrationPromptModal** w `src/components/game/demo/RegistrationPromptModal.tsx` (Shadcn Dialog).
6. **GameHeader / GameControls**: Dopisz prop `demoMode` do ukrycia niepotrzebnych elementów.
7. **GamePlayArea** wrapper w `src/components/game/demo/GamePlayArea.tsx`.
8. **DemoGameApp** w `src/components/game/demo/DemoGameApp.tsx` – skleja całość + logika promptów.
9. **Styling**: Tailwind classes + global add to `global.css` jeśli potrzebne kolory.
10. **Accessibility**: Sprawdź kontrast bannera; dodać focus trap do modala.
11. **Testy manualne**: Zagraj ścieżkę, symuluj zadania, sprawdź modale, przejście do `/register`.
12. **Code review & lint**: ESLint, Prettier.
