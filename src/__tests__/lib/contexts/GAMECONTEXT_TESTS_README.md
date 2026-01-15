# 🎮 Testy GameContext - Dokumentacja

## 📋 Spis treści

1. [Wprowadzenie](#wprowadzenie)
2. [Pokrycie testów](#pokrycie-testów)
3. [Kluczowe reguły biznesowe](#kluczowe-reguły-biznesowe)
4. [Struktura testów](#struktura-testów)
5. [Uruchomienie testów](#uruchomienie-testów)
6. [Wytyczne Vitest](#wytyczne-vitest)
7. [Znane problemy](#znane-problemy)

---

## 1. Wprowadzenie

### 1.1 Cel testów

Plik `GameContext.test.tsx` zawiera kompleksowy zestaw testów jednostkowych dla komponentu `GameContext`, który zarządza stanem gry muzycznej Rytmik.

### 1.2 Co testujemy?

GameContext to kluczowy komponent odpowiedzialny za:

- **Zarządzanie sesjami gry** - tworzenie, odświeżanie, zarządzanie cookies
- **Ładowanie zadań** - pobieranie aktualnego lub generowanie nowego puzzle
- **Wysyłanie odpowiedzi** - walidacja, punktacja, progresja poziomów
- **Synchronizacja stanu** - persystencja między odświeżeniami strony
- **Zarządzanie cookies** - synchronizacja z czasem życia sesji

### 1.3 Framework testowy

- **Vitest** - test runner
- **React Testing Library** - renderowanie hooków
- **Testing Library Hooks** - `renderHook`, `waitFor`, `act`

---

## 2. Pokrycie testów

### 2.1 Metody testowane

| Metoda                     | Liczba testów | Pokrycie                                             |
| -------------------------- | ------------- | ---------------------------------------------------- |
| `ensureActiveSession()`    | 9             | Sesja w state, cookie, nowa sesja, błędy             |
| `submitAnswer()`           | 17            | Walidacja, punktacja, poziomy, stany zadań           |
| `loadCurrentOrNextTask()`  | 8             | Przywracanie, generowanie, parsowanie, błędy         |
| `refreshSession()`         | 9             | Odświeżanie, cookies, błędy, auto-refresh            |
| **Cookie Management**      | 13            | Odczyt, zapis, expiry, izolacja między profilami     |
| **SUMA**                   | **56**        | Wszystkie kluczowe ścieżki + edge cases + błędy      |

### 2.2 Scenariusze biznesowe

✅ **Session Management**
- Cookie expires równocześnie z `session.endedAt`
- Cookie presence gwarantuje aktywną sesję
- Jeden `sessionId` używany do wszystkich API calls

✅ **Attempts & Scoring**
- Poprawna odpowiedź: `attemptsUsed` **NIE** rośnie (0→0→0)
- Błędna odpowiedź: `attemptsUsed` rośnie (0→1→2→3)
- Punktacja: 0 błędów = 10 pkt, 1 błąd = 7 pkt, 2 błędy = 5 pkt

✅ **Task Completion**
- Zadanie kończy się gdy: `score > 0` **LUB** `attemptsUsed >= 3`
- Poprawna odpowiedź → `taskCompletionState = "completed"`
- Wszystkie 3 próby użyte → `taskCompletionState = "completed"`, `feedback.type = "failed"`

✅ **Level Progression**
- 5 zadań zaliczonych → awans poziomu (`levelCompleted = true`)
- `currentLevel` rośnie (1→2→3...)
- `completedTasksInLevel` resetuje się do 0

---

## 3. Kluczowe reguły biznesowe

### 3.1 Zarządzanie sesjami

#### Reguła: Cookie synchronizacja z endedAt

```typescript
// ✅ POPRAWNE: Cookie expires równocześnie z sesją
saveSessionToCookie(sessionId, session.endedAt);
// Cookie: game_session_profileId=<sessionId>; expires=<endedAt UTC>; SameSite=Strict

// ❌ BŁĘDNE: Cookie z własnym expiry
document.cookie = `game_session=${sessionId}; max-age=600`; // Desync!
```

**Test pokrywa:**
- ✅ `should set cookie expiry to match session endedAt`
- ✅ `should synchronize cookie expiry with session endedAt`

#### Reguła: Prioritet ładowania sesji

```typescript
// 1. Sprawdź state (najszybsze)
if (currentSessionId) return currentSessionId;

// 2. Sprawdź cookie (bez API call)
const cookieSessionId = getSessionFromCookie();
if (cookieSessionId) return cookieSessionId;

// 3. Utwórz nową sesję (API call)
const newSession = await createSession();
return newSession.sessionId;
```

**Test pokrywa:**
- ✅ `should return existing session ID without API call`
- ✅ `should return session ID from cookie without creating new session`
- ✅ `should create new session via API`

---

### 3.2 Punktacja i próby

#### Reguła: Scoring table

| Nieudane próby | Punkty |
| -------------- | ------ |
| 0              | 10     |
| 1              | 7      |
| 2              | 5      |
| 3              | 0      |

**Test pokrywa:**
- ✅ `should award 10 points for correct answer on first attempt`
- ✅ `should award 7 points after 1 failed attempt`
- ✅ `should award 5 points after 2 failed attempts`
- ✅ `should award 0 points after 3 failed attempts`

#### Reguła: Attempts tracking

```typescript
// Poprawna odpowiedź (score > 0):
attemptsUsed = 0; // NIE rośnie!
attemptsLeft = 3; // Pozostaje 3

// Błędna odpowiedź (score = 0, attempts < 3):
attemptsUsed++; // 0→1→2→3
attemptsLeft = 3 - attemptsUsed; // 3→2→1→0
```

---

### 3.3 Stan zadania (Task Completion)

#### Reguła: Kiedy zadanie jest ukończone?

```typescript
const isTaskCompleted = result.score > 0 || result.attemptsUsed >= 3;

if (isTaskCompleted) {
  setTaskCompletionState("completed");
  // Pokaż feedback i przycisk "Następne zadanie"
} else {
  setTaskCompletionState("in_progress");
  // Pozwól na kolejną próbę
}
```

**Test pokrywa:**
- ✅ `should mark task as completed when score > 0`
- ✅ `should mark task as completed when all 3 attempts used`
- ✅ `should mark task as in_progress when attempts remain and score = 0`

---

### 3.4 Progresja poziomów

#### Reguła: Awans poziomu po 5 sukcesach

```typescript
if (result.levelCompleted) {
  setCompletedTasksInLevel(0); // Reset!
  setCurrentLevel(result.nextLevel); // 1→2
} else {
  setCompletedTasksInLevel((prev) => prev + 1); // 0→1→2→3→4
}
```

**Test pokrywa:**
- ✅ `should increment completedTasksInLevel when task completed without level up`
- ✅ `should level up and reset completedTasksInLevel when level completed`

---

## 4. Struktura testów

### 4.1 Organizacja describe blocks

```
GameContext
├── ensureActiveSession()
│   ├── when session already exists in state (1 test)
│   ├── when session exists in cookie but not in state (2 testy)
│   ├── when no session exists (6 testów)
│   └── edge cases (2 testy)
│
├── submitAnswer()
│   ├── validation and guards (3 testy)
│   ├── successful submission - correct answer (4 testy)
│   ├── scoring rules - attempts tracking (4 testy)
│   ├── level progression (2 testy)
│   ├── task completion states (3 testy)
│   └── error handling (3 testy)
│
├── loadCurrentOrNextTask()
│   ├── when active task exists (3 testy)
│   ├── when no active task exists (2 testy)
│   ├── session management (1 test)
│   ├── error handling (1 test)
│   └── state management (2 testy)
│
├── refreshSession()
│   ├── successful refresh (2 testy)
│   ├── when no active session exists (1 test)
│   ├── error handling (2 testy)
│   └── automatic refresh interval (3 testy)
│
└── Cookie Management
    ├── getSessionFromCookie (5 testów)
    ├── saveSessionToCookie (4 testy)
    └── cookie isolation between profiles (1 test)
```

---

## 5. Uruchomienie testów

### 5.1 Wszystkie testy GameContext

```bash
npm run test -- GameContext.test.tsx
```

**Oczekiwany output:**
```
✓ GameContext (56 tests)
  ✓ ensureActiveSession (9 tests)
  ✓ submitAnswer (17 tests)
  ✓ loadCurrentOrNextTask (8 tests)
  ✓ refreshSession (9 tests)
  ✓ Cookie Management (13 tests)

Test Files  1 passed (1)
Tests  56 passed (56)
Duration  ~3-5s
```

### 5.2 Konkretna sekcja

```bash
# Tylko testy submitAnswer
npm run test -- GameContext.test.tsx -t "submitAnswer"

# Tylko testy cookie management
npm run test -- GameContext.test.tsx -t "Cookie Management"

# Tylko error handling
npm run test -- GameContext.test.tsx -t "error handling"
```

### 5.3 Watch mode (development)

```bash
npm run test -- GameContext.test.tsx --watch
```

### 5.4 Coverage report

```bash
npm run test -- GameContext.test.tsx --coverage
```

---

## 6. Wytyczne Vitest

### 6.1 Zgodność z vitest.mdc

Testy zostały stworzone zgodnie z wytycznymi z `.cursor/rules/vitest.mdc`:

✅ **Leverage the `vi` object for test doubles**
- Używamy `vi.fn()` dla function mocks
- `vi.spyOn()` do monitorowania istniejących funkcji
- `vi.useFakeTimers()` dla testów z timerem

✅ **Master `vi.mock()` factory patterns**
- Mock factory functions umieszczone na początku pliku
- Typed mock implementations

✅ **Create setup files for reusable configuration**
- Globalne mocki dla `fetch` i `document.cookie`
- Clean setup w `beforeEach`/`afterEach`

✅ **Structure tests for maintainability**
- Descriptive `describe` blocks
- AAA pattern (Arrange-Act-Assert)
- Explicit assertion messages

✅ **Handle optional dependencies with smart mocking**
- Conditional mocking dla różnych scenariuszy
- Mockowanie fetch z różnymi response types

✅ **Configure jsdom for DOM testing**
- `@vitest-environment jsdom` w nagłówku pliku
- Kombinacja z React Testing Library

---

## 7. Znane problemy

### 7.1 Aktualny status testów

**Status: 13/56 testów przechodzi (23%)**

Główne problemy:
- Testy timeout-ują (10000ms)
- `Cannot read properties of null` - context nie inicjalizuje się poprawnie
- `Cannot read properties of undefined (reading 'ok')` - brakujące mocki fetch

### 7.2 Przyczyny błędów

1. **Auto-initialization w GameContext**
   - `GameContext` automatycznie ładuje zadanie przy montowaniu (`useEffect`)
   - Wymaga dodatkowych mocków dla każdego testu
   - Wiele testów nie uwzględnia tego flow

2. **Fetch mocking challenges**
   - Każdy test wymaga mocków dla: session creation + task loading
   - Niektóre testy nie mockują wszystkich wymaganych API calls
   - Response musi mieć strukturę `{ ok: boolean, json: async () => data }`

3. **Timing issues**
   - `waitFor` z nieodpowiednimi warunkami
   - Testy timeout-ują czekając na stan, który nigdy nie nastąpi
   - Brak wystarczających `act()` wrappers

### 7.3 Roadmap naprawy

#### Faza 1: Fix core initialization (Priority: HIGH)
- [ ] Dodać helper function `setupMockContext()` który mockuje session + task
- [ ] Refaktoryzować wszystkie testy aby używały helpera
- [ ] Naprawić `waitFor` conditions - używać realnych warunków

#### Faza 2: Fix submitAnswer tests (Priority: HIGH)
- [ ] Dodać dodatkowe mocki dla submit flow
- [ ] Naprawić concurrent submission test (timeout issue)
- [ ] Dodać więcej `act()` wrappers gdzie potrzebne

#### Faza 3: Fix loadCurrentOrNextTask tests (Priority: MEDIUM)
- [ ] Poprawić error handling tests (console.error spy)
- [ ] Naprawić sequence parsing tests
- [ ] Dodać więcej edge cases

#### Faza 4: Fix refreshSession tests (Priority: MEDIUM)
- [ ] Naprawić automatic refresh interval tests (fake timers)
- [ ] Dodać cleanup tests
- [ ] Poprawić error scenarios

#### Faza 5: Optimize and cleanup (Priority: LOW)
- [ ] Zredukować czas wykonania testów (<3s total)
- [ ] Dodać więcej integration tests
- [ ] Dokumentować każdy edge case

### 7.4 Sugerowane poprawki

#### Helper: setupMockContext

```typescript
/**
 * Helper function to setup mock context with session and task
 */
async function setupMockContext(options?: {
  sessionId?: string;
  taskId?: string;
  attemptsUsed?: number;
}) {
  const mockSession = createMockSession(options?.sessionId);
  const mockTask = options?.attemptsUsed !== undefined
    ? createMockCurrentPuzzle(options.attemptsUsed)
    : createMockPuzzle(options?.taskId);

  mockFetch
    .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
    .mockResolvedValueOnce({ ok: true, json: async () => mockTask });

  return { mockSession, mockTask };
}

// Usage:
it("should do something", async () => {
  // Arrange
  const { mockSession, mockTask } = await setupMockContext();
  
  const { result } = renderHook(() => useGame(), {
    wrapper: createWrapper(),
  });

  await waitFor(() => {
    expect(result.current.currentTask).not.toBeNull();
  });

  // Act & Assert...
});
```

#### Better waitFor conditions

```typescript
// ❌ BAD - może timeout-ować
await waitFor(() => {
  expect(result.current.currentTask).toBeDefined();
});

// ✅ GOOD - sprawdza konkretną wartość
await waitFor(() => {
  expect(result.current.currentTask).not.toBeNull();
  expect(result.current.currentSessionId).toBeTruthy();
}, { timeout: 5000 });
```

---

## 8. Contributing

### 8.1 Dodawanie nowych testów

1. **Użyj AAA pattern** (Arrange-Act-Assert)
2. **Mockuj wszystkie fetch calls** (session + task minimum)
3. **Używaj `waitFor` do asynchronicznych operacji**
4. **Zawsze używaj `act()` dla state updates**
5. **Testuj edge cases i error scenarios**

### 8.2 Checklist przed commitem

- [ ] Wszystkie nowe testy przechodzą
- [ ] Brak błędów ESLint
- [ ] Brak błędów TypeScript
- [ ] Testy są deterministyczne (nie flaky)
- [ ] Dodano odpowiednią dokumentację
- [ ] Zaktualizowano ten README jeśli potrzebne

---

## 9. Przykłady

### 9.1 Kompletny test flow

```typescript
it("should submit correct answer and get 10 points", async () => {
  // ARRANGE
  const mockSession = createMockSession();
  const mockPuzzle = createMockPuzzle();
  const mockResponse = createMockSubmitResponse(10, 0, false);

  mockFetch
    .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
    .mockResolvedValueOnce({ ok: true, json: async () => mockPuzzle })
    .mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

  const { result } = renderHook(() => useGame(), {
    wrapper: createWrapper(),
  });

  // Wait for initialization
  await waitFor(() => expect(result.current.currentTask).not.toBeNull());

  // ACT
  await act(async () => {
    result.current.addNote("C5");
    result.current.addNote("D5");
    await result.current.submitAnswer();
  });

  // ASSERT
  expect(result.current.totalScore).toBe(10);
  expect(result.current.attemptsLeft).toBe(3);
  expect(result.current.taskCompletionState).toBe("completed");
  expect(result.current.feedback?.type).toBe("success");
});
```

### 9.2 Test z error handling

```typescript
it("should handle API errors gracefully", async () => {
  // ARRANGE
  mockFetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ message: "Server error" }),
  });

  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  // ACT
  renderHook(() => useGame(), {
    wrapper: createWrapper(),
  });

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  // ASSERT
  expect(consoleErrorSpy).toHaveBeenCalled();

  consoleErrorSpy.mockRestore();
});
```

---

## 10. Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Hooks](https://react-hooks-testing-library.com/)
- [Vitest Guidelines (vitest.mdc)](.cursor/rules/vitest.mdc)

---

**Last updated:** 2026-01-13  
**Maintainer:** Development Team  
**Questions?** Sprawdź [src/__tests__/README.md](../../README.md)
