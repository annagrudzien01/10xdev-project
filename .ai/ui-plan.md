# Architektura UI dla Rytmik MVP

## 1. Przegląd struktury UI

Rytmik to webowa gra edukacyjna dla dzieci rozwijająca umiejętność rozpoznawania i kontynuowania sekwencji dźwiękowych. Architektura UI została zaprojektowana z myślą o dwóch typach użytkowników: **Rodzic (Admin)** oraz **Dziecko (Gracz)**.

### Kluczowe założenia architektoniczne:

- **Stack technologiczny**: Astro 5 (SSR, routing) + React 19 (komponenty interaktywne) + TypeScript 5
- **Styling**: Tailwind 4 + Shadcn/ui
- **State management**: TanStack Query (server state) + React Context (client state)
- **Audio**: Tone.js
- **Backend**: Supabase (auth, database, API)
- **Optymalizacja**: Tablet/desktop landscape (≥768px)
- **Dostępność**: WCAG AA
- **Bezpieczeństwo**: HttpOnly cookies, token refresh, RLS

### Główne ścieżki użytkownika:

1. **Ścieżka rodzica**: Rejestracja → Logowanie → Zarządzanie profilami dzieci → Monitoring postępów
2. **Ścieżka dziecka**: Wybór profilu → Start gry → Rozwiązywanie zagadek muzycznych → Postęp przez poziomy
3. **Ścieżka demo**: Wypróbowanie gry bez rejestracji (poziomy 1-3, brak persystencji)

---

## 2. Lista widoków

### 2.1 Landing Page `/`

**Główny cel**: Punkt wejścia do aplikacji, przekierowanie użytkownika do odpowiedniego ekranu

**Kluczowe informacje**:

- Tytuł i krótki opis aplikacji Rytmik
- Przyciski CTA: "Zaloguj się", "Zarejestruj się", "Wypróbuj demo"
- Krótkie wyjaśnienie koncepcji gry (opcjonalnie)

**Kluczowe komponenty**:

- Hero section z tytułem i opisem
- Przyciski nawigacyjne (Button z Shadcn/ui)
- Ilustracja/animacja pianina (opcjonalnie)

**Logika nawigacji**:

- Jeśli użytkownik zalogowany (token valid) → redirect na `/profiles`
- Jeśli niezalogowany → wyświetl landing page z opcjami "Zaloguj się", "Zarejestruj się", "Wypróbuj demo"

**UX considerations**:

- Minimalistyczny design, szybkie załadowanie
- Mobile: komunikat o preferowanej orientacji poziomej

**Dostępność**:

- Kontrast przycisków ≥ 4.5:1
- Focus indicators na przyciskach

**Bezpieczeństwo**:

- Brak wrażliwych danych
- HTTPS enforced przez middleware

---

### 2.2 Rejestracja `/register`

**Główny cel**: Umożliwienie utworzenia konta rodzica w systemie

**Kluczowe informacje**:

- Formularz rejestracji: email, hasło, potwierdzenie hasła
- Komunikaty walidacji inline
- Link do strony logowania dla istniejących użytkowników

**Kluczowe komponenty**:

- `RegistrationForm` (React component)
  - Input email (type="email")
  - Input hasło (type="password", show/hide toggle)
  - Input potwierdzenie hasła
  - Submit button (disabled dopóki formularz nieprawidłowy)
- `FormField` z Shadcn/ui dla każdego pola
- Error toast dla błędów serwera

**Integracja API**:

- Supabase Auth: `signUp(email, password)`
- Po sukcesie: redirect na `/login` z komunikatem "Konto utworzone, zaloguj się"

**Walidacja (Zod schema)**:

```typescript
{
  email: z.string().email("Nieprawidłowy format email"),
  password: z.string().min(8, "Hasło musi mieć min. 8 znaków")
    .regex(/[A-Z]/, "Hasło musi zawierać wielką literę")
    .regex(/[0-9]/, "Hasło musi zawierać cyfrę"),
  confirmPassword: z.string()
}
.refine(data => data.password === data.confirmPassword, {
  message: "Hasła muszą się zgadzać",
  path: ["confirmPassword"]
})
```

**Obsługa błędów**:

- `400` → "Nieprawidłowe dane"
- `409` → "Email już istnieje"
- `422` → Szczegóły walidacji w polach
- `500` → "Błąd serwera, spróbuj później"

**UX considerations**:

- Walidacja real-time (debounce 300ms)
- Password strength indicator
- "Pokaż hasło" toggle dla lepszej UX
- Link "Masz już konto? Zaloguj się"

**Dostępność**:

- Labels powiązane z inputami (htmlFor)
- Error messages announce dla screen readers (aria-live="polite")
- Autocomplete attributes (email, new-password)

**Bezpieczeństwo**:

- Client-side validation (pierwsza linia obrony)
- Server-side validation (krytyczna)
- HTTPS tylko
- Rate limiting na endpoint (100 req/min)

---

### 2.3 Logowanie `/login`

**Główny cel**: Uwierzytelnienie istniejących rodziców

**Kluczowe informacje**:

- Formularz logowania: email, hasło
- Link do rejestracji
- Komunikaty błędów (nieprawidłowe dane, konto nieaktywne)

**Kluczowe komponenty**:

- `LoginForm` (React component)
  - Input email
  - Input hasło (show/hide toggle)
  - "Zapamiętaj mnie" checkbox (opcjonalnie)
  - Submit button
- Link do `/register`
- Error toast dla błędów logowania

**Integracja API**:

- Supabase Auth: `signInWithPassword(email, password)`
- Token zapisywany w HttpOnly cookie przez middleware Astro
- AuthContext aktualizowany z user data

**Przepływ po zalogowaniu**:

1. Submit form → API call
2. Success → Token w cookie, user w AuthContext
3. Redirect na `/profiles`

**Obsługa błędów**:

- `401` → "Nieprawidłowy email lub hasło"
- `403` → "Konto nieaktywne"
- `429` → "Zbyt wiele prób logowania, spróbuj za chwilę"
- `500` → "Błąd serwera"

**UX considerations**:

- Autofocus na email input
- Loading state na przycisku podczas submitu
- Friendly error messages (nie ujawniaj czy email istnieje)
- Link "Nie masz konta? Zarejestruj się"

**Dostępność**:

- Autocomplete="email" i "current-password"
- Error messages announced
- Keyboard submit (Enter key)

**Bezpieczeństwo**:

- HttpOnly cookie (ochrona przed XSS)
- SameSite=Strict (ochrona przed CSRF)
- Secure flag w production
- Rate limiting (max 5 failed attempts w 15 min)

---

### 2.4 Wybór Profilu `/profiles`

**Główny cel**: Główny hub po zalogowaniu - wybór profilu dziecka lub zarządzanie profilami

**Kluczowe informacje**:

- Lista profili dzieci (name, age, level, avatar/icon)
- Licznik: "X/10 profili"
- Opcje: Dodaj profil, Dashboard, Wyloguj

**Kluczowe komponenty**:

- `Header` component:
  - Logo Rytmik
  - "Dashboard" button
  - "Wyloguj" button
