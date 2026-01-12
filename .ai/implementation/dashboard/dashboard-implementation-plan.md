# API Endpoint Implementation Plan: GET /dashboard

## 1. Przegląd punktu końcowego

Endpoint `/dashboard` dostarcza zestawienie postępów wszystkich profili dzieci należących do zalogowanego rodzica. Każdy element zawiera podstawowe informacje: identyfikator profilu, imię dziecka, aktualny poziom, łączny wynik oraz datę ostatniej gry.

**Kluczowe funkcje:**

- Zwraca podsumowanie dla wszystkich profili dzieci (max 10 profili na rodzica)
- Wymaga uwierzytelnienia rodzica
- Dane są pobierane bezpośrednio z tabeli `child_profiles`
- Row Level Security (RLS) automatycznie filtruje profile na podstawie `parent_id`
- Nie wymaga paginacji (limit 10 profili jest wymuszony na poziomie bazy)

---

## 2. Szczegóły żądania

### Metoda HTTP

`GET`

### Struktura URL

```
GET /api/dashboard
```

### Nagłówki

- `Authorization: Bearer <jwt_token>` (wymagane) - Token JWT z Supabase Auth

### Parametry

- **Query Parameters:** Brak
- **Path Parameters:** Brak
- **Request Body:** Brak (metoda GET)

### Uwierzytelnianie

- Endpoint wymaga aktywnej sesji użytkownika (rodzica)
- Token JWT jest weryfikowany przez Supabase Auth
- `locals.supabase.auth.getUser()` zwraca dane zalogowanego użytkownika

---

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

#### DashboardItemDTO

Typ odpowiedzi dla pojedynczego profilu dziecka (już zdefiniowany w `src/types.ts:387-398`):

```typescript
export interface DashboardItemDTO {
  /** Child profile identifier (UUID) */
  profileId: string;
  /** Child's display name */
  profileName: string;
  /** Current difficulty level (1-20) */
  currentLevel: number;
  /** Total cumulative score */
  totalScore: number;
  /** Last time this profile played (ISO timestamp or null) */
  lastPlayedAt: string | null;
}
```

#### Response Type

Endpoint zwraca tablicę `DashboardItemDTO[]`:

```typescript
type DashboardResponse = DashboardItemDTO[];
```

### Helper Functions

Funkcja pomocnicza do transformacji encji bazodanowej na DTO (już zdefiniowana w `src/types.ts:403-411`):

```typescript
export function toDashboardItemDTO(entity: ChildProfileEntity): DashboardItemDTO {
  return {
    profileId: entity.id,
    profileName: entity.profile_name,
    currentLevel: entity.current_level_id,
    totalScore: entity.total_score,
    lastPlayedAt: entity.last_played_at,
  };
}
```

### Error Response Type

Używany w przypadku błędów (już zdefiniowany w `src/types.ts:495-507`):

```typescript
export interface APIErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}
```

---

## 4. Szczegóły odpowiedzi

### Sukces - 200 OK

**Content-Type:** `application/json`

**Body:**

```json
[
  {
    "profileId": "550e8400-e29b-41d4-a716-446655440000",
    "profileName": "Anna",
    "currentLevel": 4,
    "totalScore": 320,
    "lastPlayedAt": "2025-12-31T09:50:00Z"
  },
  {
    "profileId": "660e8400-e29b-41d4-a716-446655440001",
    "profileName": "Marek",
    "currentLevel": 7,
    "totalScore": 580,
    "lastPlayedAt": "2026-01-10T14:23:15Z"
  }
]
```

**Charakterystyka:**

- Zwraca pustą tablicę `[]` jeśli rodzic nie ma żadnych profili dzieci
- Maksymalnie 10 elementów (wymuszane przez ograniczenie bazy danych)
- Obiekty są posortowane według `created_at` (kolejność utworzenia profili)
- `lastPlayedAt` może być `null` dla profili, które nigdy nie były używane do gry

### Błąd - 401 Unauthorized

**Content-Type:** `application/json`

**Body:**

