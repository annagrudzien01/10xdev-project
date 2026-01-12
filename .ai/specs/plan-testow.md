# Plan Testów - Rytmik MVP

## 1. Wprowadzenie i cele testowania

### 1.1 Cel dokumentu
Niniejszy dokument określa kompleksową strategię testowania aplikacji Rytmik - webowej gry edukacyjnej dla dzieci rozwijającej umiejętność rozpoznawania sekwencji dźwiękowych.

### 1.2 Cele testowania
- Weryfikacja poprawności wszystkich funkcjonalności zgodnie z PRD
- Zapewnienie bezpieczeństwa danych użytkowników (autentykacja, RLS)
- Walidacja wydajności audio (Tone.js) i interakcji UI
- Potwierdzenie zgodności z WCAG 2.1 Level AA
- Weryfikacja mechaniki gry (punktacja, poziomy, sesje)
- Zapewnienie stabilności na urządzeniach tablet/desktop (landscape)

### 1.3 Kluczowe obszary ryzyka
1. **Audio synchornizacja** - podświetlanie klawiszy z odtwarzaniem dźwięków (Tone.js)
2. **Bezpieczeństwo** - Row Level Security (RLS), autentykacja, CSRF
3. **Logika poziomów** - awans po 5 sukcesach, brak degradacji poziomu
4. **Zarządzanie sesjami** - timeout 10 min, refresh +2 min, jedno aktywne session
5. **Persystencja stanu** - zapis postępów, odzyskiwanie po refresh
6. **Walidacja danych** - regex profilu, limity (10 profili), format sekwencji

---

## 2. Zakres testów

### 2.1 W zakresie testów
- **Moduł autentykacji** - rejestracja, logowanie, reset hasła, sesje (US-001, US-002, US-003, US-015)
- **Zarządzanie profilami** - CRUD profili dzieci, limit 10 profili (US-004, US-005)
- **Mechanika gry** - generowanie zagadek, walidacja odpowiedzi, punktacja, poziomy (US-006-US-012)
- **Dashboard rodzica** - agregacja postępów dzieci (US-013)
- **Audio i UI** - pianino, odtwarzanie sekwencji, free play (US-007, US-008, US-014)
- **API endpoints** - wszystkie endpointy z `/src/pages/api`
- **Tryb demo** - poziomy 1-3, brak persystencji

### 2.2 Poza zakresem testów (MVP)
- Import/eksport plików (zgodnie z PRD §4)
- Ranking użytkowników i interakcje między kontami
- Aplikacja mobilna (tylko tablet/desktop landscape)
- Onboarding/tutorial wizualny
- Testy obciążeniowe (performance testing na dużą skalę)

---

## 3. Typy testów

### 3.1 Testy jednostkowe (Unit Tests)
**Priorytet:** Wysoki  
**Framework:** Vitest + React Testing Library

**Obszary:**
- **Funkcje pomocnicze** (`src/lib/utils.ts`)
  - Transformacje DTO (snake_case ↔ camelCase)
  - Walidacja formatów sekwencji (np. `"C4-E4-G4"`)
  - Kalkulacja expectedSlots z sequence_end
- **Schematy walidacji Zod** (`src/lib/schemas/`)
  - auth.schema.ts - email, hasło (min 8 znaków)
  - profile.schema.ts - regex nazwy, data urodzenia (przeszłość)
  - task.schema.ts - format odpowiedzi (z oktawami)
  - pagination.schema.ts - page, pageSize (max 100)
- **Hooki React** (`src/lib/hooks/`)
  - `usePianoSampler` - ładowanie sampli, playNote
  - `useDemoGame` - logika demo (poziomy 1-3, brak API)
- **Komponenty UI w izolacji**
  - `<PianoKey>` - stany (default, highlighted, pressed, disabled)
  - `<AnswerSlots>` - wypełnianie slotów, czyszczenie
  - `<GameHeader>` - wyświetlanie poziomu, score, attempts