- `ProfileList` component:
  - Grid/flex container
  - `ProfileCard` dla każdego profilu:
    - Avatar/ikona
    - Imię dziecka
    - Wiek (obliczony z DOB)
    - Badge z poziomem: "Poziom X"
    - Click → `/game/start?profileId={id}`
- Counter component: "X/10 profili" (prominent)
- "Dodaj profil" button:
  - Plus icon
  - Disabled jeśli count >= 10
  - Tooltip: "Osiągnięto limit 10 profili"
- Empty state (0 profili):
  - Ilustracja
  - "Dodaj pierwszy profil dziecka"
  - CTA button → `/profiles/new`

**Integracja API**:

- `GET /api/profiles` → lista profili
- TanStack Query key: `['profiles']`
- Auto-refetch on window focus: false
- Stale time: 0

**Przepływ interakcji**:

1. Load `/profiles` → Fetch profiles
2. Display ProfileCards
3. Click card → Navigate to `/game/start?profileId={id}`
4. Click "Dodaj profil" → Navigate to `/profiles/new`
5. Click "Dashboard" → Navigate to `/dashboard`
6. Click "Wyloguj" → Logout, redirect to `/login`

**UX considerations**:

- Skeleton loader dla ProfileCards podczas fetch
- Smooth animations na hover
- Responsive grid: 2 cols (tablet), 3-4 cols (desktop)
- Prominent counter to avoid 409 errors
- Empty state encouraging

**Dostępność**:

- ProfileCards as buttons or links (semantic HTML)
- ARIA label na counter: "Liczba profili: X z 10"
- Keyboard navigation (tab przez cards)
- Screen reader announce: "Lista profili dzieci"

**Bezpieczeństwo**:

- RLS ensures parent sees only their profiles
- Token validated przez middleware
- Logout clears token i AuthContext

---

### 2.5 Tworzenie Profilu `/profiles/new`

**Główny cel**: Dodanie nowego profilu dziecka

**Kluczowe informacje**:

- Formularz: Imię dziecka, Data urodzenia
- Walidacja: regex name, past date, wiek 3-18, unikalność
- Licznik profili (kontekst limitu)

**Kluczowe komponenty**:

- `ProfileForm` (React component):
  - Input "Imię dziecka" (text)
    - Validation: 2-50 chars, regex `/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/`
  - DatePicker "Data urodzenia"
    - Validation: past date, age 3-18
  - "Zapisz" button (disabled dopóki invalid)
  - "Anuluj" button → back to `/profiles`
- Error messages inline (red text pod inputami)
- Success toast po utworzeniu

**Integracja API**:

- `POST /api/profiles`
- Body: `{ profileName: string, dateOfBirth: string }`
- Response 201: pełny profil object
- TanStack mutation invalidates: `['profiles']`

**Walidacja Zod schema**:

```typescript
{
  profileName: z.string()
    .min(2, "Imię musi mieć min. 2 znaki")
    .max(50, "Imię może mieć max. 50 znaków")
    .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/, "Nieprawidłowe znaki"),
  dateOfBirth: z.string()
    .refine(date => new Date(date) < new Date(), "Data musi być w przeszłości")
    .refine(date => {
      const age = (new Date() - new Date(date)) / (365.25 * 24 * 60 * 60 * 1000);
      return age >= 3 && age <= 18;
    }, "Wiek: 3-18 lat")
}
```

**Obsługa błędów**:

- `400` → "Nieprawidłowe dane"
- `409` (duplicate name) → "Profil o tej nazwie już istnieje"
- `409` (max profiles) → "Osiągnięto limit 10 profili"
- `422` → Szczegóły walidacji w toast

**Przepływ**:

1. User fills form
2. Real-time validation (client-side)
3. Click "Zapisz" → POST request
4. Success → Toast "Profil utworzony", redirect `/profiles`
5. Error → Toast z komunikatem, user stays on form

**UX considerations**:

- Autofocus na imię input
- Disabled submit during mutation (loading spinner)
- DatePicker z ograniczeniem do przeszłych dat
- "Anuluj" confirms if form dirty

**Dostępność**:

- Labels for all inputs
- Error messages announced (aria-live)
- DatePicker keyboard accessible

**Bezpieczeństwo**:

- Client + server validation
- RLS ensures profile assigned to auth.uid()
- Max 10 profiles enforced w DB (unique index)

---

### 2.6 Edycja Profilu `/profiles/{id}/edit`

**Główny cel**: Modyfikacja istniejącego profilu dziecka

**Kluczowe informacje**:

- Formularz pre-filled: Imię, Data urodzenia
- Opcja usunięcia profilu (jeśli brak aktywnej sesji)

**Kluczowe komponenty**:

- `ProfileForm` (reused, edit mode)
  - Input "Imię dziecka" (pre-filled)
  - DatePicker "Data urodzenia" (pre-filled)
  - "Zapisz" button
  - "Anuluj" button
- "Usuń profil" button (destructive style, bottom)
  - Confirm dialog przed usunięciem

**Integracja API**:

- `GET /api/profiles/{id}` → load profile data
- `PATCH /api/profiles/{id}` → update profile
- `DELETE /api/profiles/{id}` → delete profile (if no active session)
- TanStack mutations invalidate: `['profiles']`, `['profiles', id]`

**Obsługa błędów**:

- `404` → "Profil nie znaleziony"
- `409` (active session) → "Nie można usunąć profilu z aktywną sesją"
- `409` (duplicate name) → "Profil o tej nazwie już istnieje"

**Przepływ update**:

1. Load `/profiles/{id}/edit` → Fetch profile
2. Form pre-filled with data
3. User modifies fields
4. Click "Zapisz" → PATCH request
5. Success → Toast "Profil zaktualizowany", redirect `/profiles`

**Przepływ delete**:

1. Click "Usuń profil" button
2. Confirm dialog: "Czy na pewno chcesz usunąć profil [Name]?"
3. Confirm → DELETE request
4. Success → Toast "Profil usunięty", redirect `/profiles`
5. Error (409) → Toast "Nie można usunąć profilu z aktywną sesją"

**UX considerations**:

- Loading skeleton while fetching profile
- Confirm dialog for destructive action (delete)
- Disabled save during mutation
- Dirty form warning on navigate away

**Dostępność**:

- Confirm dialog accessible (focus trap)
- Delete button clearly marked as destructive (aria-label)

**Bezpieczeństwo**:

- RLS ensures parent can only edit their profiles
- Confirmation for delete prevents accidents

---

### 2.7 Start Gry `/game/start?profileId={id}`

**Główny cel**: Przygotowanie do sesji gry, preload zasobów audio, wyjaśnienie zasad

**Kluczowe informacje**:

- Tytuł: "Rytmik - Gra dla [Profile Name]"
- Krótki opis zadania: "Posłuchaj melodii i dokończ ją!"
- Pasek postępu ładowania audio
- Status: "Ładowanie dźwięków... X%"

**Kluczowe komponenty**:

- Hero section:
  - Tytuł z imieniem dziecka
  - Opis gry (2-3 zdania)
  - Ilustracja pianina
- Preload section:
  - Progress bar component (0-100%)
  - Status text
- "Rozpocznij" button:
  - Disabled dopóki preload incomplete
  - Enabled + pulse animation gdy ready