```json
{
  "error": "unauthenticated",
  "message": "Authentication required"
}
```

**Przyczyny:**

- Brak tokenu JWT w nagłówku Authorization
- Token JWT wygasł
- Token JWT jest nieprawidłowy
- `locals.supabase` jest undefined

### Błąd - 500 Internal Server Error

**Content-Type:** `application/json`

**Body:**

```json
{
  "error": "internal_error",
  "message": "An unexpected error occurred"
}
```

**Przyczyny:**

- Błąd połączenia z bazą danych
- Błąd w zapytaniu SQL
- Nieoczekiwany błąd aplikacji

---

## 5. Przepływ danych

### Diagram przepływu:

```
1. CLIENT
   │
   ├──> GET /api/dashboard
   │    Authorization: Bearer <jwt>
   │
2. ASTRO ENDPOINT (/api/dashboard.ts)
   │
   ├──> Walidacja autentykacji
   │    - Sprawdzenie locals.supabase
   │    - supabase.auth.getUser()
   │
3. PROFILE SERVICE (ProfileService)
   │
   ├──> listChildProfiles(parentId)
   │    - Query: SELECT * FROM child_profiles
   │    - Filter: WHERE parent_id = auth.uid() (RLS)
   │    - Order: ORDER BY created_at ASC
   │
4. DATABASE (PostgreSQL + RLS)
   │
   ├──> Row Level Security
   │    - Policy: child_profiles_owner
   │    - Sprawdza: parent_id = auth.uid()
   │
   └──> Zwraca: ChildProfileEntity[]
   │
5. TRANSFORMATION
   │
   ├──> Mapowanie encji na DTOs
   │    - entities.map(toDashboardItemDTO)
   │
6. RESPONSE
   │
   └──> JSON: DashboardItemDTO[]
        Status: 200 OK
```

### Szczegóły interakcji z bazą danych:

#### Zapytanie SQL (przez Supabase Client)

```sql
SELECT
  id,
  parent_id,
  profile_name,
  date_of_birth,
  current_level_id,
  last_played_at,
  total_score,
  created_at,
  updated_at
FROM child_profiles
WHERE parent_id = <auth.uid>
ORDER BY created_at ASC;
```

#### Row Level Security Policy

Automatyczne zastosowanie polityki `child_profiles_owner`:

```sql
CREATE POLICY child_profiles_owner ON child_profiles
USING (parent_id = auth.uid());
```

#### Optymalizacja

- Wykorzystuje indeks `idx_child_parent (parent_id)`
- Brak JOIN-ów - wszystkie dane w jednej tabeli
- Maksymalnie 10 rekordów (mały zestaw danych)

---

## 6. Względy bezpieczeństwa

### Uwierzytelnianie (Authentication)

**Mechanizm:** Supabase Auth JWT Token

**Proces weryfikacji:**

1. Endpoint sprawdza obecność `locals.supabase`
2. Wywołuje `supabase.auth.getUser()` aby zweryfikować token
3. Zwraca 401 Unauthorized jeśli weryfikacja nie powiodła się

**Kod implementacyjny:**

```typescript
const supabase = locals.supabase;
if (!supabase) {
  throw new UnauthorizedError();
}

const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();
if (authError || !user) {
  throw new UnauthorizedError();
}
```

### Autoryzacja (Authorization)

**Mechanizm:** Row Level Security (RLS) na poziomie PostgreSQL

**Polityka RLS:**

- Tabela: `child_profiles`
- Polityka: `child_profiles_owner`
- Warunek: `parent_id = auth.uid()`

**Efekt:**

- Rodzic widzi **tylko** swoje profile dzieci
- Nie może pobrać profili innych rodziców
- Automatyczne filtrowanie na poziomie bazy danych
- Dodatkowa warstwa ochrony poza logiką aplikacji

### Ochrona danych

**GDPR Compliance:**

- Endpoint zwraca **minimum** danych potrzebnych do dashboardu
- Nie eksponuje wrażliwych danych (np. date_of_birth)
- Logowanie błędów bez danych użytkownika