**Kryteria akceptacji:**
- Pokrycie kodu ≥ 80% dla utils, schemas, hooks
- Wszystkie edge cases pokryte (np. pusty string, null, undefined)
- Testy izolowane (mocked dependencies)

### 3.2 Testy integracyjne (Integration Tests)
**Priorytet:** Wysoki  
**Framework:** Vitest + MSW (Mock Service Worker)

**Obszary:**
- **API endpoints z serwisami**
  - `POST /api/auth/register` → Supabase Auth
  - `POST /api/profiles` → profile.service.ts → Supabase DB
  - `POST /profiles/{id}/tasks/next` → task.service.ts → generowanie zagadki
  - `GET /api/dashboard` → agregacja z child_profiles + task_results
- **Game flow**
  - GameContext → API calls → UI update
  - Start session → generate task → submit answer → level progression
- **Autentykacja end-to-end**
  - Middleware → cookie verification → RLS enforcement
- **Zarządzanie sesjami**
  - Start session → auto-close previous → timeout → refresh

**Kryteria akceptacji:**
- Wszystkie API endpointy przetestowane z mockami Supabase
- Error handling (400, 401, 403, 404, 409, 429, 500)
- Walidacja RLS policies (użytkownik A nie widzi profili użytkownika B)

### 3.3 Testy komponentów (Component Tests)
**Priorytet:** Wysoki  
**Framework:** Vitest + React Testing Library + Testing Playground

**Obszary:**
- **Piano Component**
  - Renderowanie 12 klawiszy (7 białych, 5 czarnych)
  - Kliknięcie klawisza → onKeyPress callback z formatem "C4"
  - Sekwencja autoPlay → podświetlanie klawiszy w odpowiedniej kolejności
  - Disabled state podczas playback
- **GamePlayView**
  - Ładowanie zagadki → wyświetlenie slotów
  - Wypełnianie slotów → aktywacja przycisku "Sprawdź"
  - Submit → feedback (sukces/błąd) → aktualizacja attempts
  - Zadanie ukończone → przycisk "Następne zadanie"
- **AuthForms**
  - RegisterForm - walidacja inline, error messages
  - LoginForm - błędne dane → toast error
  - ForgotPasswordForm - wysłanie emaila → komunikat sukcesu
- **DashboardView**
  - Lista profili dzieci → poziom, score, lastPlayedAt
  - Brak profili → komunikat "Dodaj pierwszy profil"

**Kryteria akceptacji:**
- User interactions przetestowane (click, type, submit)
- Accessibility (role, aria-label, keyboard navigation)
- Loading/error states

### 3.4 Testy end-to-end (E2E Tests)
**Priorytet:** Średni  
**Framework:** Playwright

**Kluczowe scenariusze:**
1. **Rejestracja i pierwsze logowanie**
   - Nawigacja na /register → wypełnienie formularza → redirect /login
   - Logowanie → redirect /profiles (pusta lista)
2. **Kompletny flow rodzica**
   - Dodanie profilu dziecka → wybór profilu → start sesji
   - Dashboard → weryfikacja statystyk (poziom 1, 0 punktów)
3. **Kompletna rozgrywka dziecka**
   - Start gry → odtworzenie sekwencji → uzupełnienie odpowiedzi
   - Poprawna odpowiedź → +10 punktów, attempts 3→3
   - Błędna odpowiedź → attempts 3→2, komunikat błędu
   - 5 sukcesów → awans poziom 1→2
4. **Tryb demo**
   - Gra bez rejestracji → poziomy 1-3
   - Modal rejestracyjny po 3 zadaniach lub awansie poziomu
5. **Session timeout**
   - Rozpoczęcie gry → czekanie 10 min → próba submit → błąd "Session expired"
6. **Reset hasła**
   - Forgot password → email link (mock) → reset password → logowanie