**Integracja API**:

- `POST /api/profiles/{id}/sessions` → start new session
  - Deactivates previous session (jeśli istnieje)
  - Response: `{ sessionId, startedAt, isActive: true }`
- TanStack mutation key: `['session', profileId]`

**Preload Audio (Tone.js)**:

1. Initialize Tone.Context (requires user gesture)
2. Load samples:
   - 12 nut pierwszego poziomu (C4-B4)
   - Krótkie SFX: success, error, click
3. Progress callback → update progress bar
4. OnLoad complete → enable "Rozpocznij" button

**Przepływ**:

1. Navigate to `/game/start?profileId={id}`
2. Render hero + description
3. Initialize audio context (after first interaction)
4. Start preload → update progress bar
5. Preload complete → "Rozpocznij" button enabled
6. Click "Rozpocznij" → Start session API call
7. Success → Navigate to `/game/play?profileId={id}`

**Obsługa błędów**:

- Audio load failure → Toast "Błąd ładowania audio", "Spróbuj ponownie" button
- Session start failure → Toast with error, back button

**UX considerations**:

- Engaging description to build anticipation
- Visual feedback (progress bar) podczas ładowania
- Button animation (pulse) gdy ready
- Back button → `/profiles` (abort)

**Dostępność**:

- Progress bar with aria-valuenow, aria-valuemin, aria-valuemax
- Status text announced (aria-live="polite")
- "Rozpocznij" button clear focus indicator

**Bezpieczeństwo**:

- Validate profileId belongs to authenticated parent
- RLS on session creation

---

### 2.8 Ekran Gry `/game/play?profileId={id}`

**Główny cel**: Główny interfejs gry - odtwarzanie zagadek, wprowadzanie odpowiedzi, feedback

**Kluczowe informacje**:

- Poziom gracza (1-20)
- Suma punktów
- Liczba prób (3 serduszka)
- Postęp w poziomie (X/5 zadań)
- Aktualna zagadka (sekwencja początkowa + puste sloty)

**Struktura ekranu (4 sekcje)**:

#### Sekcja 1: Panel Informacyjny (top)

**Komponenty**:

- `LevelIndicator`: "Poziom X"
- `ScoreDisplay`: "X punktów"
- `AttemptsIndicator`: 3 ikony serduszek (filled/empty)
- `ProgressIndicator`: "Zadanie X/5"

**Layout**: Flex row, space-between, responsive (stack na mobile)

#### Sekcja 2: Pianino (center)

**Komponenty**:

- `Piano` container:
  - 12 `PianoKey` components
  - Layout: 2 rzędy (white keys bottom, black keys top offset)
  - White keys: C, D, E, F, G, A, B (7)
  - Black keys: C#, D#, F#, G#, A# (5)

**PianoKey properties**:

- `note`: string (e.g., "C", "C#")
- `color`: "white" | "black"
- `isHighlighted`: boolean (podczas playback)
- `isDisabled`: boolean (podczas playback)
- `onClick`: () => void (play note + add to slots)

**Stany klawisza**:

- Default: Normalny kolor, clickable
- Highlighted: Jasny kolor, podczas playback sekwencji
- Pressed: Animacja wciśnięcia, odtworzenie dźwięku
- Disabled: Gray out, podczas playback

**Interaction**:

1. Free play mode: Click key → play sound
2. Answer mode: Click key → play sound + add to next slot
3. Playback mode: Keys highlight in sequence, disabled clicks

#### Sekcja 3: Panel Slotów (above piano)

**Komponenty**:

- `AnswerSlots` container:
  - Flex row of `Slot` components
  - Number of slots = `expectedSlots` from API
  - Each slot: letter + color or empty

**Slot states**:

- Empty: Dashed border, placeholder icon
- Filled: Note letter, background color matching key
- Current: Highlighted border (next to fill)

**Interaction**:

- Slots fill left-to-right as keys clicked
- Full slots → enable "Sprawdź" button
- "Wyczyść" → all slots empty

#### Sekcja 4: Przyciski Kontroli (bottom)

**Komponenty**:

- `GameControls`:
  - "Odtwórz ponownie" button:
    - Icon: replay
    - Action: Replay sequence audio + highlights
    - Disabled during playback
  - "Wyczyść" button:
    - Icon: eraser/trash
    - Action: Clear all slots
    - Disabled if slots empty
  - "Sprawdź" button:
    - Icon: check
    - Action: Submit answer
    - Enabled only when all slots filled
    - Primary style (accent color)

**Layout**: Flex row, center, gap-4

#### Feedback i Animacje

**Success (correct answer)**:

- Green flash on piano
- Score animation: "+10" / "+5" / "+2" floating up
- Success sound (short chime)
- Confetti animation (level up)
- Auto-transition to next task (1.5s delay)

**Error (wrong answer)**:

- Red flash on piano
- Heart break animation (one heart empties)
- Error sound (short buzz)
- Shake animation on slots
- Attempts decrement
- Enable retry (slots stay filled for review)

**3 Failures**:

- Modal: "Poprawna odpowiedź: [sequence]"
- Show correct sequence with highlights
- 0 points awarded
- Auto-continue to next task after 3s

**Level Up (5 correct in level)**:

- Full-screen modal:
  - "Poziom up! Teraz poziom X"
  - Confetti animation
  - Level badge with new number
  - "Kontynuuj" button
- Sound: triumph fanfare

**Skeleton States**:

- Piano: Skeleton keys during initial load
- Slots: Skeleton slots while fetching task
- Fade-in transition when data ready

**Integracja API**:

1. **Get Next Task**:
   - `POST /api/profiles/{id}/tasks/next`
   - Response: `{ sequenceId, levelId, sequenceBeginning: ["C", "E"], expectedSlots: 2 }`
   - TanStack mutation key: `['task', profileId]`
   - Triggered: On mount, after task completion

2. **Submit Answer**:
   - `POST /api/profiles/{id}/tasks/{sequenceId}/submit`
   - Body: `{ answer: ["A", "B"] }`
   - Response: `{ correct: bool, score: number, attemptsUsed: number, levelCompleted: bool, completedTasksInLevel: number, nextLevel: number }`
   - Invalidates: `['profiles', profileId]`, `['task', profileId]`

**State Management (GameContext)**:

```typescript
{
  currentLevel: number,
  totalScore: number,
  attemptsLeft: number, // 3, 2, 1
  completedTasksInLevel: number, // 0-4
  currentTask: {
    sequenceId: string,
    levelId: number,
    sequenceBeginning: string[],
    expectedSlots: number
  } | null,
  selectedNotes: string[], // User's answer
  isPlayingSequence: boolean,

  // Methods
  addNote: (note: string) => void,
  clearNotes: () => void,
  submitAnswer: () => Promise<void>,
  playSequence: () => Promise<void>,
  resetTask: () => void
}
```

**Przepływ Gry**:

1. Load `/game/play?profileId={id}`
2. Fetch next task → Update GameContext
3. Auto-play sequence (audio + highlights)
4. Enable piano for answer input
5. User clicks keys → Slots fill
6. All slots filled → Enable "Sprawdź"
7. Click "Sprawdź" → Submit answer
8. Receive response:
   - If correct: Success animation, +points, next task
   - If wrong: Error animation, -attempt, retry
   - If 3 failures: Show solution, next task
   - If level complete: Level up modal, next task at new level
