# Dokumentacja Projektu Rytmik

Ten katalog zawiera całą dokumentację techniczną, specyfikacje i plany implementacyjne projektu Rytmik.

## Struktura katalogów

### 📋 `/specs` - Specyfikacje i planowanie
Zawiera dokumenty planistyczne i specyfikacje projektu:
- **prd.md** - Product Requirements Document (wymagania produktowe)
- **tech-stack.md** - Stosowany stack technologiczny
- **api-plan.md** - Plan i specyfikacja API
- **db-plan.md** - Plan i schemat bazy danych
- **ui-plan.md** - Plan interfejsu użytkownika
- **plan-testow.md** - Kompleksowy plan testów (jednostkowe, E2E, wydajność, bezpieczeństwo)

### 🏗️ `/architecture` - Architektura systemu
Dokumenty architektury i podsumowania techniczne:
- **ui-architecture-summary.md** - Podsumowanie architektury UI (Astro + React)

### 🔨 `/implementation` - Plany i podsumowania implementacji
Szczegółowe plany implementacyjne podzielone tematycznie:

#### `/implementation/auth` - Autentykacja
- auth-spec.md - Specyfikacja autentykacji (Supabase Auth)
- 401-redirect-implementation.md - Obsługa przekierowań przy braku autoryzacji

#### `/implementation/profiles` - Profile dzieci
- create-profile-implementation-plan.md - Plan tworzenia profilu
- create-profile-view-implementation-plan.md - Widok tworzenia profilu
- edit-profile-view-implementation-plan.md - Widok edycji profilu
- get-profiles-implementation-plan.md - Pobieranie listy profili
- profiles-view-implementation-plan.md - Główny widok profili

#### `/implementation/dashboard` - Dashboard rodzica
- dashboard-implementation-plan.md - Plan implementacji dashboardu
- dashboard-implementation-summary.md - Podsumowanie implementacji
- dashboard-view-implementation-plan.md - Widok dashboardu

#### `/implementation/game` - Mechanika gry
- get-current-task-implementation-plan.md - Plan pobierania zadań
- get-current-task-implementation-summary.md - Podsumowanie implementacji
- game-state-persistence.md - Persystencja stanu gry
- piano-view-implementation-plan.md - Widok pianina (Tone.js)

#### `/implementation/demo` - Tryb demo
- demo-view-implementation-plan.md - Plan widoku demo
- demo-view-implementation-summary.md - Podsumowanie implementacji
- demo-db-integration-update.md - Integracja demo z bazą danych

#### `/implementation/sessions` - Zarządzanie sesjami gry
- sessions-implementation-plan.md - Plan sesji (timeout 10 min, refresh)
- session-tracking-update-2026-01-11.md - Aktualizacja śledzenia sesji

#### `/implementation/landing` - Landing page
- landing-page-implementation-complete.md - Kompletna implementacja landing page
- landing-view-implementation-plan.md - Plan widoku landing page

### 🧪 `/testing` - Przewodniki testowania
Przewodniki testowania poszczególnych funkcjonalności:
- **dashboard-endpoint-testing-guide.md** - Testowanie endpointów dashboardu
- **get-current-task-testing-guide.md** - Testowanie pobierania zadań

---

## Główne dokumenty startowe

Jeśli zaczynasz pracę z projektem, zacznij od:

1. **specs/prd.md** - Zrozumienie wymagań produktowych
2. **specs/tech-stack.md** - Poznanie stosowanych technologii
3. **specs/api-plan.md** i **specs/db-plan.md** - Architektura backendu
4. **architecture/ui-architecture-summary.md** - Architektura frontendu
5. **NEXT_STEPS.md** - Bieżące zadania i kolejne kroki

---

## Konwencje nazewnictwa

- `*-plan.md` - Plany implementacyjne przed rozpoczęciem prac
- `*-summary.md` - Podsumowania po zakończeniu implementacji
- `*-spec.md` - Szczegółowe specyfikacje techniczne
- `*-guide.md` - Przewodniki i instrukcje (np. testowania)
- `*-update-YYYY-MM-DD.md` - Aktualizacje i zmiany w implementacji

---

## Stack technologiczny

**Frontend:** Astro 5, React 19, TypeScript 5, Tailwind 4, shadcn/ui  
**Audio:** Tone.js 15  
**Backend:** Supabase (PostgreSQL + Auth + RLS)  
**Testowanie:** Vitest, React Testing Library, Playwright, MSW  

---

_Ostatnia aktualizacja: 2026-01-12_
