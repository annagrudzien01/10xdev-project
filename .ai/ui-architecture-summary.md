# Podsumowanie Planowania Architektury UI - Rytmik MVP

## Decyzje

### Przepływ Nawigacji i Ekrany

1. **Ekran startowy**: Po zalogowaniu użytkownik trafia bezpośrednio na ekran „Wybór profilu".
2. **Ekran „Start gry"**: Dodanie dedykowanego ekranu z opisem i przyciskiem przed rozpoczęciem sesji (preload audio).
3. **Licznik profili**: Wyświetlanie licznika „X/10 profili" z dezaktywacją przycisku dodawania po osiągnięciu limitu 10.

### Responsywność i Wsparcie Urządzeń

4. **Orientacja i urządzenia**: Komunikat o preferowanej orientacji poziomej (≥ 768 px) z układem responsywnym dla tabletów; bez wsparcia trybu offline.
5. **Brak wsparcia dla klawiatury fizycznej**: Rezygnacja z mapowania klawiszy fizycznych na nuty pianina w MVP.
6. **Brak page transitions**: Rezygnacja z zaawansowanych animacji przejść między stronami w MVP.

### Dostępność (a11y)

5. **Standardy WCAG**: Implementacja kontrastu ≥ AA, opisów ARIA dla dźwięków.
6. **Preferencje użytkownika**: Opcje „wysoki kontrast / bez dźwięku" zapisywane w `localStorage` pod kluczem `uiPrefs`, synchronizowane przez React Context z możliwością eksportu/importu.

### Bezpieczeństwo i Autoryzacja

6. **Token storage**: Przechowywanie tokenu Supabase w HttpOnly cookie z warstwą odświeżania tokenu i automatycznym wylogowaniem przy błędzie `401`.

### Zarządzanie Stanem i API

7. **State management**: TanStack Query dla cachingu i synchronizacji z API (retry: 2, retryDelay: attempt => 2000 \* attempt, staleTime: 0) + React Context dla lokalnych danych UI.
8. **Error handling**: Centralny handler błędów mapujący kody API na przyjazne komunikaty w toastach/modalach; modal z opcją ponowienia po przekroczeniu 10s timeoutu.
9. **Brak cache offline**: Rezygnacja z IndexedDB i kolejki zapytań offline.

### Międzynarodowość (i18n)

1. **Struktura tłumaczeń**: Katalog `locales/{lang}.json`; polski (PL) ładowany w SSR, pozostałe języki przez dynamic `import()` w React/Astro.

### Tryb Demo i Audio

2. **Trasa `/demo`**: Oddzielna trasa bez tokena i sesji Supabase dla łatwego udostępniania.
3. **Brak przenoszenia postępu**: Rezygnacja z mechanizmu przenoszenia postępu z wersji demo do pełnego konta.
4. **Audio preload**: Preładowanie nut pierwszego poziomu + krótkie SFX UI; lazy-loading pozostałych próbek po starcie sesji.

### Komponenty i Styling

10. **Biblioteka komponentów**: Wykorzystanie Shadcn/ui z motywem Tailwind dla spójnego designu.

### Analityka

10. **Brak zewnętrznej analityki**: Rezygnacja z integracji PostHog w MVP; rozważenie logów Supabase dla podstawowych metryk.

---

## Dopasowane Zalecenia

### Nawigacja i UX