9. Repeat from step 2

**Obsługa błędów**:

- Task fetch failure → Toast "Nie udało się pobrać zadania", "Spróbuj ponownie" button
- Submit failure → Toast "Błąd połączenia", "Spróbuj ponownie" button
- Timeout (>10s) → Modal "Sprawdź połączenie", "Spróbuj ponownie" / "Wróć do profili"

**UX considerations**:

- Disable piano during sequence playback (prevent confusion)
- Visual feedback on every interaction (key press, slot fill)
- Clear indication of current state (free play vs answer mode)
- Smooth animations (not too fast, not too slow)
- Audio sync with visual highlights
- Encouraging messages throughout

**Dostępność**:

- Piano: role="region", aria-label="Pianino"
- Keys: role="button", aria-label="Klawisz C", aria-pressed
- Slots: role="list", aria-label="Sloty odpowiedzi"
- Live region for feedback: aria-live="polite"
- Keyboard navigation: Tab through keys, Enter to play
- Screen reader announces score changes, level ups

**Bezpieczeństwo**:

- Validate profileId ownership
- RLS on task and submit endpoints
- Rate limiting on submit (prevent spam)

**Performance**:

- Lazy load Tone.js (already preloaded in /game/start)
- Memoize Piano component (prevent unnecessary re-renders)
- Debounce rapid key clicks
- Optimize animations (use CSS transforms)

---

### 2.9 Dashboard Rodzica `/dashboard`

**Główny cel**: Monitoring postępów wszystkich profili dzieci

**Kluczowe informacje**:

- Podsumowanie wszystkich profili: imię, poziom, suma punktów, data ostatniej gry
- Historia zadań dla wybranych profili (opcjonalnie rozwijana)

**Kluczowe komponenty**:

#### Header

- Logo Rytmik
- "Wróć do profili" button
- "Wyloguj" button
- "Odśwież" button (manual refresh)

#### Summary Section

- Nagłówek: "Postępy Dzieci"
- `DashboardTable` component:
  - Responsive: tabela na desktop, karty na tablet
  - Kolumny:
    - Imię (+ avatar/icon)
    - Poziom (badge)
    - Suma punktów
    - Ostatnia gra (relative time, np. "2 godziny temu")
  - Click row → Expand to show task history (accordion)

#### History Section (per profile, rozwijana)

- `TaskHistoryTable` component:
  - Kolumny:
    - Data i czas
    - Poziom
    - Sekwencja (beginning + answer)
    - Wynik (punkty, próby)
  - Pagination: 20 zadań per page
  - "Wczytaj więcej" button lub classic pagination

**Integracja API**:

1. **Dashboard Summary**:
   - `GET /api/dashboard`
   - Response: Array of profile summaries
   - TanStack Query key: `['dashboard']`
   - Refetch interval: 30-60s (auto-refresh)

2. **Task History**:
   - `GET /api/profiles/{id}/tasks/history?page=1&pageSize=20`
   - Response: `{ tasks: [], totalCount: number, page: number }`
   - TanStack Query key: `['taskHistory', profileId, page]`
   - Fetch on demand (when row expanded)

**Layout**:

- Desktop (≥1024px): Table layout, wszystkie kolumny visible
- Tablet (768-1024px): Cards layout, dane w grid
- Mobile (<768px): Komunikat o desktop experience

**Przepływ**:

1. Navigate to `/dashboard`
2. Fetch dashboard data → Display summary table
3. Click profile row → Expand accordion
4. Fetch task history for that profile → Display history table
5. Paginate history if needed
6. Click "Odśwież" → Refetch all data
7. Click "Wróć do profili" → Navigate to `/profiles`

**Obsługa błędów**:

- Fetch failure → Error message in table: "Nie udało się załadować danych"
- Empty state: "Brak historii gry"

**UX considerations**:

- Auto-refresh subtle (no disruptive reload)
- Skeleton loaders for tables during fetch
- Smooth accordion animation on expand
- Relative time for "Ostatnia gra" (friendlier than timestamps)
- Color-coded levels (gradual progression visual)
- Sort options: by name, level, score, last played

**Dostępność**:

- Table with proper th/td, scope attributes
- Accordion with aria-expanded
- Sort buttons with aria-sort
- Screen reader announces data updates

**Bezpieczeństwo**:

- RLS ensures parent sees only their children's data
- No sensitive data exposed (just game stats)

**Performance**:

- Paginated history (prevent large data loads)
- Memoize table rows
- Virtual scrolling if history very long (optional)

---

### 2.10 Demo `/demo`

**Główny cel**: Umożliwienie wypróbowania gry bez rejestracji, zachęcenie do założenia konta

**Kluczowe informacje**:

- Uproszczona wersja gry (poziomy 1-3)
- Brak persystencji (lokalny state only)
- Banner komunikujący tryb demo
- Zachęta do rejestracji po kilku zadaniach

**Kluczowe komponenty**:

#### Demo Banner (sticky top)

- Background: Yellow/orange (informacyjny)
- Text: "Tryb demo - postępy nie są zapisywane"
- "Zarejestruj się" button (link do `/register`)

#### Game Interface

- Simplified version of `/game/play`
- Components: Piano, AnswerSlots, GameControls
- Info panel: Level, Score (no attempts indicator)
- No profile selection, no session persistence

#### Registration Prompt Modal

- Trigger: After 5-10 completed tasks
- Content:
  - Nagłówek: "Podobała Ci się gra?"
  - Tekst: "Zarejestruj się, aby zapisać postępy i odblokować więcej poziomów!"
  - "Zarejestruj się" button (primary)
  - "Kontynuuj demo" button (secondary)

**State Management**:

- Local React state (useState, not TanStack Query)
- No API calls (except for Supabase-agnostic data like levels catalog)
- Mock sequence generation (client-side random from preset pool)

**Demo Constraints**:

- Levels: Only 1-3
- No profiles, no parent dashboard
- No session saving
- Limited sequences (preset, not from DB)
- After level 3 completion → Modal "Zarejestruj się, aby grać dalej"

**Przepływ**:

1. Navigate to `/demo` (no auth required)
2. Render game interface with demo banner
3. Start game with local state (level 1)
4. Play tasks (local validation, mock responses)
5. After 5-10 tasks → Show registration prompt modal
6. User choices:
   - "Zarejestruj się" → Navigate to `/register`
   - "Kontynuuj demo" → Continue playing, prompt again later
7. Reach level 3 completion → Final modal "Zarejestruj się, aby grać dalej"

**Obsługa błędów**:

- Audio load failure → Same as regular game
- No network errors (everything local)

**UX considerations**:

- Engaging experience to hook users
- Clear communication (demo = no saving)
- Timely registration prompts (not too early, not too late)
- Easy transition to registration (one click)
- Demo state not transferred (clear in messaging)

**Dostępność**:

- Same as regular game
- Banner readable (high contrast)
- Modal accessible (focus trap)

**Bezpieczeństwo**:

- No auth required
- No sensitive data
- No backend writes
- Rate limiting on public endpoint (if any API calls)