**Rate Limiting:**

- Implementowane na poziomie middleware
- Limit: 100 zapytań/minutę na token
- Status: 429 Too Many Requests

### Walidacja danych wyjściowych

**Transformacja:**

- Wykorzystanie helper function `toDashboardItemDTO()`
- Zapewnia spójny format odpowiedzi
- Konwersja snake_case (baza) → camelCase (API)

**Typy TypeScript:**

- Silne typowanie na każdym etapie
- Automatyczna walidacja przez kompilator

### Ochrona przed injection attacks

**SQL Injection:**

- Supabase Client używa prepared statements
- Parametry są automatycznie escapowane

**XSS Protection:**

- API zwraca tylko JSON (Content-Type: application/json)
- Brak HTML w odpowiedziach

---

## 7. Obsługa błędów

### Katalog potencjalnych błędów

| Kod | Error Code        | Przyczyna                     | Odpowiedź                                                              |
| --- | ----------------- | ----------------------------- | ---------------------------------------------------------------------- |
| 401 | `unauthenticated` | Brak tokenu JWT               | `{ error: "unauthenticated", message: "Authentication required" }`     |
| 401 | `unauthenticated` | Token wygasł                  | `{ error: "unauthenticated", message: "Authentication required" }`     |
| 401 | `unauthenticated` | Token nieprawidłowy           | `{ error: "unauthenticated", message: "Authentication required" }`     |
| 401 | `unauthenticated` | `locals.supabase` undefined   | `{ error: "unauthenticated", message: "Authentication required" }`     |
| 500 | `internal_error`  | Błąd połączenia z bazą danych | `{ error: "internal_error", message: "An unexpected error occurred" }` |
| 500 | `internal_error`  | Błąd w zapytaniu SQL          | `{ error: "internal_error", message: "An unexpected error occurred" }` |
| 500 | `internal_error`  | Nieoczekiwany błąd aplikacji  | `{ error: "internal_error", message: "An unexpected error occurred" }` |

### Strategia obsługi błędów

#### 1. Błędy uwierzytelniania (401)

**Przypadki:**

- `locals.supabase` jest `undefined` lub `null`
- `supabase.auth.getUser()` zwraca błąd
- `user` jest `null` lub `undefined`

**Obsługa:**

