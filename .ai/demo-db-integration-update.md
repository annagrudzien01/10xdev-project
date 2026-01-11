# Aktualizacja implementacji Demo - Integracja z bazą danych

## Data: 2026-01-10

## Zmiany

### ✅ Dodano publiczny endpoint API

**Nowy plik**: `src/pages/api/demo/sequences.ts`

- Endpoint: `GET /api/demo/sequences?levelId={1-3}`
- Publiczny (no auth required)
- Pobiera prawdziwe sekwencje z tabeli `sequence` dla poziomów 1-3
- Cache headers: `public, max-age=300` (5 min)
- Walidacja: Zod schema dla query params
- Filtrowanie: Tylko poziomy 1-3 (bezpieczeństwo)

### ✅ Zaktualizowano hook useDemoGame

**Plik**: `src/lib/hooks/useDemoGame.ts`

**Zmiany**:

- Dodano TanStack Query do pobierania sekwencji
- Funkcja `fetchDemoSequences()` - fetch z API
- Query key: `['demoSequences']`
- Stale time: 5 minut
- GC time: 10 minut
- `sequencesByLevel` - memoized grouping po poziomach
- `generateNewTask()` - używa prawdziwych sekwencji zamiast presetów
- Dodano `isLoadingSequences` i `sequencesError` do return

### ✅ Zaktualizowano DemoGameApp

**Plik**: `src/components/game/demo/DemoGameApp.tsx`

**Zmiany**:

- Dodano `QueryClientProvider` wrapper
- Podział na `DemoGameContent` (internal) i `DemoGameApp` (wrapper)
- Obsługa stanów: loading, error, success
- Komunikat ładowania: "Ładowanie sekwencji z bazy danych..."
- Komunikat błędu z przyciskiem "Spróbuj ponownie"

### ✅ Zaktualizowano plan implementacji

**Plik**: `.ai/demo-view-implementation-plan.md`

**Sekcja 6 i 7**:

- Opisano integrację z TanStack Query
- Dodano informacje o endpointach API
- Wyjaśniono strategię cache'owania

## Korzyści

### 1. Autentyczne doświadczenie

- Użytkownicy demo grają na tych samych sekwencjach co zarejestrowani
- Sekwencje są wysokiej jakości (stworzone przez zespół)
- Brak różnic między demo a pełną wersją pod względem trudności

### 2. Łatwiejsze zarządzanie

- Sekwencje zarządzane centralnie w bazie danych
- Łatwa aktualizacja bez zmian w kodzie frontendu
- Możliwość A/B testingu sekwencji

### 3. Skalowalność

- Automatyczne pobieranie nowych sekwencji
- Cache redukuje obciążenie serwera
- Możliwość dodania więcej poziomów demo w przyszłości

## Co pozostało bez zmian

✅ **Brak mutacji w DB** - Postępy demo NIE są zapisywane  
✅ **Lokalna walidacja** - Sprawdzanie odpowiedzi po stronie klienta  
✅ **Lokalna punktacja** - Scoring bez zapytań do backendu  
✅ **Komponenty UI** - Wszystkie bez zmian

## Bezpieczeństwo

- Endpoint demo jest publiczny (zgodnie z wymaganiami)
- Filtrowanie tylko poziomów 1-3 (RLS nie potrzebne, query ograniczone)
- Cache headers optymalizują wydajność
- Brak wrażliwych danych w response

## Testy

### Do przetestowania:

1. [ ] Wejście na `/demo` → loading → sekwencje załadowane
2. [ ] Sprawdź DevTools Network → request do `/api/demo/sequences`
3. [ ] Sprawdź czy sekwencje są cache'owane (kolejne wizyty bez requesta)
4. [ ] Odśwież stronę → sekwencje z cache (szybkie)
5. [ ] Sprawdź console → brak błędów
6. [ ] Zagraj kilka zadań → losowe sekwencje z DB
7. [ ] Symuluj błąd API (wyłącz backend) → komunikat błędu + retry button

## Następne kroki

Implementacja kompletna! Gotowe do testów manualnych.

---

## Struktura plików (zaktualizowana)

```
src/
├── pages/
│   ├── demo.astro                              ← Entry point
│   └── api/
│       └── demo/
│           └── sequences.ts                     ← NOWY: Public API
├── lib/
│   ├── demo/
│   │   └── demoLevels.ts                       ← Konfiguracja poziomów
│   └── hooks/
│       └── useDemoGame.ts                      ← ZMODYFIKOWANY: + TanStack Query
└── components/
    └── game/
        ├── demo/
        │   ├── DemoGameApp.tsx                 ← ZMODYFIKOWANY: + QueryClientProvider
        │   ├── GamePlayArea.tsx
        │   ├── DemoBanner.tsx
        │   └── RegistrationPromptModal.tsx
        ├── GameHeader.tsx
        └── GameControls.tsx
```