**Performance**:

- Lighter than full game (no API overhead)
- Preload audio same as regular
- Fast initial load (attract users)

---

## 3. Mapa podróży użytkownika

### 3.1 Podróż Rodzica - Pierwszy Raz

**Krok 1: Odkrycie**

- Użytkownik trafia na landing page `/`
- Widzi opis gry Rytmik
- Decyzja: Wypróbować demo czy zarejestrować się od razu

**Krok 2: Rejestracja**

- Klika "Zarejestruj się" → `/register`
- Wypełnia formularz (email, hasło)
- Submit → Konto utworzone
- Redirect na `/login` z komunikatem sukcesu

**Krok 3: Logowanie**

- Wprowadza dane logowania
- Submit → Token zapisany w cookie
- Redirect na `/profiles` (empty state)

**Krok 4: Utworzenie pierwszego profilu**

- Widzi empty state: "Dodaj pierwszy profil dziecka"
- Klika "Dodaj profil" → `/profiles/new`
- Wypełnia formularz (imię: "Anna", DOB: "2018-05-24")
- Submit → Profil utworzony
- Redirect na `/profiles` (1 profil, licznik "1/10")

**Krok 5: Wybór profilu i start gry**

- Klika na kartę profilu "Anna"
- Redirect na `/game/start?profileId={id}`
- Widzi opis gry + pasek ładowania audio
- Audio preload → Button "Rozpocznij" aktywny
- Klika "Rozpocznij" → Sesja startuje
- Redirect na `/game/play?profileId={id}`

**Krok 6: Pierwsza zagadka**

- Zagadka odtwarzana (audio + highlights)
- Dziecko klika klawisze → Sloty się wypełniają
- Klika "Sprawdź" → Poprawna odpowiedź!
- Animacja sukcesu, +10 punktów
- Następna zagadka ładuje się automatycznie

**Krok 7: Kontynuacja gry**

- Dziecko rozwiązuje więcej zagadek
- Po 5 poprawnych → Modal "Poziom up!"
- Gra trwa...

**Krok 8: Zakończenie sesji**

- Rodzic klika "Wróć do profili" w headerze
- Confirmation modal: "Czy na pewno chcesz zakończyć grę?"
- Potwierdza → Sesja kończy się
- Redirect na `/profiles`

**Krok 9: Monitoring postępów**

- Klika "Dashboard" → `/dashboard`
- Widzi podsumowanie: Anna - Poziom 2, 85 punktów, gra 5 minut temu
- Klika row → Historia zadań rozszerza się
- Przegląda szczegóły
- Klika "Wróć do profili"

### 3.2 Podróż Rodzica - Powracający Użytkownik

**Krok 1: Logowanie**

- Trafia na `/login`
- Wprowadza dane
- Redirect na `/profiles` (kilka profili)

**Krok 2: Wybór profilu**

- Widzi 3 profile: Anna (poziom 4), Tomek (poziom 2), Zosia (poziom 1)
- Wybiera profil do gry

**Krok 3: Gra**

- Standardowy przepływ gry

**Krok 4: Dodanie nowego profilu**

- Wraca do `/profiles`
- Klika "Dodaj profil" (licznik "3/10")
- Dodaje czwarty profil

**Krok 5: Dashboard**

- Regularnie sprawdza postępy w `/dashboard`
- Sortuje według poziomu lub ostatniej gry
- Przegląda historię dla konkretnych dzieci

### 3.3 Podróż Dziecka

**Krok 1: Wybór profilu (z pomocą rodzica)**

- Rodzic zalogowany, wybiera profil dziecka
- `/profiles` → Klika kartę "Anna"

**Krok 2: Start gry**

- `/game/start` → Dziecko widzi opis
- Rodzic klika "Rozpocznij" (lub dziecko jeśli starsze)

**Krok 3: Rozwiązywanie zagadek**

- `/game/play` → Dziecko słucha melodii
- Widzi podświetlone klawisze
- Próbuje odtworzyć brakujące nuty
- Klika klawisze → Sloty wypełniają się
- Klika "Sprawdź" → Feedback

**Krok 4: Doświadczenie sukcesu**

- Poprawna odpowiedź → Animacja, dźwięk, punkty
- Motywacja do kolejnych zadań

**Krok 5: Doświadczenie błędu**

- Błędna odpowiedź → Serduszko pęka, animacja
- Dziecko próbuje ponownie (2 próby pozostały)
- Drugi raz → Poprawnie!

**Krok 6: Awans poziomu**

- Po 5 poprawnych → Modal "Poziom up!"
- Dziecko cieszy się z postępu
- Trudniejsze zagadki na wyższym poziomie

**Krok 7: Free play**

- Między zagadkami dziecko klika klawisze swobodnie
- Eksperymentuje z dźwiękami
- Rodzic może pozwolić na dłuższy free play przed następnym zadaniem

### 3.4 Podróż Demo User

**Krok 1: Landing**

- Użytkownik niezalogowany trafia na `/`
- Klika "Wypróbuj demo"

**Krok 2: Demo game**

- `/demo` → Banner "Tryb demo"
- Gra zaczyna się od poziomu 1
- Lokalny state, brak zapisu

**Krok 3: Granie**

- Rozwiązuje 5-10 zagadek
- Doświadcza mechaniki gry
- Modal pojawia się: "Podobała Ci się gra?"

**Krok 4: Decyzja**

- Wybiera "Zarejestruj się" → `/register`
- Lub "Kontynuuj demo" → Gra dalej

**Krok 5: Limit demo**

- Osiąga poziom 3
- Modal: "Zarejestruj się, aby grać dalej"
- Call to action → Rejestracja

---

## 4. Układ i struktura nawigacji

### 4.1 Hierarchia Nawigacji

```
Landing (/)
│
├─ Public Routes (Niezalogowani)
│  ├─ Logowanie (/login)
│  ├─ Rejestracja (/register)
│  └─ Demo (/demo)
│
└─ Protected Routes (Zalogowani Rodzice)
   │
   ├─ Wybór Profilu (/profiles) ← GŁÓWNY HUB
   │  │
   │  ├─ Dodaj Profil (/profiles/new)
   │  ├─ Edytuj Profil (/profiles/{id}/edit)
   │  │
   │  ├─ Start Gry (/game/start?profileId={id})
   │  │  └─ Gra (/game/play?profileId={id})
   │  │
   │  └─ Dashboard (/dashboard)
   │     └─ Historia zadań (inline/modal)
```

### 4.2 Komponenty Nawigacyjne

#### Header Component (Protected Routes)

**Warianty według strony**:

1. **Header dla /profiles**:
   - Logo Rytmik (left, link do `/profiles`)
   - Spacer
   - "Dashboard" button (right)
   - "Wyloguj" button (right)

2. **Header dla /dashboard**:
   - Logo Rytmik (left, link do `/profiles`)
   - Spacer
   - "Wróć do profili" button (right)
   - "Wyloguj" button (right)

3. **Header dla /game/start, /game/play**:
   - Logo Rytmik (left)
   - Profile name badge (center)
   - Level indicator (center)
   - "Wróć do profili" button (right) - z confirmation