1. Ustalenie jednolitego ekranu startowego „Wybór profilu" dla uproszczenia przepływu i ograniczenia liczby kliknięć.
2. Dodanie ekranu „Start gry" z opisem i przyciskiem dla świadomego rozpoczęcia sesji i preloadu zasobów audio.
3. Widoczny licznik profili (np. „7/10") i dezaktywacja przycisku dodawania po przekroczeniu limitu, aby uniknąć błędu `409 Conflict`.

### Responsywność

4. Komunikat o najlepszym doświadczeniu w orientacji poziomej na ekranach ≥ 768 px oraz układ responsywny zoptymalizowany dla tabletów.

### Dostępność

5. Zapewnienie kontrastu ≥ AA zgodnie z WCAG, opisy ARIA dla interakcji audio oraz tryb „wysoki kontrast / bez dźwięku" dla użytkowników z niepełnosprawnościami.

### Bezpieczeństwo

6. Preferowanie HttpOnly cookie dla tokenu Supabase z warstwą odświeżania tokenów i automatycznym wylogowaniem przy błędzie `401 Unauthenticated`.

### State Management

7. Wykorzystanie TanStack Query do cachingu i synchronizacji REST (automatyczne retry, deduplikacja) z parametrami: retry: 2, retryDelay exponential, staleTime: 0.
8. Stworzenie centralnego handlera błędów tłumaczącego kody HTTP na czytelne komunikaty („Za szybkie klikanie – spróbuj za chwilę", „Nie znaleziono profilu") wyświetlane w toastach/modalach.

### i18n

9. Podział katalogu `locales` na per-język JSON, ładowanie domyślnego (PL) w SSR, pozostałe języki na żądanie przez dynamic `import()`.

### Demo i Audio

10. Udostępnienie trasy `/demo` bez tokena i sesji Supabase dla prostego share linku i separacji logiki.
11. Preładowanie nut pierwszego poziomu + krótkie SFX UI; lazy-loading pozostałych próbek audio w tle po starcie sesji.

### UI Components

12. Opracowanie biblioteki komponentów opartej na Shadcn/ui z motywem Tailwind dla szybkiego budowania ekranów i zachowania jednolitego stylu.

### Preferencje Użytkownika

13. Przechowywanie preferencji UI (`uiPrefs`) oraz ostatnio wybranego profilu (`lastProfileId`) w `localStorage`, synchronizacja do React Context z możliwością eksportu/importu w ustawieniach.

### UX Continuity

14. Stosowanie szkieletu ekranu (skeleton) dla slotów i klawiszy, wstawianie nowych danych przez animację fade-in dla utrzymania płynności.

---

## Szczegółowe Podsumowanie Architektury UI

### A. Główne Wymagania Architektury UI

**Stack Technologiczny:**

- Astro 5 (SSR, routing)
- React 19 (komponenty interaktywne)
- TypeScript 5 (type safety)
- Tailwind 4 (styling)
- Shadcn/ui (komponenty UI)
- Tone.js (synteza audio)
- TanStack Query (state management, API sync)
- Supabase (backend, auth, baza danych)

**Kluczowe Założenia:**

- Aplikacja webowa zoptymalizowana pod tablety i desktop (landscape ≥ 768 px)
- Wsparcie dla dwóch typów użytkowników: Rodzic (Admin) i Dziecko
- Bez trybu offline – wszystkie operacje wymagają połączenia
- Międzynarodowość (PL domyślny, struktura gotowa na więcej języków)
- Dostępność zgodna z WCAG AA

---

### B. Kluczowe Widoki, Ekrany i Przepływy Użytkownika

#### 1. Ścieżka Rodzica (Admin)

**1.1 Rejestracja** (`/register`)

- Formularz: email, hasło, potwierdzenie hasła
- Walidacja po stronie klienta i serwera
- Po sukcesie → przekierowanie na `/login`
- Integracja: Supabase Auth

**1.2 Logowanie** (`/login`)

- Formularz: email, hasło
- Token zapisywany w HttpOnly cookie
- Po sukcesie → przekierowanie na `/profiles` (wybór profilu)
- Obsługa błędów: nieprawidłowe dane, konto nieaktywne
- Integracja: Supabase Auth

**1.3 Wybór Profilu** (`/profiles`)

- **Główny ekran startowy po zalogowaniu**
- Lista profili dziecka (kafelki z nazwą, wiekiem, poziomem)
- Licznik „X/10 profili" widoczny nad przyciskiem „+"
- Przycisk „Dodaj profil" (dezaktywowany po 10 profilach)
- Przycisk „Dashboard" (przejście do widoku postępów)
- Kliknięcie profilu → `/game/start?profileId={id}`
- Integracja: `GET /api/profiles`

**1.4 Formularz Profilu** (`/profiles/new`, `/profiles/{id}/edit`)

- Pola: imię dziecka, data urodzenia
- Walidacja: regex dla imienia, data w przeszłości, unikalność per rodzic
- Integracja: `POST /api/profiles`, `PATCH /api/profiles/{id}`

**1.5 Dashboard Rodzica** (`/dashboard`)

- Tabela profili: imię, poziom, suma punktów, data ostatniej gry
- Historia zadań (paginowana): data, poziom, sekwencja, wynik
- Przycisk „Odśwież" (opcjonalnie auto-refresh co 30-60s przez TanStack Query)
- Integracja: `GET /api/dashboard`, `GET /api/profiles/{id}/tasks/history`

#### 2. Ścieżka Dziecka (Gracz)

**2.1 Start Gry** (`/game/start?profileId={id}`)

- Ekran z opisem zadania i przyciskiem „Rozpocznij"
- **Preload audio**: nuty pierwszego poziomu + SFX UI
- Pasek postępu ładowania próbek
- Po zakończeniu preloadu → aktywacja przycisku „Rozpocznij"
- Integracja: `POST /api/profiles/{id}/sessions` (start sesji)

**2.2 Ekran Gry** (`/game/play?profileId={id}`)

- **Sekcja 1: Panel informacyjny**
  - Poziom gracza (1-20)
  - Liczba punktów
  - Szanse (3 serduszka/ikony)
  - Licznik ukończonych zadań w tym poziomie (X/5)

- **Sekcja 2: Pianino (1 oktawa)**
  - 12 klawiszy (7 białych + 5 czarnych)
  - Każdy klawisz: kolor + litera (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
  - Podświetlenie podczas odtwarzania zagadki
  - Kliknięcie klawisza → odtworzenie dźwięku (monofoniczne)
  - Free play: aktywne poza odtwarzaniem zagadki

- **Sekcja 3: Panel slotów**
  - Wyświetla długość brakującej sekwencji (pustych slotów)
  - Każdy klik klawisza wypełnia kolejny slot
  - Slot pokazuje literę nuty i kolor

- **Sekcja 4: Przyciski akcji**
  - „Wyczyść" – czyści wszystkie sloty
  - „Sprawdź" – aktywny po uzupełnieniu wszystkich slotów
  - „Odtwórz ponownie" – powtarza zagadkę audio

- **Integracja:**
  - `POST /api/profiles/{id}/tasks/next` → pobiera nowe zadanie
  - `POST /api/profiles/{id}/tasks/{sequenceId}/submit` → walidacja odpowiedzi

**2.3 Feedback i Animacje**

- **Sukces**: animacja (+10/5/2 pkt), dźwięk sukcesu, przejście do kolejnego zadania
- **Błąd**: animacja pękającego serduszka, odejmowanie szansy, możliwość ponowienia
- **3 błędy**: pokazanie poprawnej sekwencji, 0 pkt, przejście do kolejnego zadania
- **Awans poziomu**: po 5 poprawnych odpowiedziach → komunikat „Poziom up!", animacja

**2.4 Szkielet i Ładowanie (Skeleton States)**

- Skeleton dla pianinka podczas ładowania próbek
- Skeleton dla slotów podczas pobierania zadania
- Fade-in dla nowych danych po załadowaniu

#### 3. Ścieżka Demo

**3.1 Demo** (`/demo`)

- Uproszczona wersja gry bez logowania
- Brak sesji Supabase, brak zapisu postępów
- Lokalny stan w React (bez persystencji)
- Ograniczone poziomy (np. 1-3)
- Komunikat zachęcający do rejestracji
- **Brak przenoszenia postępu** po rejestracji

---

### C. Strategia Integracji z API i Zarządzania Stanem

#### API Communication Layer

**TanStack Query Configuration:**

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => 2000 * attemptIndex,
      staleTime: 0,
      cacheTime: 5 * 60 * 1000, // 5 min
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

**Global Timeout & Error Handling:**

- Timeout: 10 sekund dla wszystkich requestów
- Po przekroczeniu: modal z opcją „Spróbuj ponownie" lub „Sprawdź połączenie"
- Centralny error handler mapujący kody HTTP:
  - `400` → „Nieprawidłowe dane"
  - `401` → Automatyczne wylogowanie + redirect na `/login`
  - `403` → „Brak uprawnień"
  - `404` → „Nie znaleziono zasobu"
  - `409` → „Konflikt" (np. limit profili, duplikat nazwy)
  - `422` → „Błąd walidacji" + szczegóły
  - `429` → „Za szybkie klikanie – spróbuj za chwilę"
  - `500` → „Błąd serwera – spróbuj później"

**API Endpoints Mapping:**

| UI Action         | Endpoint                                       | Method | Query Key                                  |
| ----------------- | ---------------------------------------------- | ------ | ------------------------------------------ |
| Lista profili     | `/api/profiles`                                | GET    | `['profiles']`                             |
| Tworzenie profilu | `/api/profiles`                                | POST   | invalidates `['profiles']`                 |
| Edycja profilu    | `/api/profiles/{id}`                           | PATCH  | invalidates `['profiles', id]`             |
| Usunięcie profilu | `/api/profiles/{id}`                           | DELETE | invalidates `['profiles']`                 |
| Start sesji       | `/api/profiles/{id}/sessions`                  | POST   | `['session', profileId]`                   |
| Pobierz zadanie   | `/api/profiles/{id}/tasks/next`                | POST   | `['task', profileId]`                      |
| Submit odpowiedzi | `/api/profiles/{id}/tasks/{sequenceId}/submit` | POST   | invalidates `['profiles', id]`, `['task']` |
| Dashboard         | `/api/dashboard`                               | GET    | `['dashboard']` (refetch 30-60s)           |
| Historia zadań    | `/api/profiles/{id}/tasks/history`             | GET    | `['taskHistory', profileId]`               |

#### State Management Architecture

**1. Server State (TanStack Query)**

- Profile użytkownika
- Sesje gry
- Zadania i wyniki
- Dashboard data
- Auto-revalidation dla dashboard (30-60s)

**2. Client State (React Context)**

```typescript
// AuthContext - uwierzytelnienie
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// UIPrefsContext - preferencje użytkownika
interface UIPrefsState {
  highContrast: boolean;
  soundEnabled: boolean;
  language: "pl" | "en";
  lastProfileId: string | null;
  updatePrefs: (prefs: Partial<UIPrefsState>) => void;
  exportPrefs: () => string;
  importPrefs: (json: string) => void;
}

// GameContext - stan gry (dla ekranu gry)
interface GameState {
  currentLevel: number;
  totalScore: number;
  attemptsLeft: number;
  completedTasksInLevel: number;
  currentTask: Task | null;
  selectedNotes: string[];
  isPlayingSequence: boolean;
  addNote: (note: string) => void;
  clearNotes: () => void;
  submitAnswer: () => Promise<void>;
}
```

**3. Local Storage Schema**

```typescript
{
  "uiPrefs": {
    "highContrast": false,
    "soundEnabled": true,
    "language": "pl",
    "lastProfileId": "uuid-here"
  }
}
```

#### Authentication Flow

1. **Login**:
   - Supabase Auth zwraca session
   - Token zapisywany w HttpOnly cookie (via middleware)
   - User data w AuthContext

2. **Token Refresh**:
   - Middleware Astro sprawdza ważność tokenu
   - Auto-refresh przed wygaśnięciem
   - W przypadku błędu `401` → logout + redirect

3. **Logout**:
   - Clear AuthContext
   - Supabase `signOut()`
   - Redirect na `/login`

---

### D. Responsywność, Dostępność i Bezpieczeństwo

#### Responsywność

**Breakpoints (Tailwind):**

```typescript
{
  'sm': '640px',  // małe tablety (portrait)
  'md': '768px',  // tablety (landscape) - TARGET
  'lg': '1024px', // małe laptopy
  'xl': '1280px', // desktop
}
```

**Layout Strategy:**

- Mobile (< 768px): Komunikat „Najlepiej działa w orientacji poziomej na ekranie ≥ 768 px"
- Tablet (768px - 1024px): Zoptymalizowany layout (main target)
- Desktop (> 1024px): Rozszerzony layout z większymi elementami

**Responsive Components:**

- Pianino: grid responsive (2 rzędy na tablet, 1 rząd na desktop)
- Sloty: flex-wrap dla mniejszych ekranów
- Dashboard: tabela → karty na mniejszych ekranach

#### Dostępność (WCAG AA)

**Kontrast:**

- Tekst: minimum 4.5:1
- Duże elementy: minimum 3:1
- Tryb wysokiego kontrastu: 7:1+

**ARIA Labels:**

```typescript
// Przykłady
<button aria-label="Odtwórz sekwencję ponownie">
<div role="region" aria-label="Pianino" aria-live="polite">
<div role="list" aria-label="Sloty odpowiedzi">
<button aria-label="Klawisz C" aria-pressed={isActive}>
```

**Keyboard Navigation:**

- Tab order logiczny (header → pianino → sloty → przyciski)
- Focus indicators widoczne
- Skip links do głównej treści
- **Brak mapowania fizycznych klawiszy na nuty w MVP**

**Screen Reader Support:**

- Opisowe teksty dla wszystkich interakcji
- Live regions dla feedbacku (sukces/błąd)
- Alt text dla animacji

**Preferencje Użytkownika:**

- `prefers-reduced-motion` → wyłącz animacje
- `prefers-color-scheme` → respektuj systemowy dark mode
- Toggle w UI: „Wysoki kontrast", „Wyłącz dźwięk"

#### Bezpieczeństwo

**Authentication & Authorization:**

- Token w HttpOnly cookie (ochrona przed XSS)
- SameSite=Strict (ochrona przed CSRF)
- Secure flag w production (HTTPS only)
- Auto-refresh tokenu przed wygaśnięciem
- Logout przy `401 Unauthenticated`

**Row Level Security (RLS):**

- Wszystkie zapytania DB filtrowane przez `auth.uid()`
- Brak możliwości dostępu do danych innych użytkowników

**Middleware Security Headers:**

```typescript
{
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
}
```

**Input Validation:**

- Client-side: React Hook Form + Zod schemas
- Server-side: Duplicate validation w API endpoints
- Sanitization: escape user input w wyświetlanych komunikatach

**Rate Limiting:**

- API: 100 requests/minute per token (zgodnie z api-plan.md)
- UI feedback: komunikat `429` → „Za szybkie klikanie"

---

### E. Międzynarodowość (i18n)

**Struktura Plików:**

```
src/
  locales/
    pl.json       # Default, loaded SSR
    en.json       # Dynamic import
    de.json       # Dynamic import (future)
```

**Implementacja:**

- Astro: `astro-i18next` dla SSR
- React: `react-i18next` dla komponentów
- Lazy loading języków: `import(`./locales/${lang}.json`)`
- Default: PL (ładowany w SSR)
- Przełącznik języka w UI (header/settings)

**Treści do Tłumaczenia:**

- Wszystkie komunikaty UI
- Error messages
- ARIA labels
- Instrukcje gry
- **NIE**: Nazwy nut (pozostają literami)

---

### F. Audio Management (Tone.js)

**Preload Strategy:**

1. **Ekran „Start Gry"**:
   - Nuty pierwszego poziomu (12 próbek)
   - Krótkie SFX UI (sukces, błąd, klik)
   - Pasek postępu

2. **Lazy Loading** (w tle po starcie sesji):
   - Próbki wyższych oktaw (poza MVP)
   - Dodatkowe SFX

**Audio Context Management:**

```typescript
// Inicjalizacja po user gesture (wymagane przez przeglądarki)
const audioContext = new Tone.Context();
await audioContext.resume();

// Sampler dla pianina
const sampler = new Tone.Sampler({
  urls: {
    /* preloaded samples */
  },
  onload: () => setAudioReady(true),
});
```

**Preferencje Audio:**

- Toggle „Wyłącz dźwięk" w `uiPrefs`
- Respektowanie `prefers-reduced-motion` (brak auto-play)

---

### G. Component Architecture (Shadcn/ui + Tailwind)

**Struktura Komponentów:**

```
src/components/
  ui/                    # Shadcn/ui base components
    button.tsx
    card.tsx
    dialog.tsx
    toast.tsx
    skeleton.tsx

  game/                  # Game-specific components
    Piano.tsx
    PianoKey.tsx
    AnswerSlots.tsx
    GameControls.tsx
    LevelIndicator.tsx
    AttemptsIndicator.tsx

  profile/               # Profile management
    ProfileCard.tsx
    AddProfileForm.tsx
    ProfileList.tsx

  dashboard/             # Parent dashboard
    DashboardTable.tsx
    TaskHistoryTable.tsx

  shared/                # Shared components
    ErrorBoundary.tsx
    ErrorToast.tsx
    LoadingSkeleton.tsx
    LanguageSwitcher.tsx
    AccessibilityToggle.tsx
```

**Tailwind Theme:**

```typescript
// tailwind.config.js
{
  theme: {
    extend: {
      colors: {
        primary: { /* piano keys */ },
        success: { /* correct answer */ },
        error: { /* wrong answer */ },
        // High contrast variants
      },
      animation: {
        'key-press': 'keyPress 0.2s ease-out',
        'slot-fill': 'slotFill 0.3s ease-in',
        'heart-break': 'heartBreak 0.5s ease-out',
      },
    },
  },
}
```

---

### H. Routing Structure (Astro)

```
src/pages/
  index.astro                      # Landing page (redirect na /login lub /profiles)

  register.astro                   # Rejestracja
  login.astro                      # Logowanie

  profiles/
    index.astro                    # Lista profili (główny ekran startowy)
    new.astro                      # Formularz nowego profilu
    [id]/edit.astro                # Edycja profilu

  game/
    start.astro                    # Ekran start gry (preload)
    play.astro                     # Ekran gry

  dashboard/
    index.astro                    # Dashboard rodzica

  demo/
    index.astro                    # Demo bez logowania

  api/
    profiles/
      index.ts                     # GET, POST /profiles
      [id].ts                      # GET, PATCH, DELETE /profiles/{id}
      [id]/sessions.ts             # POST /profiles/{id}/sessions
      [id]/tasks/
        next.ts                    # POST /profiles/{id}/tasks/next
        [sequenceId]/submit.ts     # POST /profiles/{id}/tasks/{sequenceId}/submit
        history.ts                 # GET /profiles/{id}/tasks/history
    dashboard/
      index.ts                     # GET /dashboard
    auth/
      login.ts                     # POST /auth/login
      register.ts                  # POST /auth/register
      logout.ts                    # POST /auth/logout
```

**Protected Routes:**

- Middleware sprawdza token w cookie
- Redirect na `/login` jeśli brak tokenu
- Routes wymagające auth: `/profiles`, `/game`, `/dashboard`
- Public routes: `/login`, `/register`, `/demo`

---

### I. Error Handling & User Feedback

**Toast Notifications (Inline Errors):**

- Success: Redirect immediately without toast
- Error: Inline display in FormError component (red, persistent until corrected)
- Field-specific errors: Displayed directly under the relevant form field
- General errors: Displayed at the top of the form in a destructive background box

**Modal Dialogs:**

- Timeout (>10s): „Sprawdź połączenie" + przycisk „Spróbuj ponownie"
- Krytyczne błędy: Modal z opisem + opcje akcji
- Potwierdzenia: Usunięcie profilu, wylogowanie

**Error Boundary:**

```typescript
// Catches unhandled errors in React tree
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

**Loading States:**

- Skeleton screens dla asynchronicznych danych
- Spinner dla akcji w tle
- Disabled state dla przycisków podczas mutation

**Empty States:**

- Brak profili: „Dodaj pierwszy profil dziecka"
- Brak historii: „Historia zadań pojawi się po pierwszej grze"

---

### J. Performance Optimization

**Code Splitting:**

- Lazy load routes (Astro default)
- Dynamic import dla języków i18n
- Lazy load Tone.js sampler (po user gesture)

**Asset Optimization:**

- Audio próbki: kompresja, preload tylko dla poziomu 1
- Images: WebP, lazy loading, responsive sizes
- Fonts: subset, preload

**Caching Strategy:**

- TanStack Query cache (5 min)
- Service Worker (future, poza MVP)
- Browser cache headers dla statycznych assetów

**Bundle Size:**

- Tree-shaking (Vite default)
- Code splitting per route
- Lazy load heavy dependencies (Tone.js, chart libraries)

---

## Nierozwiązane Kwestie

### 1. Mapowanie Klawiatury Fizycznej

**Status**: Odrzucone w MVP  
**Kontekst**: Czy implementować obsługę klawiszy fizycznych (A-L) dla użytkowników desktop?  
**Decyzja**: NIE w MVP, rozważyć na podstawie feedbacku użytkowników.  
**Akcja**: Monitorować prośby użytkowników; dodać tooltip informujący o kliknięciu myszą.

### 2. Analityka i Metryki

**Status**: Do doprecyzowania  
**Kontekst**: Jak mierzyć R7 (retencja 7-dniowa) i średni czas gry bez zewnętrznej analityki (PostHog)?  
**Opcje**:

- Własna tabela `event_logs` w Supabase
- Logi Supabase (query logs)
- Dodanie prostego trackera wydarzeń  
  **Akcja**: Zdefiniować minimalne wymagania dla metryk sukcesu i wybrać rozwiązanie.

### 3. Przenoszenie Postępu z Demo

**Status**: Odrzucone  
**Kontekst**: Czy pozwalać na przeniesienie postępu z `/demo` po rejestracji?  
**Decyzja**: NIE w MVP.  
**Akcja**: Monitorować feedback; rozważyć w przyszłych iteracjach.

### 4. Page Transitions i Animacje

**Status**: Odrzucone w MVP  
**Kontekst**: Czy wdrożyć zaawansowane animacje przejść między stronami (View Transitions API)?  
**Decyzja**: NIE w MVP, focus na funkcjonalności core.  
**Akcja**: Rozważyć po walidacji MVP z użytkownikami.

### 5. Szczegóły Offline Support

**Status**: Odrzucone  
**Kontekst**: Czy potrzebny cache offline (Service Worker, IndexedDB)?  
**Decyzja**: NIE w MVP, aplikacja wymaga połączenia.  
**Akcja**: Rozważyć Progressive Web App (PWA) w przyszłości.

### 6. Strategia Auto-Save

**Status**: Do ustalenia  
**Kontekst**: Jak często zapisywać stan gry (punkty, poziom, próby)?  
**Opcje**:

- Po każdym zadaniu (natychmiast)
- Co N zadań (batch)
- Na końcu sesji  
  **Akcja**: Ustalić strategię na podstawie wydajności API i UX.

### 7. Limit Czasu na Zadanie

**Status**: Nie zdefiniowane w PRD  
**Kontekst**: Czy wprowadzić limit czasu na uzupełnienie odpowiedzi?  
**Akcja**: Konsultacja z właścicielem produktu; obecnie brak limitu.

### 8. Dashboard Real-time Updates

**Status**: Częściowo rozwiązane (auto-refresh TanStack Query)  
**Kontekst**: Czy potrzebne WebSocket/Supabase Realtime dla natychmiastowych aktualizacji?  
**Decyzja**: NIE w MVP, polling (30-60s) wystarczający.  
**Akcja**: Rozważyć przy większej skali (>1000 użytkowników).

### 9. Eksport/Import Preferencji UI

**Status**: Zaplanowane  
**Kontekst**: Mechanizm eksportu `uiPrefs` do JSON i importu.  
**Akcja**: Implementować w panelu ustawień; format JSON do uzgodnienia.

### 10. Strategia Testowania UI

**Status**: Do zdefiniowania  
**Kontekst**: Jakie testy jednostkowe/integracyjne dla komponentów UI?  
**Opcje**:

- Vitest + React Testing Library
- Playwright (E2E)
- Storybook (visual testing)  
  **Akcja**: Zdefiniować strategię testowania przed implementacją.

---

## Następne Kroki

### Faza 1: Setup Projektu (Week 1)

1. [ ] Konfiguracja Astro 5 + React 19 + TypeScript
2. [ ] Setup Tailwind 4 + Shadcn/ui
3. [ ] Instalacja TanStack Query + React Context
4. [ ] Konfiguracja i18n (astro-i18next)
5. [ ] Setup Supabase Client + middleware (HttpOnly cookie)
6. [ ] Konfiguracja ESLint + Prettier

### Faza 2: Komponenty Bazowe (Week 1-2)

1. [ ] UI Components (Button, Card, Toast, Dialog, Skeleton)
2. [ ] Layout Components (Header, Footer, Container)
3. [ ] Error Boundary + Error Handler
4. [ ] AuthContext + UIPrefsContext
5. [ ] LanguageSwitcher + AccessibilityToggle

### Faza 3: Autentykacja i Profile (Week 2-3)

1. [ ] Ekrany: Register, Login
2. [ ] Middleware autoryzacji
3. [ ] ProfileList + ProfileCard + ProfileForm
4. [ ] API endpoints: `/api/profiles/*`
5. [ ] Walidacja (Zod schemas)

### Faza 4: Ekran Gry (Week 3-5)

1. [ ] Piano Component + PianoKey
2. [ ] AnswerSlots Component
3. [ ] GameControls (Sprawdź, Wyczyść, Odtwórz)
4. [ ] Integracja Tone.js (preload, sampler)
5. [ ] GameContext (stan gry)
6. [ ] API endpoints: `/api/profiles/{id}/tasks/*`
7. [ ] Animacje feedbacku (sukces, błąd, awans poziomu)

### Faza 5: Dashboard i Historia (Week 5)

1. [ ] Dashboard layout
2. [ ] DashboardTable + TaskHistoryTable
3. [ ] API endpoint: `/api/dashboard`
4. [ ] Auto-refresh (TanStack Query)

### Faza 6: Demo Mode (Week 6)

1. [ ] Trasa `/demo`
2. [ ] Lokalny stan gry (bez Supabase)
3. [ ] Ograniczone poziomy (1-3)
4. [ ] Komunikat zachęcający do rejestracji

### Faza 7: Polish & Testing (Week 6-7)

1. [ ] Responsywność (tablet, desktop)
2. [ ] Dostępność (WCAG AA audit)
3. [ ] Error handling (wszystkie edge cases)
4. [ ] Performance optimization
5. [ ] Manual testing (user flows)
6. [ ] Bug fixes

### Faza 8: Deployment (Week 7)

1. [ ] Docker image
2. [ ] CI/CD pipeline (GitHub Actions)
3. [ ] Hosting setup (DigitalOcean)
4. [ ] Monitoring (logi, basic analytics)
5. [ ] Production launch

---

## Załączniki

### A. Przykładowe User Flows

**Flow 1: Nowy rodzic tworzy profil i rozpoczyna grę**

1. Rejestracja (`/register`)
2. Login (`/login`)
3. Ekran wyboru profilu – pusta lista
4. Klik „Dodaj profil" → Formularz (`/profiles/new`)
5. Wypełnienie: Imię „Anna", Data urodzenia „2018-05-24"
6. Submit → redirect na `/profiles` (lista z 1 profilem)
7. Klik na profil „Anna" → `/game/start?profileId={id}`
8. Preload audio (pasek postępu)
9. Klik „Rozpocznij" → `/game/play?profileId={id}`
10. Odtworzenie zagadki (audio + podświetlenie klawiszy)
11. Uzupełnienie slotów przez kliknięcie klawiszy
12. Klik „Sprawdź" → Feedback (sukces/błąd)
13. Kolejne zadanie...

**Flow 2: Rodzic sprawdza postępy dziecka**

1. Login (`/login`)
2. Ekran wyboru profilu (`/profiles`)
3. Klik „Dashboard" → `/dashboard`
4. Widok tabeli: Anna (poziom 4, 320 pkt, ostatnia gra: wczoraj)
5. Klik „Historia" dla Anny → `GET /api/profiles/{id}/tasks/history`
6. Tabela paginowana z wynikami

**Flow 3: Użytkownik testuje demo**

1. Landing page → klik „Wypróbuj demo"
2. `/demo` – ekran start gry
3. Preload audio
4. Klik „Rozpocznij"
5. Gra (lokalny stan, poziomy 1-3)
6. Po kilku zadaniach: modal „Zarejestruj się, aby zapisać postępy"

### B. API Request/Response Examples

**POST /api/profiles**

```json
// Request
{
  "profileName": "Anna",
  "dateOfBirth": "2018-05-24"
}

// Response 201 Created
{
  "id": "uuid",
  "profileName": "Anna",
  "dateOfBirth": "2018-05-24",
  "currentLevel": 1,
  "totalScore": 0,
  "createdAt": "2025-01-01T10:00:00Z"
}
```

**POST /api/profiles/{id}/tasks/next**

```json
// Response 200 OK
{
  "sequenceId": "uuid",
  "levelId": 3,
  "sequenceBeginning": ["C", "E", "G", "G#"],
  "expectedSlots": 2
}
```

**POST /api/profiles/{id}/tasks/{sequenceId}/submit**

```json
// Request
{
  "answer": ["A", "B"]
}

// Response 200 OK
{
  "correct": true,
  "score": 10,
  "attemptsUsed": 1,
  "levelCompleted": false,
  "completedTasksInLevel": 3,
  "nextLevel": 3
}
```

### C. Zod Schemas (Validation)

```typescript
// Profile schema
const profileSchema = z.object({
  profileName: z
    .string()
    .min(2, "Imię musi mieć min. 2 znaki")
    .max(50, "Imię może mieć max. 50 znaków")
    .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/, "Imię zawiera niedozwolone znaki"),
  dateOfBirth: z
    .string()
    .refine((date) => new Date(date) < new Date(), "Data urodzenia musi być w przeszłości")
    .refine((date) => {
      const age = (new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24 * 365);
      return age >= 3 && age <= 18;
    }, "Wiek dziecka powinien być między 3 a 18 lat"),
});

// Answer schema
const answerSchema = z.object({
  answer: z.array(z.string()).min(1, "Odpowiedź nie może być pusta").max(20, "Odpowiedź zbyt długa"),
});
```

---

## Podsumowanie

Dokument definiuje kompletną architekturę UI dla MVP aplikacji Rytmik, obejmującą:

✅ **Przepływy użytkownika** dla rodzica i dziecka  
✅ **Strukturę ekranów** (9 głównych widoków)  
✅ **Integrację z API** (TanStack Query, error handling, timeouts)  
✅ **Zarządzanie stanem** (server state, client contexts, localStorage)  
✅ **Bezpieczeństwo** (HttpOnly cookies, RLS, validation)  
✅ **Dostępność** (WCAG AA, ARIA, preferencje użytkownika)  
✅ **Responsywność** (tablet-first, komunikat dla mobile)  
✅ **Audio management** (Tone.js, preload strategy)  
✅ **Komponenty** (Shadcn/ui, struktura katalogów)  
✅ **i18n** (PL default, lazy loading innych języków)

Architektura jest gotowa do implementacji zgodnie z planem 7-tygodniowym.