```typescript
try {
  const supabase = locals.supabase;
  if (!supabase) {
    throw new UnauthorizedError();
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new UnauthorizedError();
  }
} catch (error) {
  if (error instanceof UnauthorizedError) {
    return new Response(
      JSON.stringify({
        error: "unauthenticated",
        message: error.message,
      } as APIErrorResponse),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

#### 2. Błędy bazy danych (500)

**Przypadki:**

- Timeout połączenia z PostgreSQL
- Błąd w zapytaniu SQL
- RLS policy error

**Obsługa:**

```typescript
try {
  const profileService = new ProfileService(supabase);
  const result = await profileService.listChildProfiles(user.id);
  // ...
} catch (error) {
  // Log error dla debugowania (bez wrażliwych danych)
  console.error("Unexpected error in GET /api/dashboard:", {
    error: error instanceof Error ? error.message : "Unknown error",
    timestamp: new Date().toISOString(),
  });

  return new Response(
    JSON.stringify({
      error: "internal_error",
      message: "An unexpected error occurred",
    } as APIErrorResponse),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

#### 3. Pusty wynik (200 OK, nie błąd)

**Przypadek:**

- Rodzic nie ma jeszcze żadnych profili dzieci

**Obsługa:**

```typescript
// Zwraca pustą tablicę []
return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
```

### Logowanie błędów

**Zgodnie z GDPR:**

- **NIE logować:** danych użytkownika, emaili, ID użytkowników
- **Logować:** typ błędu, timestamp, ogólny komunikat

**Przykład:**

```typescript
console.error("Unexpected error in GET /api/dashboard:", {
  error: error instanceof Error ? error.message : "Unknown error",
  timestamp: new Date().toISOString(),
});
```

### Error Recovery

**Retry Logic:**

- Brak retry na poziomie endpointu (klient może ponowić żądanie)
- Supabase Client ma wbudowany retry dla connection errors

**Graceful Degradation:**

- Jeśli `listChildProfiles()` zwróci pustą tablicę, endpoint zwraca `[]` (status 200)
- Frontend pokazuje odpowiedni komunikat ("Brak profili dzieci")

---

## 8. Rozważania dotyczące wydajności

### Analiza wydajności

#### Zapytanie bazodanowe

- **Operacja:** `SELECT` na tabeli `child_profiles`
- **Filter:** `parent_id = <user_id>` (indeksowane przez `idx_child_parent`)
- **Rozmiar danych:** Maksymalnie 10 rekordów
- **Czas wykonania:** < 10ms (z cache < 1ms)

#### Optymalizacje bazy danych

**Indeksy:**

- `idx_child_parent (parent_id)` - wspomaga filtrowanie
- Query planner używa index scan zamiast sequential scan

**RLS Performance:**

- RLS policy jest optymalizowana przez PostgreSQL
- Dodaje minimalny overhead (<1ms)

**Brak JOIN-ów:**

- Wszystkie dane w jednej tabeli
- Unikamy kosztownych operacji JOIN

#### Wielkość odpowiedzi

**Minimalna (0 profili):**

```json
[] // 2 bytes
```

**Typowa (3 profile):**

```json
[
  { "profileId": "...", "profileName": "Anna", "currentLevel": 4, "totalScore": 320, "lastPlayedAt": "..." },
  { "profileId": "...", "profileName": "Marek", "currentLevel": 7, "totalScore": 580, "lastPlayedAt": "..." },
  { "profileId": "...", "profileName": "Zosia", "currentLevel": 2, "totalScore": 150, "lastPlayedAt": null }
]
// ~400 bytes
```

**Maksymalna (10 profili):**

```json
// ~1.2 KB
```

**Wniosek:** Rozmiar odpowiedzi jest mały, nie wymaga kompresji.

### Caching Strategy

#### Server-side caching

**Nie zalecane dla tego endpointu:**

- Dane często się zmieniają (po każdej grze)
- `total_score` i `last_played_at` są aktualizowane przez dzieci
- Cache mogłyby zwrócić nieaktualne dane

#### Client-side caching

**Zalecane:**

- TanStack Query z stale time ~30s
- Automatyczne odświeżanie po akcjach (po zakończeniu gry)
- Background refetch przy focus okna

**Konfiguracja TanStack Query:**

```typescript
{
  queryKey: ['dashboard'],
  queryFn: fetchDashboard,
  staleTime: 30000, // 30 seconds
  refetchOnWindowFocus: true,
}
```

### Database Connection Pooling

**Supabase Client:**

- Wbudowany connection pooling
- Domyślnie: 15 połączeń w puli
- Automatyczne zarządzanie połączeniami

**Zalecenia:**

- Używać jednej instancji `SupabaseClient` na żądanie (przez `locals.supabase`)
- Nie tworzyć wielu klientów w ramach jednego żądania

### Potential Bottlenecks

#### 1. Autentykacja JWT

**Problem:** Weryfikacja tokenu JWT dodaje 10-30ms do każdego żądania

**Rozwiązanie:**

- Supabase cache'uje zweryfikowane tokeny
- Token jest weryfikowany raz per żądanie
- Overhead jest akceptowalny (<30ms)

#### 2. RLS Policy Evaluation

**Problem:** PostgreSQL musi ewaluować politykę RLS dla każdego wiersza

**Rozwiązanie:**

- RLS jest optymalizowane przez query planner
- Filter `parent_id = auth.uid()` używa indeksu
- Overhead jest minimalny (<5ms)

#### 3. Transformacja DTO

**Problem:** Mapowanie encji na DTOs w JavaScript

**Rozwiązanie:**

- Maksymalnie 10 iteracji (`entities.map()`)
- Operacja jest bardzo szybka (<1ms)
- Nie ma potrzeby optymalizacji

### Skalowanie

**Current Load:**

- Endpoint jest używany przy każdym załadowaniu dashboardu
- ~1-5 zapytań na użytkownika na sesję

**Expected Load (1000 aktywnych rodziców):**

- ~5000 żądań dziennie
- ~0.06 żądań/sekundę (bardzo niskie)
- PostgreSQL obsługuje 10,000+ qps bez problemu

**Wniosek:** Endpoint nie wymaga dodatkowych optymalizacji dla MVP.

### Monitoring

**Metryki do śledzenia:**

- Response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Database query time
- Connection pool usage

**Alerty:**

- Response time > 500ms (95th percentile)
- Error rate > 1%
- Database connection pool > 80% usage

---

## 9. Etapy wdrożenia

### Krok 1: Utworzenie pliku endpointu API

**Ścieżka:** `src/pages/api/dashboard.ts`

**Zadania:**

1. Utworzyć nowy plik w katalogu `src/pages/api/`
2. Ustawić `export const prerender = false;` (SSR mode)
3. Zaimportować typy z `@/types` (APIRoute, DashboardItemDTO, APIErrorResponse)
4. Zaimportować serwisy i błędy (`ProfileService`, `UnauthorizedError`)

**Szacowany czas:** 5 minut

---

### Krok 2: Implementacja obsługi metody GET

**Zadania:**

1. Zdefiniować funkcję `export const GET: APIRoute`
2. Dodać blok `try-catch` dla obsługi błędów
3. Zaimplementować strukturę zgodną z wzorcem projektu

**Pseudo-kod:**

```typescript
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Krok 3: Walidacja autentykacji
    // Krok 4: Pobranie danych z serwisu
    // Krok 5: Zwrot odpowiedzi
  } catch (error) {
    // Krok 6: Obsługa błędów
  }
};
```

**Szacowany czas:** 10 minut

---

### Krok 3: Walidacja autentykacji użytkownika

**Zadania:**

1. Sprawdzić obecność `locals.supabase`
2. Wywołać `supabase.auth.getUser()` aby pobrać dane użytkownika
3. Rzucić `UnauthorizedError` jeśli autentykacja nie powiodła się

**Implementacja:**

```typescript
const supabase = locals.supabase;
if (!supabase) {
  throw new UnauthorizedError();
}

const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError || !user) {
  throw new UnauthorizedError();
}
```

**Szacowany czas:** 10 minut

---

### Krok 4: Pobranie profili dzieci przez ProfileService

**Zadania:**

1. Utworzyć instancję `ProfileService` z klientem Supabase
2. Wywołać metodę `listChildProfiles(user.id)` bez parametrów paginacji (pobrać wszystkie)
3. Wyodrębnić tablicę DTOs z paginowanej odpowiedzi

**Implementacja:**

```typescript
const profileService = new ProfileService(supabase);
const paginatedResult = await profileService.listChildProfiles(user.id, {
  page: 1,
  pageSize: 10, // max 10 profili per rodzic
});

// Wyodrębnij tylko tablicę danych (bez metadanych paginacji)
const dashboardData = paginatedResult.data;
```

**Uwagi:**

- `ProfileService.listChildProfiles()` już zwraca `ChildProfileDTO[]`
- Transformacja na `DashboardItemDTO[]` wymaga mapowania (Krok 5)

**Szacowany czas:** 10 minut

---

### Krok 5: Transformacja DTOs i zwrot odpowiedzi

**Zadania:**

1. Zmapować `ChildProfileDTO[]` na `DashboardItemDTO[]` używając `toDashboardItemDTO()`
2. Zserializować dane do JSON
3. Zwrócić odpowiedź z kodem 200 OK

**Implementacja:**

```typescript
// Transformacja ChildProfileDTO[] -> DashboardItemDTO[]
const dashboardData: DashboardItemDTO[] = paginatedResult.data.map((profile) => ({
  profileId: profile.id,
  profileName: profile.profileName,
  currentLevel: profile.currentLevelId,
  totalScore: profile.totalScore,
  lastPlayedAt: profile.lastPlayedAt,
}));

// Alternatywnie, jeśli serwis zwraca encje, użyj helper function:
// const dashboardData = entities.map(toDashboardItemDTO);

return new Response(JSON.stringify(dashboardData), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});
```

**Uwaga:** Rozważyć modyfikację `ProfileService.listChildProfiles()` aby zwracać odpowiednio zmapowane dane lub utworzyć dedykowaną metodę `getDashboardData()`.

**Szacowany czas:** 15 minut

---

### Krok 6: Obsługa błędów w bloku catch

**Zadania:**

1. Obsłużyć `UnauthorizedError` (401)
2. Obsłużyć inne błędy (500) z logowaniem
3. Zwrócić odpowiednie odpowiedzi JSON zgodnie z typem `APIErrorResponse`

**Implementacja:**

```typescript
catch (error) {
  // Błędy uwierzytelniania
  if (error instanceof UnauthorizedError) {
    return new Response(
      JSON.stringify({
        error: "unauthenticated",
        message: error.message,
      } as APIErrorResponse),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Nieoczekiwane błędy - logowanie bez wrażliwych danych
  console.error("Unexpected error in GET /api/dashboard:", {
    error: error instanceof Error ? error.message : "Unknown error",
    timestamp: new Date().toISOString(),
  });

  return new Response(
    JSON.stringify({
      error: "internal_error",
      message: "An unexpected error occurred",
    } as APIErrorResponse),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

**Szacowany czas:** 15 minut

---

### Krok 7: Rozważenie optymalizacji ProfileService

**Opcjonalne: Dedykowana metoda w ProfileService**

**Zadania:**

1. Otworzyć `src/lib/services/profile.service.ts`
2. Dodać metodę `getDashboardData(parentId: string): Promise<DashboardItemDTO[]>`
3. Zoptymalizować zapytanie SQL (SELECT tylko potrzebne kolumny)
4. Zwracać bezpośrednio `DashboardItemDTO[]` bez metadanych paginacji

**Implementacja:**

```typescript
/**
 * Gets dashboard data for all child profiles of a parent.
 * Returns simplified view with only dashboard-relevant fields.
 *
 * @param parentId - The authenticated parent's user ID
 * @returns Array of DashboardItemDTO
 */
async getDashboardData(parentId: string): Promise<DashboardItemDTO[]> {
  // Optymalizowane zapytanie - tylko potrzebne kolumny
  const { data, error } = await this.supabase
    .from("child_profiles")
    .select("id, profile_name, current_level_id, total_score, last_played_at")
    .eq("parent_id", parentId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch dashboard data: ${error.message}`);
  }

  // Transformacja do DashboardItemDTO
  return (data ?? []).map((entity) => ({
    profileId: entity.id,
    profileName: entity.profile_name,
    currentLevel: entity.current_level_id,
    totalScore: entity.total_score,
    lastPlayedAt: entity.last_played_at,
  }));
}
```

**Zalety:**

- Dedykowana metoda dla dashboardu (Single Responsibility Principle)
- Optymalizacja zapytania SQL (mniej kolumn)
- Bezpośredni zwrot `DashboardItemDTO[]` (bez paginacji)
- Czytelniejszy kod w endpoincie

**Wady:**

- Duplikacja logiki (podobna do `listChildProfiles`)
- Dodatkowa metoda w serwisie

**Rekomendacja:**

- Dla MVP: użyć istniejącego `listChildProfiles()` i zmapować w endpoincie
- Dla produkcji: rozważyć dedykowaną metodę dla lepszej czytelności

**Szacowany czas:** 20 minut (jeśli implementowane)

---

### Krok 8: Testowanie endpointu

**Zadania manualne:**

1. **Test autentykacji:**
   - Sprawdzić odpowiedź 401 bez tokenu
   - Sprawdzić odpowiedź 401 z wygasłym tokenem
   - Sprawdzić odpowiedź 200 z poprawnym tokenem

2. **Test danych:**
   - Sprawdzić pustą tablicę dla rodzica bez profili
   - Sprawdzić poprawną strukturę dla rodzica z profilami
   - Zweryfikować wszystkie pola w odpowiedzi

3. **Test edge cases:**
   - Profil z `lastPlayedAt = null`
   - Rodzic z maksymalną liczbą profili (10)
   - Profil na najniższym poziomie (1)
   - Profil na najwyższym poziomie (20)

**Narzędzia:**

- Postman / Insomnia / curl
- Supabase Dashboard (do weryfikacji danych w bazie)
- Chrome DevTools (Network tab)

**Przykładowe żądanie curl:**

```bash
curl -X GET http://localhost:4321/api/dashboard \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json"
```

**Szacowany czas:** 30 minut

---

### Krok 9: Integracja z frontendem (opcjonalne dla tego planu)

**Zadania:**

1. Utworzyć hook `useDashboardQuery()` w `src/lib/hooks/`
2. Zaimplementować TanStack Query dla cache'owania
3. Zintegrować hook w komponencie Dashboard

**Przykład hook:**

```typescript
// src/lib/hooks/useDashboardQuery.ts
import { useQuery } from "@tanstack/react-query";
import type { DashboardItemDTO } from "@/types";

export function useDashboardQuery() {
  return useQuery<DashboardItemDTO[]>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard");
      }
      return response.json();
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}
```

**Uwaga:** Ten krok wykracza poza implementację samego API endpointu i może być częścią oddzielnego zadania.

**Szacowany czas:** 45 minut (jeśli implementowane)

---

### Krok 10: Dokumentacja i finalizacja

**Zadania:**

1. Dodać komentarze JSDoc do endpointu
2. Zaktualizować dokumentację API (jeśli istnieje)
3. Sprawdzić zgodność z planem API (`api-plan.md`)
4. Code review (jeśli wymagane)

**Przykład JSDoc:**

```typescript
/**
 * GET /api/dashboard
 *
 * Returns a summary of all child profiles for the authenticated parent.
 * Includes profile ID, name, current level, total score, and last played timestamp.
 *
 * @route GET /api/dashboard
 * @auth Required (JWT token)
 * @returns {DashboardItemDTO[]} 200 - Array of dashboard items
 * @returns {APIErrorResponse} 401 - Unauthorized (no/invalid token)
 * @returns {APIErrorResponse} 500 - Internal server error
 *
 * @example
 * // Success response:
 * [
 *   {
 *     "profileId": "550e8400-e29b-41d4-a716-446655440000",
 *     "profileName": "Anna",
 *     "currentLevel": 4,
 *     "totalScore": 320,
 *     "lastPlayedAt": "2025-12-31T09:50:00Z"
 *   }
 * ]
 */
export const GET: APIRoute = async ({ locals }) => {
  // ...
};
```

**Szacowany czas:** 15 minut

---

## Podsumowanie czasowe

| Krok | Opis                                      | Czas                   |
| ---- | ----------------------------------------- | ---------------------- |
| 1    | Utworzenie pliku endpointu                | 5 min                  |
| 2    | Implementacja obsługi GET                 | 10 min                 |
| 3    | Walidacja autentykacji                    | 10 min                 |
| 4    | Pobranie danych przez ProfileService      | 10 min                 |
| 5    | Transformacja DTOs i zwrot odpowiedzi     | 15 min                 |
| 6    | Obsługa błędów                            | 15 min                 |
| 7    | Optymalizacja ProfileService (opcjonalne) | 20 min                 |
| 8    | Testowanie endpointu                      | 30 min                 |
| 9    | Integracja z frontendem (opcjonalne)      | 45 min                 |
| 10   | Dokumentacja i finalizacja                | 15 min                 |
|      | **Razem (ścieżka minimalna):**            | **110 min (1h 50min)** |
|      | **Razem (z opcjonalnymi):**               | **175 min (2h 55min)** |

---

## Checklisty implementacyjne

### ✅ Przed rozpoczęciem implementacji

- [ ] Zapoznać się z istniejącym kodem (`ProfileService`, inne endpointy API)
- [ ] Zweryfikować strukturę `DashboardItemDTO` w `src/types.ts`
- [ ] Sprawdzić działanie `toDashboardItemDTO()` helper function
- [ ] Przejrzeć przykłady innych endpointów GET (np. `/api/profiles`)
- [ ] Upewnić się, że środowisko deweloperskie działa (Supabase, Astro dev server)

### ✅ Podczas implementacji

- [ ] Utworzono plik `src/pages/api/dashboard.ts`
- [ ] Ustawiono `prerender = false`
- [ ] Zaimportowano wszystkie potrzebne typy i serwisy
- [ ] Zaimplementowano walidację autentykacji
- [ ] Pobrano dane przez `ProfileService`
- [ ] Przekształcono dane na `DashboardItemDTO[]`
- [ ] Dodano obsługę błędów 401 i 500
- [ ] Dodano logowanie błędów (bez wrażliwych danych)
- [ ] Zwrócono odpowiedź JSON z właściwymi nagłówkami

### ✅ Po implementacji (testowanie)

- [ ] Endpoint zwraca 401 bez tokenu JWT
- [ ] Endpoint zwraca 401 z nieprawidłowym tokenem
- [ ] Endpoint zwraca 200 z pustą tablicą dla rodzica bez profili
- [ ] Endpoint zwraca 200 z danymi dla rodzica z profilami
- [ ] Wszystkie pola w `DashboardItemDTO` są poprawne
- [ ] `lastPlayedAt` może być `null` (test profilu bez gry)
- [ ] Dane są posortowane według `created_at`
- [ ] Maksymalnie 10 profili jest zwracanych
- [ ] Response time < 200ms dla typowego przypadku
- [ ] Linter nie zgłasza błędów (`npm run lint`)
- [ ] TypeScript kompiluje się bez błędów (`npm run build`)

### ✅ Code review

- [ ] Kod jest zgodny ze stylem projektu
- [ ] Komentarze JSDoc są kompletne
- [ ] Obsługa błędów jest zgodna z wzorcem projektu
- [ ] Brak duplikacji kodu
- [ ] Nazewnictwo zmiennych jest zrozumiałe
- [ ] Typy TypeScript są używane konsekwentnie
- [ ] Brak wrażliwych danych w logach
- [ ] Zgodność z GDPR (brak logowania danych użytkowników)

---

## Potencjalne rozszerzenia (poza MVP)

1. **Sortowanie:**
   - Query parameter `sort=totalScore|currentLevel|lastPlayedAt|profileName`
   - Query parameter `order=asc|desc`

2. **Filtrowanie:**
   - Query parameter `minLevel=1` (pokaż tylko profile powyżej poziomu X)
   - Query parameter `recentlyPlayed=true` (tylko profile grane w ostatnim tygodniu)

3. **Aggregacje:**
   - Dodać `averageScore` (średni wynik per zadanie)
   - Dodać `totalTasksCompleted` (liczba ukończonych zadań)
   - Dodać `playStreak` (ile dni z rzędu grał)

4. **Cache:**
   - Server-side cache z invalidacją po zapisie wyniku
   - Redis dla rozproszonych instancji

5. **Analytics:**
   - Tracking czasu odpowiedzi (APM)
   - Monitoring wywołań endpointu (częstotliwość)

---

## Uwagi końcowe

- **Prostota:** Endpoint jest prosty i nie wymaga skomplikowanej logiki
- **Reużywalność:** Wykorzystuje istniejący `ProfileService` co minimalizuje duplikację kodu
- **Bezpieczeństwo:** RLS + autentykacja JWT zapewniają solidną ochronę
- **Wydajność:** Mały zestaw danych (max 10 rekordów) nie wymaga optymalizacji
- **Zgodność:** Implementacja jest zgodna z wzorcem projektu i specyfikacją API

**Zalecenie:** Implementować minimalną wersję (kroki 1-6, 8, 10) dla MVP, a rozszerzenia dodawać na podstawie feedbacku użytkowników.