4. **Header dla /profiles/new, /profiles/{id}/edit**:
   - Logo Rytmik (left)
   - Breadcrumb: "Profile > Nowy profil" (center)
   - "Anuluj" button (right, funkcjonalnie = back)

#### Navigation Patterns

**Przekierowania automatyczne**:

- `/` (authenticated) → `/profiles`
- `/` (unauthenticated) → `/login`
- `/login` (success) → `/profiles`
- `/register` (success) → `/login`
- `/profiles/new` (success) → `/profiles`
- `/profiles/{id}/edit` (success) → `/profiles`
- `/game/start` (session started) → `/game/play`

**Back Navigation**:

- Browser back button: Respects history, ale confirmation na `/game/play`
- Header back button: Explicit navigation
- "Anuluj" buttons: Equivalent to back

**Confirmation Modals**:

- Opuszczanie `/game/play` (gra w toku)
- Usunięcie profilu
- Dirty form w `/profiles/new`, `/profiles/{id}/edit`

### 4.3 Middleware Protection

**Protected Routes** (require token):

- `/profiles/*`
- `/game/*`
- `/dashboard`

**Public Routes** (no token required):

- `/`
- `/login`
- `/register`
- `/demo`

**Middleware Logic** (Astro middleware: `src/middleware/index.ts`):

```typescript
1. Extract token from HttpOnly cookie
2. If protected route && no token → Redirect to /login
3. If token present → Validate with Supabase
4. If token invalid/expired:
   - Try refresh
   - If refresh fails → Clear cookie, redirect to /login
5. If token valid → Set user in Astro.locals, continue
6. If public route && token valid → Allow (user can access login while logged in)
```

**Token Refresh Strategy**:

- Check token expiration on each request
- Auto-refresh if < 5 minutes remaining
- Refresh token stored in HttpOnly cookie (separate from access token)

**Logout Flow**:

1. User clicks "Wyloguj"
2. Call Supabase `signOut()`
3. Clear AuthContext
4. Clear cookies (middleware helper)
5. Redirect to `/login`

### 4.4 Deep Linking & State Management

**URL Parameters**:

- `/game/start?profileId={id}` - Profile to start game for
- `/game/play?profileId={id}` - Profile currently playing
- `/profiles/{id}/edit` - Profile to edit

**Query Parameters Validation**:

- Validate `profileId` exists and belongs to authenticated parent
- If invalid → Toast error, redirect to `/profiles`

**State Persistence**:

- Game state (`GameContext`) persists during session
- On refresh `/game/play` → Fetch current task from API
- No localStorage for game state (server is source of truth)
- UI prefs in localStorage: `uiPrefs` key

**Handling Refresh**:

- Protected route → Middleware validates token
- `/game/play` refresh → Re-fetch task, resume game
- AuthContext re-hydrates from cookie

---

## 5. Kluczowe komponenty

### 5.1 Layout Components

#### `Layout.astro` (Base Layout)

**Używany przez**: Wszystkie strony

**Struktura**:

- `<head>`: Meta tags, fonts, CSS imports
- `<body>`:
  - Skip link (accessibility)
  - `<main>`: Slot dla page content
  - Toast container (Shadcn/ui)
  - Modal container (portals)

**Features**:

- Responsive meta viewport
- Security headers (via middleware)
- i18n lang attribute
- Theme variables (Tailwind CSS)

#### `Header` (React Component)

**Używany przez**: Protected routes

**Props**:

- `variant`: 'profiles' | 'game' | 'dashboard' | 'form'
- `profileName`: string (dla game variant)
- `level`: number (dla game variant)

**Features**:

- Conditional rendering based on variant
- Logout handler (calls AuthContext.logout)
- Navigation buttons
- Responsive (hamburger menu na mobile, opcjonalnie)

#### `Container` (React Component)

**Używany przez**: Większość widoków dla consistent spacing

**Props**:

- `maxWidth`: 'sm' | 'md' | 'lg' | 'xl'
- `children`: ReactNode

**Features**:

- Centered layout
- Responsive padding
- Max-width constraints

---

### 5.2 Form Components

#### `FormField` (Shadcn/ui)

**Używany przez**: Wszystkie formularze

**Features**:

- Label + Input
- Error message display
- Accessible (proper htmlFor, aria-describedby)

#### `ProfileForm` (React Component)

**Używany przez**: `/profiles/new`, `/profiles/{id}/edit`

**Props**:

- `mode`: 'create' | 'edit'
- `initialData`: Profile | null
- `onSuccess`: () => void

**Features**:

- React Hook Form + Zod validation
- Async validation (unique name check)
- Submit handler (TanStack mutation)
- Error handling (inline + toast)

#### `RegistrationForm`, `LoginForm` (React Components)

**Używany przez**: `/register`, `/login`

**Features**:

- Similar to ProfileForm
- Integration with Supabase Auth
- Password show/hide toggle

---

### 5.3 UI Components (Shadcn/ui Base)

#### `Button`

**Variants**: default, destructive, outline, ghost, link
**Sizes**: sm, default, lg
**Features**: Loading state (spinner), disabled state

#### `Card`

**Sub-components**: CardHeader, CardTitle, CardDescription, CardContent, CardFooter
**Used for**: ProfileCard, Dashboard cards

#### `Dialog` (Modal)

**Features**: Focus trap, overlay, close button, ESC to close
**Used for**: Confirmations, level up, errors

#### `Toast`

**Variants**: default, destructive, success
**Features**: Auto-dismiss, action button, close button
**Used for**: Feedback messages, errors

#### `Skeleton`

**Features**: Pulsing animation, responsive sizes
**Used for**: Loading states (profiles, piano, slots)

#### `Progress`

**Features**: Animated fill, percentage label
**Used for**: Audio preload progress

---

### 5.4 Game Components

#### `Piano` (React Component)

**Props**:

- `onKeyPress`: (note: string) => void
- `highlightedKeys`: string[]
- `disabledKeys`: boolean

**Features**:

- 12 PianoKey children
- Responsive layout (2 rows)
- Tone.js integration for sound playback

#### `PianoKey` (React Component)

**Props**:

- `note`: string
- `color`: 'white' | 'black'
- `isHighlighted`: boolean
- `isDisabled`: boolean
- `onClick`: () => void

**Features**:

- Visual states (default, highlighted, pressed, disabled)
- Click animation (scale down)
- Label (note letter)
- Accessible (button role, aria-label)

#### `AnswerSlots` (React Component)

**Props**:

- `slots`: Array<{ note: string | null, color: string }>
- `currentSlot`: number

**Features**:

- Flex row of Slot components
- Visual indicator for current slot
- Empty state (dashed border)

#### `Slot` (React Component)

**Props**:

- `note`: string | null
- `color`: string
- `isCurrent`: boolean

**Features**:

- Empty vs filled state
- Color matching piano key
- Current slot highlight

#### `GameControls` (React Component)

**Props**:

- `onReplay`: () => void
- `onClear`: () => void
- `onCheck`: () => void
- `checkEnabled`: boolean

**Features**:

- Three buttons with icons
- Conditional enable/disable
- Responsive layout

#### `LevelIndicator`, `ScoreDisplay`, `AttemptsIndicator`, `ProgressIndicator`

**Used for**: Game info panel