**Środowisko:**
- Browser: Chromium, Firefox (desktop), WebKit (tablet emulation)
- Orientacja: landscape (≥768px)

**Kryteria akceptacji:**
- Wszystkie critical user paths działają end-to-end
- Screenshoty regression testing dla głównych ekranów

### 3.5 Testy dostępności (Accessibility Tests)
**Priorytet:** Średni  
**Framework:** axe-core + Playwright + Storybook

**Obszary:**
- **WCAG 2.1 Level AA**
  - Kontrast ≥ 4.5:1 dla tekstu
  - Focus indicators na interaktywnych elementach
  - Aria-labels dla ikon (serduszka attempts)
  - Keyboard navigation (Tab, Enter, Space)
- **Screen reader support**
  - Aria-live="polite" dla feedbacku gry
  - Role="button" dla PianoKey (klawiatura)
- **Responsive design**
  - Tablet landscape (768px+)
  - Desktop (1024px+)
  - Komunikat o orientacji portrait → landscape

**Kryteria akceptacji:**
- axe-core: 0 błędów krytycznych
- Keyboard-only navigation możliwa dla całej gry
- Screen reader announcements testowane z NVDA/VoiceOver

### 3.6 Testy wydajności (Performance Tests)
**Priorytet:** Średni  
**Narzędzia:** Lighthouse, Web Vitals

**Metryki:**
- **Tone.js audio loading**
  - Czas ładowania sampli piano < 3s
  - Latencja playNote < 50ms
- **Page load**
  - First Contentful Paint (FCP) < 1.8s
  - Largest Contentful Paint (LCP) < 2.5s
  - Time to Interactive (TTI) < 3.5s
- **Astro SSR**
  - Server Response Time < 600ms
  - Bundle size JavaScript < 150KB (gzipped)

**Kryteria akceptacji:**
- Lighthouse Score ≥ 90 (Performance, Accessibility, Best Practices)
- Core Web Vitals: wszystkie "Good"

### 3.7 Testy bezpieczeństwa (Security Tests)
**Priorytet:** Krytyczny  
**Narzędzia:** OWASP ZAP, manualne testy

**Obszary:**
- **Autentykacja**
  - Brute-force protection (rate limiting: 100 req/min)
  - Session fixation - nowy token po loginie
  - HttpOnly cookies (brak dostępu z JavaScript)
- **Row Level Security (RLS)**
  - Użytkownik A nie może odczytać profili użytkownika B
  - Direct object reference (IDOR) - `/api/profiles/{UUID}` innego rodzica → 403
- **Input validation**
  - SQL injection - parametryzowane queries (Supabase SDK)
  - XSS - sanityzacja profile_name (regex constraint)
  - CSRF - SameSite cookies + token verification
- **Data exposure**
  - Error messages nie ujawniają stack traces (production)
  - API responses nie zawierają parent_id dla dzieci