**Features**:

- Compact, clear display
- Animated updates (score increment, heart break)
- Responsive (stack on mobile)

---

### 5.5 Profile Components

#### `ProfileCard` (React Component)

**Props**:

- `profile`: Profile
- `onClick`: () => void

**Features**:

- Avatar/icon
- Name, age, level badge
- Hover animation (scale up)
- Click → Navigate to game

#### `ProfileList` (React Component)

**Props**:

- `profiles`: Profile[]
- `onSelectProfile`: (id: string) => void

**Features**:

- Grid layout (responsive)
- Empty state
- Loading skeleton during fetch

---

### 5.6 Dashboard Components

#### `DashboardTable` (React Component)

**Props**:

- `profiles`: DashboardSummary[]
- `onExpandProfile`: (id: string) => void

**Features**:

- Responsive (table → cards)
- Sortable columns
- Expand row → Show history
- Auto-refresh indicator

#### `TaskHistoryTable` (React Component)

**Props**:

- `tasks`: TaskResult[]
- `totalCount`: number
- `currentPage`: number
- `onPageChange`: (page: number) => void

**Features**:

- Paginated
- Columns: Date, Level, Sequence, Score
- Loading skeleton during fetch

---

### 5.7 Shared Components

#### `ErrorBoundary` (React Component)

**Features**:

- Catches unhandled errors in component tree
- Fallback UI with error message
- "Spróbuj ponownie" button (reload)

#### `ErrorToast` (React Component)

**Props**:

- `message`: string
- `details`: string (optional)

**Features**:

- Centralized error display
- Maps HTTP codes to friendly messages
- Action buttons (retry, dismiss)

#### `LoadingSkeleton` (React Component)

**Props**:

- `variant`: 'profile' | 'piano' | 'slot' | 'table'

**Features**:

- Variant-specific skeleton shapes
- Pulsing animation

#### `LanguageSwitcher` (React Component)

**Features**:

- Dropdown with language options
- Updates i18n context
- Stores preference in localStorage

#### `AccessibilityToggle` (React Component)

**Features**:

- Toggle buttons: High Contrast, Sound Off
- Updates UIPrefsContext
- Stores in localStorage

---

### 5.8 Context Providers

#### `AuthProvider` (React Context)

**Provides**: AuthState (user, token, isLoading, logout, refreshToken)

**Features**:

- Wraps app in Astro layout
- Manages authentication state
- Auto-refresh token logic
- Logout clears context + cookies

#### `UIPrefsProvider` (React Context)

**Provides**: UIPrefsState (highContrast, soundEnabled, language, lastProfileId, updatePrefs, exportPrefs, importPrefs)

**Features**:

- Syncs with localStorage
- Applies preferences (CSS classes, Tone.js mute)
- Export/import JSON for backup

#### `GameProvider` (React Context)

**Provides**: GameState (level, score, attempts, task, selectedNotes, methods)

**Features**:

- Used only in `/game/play`
- Manages game logic
- Integrates with TanStack mutations
- Audio playback coordination

---

### 5.9 Hooks

#### `usePianoSampler` (React Hook)

**Returns**: `{ sampler, isLoaded, loadProgress, playNote, playSequence }`

**Features**:

- Initializes Tone.js sampler
- Loads audio samples
- Provides play methods
- Tracks load progress

#### `useAuth` (React Hook)

**Returns**: AuthState from AuthContext

#### `useUIPrefs` (React Hook)

**Returns**: UIPrefsState from UIPrefsContext

#### `useGame` (React Hook)

**Returns**: GameState from GameContext

#### `useProfile` (React Hook)

**Params**: `profileId: string`
**Returns**: TanStack Query result for profile

#### `useTasks` (React Hook)

**Params**: `profileId: string`
**Returns**: Mutations for next task, submit answer

---

### 5.10 Utility Functions

#### `cn` (ClassName Merge)

**Used for**: Merging Tailwind classes without conflicts

#### `formatRelativeTime` (Date Formatting)

**Used for**: Dashboard "ostatnia gra" column

#### `calculateAge` (Date Calculation)

**Used for**: Profile cards age display

#### `mapHttpErrorToMessage` (Error Handling)

**Used for**: Centralized error message mapping

---

## 6. Względy UX, dostępności i bezpieczeństwa

### 6.1 User Experience (UX)

#### Responsywność

- **Target**: Tablet landscape (≥768px), desktop
- **Mobile (<768px)**: Komunikat "Najlepiej działa w orientacji poziomej"
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Layout**: Adaptive (nie tylko scaling, ale zmiana struktury)

#### Feedback i Komunikacja

- **Loading states**: Skeleton screens, spinners, disabled buttons
- **Success feedback**: Toast notifications, animations, sounds
- **Error feedback**: Inline validation, toast messages, modals
- **Empty states**: Encouraging illustrations, clear CTAs

#### Animacje

- **Purpose**: Enhance understanding, not distraction
- **Types**: Key press, slot fill, heart break, level up, score increment
- **Duration**: Quick (0.2-0.5s), respectful of user time
- **Reduced motion**: Respect `prefers-reduced-motion` media query

#### Spójność

- **Design system**: Shadcn/ui components, consistent spacing
- **Colors**: Semantic (success green, error red, primary brand)
- **Typography**: Clear hierarchy, readable sizes
- **Interactions**: Predictable behavior across app

#### Błędy i Edge Cases

- **Network errors**: Timeout modals, retry buttons
- **Validation errors**: Real-time feedback, friendly messages
- **Conflict errors**: Clear explanation (e.g., max profiles limit)
- **Graceful degradation**: Funkcjonalność core always accessible

---

### 6.2 Dostępność (WCAG AA)

#### Kontrast

- **Tekst**: Minimum 4.5:1 (normal), 3:1 (large)
- **Komponenty UI**: Minimum 3:1
- **High contrast mode**: 7:1+ dla wszystkich elementów

#### Nawigacja Klawiaturą

- **Tab order**: Logiczny (header → main content → footer)
- **Focus indicators**: Widoczne, wyraźne (outline lub custom)
- **Skip links**: Przejście do main content
- **Keyboard shortcuts**: Enter/Space dla buttonów
- **Brak pułapek**: Focus można zawsze przenieść dalej (poza modals)

#### ARIA Labels i Role

- **Semantic HTML**: Preferowane (button, nav, main, section)
- **ARIA labels**: Dla elementów bez visible text (icon buttons)
- **ARIA live regions**: Dla dynamic content (score updates, errors)
- **Role attributes**: Dla custom components (piano, slots)
- **Aria-pressed**: Dla toggle states (piano keys highlighted)

#### Screen Reader Support

- **Descriptive text**: Wszystkie interakcje opisane
- **Live announcements**: Zmiany w grze (sukces, błąd, level up)
- **Alt text**: Dla obrazów i ikon
- **Form labels**: Powiązane z inputami
- **Error messages**: Announced przez screen reader

#### Preferencje Użytkownika

- **Reduced motion**: Wyłączenie animacji
- **High contrast**: Zwiększony kontrast kolorów
- **Sound off**: Wyłączenie dźwięków
- **Font size**: Respect browser/OS settings (relative units)

#### Testy Dostępności