**Kryteria akceptacji:**
- OWASP Top 10: brak krytycznych luk
- Wszystkie endpointy wymagają autentykacji (poza /api/auth/*, /api/demo/*)
- RLS policies wymuszone na poziomie DB

---

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1 Moduł autentykacji

#### TC-AUTH-001: Rejestracja nowego użytkownika
**Priorytet:** Krytyczny  
**Warunki wstępne:** Brak konta z emailem test@example.com

| Krok | Akcja | Oczekiwany rezultat |
|------|-------|---------------------|
| 1 | Nawigacja na `/register` | Formularz rejestracji widoczny |
| 2 | Wprowadź email: test@example.com | Pole email zaakceptowane |
| 3 | Wprowadź hasło: TestPass123 | Walidacja OK (≥8 znaków, wielka litera, cyfra) |
| 4 | Wprowadź potwierdzenie hasła: TestPass123 | Walidacja OK (hasła zgodne) |
| 5 | Kliknij "Zarejestruj się" | Redirect na `/login`, toast "Konto utworzone" |
| 6 | Sprawdź DB (auth.users) | Rekord z email test@example.com istnieje |

**Status pass:** Wszystkie kroki OK

#### TC-AUTH-002: Logowanie z poprawnymi danymi
**Priorytet:** Krytyczny  
**Warunki wstępne:** Konto test@example.com istnieje

| Krok | Akcja | Oczekiwany rezultat |
|------|-------|---------------------|
| 1 | Nawigacja na `/login` | Formularz logowania widoczny |
| 2 | Wprowadź email: test@example.com, hasło: TestPass123 | Pola wypełnione |
| 3 | Kliknij "Zaloguj się" | Redirect na `/profiles` |
| 4 | Sprawdź cookies | `sb-access-token` ustawiony (HttpOnly) |
| 5 | Sprawdź GET `/api/auth/me` | 200 OK, { id, email } |

#### TC-AUTH-003: Reset hasła
**Priorytet:** Wysoki

| Krok | Akcja | Oczekiwany rezultat |
|------|-------|---------------------|
| 1 | `/forgot-password` → email: test@example.com → Submit | Toast "Email wysłany" |
| 2 | Otwórz link z emaila (mock) | Redirect `/reset-password?token=...` |
| 3 | Wprowadź nowe hasło: NewPass456 | Walidacja OK |
| 4 | Submit | Toast "Hasło zmienione", redirect `/login` |
| 5 | Zaloguj ze starym hasłem | 401 Unauthorized |
| 6 | Zaloguj z nowym hasłem | 200 OK, redirect `/profiles` |

### 4.2 Zarządzanie profilami dzieci

#### TC-PROFILE-001: Utworzenie profilu dziecka
**Priorytet:** Krytyczny  
**Warunki wstępne:** Rodzic zalogowany

| Krok | Akcja | Oczekiwany rezultat |
|------|-------|---------------------|
| 1 | `/profiles` → Kliknij "Dodaj profil" | Modal z formularzem |
| 2 | Imię: Anna, Data urodzenia: 2018-05-24 | Walidacja OK (przeszłość, regex) |
| 3 | Submit | 201 Created, modal zamknięty |
| 4 | Sprawdź listę profili | Profil "Anna" widoczny (poziom 1, 0 pkt) |
| 5 | Sprawdź DB (child_profiles) | parent_id = auth.uid(), current_level_id = 1 |

#### TC-PROFILE-002: Limit 10 profili na rodzica
**Priorytet:** Średni  
**Warunki wstępne:** Rodzic ma już 10 profili

| Krok | Akcja | Oczekiwany rezultat |
|------|-------|---------------------|
| 1 | Dodaj 11. profil | 409 Conflict "Maksymalnie 10 profili" |
| 2 | Sprawdź listę profili | Nadal 10 profili |

#### TC-PROFILE-003: RLS - izolacja danych między rodzicami
**Priorytet:** Krytyczny

| Krok | Akcja | Oczekiwany rezultat |
|------|-------|---------------------|
| 1 | Rodzic A tworzy profil (UUID1) | 201 Created |
| 2 | Rodzic B próbuje GET `/api/profiles/{UUID1}` | 403 Forbidden |
| 3 | Rodzic B próbuje PATCH `/api/profiles/{UUID1}` | 403 Forbidden |

### 4.3 Mechanika gry

#### TC-GAME-001: Kompletna rozgrywka - poprawna odpowiedź
**Priorytet:** Krytyczny  
**Warunki wstępne:** Profil "Anna" (poziom 1, 0 pkt)

| Krok | Akcja | Oczekiwany rezultat |
|------|-------|---------------------|
| 1 | Wybierz profil Anna → Start gry | Redirect `/game/play?profileId={id}` |
| 2 | Sprawdź session | POST `/profiles/{id}/sessions` → sessionId, endedAt = now+10min |
| 3 | Zagadka wygenerowana | sequenceBeginning, expectedSlots (np. 2) |
| 4 | Odtworzenie sekwencji | Klawisze podświetlają się synchronicznie, audio Tone.js |
| 5 | Kliknij klawisze (poprawna odpowiedź) | Sloty wypełnione, przycisk "Sprawdź" aktywny |
| 6 | Kliknij "Sprawdź" | Feedback "Brawo!", +10 pkt, attempts 3→3 |
| 7 | Sprawdź DB (task_results) | score=10, attempts_used=1, completed_at |
| 8 | Sprawdź profile | total_score=10, last_played_at aktualizowane |

#### TC-GAME-002: Błędna odpowiedź - tracenie prób
**Priorytet:** Krytyczny

| Krok | Akcja | Oczekiwany rezultat |
|------|-------|---------------------|
| 1 | Zagadka wygenerowana, attempts=3 | UI pokazuje 3 serduszka |
| 2 | Wprowadź błędną odpowiedź → Submit | Feedback "Spróbuj ponownie", attempts=2, 2 serduszka |
| 3 | Błędna odpowiedź #2 | Attempts=1, 1 serduszko |
| 4 | Błędna odpowiedź #3 | Feedback "Poprawna sekwencja: ...", attempts=0, score=0 |
| 5 | Sprawdź DB (task_results) | score=0, attempts_used=3 |
| 6 | Następne zadanie | Nowa zagadka, attempts reset 3 |

#### TC-GAME-003: Awans poziomu po 5 sukcesach
**Priorytet:** Krytyczny  
**Warunki wstępne:** Profil na poziomie 1, 4 zadania zaliczone

| Krok | Akcja | Oczekiwany rezultat |
|------|-------|---------------------|
| 1 | Rozwiąż 5. zadanie poprawnie (1. próba) | +10 pkt, feedback "Awans! Poziom 2" |
| 2 | Sprawdź GameHeader | current_level = 2 |
| 3 | Sprawdź DB (child_profiles) | current_level_id = 2 |
| 4 | Następna zagadka | level_id=2, dłuższa sekwencja (seq_length wyższe) |

#### TC-GAME-004: Punktacja 10/5/2
**Priorytet:** Wysoki

| Krok | Akcja | Oczekiwany rezultat |
|------|-------|---------------------|
| 1 | Poprawna odpowiedź (1. próba) | score=10 |
| 2 | Nowe zadanie: błąd, potem poprawna (2. próba) | score=5 |
| 3 | Nowe zadanie: 2 błędy, potem poprawna (3. próba) | score=2 |

#### TC-GAME-005: Session timeout i refresh
**Priorytet:** Wysoki

| Krok | Akcja | Oczekiwany rezultat |
|------|-------|---------------------|
| 1 | Start session (10 min) | ended_at = now+10min |
| 2 | Po 5 min: POST `/sessions/{id}/refresh` | ended_at = poprzedni+2min |
| 3 | Czekaj 7 min (>10 min od startu) | Session expired |
| 4 | Próba submit answer | 400 "No active session, start new one" |

### 4.4 Dashboard rodzica

#### TC-DASH-001: Wyświetlanie postępów dzieci
**Priorytet:** Wysoki  
**Warunki wstępne:** 2 profile (Anna: lvl 2, 50 pkt; Bartek: lvl 1, 10 pkt)

| Krok | Akcja | Oczekiwany rezultat |
|------|-------|---------------------|
| 1 | GET `/api/dashboard` | 200 OK, array[2] |
| 2 | Sprawdź dane Anna | currentLevel=2, totalScore=50, lastPlayedAt |
| 3 | Sprawdź dane Bartek | currentLevel=1, totalScore=10 |
| 4 | Sortowanie | Default: createdAt desc (Bartek, Anna) |

### 4.5 Tryb demo

#### TC-DEMO-001: Gra bez rejestracji (poziomy 1-3)
**Priorytet:** Średni

| Krok | Akcja | Oczekiwany rezultat |
|------|-------|---------------------|
| 1 | `/demo` (niezalogowany) | Gra startuje poziom 1 |
| 2 | Rozwiąż zadanie | Score lokalnie (brak POST /api) |
| 3 | 5 sukcesów → poziom 2 | Lokalny state, brak DB |
| 4 | Poziom 3 → modal rejestracyjny | "Zarejestruj się, aby grać dalej" |
| 5 | Refresh strony | Postęp zresetowany (brak persystencji) |

---

## 5. Środowisko testowe

### 5.1 Konfiguracja środowisk

| Środowisko | Cel | URL | Baza danych | Auth |
|------------|-----|-----|-------------|------|
| **Local** | Development | http://localhost:4321 | Supabase Local (Docker) | Test users |
| **Staging** | Pre-production tests | https://staging.rytmik.app | Supabase Staging | Test users |
| **Production** | Smoke tests | https://rytmik.app | Supabase Production | Real users |

### 5.2 Dane testowe

**Test users (Staging):**
- parent1@test.com / TestPass123 (0 profili)
- parent2@test.com / TestPass123 (5 profili)
- parent3@test.com / TestPass123 (10 profili - limit)

**Seeded sequences:**
- Poziom 1: 10 sekwencji (4 nuty, tempo 120, brak czarnych klawiszy)
- Poziom 2: 10 sekwencji (5 nut, tempo 120, czarne klawisze)
- Poziom 20: 10 sekwencji (12 nut, tempo 180, wszystkie klawisze)

### 5.3 Konfiguracja przeglądarek (E2E)

| Przeglądarka | Wersja | Orientacja | Rozdzielczość |
|--------------|--------|------------|---------------|
| Chromium | Latest | Landscape | 1024x768 |
| Firefox | Latest | Landscape | 1024x768 |
| WebKit (Safari) | Latest | Landscape | 1024x768 |
| Chromium (tablet) | Latest | Landscape | 768x1024 rotated |

---

## 6. Narzędzia do testowania

### 6.1 Testy jednostkowe i komponentów
- **Vitest** - test runner (szybszy od Jest dla Vite)
- **React Testing Library** - renderowanie komponentów, user interactions
- **@testing-library/user-event** - symulacja interakcji użytkownika
- **MSW (Mock Service Worker)** - mockowanie API calls

### 6.2 Testy E2E
- **Playwright** - cross-browser automation
- **playwright-test** - assertions, fixtures
- **@axe-core/playwright** - accessibility testing

### 6.3 Narzędzia dodatkowe
- **Storybook** - izolowane testowanie komponentów UI
- **Chromatic** - visual regression testing
- **Lighthouse CI** - automatyczne audyty performance
- **OWASP ZAP** - skanowanie bezpieczeństwa
- **Supabase Studio** - weryfikacja DB state, RLS policies

---

## 7. Harmonogram testów

### Faza 1: Przygotowanie (Tydzień 1)
- [ ] Setup Vitest + React Testing Library
- [ ] Konfiguracja Playwright (3 przeglądarki)
- [ ] Przygotowanie środowiska Staging + seeding danych
- [ ] Utworzenie test users

### Faza 2: Testy jednostkowe (Tydzień 2)
- [ ] Utils i schematy walidacji (Zod)
- [ ] Hooki (`usePianoSampler`, `useDemoGame`)
- [ ] Komponenty izolowane (`PianoKey`, `AnswerSlots`)
- **Cel:** 80% code coverage

### Faza 3: Testy integracyjne (Tydzień 3)
- [ ] API endpoints (auth, profiles, tasks, dashboard)
- [ ] Serwisy z mockami Supabase
- [ ] Game flow (start session → task → submit)
- [ ] RLS policies verification

### Faza 4: Testy E2E (Tydzień 4)
- [ ] Critical user paths (rejestracja, gra, dashboard)
- [ ] Session timeout scenarios
- [ ] Tryb demo
- [ ] Cross-browser testing (Chromium, Firefox, WebKit)

### Faza 5: Testy niefunkcjonalne (Tydzień 5)
- [ ] Accessibility audit (axe-core)
- [ ] Performance (Lighthouse, Web Vitals)
- [ ] Security (OWASP ZAP, manual penetration tests)

### Faza 6: Regression testing (Tydzień 6)
- [ ] Re-run wszystkich testów po bugfixach
- [ ] Visual regression (Chromatic)
- [ ] Smoke tests na Production

---

## 8. Kryteria akceptacji testów

### 8.1 Kryteria ilościowe
- **Code coverage:** ≥ 80% (utils, schemas, hooks, services)
- **Test pass rate:** 100% (wszystkie testy green)
- **E2E reliability:** ≥ 95% (max 5% flaky tests)
- **Performance:** Lighthouse ≥ 90 (Performance, Accessibility)

### 8.2 Kryteria jakościowe
- Wszystkie User Stories (US-001 - US-015) zweryfikowane
- Zero krytycznych błędów bezpieczeństwa (OWASP Top 10)
- RLS policies wymuszone i przetestowane
- Audio synchronizacja (podświetlanie + Tone.js) działa płynnie
- Accessibility: WCAG 2.1 AA (0 błędów axe-core)

### 8.3 Kryteria biznesowe (zgodnie z PRD §6)
- **Retencja 7-dniowa** (R7) ≥ 50% - monitoring przez Google Analytics
- **Zadania na sesję** ≥ 10 - query na `task_results` grouped by `session_id`
- **Średni czas sesji** > 5 min - difference `ended_at - started_at`
- **Error rate** ≤ 1% sesji - monitoring błędów API (Sentry/Supabase logs)

---

## 9. Role i odpowiedzialności

| Rola | Odpowiedzialność | Osoba |
|------|------------------|-------|
| **QA Lead** | Koordynacja testów, harmonogram, raportowanie | [Przypisać] |
| **Automation Engineer** | Vitest + Playwright setup, CI/CD integration | [Przypisać] |
| **Frontend Tester** | Testy komponentów React, accessibility | [Przypisać] |
| **Backend Tester** | API tests, RLS policies, DB verification | [Przypisać] |
| **Security Tester** | OWASP ZAP, penetration tests, RLS audits | [Przypisać] |
| **DevOps** | Staging environment, CI runners, monitoring | [Przypisać] |

---

## 10. Procedury raportowania błędów

### 10.1 Format zgłoszenia
**Szablon:**
```
Tytuł: [MODUŁ] Krótki opis problemu
Priorytet: Critical / High / Medium / Low
Typ: Bug / Security / Performance / Accessibility
Środowisko: Local / Staging / Production

Kroki do reprodukcji:
1. [Krok 1]
2. [Krok 2]

Oczekiwany rezultat:
[Co powinno się stać]

Aktualny rezultat:
[Co się dzieje]

Dodatkowe informacje:
- Przeglądarka: [Chrome 120, Firefox 121]
- Screenshot: [Link]
- Console errors: [Logi]
- DB state: [Query result]
```

### 10.2 Priorytety błędów

| Priorytet | Definicja | SLA fix |
|-----------|-----------|---------|
| **Critical** | Blocker produkcji (autentykacja nie działa, RLS breach, data loss) | 24h |
| **High** | Główna funkcjonalność uszkodzona (gra się nie ładuje, błędna punktacja) | 3 dni |
| **Medium** | Funkcjonalność działa częściowo (UI bug, slow performance) | 1 tydzień |
| **Low** | Kosmetyczne (typo, minor visual glitch) | Backlog |

### 10.3 Workflow
1. **Utworzenie** - QA tworzy issue w GitHub/Jira
2. **Triage** - QA Lead przypisuje priorytet i developera
3. **In Progress** - Developer fixuje bug
4. **Code Review** - Pull request review
5. **Ready for Testing** - QA weryfikuje fix na Staging
6. **Verified** - Bug zamknięty, regression test dodany
7. **Deployed** - Fix na Production

### 10.4 Narzędzia
- **Issue tracking:** GitHub Issues / Jira
- **Screenshots:** Greenshot, Playwright screenshots
- **Logs:** Supabase Dashboard (Edge Functions logs), Browser DevTools
- **Monitoring:** Sentry (error tracking), Google Analytics (metrics)

---

## 11. Checklisty testowe

### 11.1 Checklist przed każdym releasem

**Funkcjonalność:**
- [ ] Wszystkie testy jednostkowe passed (Vitest)
- [ ] Wszystkie testy E2E passed (Playwright)
- [ ] Critical user paths zweryfikowane manualnie
- [ ] Tryb demo działa (poziomy 1-3)

**Bezpieczeństwo:**
- [ ] RLS policies wymuszone (test z 2 użytkownikami)
- [ ] Autentykacja wymaga tokena (test bez cookies → 401)
- [ ] CSRF protection aktywna (SameSite cookies)
- [ ] Error messages nie ujawniają stack traces

**Wydajność:**
- [ ] Lighthouse Score ≥ 90
- [ ] Audio sampli ładuje się < 3s
- [ ] FCP < 1.8s, LCP < 2.5s

**Accessibility:**
- [ ] axe-core: 0 błędów krytycznych
- [ ] Keyboard navigation działa (Tab, Enter)
- [ ] Screen reader testing (NVDA/VoiceOver)

**Dane:**
- [ ] Migrations uruchomione na Staging
- [ ] Seeding poziomów 1-20 + sekwencje
- [ ] Test users utworzeni

### 11.2 Checklist regresji po hotfixie
- [ ] Bug fix zweryfikowany (original test case)
- [ ] Regression test dodany do suite
- [ ] Smoke test na powiązanych funkcjonalnościach
- [ ] E2E critical paths re-run

---

## 12. Metryki jakości testów

### 12.1 Metryki ilościowe
- **Test coverage:** Aktualne / Cel 80%
- **Tests passed:** X / Total Y (ZZ%)
- **Test execution time:** Suma czasu wszystkich testów
- **Flakiness rate:** % testów, które sporadycznie fail

### 12.2 Metryki jakości kodu
- **ESLint errors:** 0 (CI blocker)
- **TypeScript errors:** 0 (CI blocker)
- **Prettier format:** Enforced (pre-commit hook)

### 12.3 Bug metrics
- **Bugs found in testing:** Suma przed release
- **Bugs escaped to production:** Suma po release
- **Defect density:** Bugs / 1000 LOC
- **Mean Time to Fix (MTTF):** Średni czas fixu buga

### 12.4 Raportowanie
- **Częstotliwość:** Cotygodniowy raport QA Lead → Team
- **Format:** Dashboard (GitHub Actions summary / Jira Board)
- **Zawartość:** Pass rate, coverage trend, top bugs, blockers

---

## Podsumowanie

Plan testów dla Rytmik MVP został zaprojektowany z uwzględnieniem:
1. **Kluczowych ryzyk:** Audio sync, RLS security, session management
2. **Stosu technologicznego:** Astro 5, React 19, Supabase, Tone.js
3. **Wymagań PRD:** Wszystkie 15 User Stories pokryte scenariuszami
4. **Dostępności:** WCAG 2.1 AA compliance
5. **Wydajności:** Lighthouse ≥ 90, audio latency < 50ms

Sukces projektu zostanie zmierzony metrykami z PRD §6 (retencja R7 ≥ 50%, zadania/sesja ≥ 10, czas sesji > 5 min, error rate ≤ 1%).