- **Automated**: Lighthouse, axe DevTools
- **Manual**: Keyboard-only navigation, screen reader (NVDA/JAWS)
- **Checklists**: WCAG AA compliance checklist

---

### 6.3 Bezpieczeństwo

#### Uwierzytelnianie

- **Token storage**: HttpOnly cookie (ochrona przed XSS)
- **Token expiration**: Auto-refresh przed wygaśnięciem
- **Secure flag**: HTTPS only w production
- **SameSite**: Strict (ochrona przed CSRF)

#### Autoryzacja

- **Row Level Security (RLS)**: Wszystkie query filtrowane przez `auth.uid()`
- **Endpoint validation**: Server-side sprawdzanie ownership
- **Middleware protection**: Token validated on every protected route

#### Input Validation

- **Client-side**: React Hook Form + Zod (pierwsza linia obrony)
- **Server-side**: Duplicate validation (krityczna warstwa)
- **Sanitization**: Escape user input w wyświetlanych tekstach
- **SQL injection**: Protected przez Supabase (parameterized queries)

#### Headers i Middleware

- **HSTS**: `Strict-Transport-Security: max-age=31536000`
- **X-Frame-Options**: `DENY` (prevent clickjacking)
- **X-Content-Type-Options**: `nosniff`
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **Permissions-Policy**: Disable unnecessary features

#### Rate Limiting

- **API**: 100 requests/minute per token
- **UI feedback**: 429 errors → "Za szybkie klikanie"
- **Prevent abuse**: Protect against spam, brute force

#### HTTPS

- **Enforced**: All requests over HTTPS
- **Middleware**: Redirect HTTP → HTTPS
- **Secure cookies**: Only transmitted over HTTPS

#### Error Handling

- **Don't leak info**: Generic error messages (nie ujawniaj system details)
- **Log securely**: Errors logged server-side, nie exposed do client
- **Friendly messages**: User-facing errors czytelne, ale bezpieczne

#### Data Privacy

- **Minimal data**: Only collect co needed (email, name, DOB)
- **No sharing**: Data not shared z third parties
- **GDPR ready**: Architecture supports data deletion (DELETE profile)

---

## 7. Mapowanie wymagań na elementy UI

| Wymaganie (PRD)                   | Widok                   | Komponent                            | Endpoint API                                                 |
| --------------------------------- | ----------------------- | ------------------------------------ | ------------------------------------------------------------ |
| US-001: Rejestracja rodzica       | `/register`             | `RegistrationForm`                   | Supabase Auth `signUp`                                       |
| US-002: Logowanie rodzica         | `/login`                | `LoginForm`                          | Supabase Auth `signInWithPassword`                           |
| US-003: Bezpieczne sesje          | Middleware, AuthContext | Token refresh logic                  | -                                                            |
| US-004: Tworzenie profilu dziecka | `/profiles/new`         | `ProfileForm`                        | `POST /api/profiles`                                         |
| US-005: Wybór profilu             | `/profiles`             | `ProfileCard`, `ProfileList`         | `GET /api/profiles`                                          |
| US-006: Losowanie sekwencji       | `/game/play` (auto)     | GameContext logic                    | `POST /api/profiles/{id}/tasks/next`                         |
| US-007: Odtworzenie zagadki       | `/game/play`            | `Piano` (highlights), Audio playback | -                                                            |
| US-008: Wprowadzanie odpowiedzi   | `/game/play`            | `Piano` (clicks), `AnswerSlots`      | -                                                            |
| US-009: Czyszczenie odpowiedzi    | `/game/play`            | `GameControls` ("Wyczyść" button)    | -                                                            |
| US-010: Sprawdzenie odpowiedzi    | `/game/play`            | `GameControls` ("Sprawdź" button)    | `POST /api/profiles/{id}/tasks/{seqId}/submit`               |
| US-011: Szanse i punktacja        | `/game/play`            | `AttemptsIndicator`, `ScoreDisplay`  | Response from submit endpoint                                |
| US-012: Awans poziomu             | `/game/play`            | Level up modal, animation            | Server logic (returns nextLevel)                             |
| US-013: Dashboard postępów        | `/dashboard`            | `DashboardTable`, `TaskHistoryTable` | `GET /api/dashboard`, `GET /api/profiles/{id}/tasks/history` |
| US-014: Free play                 | `/game/play`            | `Piano` (enabled between tasks)      | -                                                            |

---

## 8. Podsumowanie architektury

Architektura UI dla Rytmik MVP jest kompleksowa, skalowalna i zgodna z najlepszymi praktykami web development. Kluczowe cechy:

### ✅ Kompletność

- **10 głównych widoków** pokrywających wszystkie user stories z PRD
- **Dwie główne ścieżki** (rodzic, dziecko) + ścieżka demo
- **Wszystkie API endpoints** zmapowane na akcje UI

### ✅ Użyteczność

- **Intuicyjna nawigacja** z `/profiles` jako głównym hubem
- **Jasne komunikaty** i feedback na każdym kroku
- **Responsywny design** zoptymalizowany dla tabletów
- **Skeleton states** i loading indicators dla lepszej perceived performance

### ✅ Dostępność

- **WCAG AA compliance**: Kontrast, ARIA, keyboard navigation
- **Screen reader support**: Descriptive labels, live regions
- **User preferences**: High contrast, sound off, reduced motion

### ✅ Bezpieczeństwo

- **HttpOnly cookies** dla token storage
- **Row Level Security** enforcement
- **Input validation** (client + server)
- **Security headers** i HTTPS enforcement

### ✅ Technologia

- **Nowoczesny stack**: Astro 5, React 19, TypeScript 5, Tailwind 4
- **State management**: TanStack Query (server) + React Context (client)
- **Audio engine**: Tone.js z preload strategy
- **UI library**: Shadcn/ui dla spójności

### ✅ Skalowalność

- **Modułowa struktura** komponentów (reusable, composable)
- **Context providers** dla shared state
- **Custom hooks** dla logic reuse
- **Type safety** z TypeScript

### ✅ UX Polish

- **Animacje** (key press, success, error, level up)
- **Empty states** (encouraging, actionable)
- **Error handling** (friendly messages, retry options)
- **Demo mode** (engagement bez commitment)

---

## 9. Następne kroki implementacji

Zgodnie z planem 7-tygodniowym, architektura UI jest gotowa do implementacji:

1. **Tydzień 1**: Setup projektu, base components (Layout, Header, Button, Card)
2. **Tydzień 2**: Autentykacja (Register, Login, AuthContext, Middleware)
3. **Tydzień 3**: Profile management (CRUD views, ProfileForm, ProfileCard)
4. **Tydzień 4-5**: Game interface (Piano, Slots, GameControls, GameContext, Tone.js)
5. **Tydzień 5**: Dashboard (DashboardTable, TaskHistoryTable)
6. **Tydzień 6**: Demo mode, i18n, accessibility polish
7. **Tydzień 7**: Testing, bug fixes, deployment

Architektura zapewnia solidne fundamenty dla MVP i możliwość rozbudowy w przyszłości.

---

**Dokument przygotowany**: 2025-01-01  
**Wersja**: 1.0  
**Status**: Gotowy do implementacji
