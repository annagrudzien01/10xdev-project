# API Endpoint Implementation Plan: Sessions Management

## 1. Przegląd punktów końcowych

System zarządzania sesjami gry umożliwia śledzenie sesji rozgrywki dla profili dzieci. Każda sesja ma domyślny czas trwania **10 minut**, który można wydłużyć o **2 minuty** za pomocą endpointu refresh. Status sesji jest obliczany dynamicznie na podstawie `ended_at > current_time`.

### Endpoints:
1. **POST /api/profiles/{profileId}/sessions** - Rozpocznij nową sesję (10 min, zamyka poprzednie aktywne sesje)
2. **POST /api/sessions/{sessionId}/refresh** - Wydłuż sesję o 2 minuty
3. **PATCH /api/sessions/{sessionId}/end** - Zakończ sesję natychmiast (ustaw `ended_at = now()`)
4. **GET /api/profiles/{profileId}/sessions** - Wyświetl listę sesji z opcjonalnym filtrem `active=true`

### Kluczowe funkcjonalności:
- Automatyczne ustawienie `ended_at = started_at + 10 min` przy tworzeniu sesji
- Możliwość wydłużenia sesji o 2 minuty (refresh)
- Automatyczne zamykanie poprzednich aktywnych sesji przy tworzeniu nowej
- Paginacja listy sesji
- Filtrowanie sesji aktywnych (obliczane dynamicznie)
- Weryfikacja własności przez rodzica
- **Status sesji obliczany dynamicznie:**
  - **Aktywna:** `ended_at > current_time`
  - **Nieaktywna:** `ended_at <= current_time`

---

## 2. Szczegóły żądania

### 2.1 POST /api/profiles/{profileId}/sessions

**Metoda HTTP:** POST

**Struktura URL:** `/api/profiles/{profileId}/sessions`

**Parametry:**
- **Wymagane:**
  - `profileId` (path parameter) - UUID profilu dziecka
  
- **Opcjonalne:** Brak

**Request Body:** Brak

**Walidacja:**
- `profileId` musi być poprawnym UUID
- Profil musi istnieć
- Profil musi należeć do uwierzytelnionego rodzica
- Nie wymaga żadnych dodatkowych danych wejściowych

**Logika biznesowa:**
- Poprzednie aktywne sesje (gdzie `ended_at > now()`) są automatycznie zamykane (SET `ended_at = now()`)
- Nowa sesja ma automatycznie ustawione `ended_at = started_at + 10 minut`

---

### 2.2 POST /api/sessions/{sessionId}/refresh

**Metoda HTTP:** POST

**Struktura URL:** `/api/sessions/{sessionId}/refresh`

**Parametry:**
- **Wymagane:**
  - `sessionId` (path parameter) - UUID sesji do wydłużenia
  
- **Opcjonalne:** Brak

**Request Body:** Brak

**Walidacja:**
- `sessionId` musi być poprawnym UUID
- Sesja musi istnieć
- Sesja musi należeć do profilu dziecka uwierzytelnionego rodzica
- Sesja musi być aktywna (`ended_at > current_time`)

**Logika biznesowa:**
- Wydłuża sesję o 2 minuty: `ended_at = ended_at + 2 min`
- Można wywoływać wielokrotnie
- Opcjonalnie można wprowadzić limit maksymalnego czasu sesji (np. max 30 minut)

---

### 2.3 PATCH /api/sessions/{sessionId}/end

**Metoda HTTP:** PATCH

**Struktura URL:** `/api/sessions/{sessionId}/end`

**Parametry:**
- **Wymagane:**
  - `sessionId` (path parameter) - UUID sesji do zakończenia
  
- **Opcjonalne:** Brak

**Request Body:** Brak

**Walidacja:**
- `sessionId` musi być poprawnym UUID
- Sesja musi istnieć
- Sesja musi należeć do profilu dziecka uwierzytelnionego rodzica
- Sesja nie może być już zakończona (`ended_at > current_time`)

---

### 2.4 GET /api/profiles/{profileId}/sessions

**Metoda HTTP:** GET

**Struktura URL:** `/api/profiles/{profileId}/sessions`

**Parametry:**
- **Wymagane:**
  - `profileId` (path parameter) - UUID profilu dziecka
  
- **Opcjonalne:**
  - `active` (query parameter) - boolean, filtr dla aktywnych sesji (np. `?active=true`)
  - `page` (query parameter) - numer strony (domyślnie: 1)
  - `pageSize` (query parameter) - liczba elementów na stronę (domyślnie: 20, max: 100)

**Request Body:** Brak

**Walidacja:**
- `profileId` musi być poprawnym UUID
- `active` musi być boolean ("true" lub "false" jako string w query)
- `page` musi być liczbą całkowitą > 0
- `pageSize` musi być liczbą całkowitą > 0 i <= 100
- Profil musi istnieć
- Profil musi należeć do uwierzytelnionego rodzica

---

## 3. Wykorzystywane typy

### 3.1 Istniejące typy w `src/types.ts`:

**SessionStartDTO** - Odpowiedź dla POST (utworzenie sesji):
```typescript
export interface SessionStartDTO {
  sessionId: string;        // UUID sesji
  startedAt: string;        // ISO timestamp rozpoczęcia
  endedAt: string;          // ISO timestamp zakończenia (started_at + 10 min)
  isActive: boolean;        // Czy sesja jest aktywna (zawsze true dla nowo utworzonej - computed field)
}
```

**Note:** 
- `isActive` jest polem obliczanym, nie jest przechowywane w bazie danych
- `endedAt` jest automatycznie ustawiane na `startedAt + 10 minut`

**SessionRefreshDTO** - Odpowiedź dla POST refresh (wydłużenie sesji):
```typescript
export interface SessionRefreshDTO {
  sessionId: string;        // UUID sesji
  endedAt: string;          // Nowy ISO timestamp zakończenia (poprzedni + 2 min)
  message: string;          // Komunikat potwierdzający ("Session extended by 2 minutes")
}
```

**SessionDTO** - Pełna reprezentacja sesji dla GET (lista):
```typescript
export interface SessionDTO {
  id: string;               // UUID sesji
  childId: string;          // UUID profilu dziecka
  isActive: boolean;        // Czy sesja jest aktywna (computed: ended_at > now())
  startedAt: string;        // ISO timestamp rozpoczęcia
  endedAt: string;          // ISO timestamp zakończenia (nigdy null - zawsze ustawione)
  createdAt: string;        // ISO timestamp utworzenia rekordu
  updatedAt: string | null; // ISO timestamp ostatniej aktualizacji
}
```

**Note:** 
- `isActive` jest polem obliczanym na podstawie `ended_at > now()`, nie jest przechowywane w bazie
- `endedAt` jest zawsze ustawione (10 min od start lub wydłużone przez refresh)

**SessionListParams** - Parametry zapytania dla GET (lista):
```typescript
export interface SessionListParams extends PaginationParams {
  active?: boolean;         // Filtr dla aktywnych sesji
}
```

**Helper Functions** (już istnieją):
```typescript
export function toSessionStartDTO(entity: SessionEntity): SessionStartDTO
export function toSessionRefreshDTO(entity: SessionEntity): SessionRefreshDTO
export function toSessionDTO(entity: SessionEntity): SessionDTO
```

### 3.2 Nowe schematy walidacji do utworzenia:

**Plik:** `src/lib/schemas/session.schema.ts`

```typescript
import { z } from "zod";
import { paginationParamsSchema } from "./pagination.schema";

/**
 * Schema for validating profileId path parameter
 */
export const profileIdParamSchema = z.object({
  profileId: z.string().uuid({ message: "Invalid profile ID format" }),
});

/**
 * Schema for validating sessionId path parameter
 */
export const sessionIdParamSchema = z.object({
  sessionId: z.string().uuid({ message: "Invalid session ID format" }),
});

/**
 * Schema for validating session list query parameters
 */
export const sessionListParamsSchema = paginationParamsSchema.extend({
  active: z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || val === "true" || val === "false",
      "active must be 'true' or 'false'"
    )
    .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
});
```

**Uwaga:** `profileIdParamSchema` już istnieje w `src/lib/schemas/task.schema.ts`, więc można go zaimportować stamtąd lub przenieść do `session.schema.ts` dla lepszej organizacji.

---

## 4. Szczegóły odpowiedzi

### 4.1 POST /api/profiles/{profileId}/sessions

**Sukces - 201 Created:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "startedAt": "2026-01-10T14:30:00.000Z",
  "endedAt": "2026-01-10T14:40:00.000Z",
  "isActive": true
}
```

**Note:** `endedAt` jest automatycznie ustawione na `startedAt + 10 minut`.

**Błędy:**
- **400 Bad Request:**
  ```json
  {
    "error": "invalid_request",
    "message": "Validation failed",
    "details": {
      "profileId": "Invalid profile ID format"
    }
  }
  ```

- **401 Unauthorized:**
  ```json
  {
    "error": "unauthenticated",
    "message": "Authentication required"
  }
  ```

- **403 Forbidden:**
  ```json
  {
    "error": "forbidden",
    "message": "Profile does not belong to this parent"
  }
  ```

- **404 Not Found:**
  ```json
  {
    "error": "not_found",
    "message": "Profile not found"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "internal_error",
    "message": "An unexpected error occurred"
  }
  ```

---

### 4.2 POST /api/sessions/{sessionId}/refresh

**Sukces - 200 OK:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "endedAt": "2026-01-10T14:42:00.000Z",
  "message": "Session extended by 2 minutes"
}
```

**Note:** `endedAt` jest wydłużone o 2 minuty względem poprzedniej wartości.

**Błędy:**
- **400 Bad Request (Invalid format):**
  ```json
  {
    "error": "invalid_request",
    "message": "Validation failed",
    "details": {
      "sessionId": "Invalid session ID format"
    }
  }
  ```

- **400 Bad Request (Session expired):**
  ```json
  {
    "error": "invalid_request",
    "message": "Session has already expired"
  }
  ```

- **401 Unauthorized:**
  ```json
  {
    "error": "unauthenticated",
    "message": "Authentication required"
  }
  ```

- **403 Forbidden:**
  ```json
  {
    "error": "forbidden",
    "message": "Session does not belong to this parent"
  }
  ```

- **404 Not Found:**
  ```json
  {
    "error": "not_found",
    "message": "Session not found"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "internal_error",
    "message": "An unexpected error occurred"
  }
  ```

---

### 4.3 PATCH /api/sessions/{sessionId}/end

**Sukces - 200 OK:**
```json
{
  "message": "Session ended successfully"
}
```

**Błędy:**
- **400 Bad Request (Invalid format):**
  ```json
  {
    "error": "invalid_request",
    "message": "Validation failed",
    "details": {
      "sessionId": "Invalid session ID format"
    }
  }
  ```

- **400 Bad Request (Already ended):**
  ```json
  {
    "error": "invalid_request",
    "message": "Session is already ended"
  }
  ```

- **401 Unauthorized:**
  ```json
  {
    "error": "unauthenticated",
    "message": "Authentication required"
  }
  ```

- **403 Forbidden:**
  ```json
  {
    "error": "forbidden",
    "message": "Session does not belong to this parent"
  }
  ```

- **404 Not Found:**
  ```json
  {
    "error": "not_found",
    "message": "Session not found"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "internal_error",
    "message": "An unexpected error occurred"
  }
  ```

---

### 4.4 GET /api/profiles/{profileId}/sessions

**Sukces - 200 OK:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "childId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "isActive": true,
      "startedAt": "2026-01-10T14:30:00.000Z",
      "endedAt": null,
      "createdAt": "2026-01-10T14:30:00.000Z",
      "updatedAt": null
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "childId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "isActive": false,
      "startedAt": "2026-01-09T10:00:00.000Z",
      "endedAt": "2026-01-09T11:30:00.000Z",
      "createdAt": "2026-01-09T10:00:00.000Z",
      "updatedAt": "2026-01-09T11:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 2,
    "totalPages": 1
  }
}
```

**Przykład z filtrem aktywnych:** `GET /api/profiles/{profileId}/sessions?active=true`
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "childId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "isActive": true,
      "startedAt": "2026-01-10T14:30:00.000Z",
      "endedAt": null,
      "createdAt": "2026-01-10T14:30:00.000Z",
      "updatedAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

**Błędy:**
- **400 Bad Request:**
  ```json
  {
    "error": "invalid_request",
    "message": "Validation failed",
    "details": {
      "active": "active must be 'true' or 'false'"
    }
  }
  ```

- **401 Unauthorized:**
  ```json
  {
    "error": "unauthenticated",
    "message": "Authentication required"
  }
  ```

- **403 Forbidden:**
  ```json
  {
    "error": "forbidden",
    "message": "Profile does not belong to this parent"
  }
  ```

- **404 Not Found:**
  ```json
  {
    "error": "not_found",
    "message": "Profile not found"
  }
  ```

- **500 Internal Server Error:**
  ```json
  {
    "error": "internal_error",
    "message": "An unexpected error occurred"
  }
  ```

---

## 5. Przepływ danych

### 5.1 POST /api/profiles/{profileId}/sessions - Rozpocznij sesję

```
1. Middleware (`src/middleware/index.ts`)
   ↓
   - Ekstrakcja JWT z nagłówka Authorization lub cookie
   - Utworzenie klienta Supabase z JWT
   - Weryfikacja tokena dla chronionej ścieżki
   - Ustawienie `context.locals.supabase` i `context.locals.user`

2. Handler POST (`src/pages/api/profiles/[profileId]/sessions/index.ts`)
   ↓
   - Sprawdzenie autentykacji (locals.supabase, locals.user)
   - Walidacja `profileId` (UUID) za pomocą `profileIdParamSchema`
   
3. ProfileService.validateOwnership(profileId, user.id)
   ↓
   - SQL: SELECT id, parent_id FROM child_profiles WHERE id = $1
   - Jeśli brak rekordu → throw NotFoundError
   - Jeśli parent_id ≠ user.id → throw ForbiddenError

4. SessionService.startSession(profileId, user.id)
   ↓
   a) Zamknięcie poprzednich aktywnych sesji (gdzie `ended_at > now()`):
      SQL: UPDATE sessions
           SET ended_at = now()
           WHERE child_id = $1 AND ended_at > now()
   
   b) Utworzenie nowej sesji z automatycznym ustawieniem ended_at:
      SQL: INSERT INTO sessions (child_id, started_at, ended_at)
           VALUES ($1, now(), now() + interval '10 minutes')
           RETURNING *

5. Transformacja SessionEntity → SessionStartDTO (helper function)
   - Obliczenie `isActive = true` (ended_at jest 10 minut w przyszłości)
   - Zwrócenie sessionId, startedAt, endedAt, isActive
   
6. Zwrócenie Response 201 Created z SessionStartDTO
```

**SQL Query:**
```sql
-- 1. Zamknięcie poprzednich aktywnych sesji
UPDATE sessions 
SET ended_at = now() 
WHERE child_id = $1 AND ended_at > now();

-- 2. Utworzenie nowej sesji (INSERT)
INSERT INTO sessions (child_id, started_at, ended_at)
VALUES ($1, now(), now() + interval '10 minutes')
RETURNING id, child_id, started_at, ended_at, created_at, updated_at;
```

---

### 5.2 POST /api/sessions/{sessionId}/refresh - Wydłuż sesję

```
1. Middleware (jak wyżej)
   
2. Handler POST (`src/pages/api/sessions/[sessionId]/refresh.ts`)
   ↓
   - Sprawdzenie autentykacji
   - Walidacja `sessionId` (UUID) za pomocą `sessionIdParamSchema`
   
3. SessionService.refreshSession(sessionId, user.id)
   ↓
   a) Weryfikacja własności i statusu:
      SQL: SELECT s.id, s.ended_at, cp.parent_id
           FROM sessions s
           JOIN child_profiles cp ON s.child_id = cp.id
           WHERE s.id = $1
      
      - Jeśli brak rekordu → throw NotFoundError
      - Jeśli parent_id ≠ user.id → throw ForbiddenError
      - Jeśli ended_at <= now() → throw ValidationError ("Session has already expired")
   
   b) Wydłużenie sesji:
      SQL: UPDATE sessions
           SET ended_at = ended_at + interval '2 minutes'
           WHERE id = $1 AND ended_at > now()
           RETURNING *
      
      - Trigger `set_updated_at()` automatycznie ustawia `updated_at = now()`

4. Transformacja SessionEntity → SessionRefreshDTO
   - Zwrócenie sessionId, endedAt, message

5. Zwrócenie Response 200 OK z SessionRefreshDTO
```

**SQL Queries:**
```sql
-- 1. Weryfikacja własności i statusu
SELECT s.id, s.ended_at, cp.parent_id
FROM sessions s
JOIN child_profiles cp ON s.child_id = cp.id
WHERE s.id = $1;

-- 2. Wydłużenie sesji o 2 minuty
UPDATE sessions
SET ended_at = ended_at + interval '2 minutes'
WHERE id = $1 AND ended_at > now()
RETURNING *;
```

---

### 5.3 PATCH /api/sessions/{sessionId}/end - Zakończ sesję

```
1. Middleware (jak wyżej)
   
2. Handler PATCH (`src/pages/api/sessions/[sessionId]/end.ts`)
   ↓
   - Sprawdzenie autentykacji
   - Walidacja `sessionId` (UUID) za pomocą `sessionIdParamSchema`
   
3. SessionService.endSession(sessionId, user.id)
   ↓
   a) Weryfikacja własności:
      SQL: SELECT s.id, s.ended_at, cp.parent_id
           FROM sessions s
           JOIN child_profiles cp ON s.child_id = cp.id
           WHERE s.id = $1
      
      - Jeśli brak rekordu → throw NotFoundError
      - Jeśli parent_id ≠ user.id → throw ForbiddenError
      - Jeśli ended_at IS NOT NULL AND ended_at <= now() → throw ValidationError ("Session is already ended")
   
   b) Zakończenie sesji:
      SQL: UPDATE sessions
           SET ended_at = now()
           WHERE id = $1 AND (ended_at IS NULL OR ended_at > now())
           RETURNING *
      
      - Trigger `set_updated_at()` automatycznie ustawia `updated_at = now()`

4. Zwrócenie Response 200 OK z komunikatem sukcesu
```

**SQL Queries:**
```sql
-- 1. Weryfikacja własności i stanu
SELECT s.id, s.ended_at, cp.parent_id
FROM sessions s
JOIN child_profiles cp ON s.child_id = cp.id
WHERE s.id = $1;

-- 2. Zakończenie sesji
UPDATE sessions
SET ended_at = now()
WHERE id = $1 AND (ended_at IS NULL OR ended_at > now())
RETURNING *;
```

---

### 5.4 GET /api/profiles/{profileId}/sessions - Lista sesji

```
1. Middleware (jak wyżej)
   
2. Handler GET (`src/pages/api/profiles/[profileId]/sessions/index.ts`)
   ↓
   - Sprawdzenie autentykacji
   - Walidacja `profileId` (UUID)
   - Walidacja query params (page, pageSize, active) za pomocą `sessionListParamsSchema`
   
3. ProfileService.validateOwnership(profileId, user.id)
   ↓
   - Jak w POST (sprawdzenie, czy profil należy do rodzica)

4. SessionService.listSessions(profileId, user.id, params)
   ↓
   - Obliczenie offset = (page - 1) * pageSize
   - Obliczenie range: offset do offset + pageSize - 1
   
   SQL: SELECT *, 
               CASE 
                 WHEN ended_at > now() THEN true 
                 ELSE false 
               END as is_active_computed
        FROM sessions
        WHERE child_id = $1
        [AND ended_at > now() IF params.active = true]
        [AND ended_at <= now() IF params.active = false]
        ORDER BY started_at DESC
        LIMIT $pageSize OFFSET $offset
   
   SQL (count): SELECT COUNT(*) FROM sessions
                WHERE child_id = $1
                [AND ended_at > now() IF params.active = true]
                [AND ended_at <= now() IF params.active = false]

5. Transformacja SessionEntity[] → SessionDTO[] (helper functions)
   - Obliczenie `isActive` dla każdej sesji na podstawie `ended_at`
   
6. Utworzenie PaginatedResponse<SessionDTO>
   - data: SessionDTO[]
   - pagination: { page, pageSize, totalItems, totalPages }

7. Zwrócenie Response 200 OK z PaginatedResponse
```

**SQL Queries:**
```sql
-- 1. Pobieranie sesji z paginacją
SELECT id, child_id, started_at, ended_at, created_at, updated_at,
       CASE 
         WHEN ended_at > now() THEN true 
         ELSE false 
       END as is_active
FROM sessions
WHERE child_id = $1
  [AND ended_at > now()]  -- opcjonalny filtr active=true
  [AND ended_at <= now()]  -- opcjonalny filtr active=false
ORDER BY started_at DESC
LIMIT $pageSize OFFSET $offset;

-- 2. Liczenie wszystkich sesji (dla paginacji)
SELECT COUNT(*) as count
FROM sessions
WHERE child_id = $1
  [AND ended_at > now()];  -- opcjonalny filtr
```

---

## 6. Względy bezpieczeństwa

### 6.1 Autentykacja

- **Wymagana:** Tak, dla wszystkich endpointów
- **Metoda:** Supabase JWT
- **Źródło tokena:**
  - Nagłówek `Authorization: Bearer <token>` (API calls)
  - Cookie `sb-access-token` (SSR fallback)
- **Weryfikacja:** Middleware sprawdza token i ustawia `context.locals.user`
- **Błąd:** 401 Unauthorized jeśli brak/nieprawidłowy token

### 6.2 Autoryzacja

**POST /profiles/{profileId}/sessions:**
- Weryfikacja, że `profileId` należy do uwierzytelnionego rodzica
- SQL: `SELECT parent_id FROM child_profiles WHERE id = profileId`
- Porównanie: `parent_id === user.id`
- Błąd: 403 Forbidden jeśli profil nie należy do rodzica

**POST /sessions/{sessionId}/refresh:**
- Weryfikacja, że sesja należy do profilu dziecka rodzica
- SQL: `SELECT cp.parent_id FROM sessions s JOIN child_profiles cp WHERE s.id = sessionId`
- Porównanie: `parent_id === user.id`
- Sprawdzenie, że sesja nie wygasła: `ended_at > now()`
- Błąd: 403 Forbidden jeśli sesja nie należy do rodzica
- Błąd: 400 Bad Request jeśli sesja wygasła

**PATCH /sessions/{sessionId}/end:**
- Weryfikacja, że sesja należy do profilu dziecka rodzica
- SQL: `SELECT cp.parent_id FROM sessions s JOIN child_profiles cp WHERE s.id = sessionId`
- Porównanie: `parent_id === user.id`
- Błąd: 403 Forbidden jeśli sesja nie należy do rodzica

**GET /profiles/{profileId}/sessions:**
- Weryfikacja jak w POST (profil należy do rodzica)
- RLS dodatkowo wymusza `parent_id = auth.uid()` na poziomie bazy

### 6.3 Row Level Security (RLS)

Tabela `sessions` ma włączone RLS z polityką:
```sql
CREATE POLICY sessions_owner ON sessions
USING (EXISTS (
  SELECT 1 FROM child_profiles cp 
  WHERE cp.id = child_id AND cp.parent_id = auth.uid()
));
```

- Polityka wymusza, że tylko rodzic może odczytywać/modyfikować sesje swoich dzieci
- Działa na poziomie bazy danych jako dodatkowa warstwa bezpieczeństwa
- Współpracuje z weryfikacją w service layer
- Status sesji (`isActive`) jest obliczany dynamicznie w aplikacji, nie ma kolumny `is_active` w bazie

### 6.4 Input Validation

**Wszystkie endpointy:**
- UUID format validation (profileId, sessionId)
- Używamy Zod schemas dla spójnej walidacji
- Błędy walidacji zwracają 400 z szczegółami

**GET sessions (query params):**
- `page`: musi być integer > 0
- `pageSize`: musi być integer > 0 i <= 100
- `active`: musi być "true" lub "false" (string transformowany do boolean, używany do filtrowania po `ended_at > now()`)

### 6.5 Business Logic Security

**POST sessions:**
- Automatyczne zamykanie poprzednich aktywnych sesji (UPDATE `ended_at = now()` WHERE `ended_at > now()`)
- Automatyczne ustawienie `ended_at = started_at + 10 minutes` dla nowej sesji
- Nie można rozpocząć sesji dla nieistniejącego profilu (404)

**POST refresh:**
- Nie można wydłużyć wygasłej sesji (400)
- Sprawdzenie `ended_at > now()` przed aktualizacją
- Sesja wydłużana o dokładnie 2 minuty

**PATCH end session:**
- Nie można zakończyć już zakończonej sesji (400)
- Sprawdzenie `ended_at > now()` przed aktualizacją

**Rate Limiting:**
- Globalne rate limiting: 100 requests/minute per token
- Błąd: 429 Too Many Requests (jeśli zaimplementowane)

### 6.6 Data Exposure Prevention

- Nigdy nie zwracamy `parent_id` w odpowiedziach sesji
- SessionDTO zawiera tylko `childId`, nie `parentId`
- `isActive` jest obliczany dynamicznie, nie przechowywany w bazie
- Logowanie błędów bez danych wrażliwych (GDPR compliance)
- Nie ujawniamy szczegółów błędów bazy danych użytkownikowi (tylko logi serwera)

---

## 7. Obsługa błędów

### 7.1 Macierz błędów dla POST /profiles/{profileId}/sessions

| Scenariusz                       | Kod | Error Code          | Message                                | Throwing Point        |
| -------------------------------- | --- | ------------------- | -------------------------------------- | --------------------- |
| Brak/nieprawidłowy JWT           | 401 | `unauthenticated`   | "Authentication required"              | Handler (auth check)  |
| Niepoprawny format profileId     | 400 | `invalid_request`   | "Validation failed" + details          | Handler (validation)  |
| Profil nie istnieje              | 404 | `not_found`         | "Profile not found"                    | ProfileService        |
| Profil nie należy do rodzica     | 403 | `forbidden`         | "Profile does not belong to parent"    | ProfileService        |
| Błąd bazy danych (INSERT)        | 500 | `internal_error`    | "An unexpected error occurred"         | SessionService        |

---

### 7.2 Macierz błędów dla POST /sessions/{sessionId}/refresh

| Scenariusz                       | Kod | Error Code          | Message                                | Throwing Point        |
| -------------------------------- | --- | ------------------- | -------------------------------------- | --------------------- |
| Brak/nieprawidłowy JWT           | 401 | `unauthenticated`   | "Authentication required"              | Handler (auth check)  |
| Niepoprawny format sessionId     | 400 | `invalid_request`   | "Validation failed" + details          | Handler (validation)  |
| Sesja nie istnieje               | 404 | `not_found`         | "Session not found"                    | SessionService        |
| Sesja nie należy do rodzica      | 403 | `forbidden`         | "Session does not belong to parent"    | SessionService        |
| Sesja już wygasła                | 400 | `invalid_request`   | "Session has already expired"          | SessionService        |
| Błąd bazy danych (UPDATE)        | 500 | `internal_error`    | "An unexpected error occurred"         | SessionService        |

---

### 7.3 Macierz błędów dla PATCH /sessions/{sessionId}/end

| Scenariusz                       | Kod | Error Code          | Message                                | Throwing Point        |
| -------------------------------- | --- | ------------------- | -------------------------------------- | --------------------- |
| Brak/nieprawidłowy JWT           | 401 | `unauthenticated`   | "Authentication required"              | Handler (auth check)  |
| Niepoprawny format sessionId     | 400 | `invalid_request`   | "Validation failed" + details          | Handler (validation)  |
| Sesja nie istnieje               | 404 | `not_found`         | "Session not found"                    | SessionService        |
| Sesja nie należy do rodzica      | 403 | `forbidden`         | "Session does not belong to parent"    | SessionService        |
| Sesja już zakończona             | 400 | `invalid_request`   | "Session is already ended"             | SessionService        |
| Błąd bazy danych (UPDATE)        | 500 | `internal_error`    | "An unexpected error occurred"         | SessionService        |

---

### 7.3 Macierz błędów dla GET /profiles/{profileId}/sessions

| Scenariusz                       | Kod | Error Code          | Message                                | Throwing Point        |
| -------------------------------- | --- | ------------------- | -------------------------------------- | --------------------- |
| Brak/nieprawidłowy JWT           | 401 | `unauthenticated`   | "Authentication required"              | Handler (auth check)  |
| Niepoprawny format profileId     | 400 | `invalid_request`   | "Validation failed" + details          | Handler (validation)  |
| Niepoprawne query params         | 400 | `invalid_request`   | "Validation failed" + details          | Handler (validation)  |
| Profil nie istnieje              | 404 | `not_found`         | "Profile not found"                    | ProfileService        |
| Profil nie należy do rodzica     | 403 | `forbidden`         | "Profile does not belong to parent"    | ProfileService        |
| Błąd bazy danych (SELECT)        | 500 | `internal_error`    | "An unexpected error occurred"         | SessionService        |

---

### 7.5 Logowanie błędów

**Wszystkie endpointy:**
```typescript
console.error("Unexpected error in [ENDPOINT PATH]:", {
  error: error instanceof Error ? error.message : "Unknown error",
  userId: locals.user ? locals.user.id : "unauthenticated",
  timestamp: new Date().toISOString(),
});
```

**Zasady logowania:**
- Logujemy tylko błędy 500 (unexpected errors)
- Nie logujemy błędów 400/401/403/404 (expected errors)
- Nie logujemy danych wrażliwych (GDPR)
- Logujemy: endpoint, error message, userId (jeśli dostępny), timestamp
- Stack trace tylko w środowisku development

**Przykłady:**
```typescript
// POST sessions - unexpected database error
console.error("Unexpected error in POST /api/profiles/{profileId}/sessions:", {
  error: "Failed to insert session: database connection lost",
  userId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  timestamp: "2026-01-10T14:30:00.000Z",
});

// PATCH end session - unexpected error
console.error("Unexpected error in PATCH /api/sessions/{sessionId}/end:", {
  error: "Failed to update session: constraint violation",
  userId: "authenticated",
  timestamp: "2026-01-10T14:35:00.000Z",
});
```

---

## 8. Rozważania dotyczące wydajności

### 8.1 Indeksy bazy danych

**Zalecane indeksy:**
```sql
-- Indeks dla szybkiego wyszukiwania sesji dziecka + sortowania (GET sessions)
CREATE INDEX idx_sessions_child_started 
ON sessions(child_id, started_at DESC);

-- Indeks dla filtrowania aktywnych sesji
CREATE INDEX idx_sessions_active 
ON sessions(child_id, ended_at) 
WHERE ended_at > now();

-- Indeks dla JOIN z child_profiles (weryfikacja własności)
CREATE INDEX idx_sessions_child_parent 
ON sessions(child_id) 
INCLUDE (id);
```

**Uzasadnienie:**
- `idx_sessions_child_started`: Przyspiesza `WHERE child_id = $1 ORDER BY started_at DESC`
- `idx_sessions_active`: Optymalizuje filtrowanie aktywnych sesji (WHERE `ended_at > now()`)
- `idx_sessions_child_parent`: Przyspiesza JOINy z child_profiles dla weryfikacji własności

**Uwaga:** Usunięto `ux_active_session_per_child` - teraz możliwe jest wiele "aktywnych" sesji (z `ended_at` w przyszłości), ale w praktyce poprzednie są zamykane przy starcie nowej.

---

### 8.2 Optymalizacje zapytań

**POST sessions:**
- UPDATE poprzednich aktywnych sesji + INSERT nowej w jednej transakcji
- Automatyczne ustawienie `ended_at = started_at + 10 min`
- Koszt: ~5-10ms (UPDATE + INSERT)

**POST refresh:**
- Weryfikacja + UPDATE `ended_at` o +2 min
- Można zoptymalizować do pojedynczego UPDATE z RETURNING + JOIN:
  ```sql
  UPDATE sessions s
  SET ended_at = ended_at + interval '2 minutes'
  FROM child_profiles cp
  WHERE s.id = $1 AND s.child_id = cp.id AND cp.parent_id = $2 
    AND s.ended_at > now()
  RETURNING s.*;
  ```
- Koszt: ~3-8ms

**PATCH end session:**
- Weryfikacja + UPDATE w jednej transakcji
- Można zoptymalizować do pojedynczego UPDATE z RETURNING + JOIN:
  ```sql
  UPDATE sessions s
  SET ended_at = now()
  FROM child_profiles cp
  WHERE s.id = $1 AND s.child_id = cp.id AND cp.parent_id = $2 
    AND s.ended_at > now()
  RETURNING s.*;
  ```
- Koszt: ~3-8ms

**GET sessions:**
- SELECT z paginacją (LIMIT/OFFSET)
- Obliczenie `isActive` w SELECT lub w aplikacji
- COUNT query może być kosztowne dla dużych zbiorów
- Optymalizacja: cache COUNT dla często używanych profilów
- Koszt: ~5-15ms (zależnie od liczby sesji)

---

### 8.3 Paginacja i limity

**Domyślne wartości:**
- `pageSize`: 20 (default)
- `pageSize` max: 100 (enforce w validation)
- `page`: 1 (default)

**Strategie optymalizacji:**
- Dla profilów z setkami sesji: OFFSET może być wolny
- Rozważyć cursor-based pagination w przyszłości (zamiast OFFSET)
- Cache pierwszy page (najczęściej używany)

**Przykład cursor-based (przyszłość):**
```sql
SELECT * FROM sessions
WHERE child_id = $1 AND started_at < $cursor
ORDER BY started_at DESC
LIMIT 20;
```

---

### 8.4 Caching strategii

**Kandydaci do cache:**
1. **Active session per profile** (GET with `active=true`)
   - TTL: 1 minuta (sesje mają krótki czas życia)
   - Invalidacja: po POST/POST refresh/PATCH end sessions
   - Benefit: Zmniejsza obciążenie DB dla często sprawdzanych aktywnych sesji

2. **Session count per profile**
   - TTL: 5 minut
   - Benefit: Przyspiesza paginację

**Nie cache'ować:**
- Pełna lista sesji (często się zmienia z powodu automatycznego wygasania)
- Pojedyncze sesje (małe obciążenie, rzadko używane)

**Uwaga:** Z powodu automatycznego wygasania sesji (10 min) cache wymaga częstszej invalidacji niż w poprzednim podejściu.

---

### 8.5 Potencjalne wąskie gardła

| Wąskie gardło                     | Prawdopodobieństwo | Mitigation                               |
| --------------------------------- | ------------------ | ---------------------------------------- |
| UPDATE + INSERT w POST sessions   | Niskie             | Używamy indeksów + transakcja           |
| COUNT(*) dla paginacji            | Średnie            | Index + cache count                      |
| OFFSET dla dużych zbiorów         | Średnie            | Cursor-based pagination (przyszłość)     |
| Częste refresh requests           | Średnie            | Rate limiting per session                |
| JOIN child_profiles → sessions    | Niskie             | Index na child_id + RLS cache            |
| Obliczanie isActive dla dużych list| Niskie            | Obliczanie w SELECT lub cache w Redis    |

---

### 8.6 Metryki do monitorowania

**SLA targets:**
- POST sessions: < 50ms (p95)
- POST refresh: < 30ms (p95)
- PATCH end session: < 100ms (p95)
- GET sessions (20 items): < 150ms (p95)

**Monitorować:**
- Query execution time per endpoint
- Database connection pool usage
- UPDATE execution time (POST sessions and refresh)
- RLS policy evaluation time
- Error rate per endpoint (especially 500s)
- Frequency of `isActive` computation (consider caching if high)
- Average session duration (powinno być ~10 min)
- Refresh frequency per session

---

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji sesji

**Plik:** `src/lib/schemas/session.schema.ts`

**Zadanie:**
1. Zaimportować `z` z "zod"
2. Zaimportować `paginationParamsSchema` z "./pagination.schema"
3. Utworzyć `profileIdParamSchema` (lub zaimportować z task.schema.ts jeśli już istnieje)
4. Utworzyć `sessionIdParamSchema` dla walidacji UUID sesji
5. Utworzyć `sessionListParamsSchema` dla walidacji query params (rozszerzenie paginationParamsSchema)
6. Dodać walidację i transformację dla parametru `active` (string "true"/"false" → boolean)

**Przykładowy kod:**
```typescript
import { z } from "zod";
import { paginationParamsSchema } from "./pagination.schema";

export const profileIdParamSchema = z.object({
  profileId: z.string().uuid({ message: "Invalid profile ID format" }),
});

export const sessionIdParamSchema = z.object({
  sessionId: z.string().uuid({ message: "Invalid session ID format" }),
});

export const sessionListParamsSchema = paginationParamsSchema.extend({
  active: z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || val === "true" || val === "false",
      "active must be 'true' or 'false'"
    )
    .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
});
```

**Weryfikacja:**
- Uruchom TypeScript compiler: `npm run build`
- Upewnij się, że nie ma błędów kompilacji

---

### Krok 2: Utworzenie SessionService

**Plik:** `src/lib/services/session.service.ts`

**Zadanie:**
1. Zaimportować typy: `SupabaseClient`, `SessionDTO`, `SessionStartDTO`, `SessionRefreshDTO`, `PaginatedResponse`, `SessionListParams`
2. Zaimportować helper functions: `toSessionDTO`, `toSessionStartDTO`, `toSessionRefreshDTO`
3. Zaimportować błędy: `NotFoundError`, `ForbiddenError`, `ValidationError`
4. Utworzyć klasę `SessionService` z konstruktorem przyjmującym `supabase: SupabaseClient`
5. Zaimplementować metodę `startSession(profileId: string, parentId: string): Promise<SessionStartDTO>`
6. Zaimplementować metodę `refreshSession(sessionId: string, parentId: string): Promise<SessionRefreshDTO>`
7. Zaimplementować metodę `endSession(sessionId: string, parentId: string): Promise<void>`
8. Zaimplementować metodę `listSessions(profileId: string, parentId: string, params: SessionListParams): Promise<PaginatedResponse<SessionDTO>>`

**Szczegóły implementacji:**

**startSession:**
```typescript
async startSession(profileId: string, parentId: string): Promise<SessionStartDTO> {
  // Step 1: Close any previous active sessions
  const now = new Date();
  await this.supabase
    .from("sessions")
    .update({ ended_at: now.toISOString() })
    .eq("child_id", profileId)
    .gt("ended_at", now.toISOString());

  // Step 2: Insert new session with 10-minute duration
  const startedAt = new Date();
  const endedAt = new Date(startedAt.getTime() + 10 * 60 * 1000); // +10 minutes

  const { data, error } = await this.supabase
    .from("sessions")
    .insert({
      child_id: profileId,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to start session: ${error.message}`);
  }

  return toSessionStartDTO(data);
}
```

**refreshSession:**
```typescript
async refreshSession(sessionId: string, parentId: string): Promise<SessionRefreshDTO> {
  // Step 1: Verify ownership and check if expired
  const { data: session, error: fetchError } = await this.supabase
    .from("sessions")
    .select(`
      id,
      ended_at,
      child_profiles!inner(parent_id)
    `)
    .eq("id", sessionId)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      throw new NotFoundError("Session not found");
    }
    throw new Error(`Failed to fetch session: ${fetchError.message}`);
  }

  // Check ownership
  const profile = session.child_profiles as unknown as { parent_id: string };
  if (profile.parent_id !== parentId) {
    throw new ForbiddenError("Session does not belong to this parent");
  }

  // Check if expired
  if (new Date(session.ended_at) <= new Date()) {
    throw new ValidationError({ session: "Session has already expired" });
  }

  // Step 2: Extend session by 2 minutes
  const newEndedAt = new Date(new Date(session.ended_at).getTime() + 2 * 60 * 1000);

  const { data: updatedSession, error: updateError } = await this.supabase
    .from("sessions")
    .update({
      ended_at: newEndedAt.toISOString(),
    })
    .eq("id", sessionId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to refresh session: ${updateError.message}`);
  }

  return toSessionRefreshDTO(updatedSession);
}
```

**endSession:**
```typescript
async endSession(sessionId: string, parentId: string): Promise<void> {
  // Step 1: Verify ownership and check if already expired
  const { data: session, error: fetchError } = await this.supabase
    .from("sessions")
    .select(`
      id,
      ended_at,
      child_profiles!inner(parent_id)
    `)
    .eq("id", sessionId)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      throw new NotFoundError("Session not found");
    }
    throw new Error(`Failed to fetch session: ${fetchError.message}`);
  }

  // Check ownership
  const profile = session.child_profiles as unknown as { parent_id: string };
  if (profile.parent_id !== parentId) {
    throw new ForbiddenError("Session does not belong to this parent");
  }

  // Check if already expired
  if (new Date(session.ended_at) <= new Date()) {
    throw new ValidationError({ session: "Session is already ended" });
  }

  // Step 2: End the session immediately
  const { error: updateError } = await this.supabase
    .from("sessions")
    .update({
      ended_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (updateError) {
    throw new Error(`Failed to end session: ${updateError.message}`);
  }
}
```
  const { data: session, error: fetchError } = await this.supabase
    .from("sessions")
    .select(`
      id,
      ended_at,
      child_profiles!inner(parent_id)
    `)
    .eq("id", sessionId)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      throw new NotFoundError("Session not found");
    }
    throw new Error(`Failed to fetch session: ${fetchError.message}`);
  }

  // Check ownership
  const profile = session.child_profiles as unknown as { parent_id: string };
  if (profile.parent_id !== parentId) {
    throw new ForbiddenError("Session does not belong to this parent");
  }

  // Check if already ended
  if (session.ended_at !== null && new Date(session.ended_at) <= new Date()) {
    throw new ValidationError({ session: "Session is already ended" });
  }

  // Step 2: End the session
  const { error: updateError } = await this.supabase
    .from("sessions")
    .update({
      ended_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (updateError) {
    throw new Error(`Failed to end session: ${updateError.message}`);
  }
}
```

**listSessions:**
```typescript
async listSessions(
  profileId: string,
  parentId: string,
  params: SessionListParams
): Promise<PaginatedResponse<SessionDTO>> {
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.pageSize && params.pageSize > 0 ? Math.min(params.pageSize, 100) : 20;
  const offset = (page - 1) * pageSize;
  const to = offset + pageSize - 1;

  // Build query
  let query = this.supabase
    .from("sessions")
    .select("*", { count: "exact" })
    .eq("child_id", profileId)
    .order("started_at", { ascending: false })
    .range(offset, to);

  // Apply active filter if provided
  if (params.active === true) {
    // Active: ended_at > now()
    query = query.gt("ended_at", new Date().toISOString());
  } else if (params.active === false) {
    // Inactive: ended_at <= now()
    query = query.lte("ended_at", new Date().toISOString());
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch sessions: ${error.message}`);
  }

  // Transform entities to DTOs (compute isActive)
  const dtoData = (data ?? []).map((session) => ({
    ...toSessionDTO(session),
    isActive: new Date(session.ended_at) > new Date(),
  }));

  const totalItems = count ?? dtoData.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    data: dtoData,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
    },
  };
}
```

**Weryfikacja:**
- Uruchom TypeScript compiler: `npm run build`
- Sprawdź, czy wszystkie typy są poprawne
- Sprawdź, czy wszystkie importy działają

---

### Krok 3: Utworzenie endpointu POST /profiles/{profileId}/sessions

**Plik:** `src/pages/api/profiles/[profileId]/sessions/index.ts`

**Zadanie:**
1. Zaimportować `APIRoute` z "astro"
2. Zaimportować schemat `profileIdParamSchema` z schemas
3. Zaimportować `ProfileService` i `SessionService`
4. Zaimportować błędy: `UnauthorizedError`, `ValidationError`, `ForbiddenError`, `NotFoundError`
5. Zaimportować typy: `APIErrorResponse`, `SessionStartDTO`
6. Ustawić `export const prerender = false;`
7. Zaimplementować handler `POST: APIRoute`

**Struktura handlera POST:**
```typescript
export const POST: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Check authentication
    const supabase = locals.supabase;
    if (!supabase) {
      throw new UnauthorizedError();
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new UnauthorizedError();
    }

    // Step 2: Validate path parameters
    const validationResult = profileIdParamSchema.safeParse(params);
    if (!validationResult.success) {
      const details: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path.join(".");
        details[field] = err.message;
      });
      throw new ValidationError(details);
    }

    const { profileId } = validationResult.data;

    // Step 3: Verify profile ownership
    const profileService = new ProfileService(supabase);
    await profileService.validateOwnership(profileId, user.id);

    // Step 4: Start new session
    const sessionService = new SessionService(supabase);
    const session: SessionStartDTO = await sessionService.startSession(profileId, user.id);

    // Step 5: Return success response
    return new Response(JSON.stringify(session), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 6: Handle errors
    // ... error handling (ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, 500)
  }
};
```

**Error handling (w catch block):**
- 400 ValidationError
- 401 UnauthorizedError
- 403 ForbiddenError
- 404 NotFoundError
- 500 Unexpected errors (z logowaniem)

**Weryfikacja:**
- Uruchom dev server: `npm run dev`
- Test z Postman/curl: `POST /api/profiles/{validProfileId}/sessions` z JWT
- Sprawdź response 201 z SessionStartDTO
- Sprawdź błędy: 401 (no auth), 403 (wrong parent), 404 (invalid profile)

---

### Krok 3a: Utworzenie endpointu POST /sessions/{sessionId}/refresh

**Plik:** `src/pages/api/sessions/[sessionId]/refresh.ts`

**Zadanie:**
1. Utworzyć strukturę katalogów: `src/pages/api/sessions/[sessionId]/`
2. Utworzyć plik `refresh.ts`
3. Zaimportować wymagane zależności
4. Zaimplementować handler `POST: APIRoute`

**Struktura handlera POST:**
```typescript
import type { APIRoute } from "astro";
import { sessionIdParamSchema } from "@/lib/schemas/session.schema";
import { SessionService } from "@/lib/services/session.service";
import { ValidationError, UnauthorizedError, ForbiddenError, NotFoundError } from "@/lib/errors/api-errors";
import type { APIErrorResponse, SessionRefreshDTO } from "@/types";

export const prerender = false;

export const POST: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Check authentication
    const supabase = locals.supabase;
    if (!supabase) {
      throw new UnauthorizedError();
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new UnauthorizedError();
    }

    // Step 2: Validate path parameters
    const validationResult = sessionIdParamSchema.safeParse(params);
    if (!validationResult.success) {
      const details: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path.join(".");
        details[field] = err.message;
      });
      throw new ValidationError(details);
    }

    const { sessionId } = validationResult.data;

    // Step 3: Refresh session (includes ownership verification)
    const sessionService = new SessionService(supabase);
    const result: SessionRefreshDTO = await sessionService.refreshSession(sessionId, user.id);

    // Step 4: Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 5: Handle errors
    // ... error handling (ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, 500)
  }
};
```

**Error handling (w catch block):**
- 400 ValidationError (invalid format lub session expired)
- 401 UnauthorizedError
- 403 ForbiddenError
- 404 NotFoundError
- 500 Unexpected errors (z logowaniem)

**Weryfikacja:**
- Test z Postman: `POST /api/sessions/{validSessionId}/refresh` z JWT
- Sprawdź response 200 z SessionRefreshDTO
- Test ponownego refresh: powinien wydłużyć o kolejne 2 minuty
- Sprawdź błędy: 401, 403 (wrong parent), 404 (invalid session), 400 (expired)

---

### Krok 4: Implementacja GET /profiles/{profileId}/sessions

**Ten sam plik:** `src/pages/api/profiles/[profileId]/sessions/index.ts`

**Zadanie:**
1. Zaimportować `sessionListParamsSchema` z schemas
2. Zaimportować typy: `PaginatedResponse`, `SessionDTO`
3. Dodać handler `GET: APIRoute` do tego samego pliku (po POST)

**Struktura handlera GET:**
```typescript
export const GET: APIRoute = async ({ params, url, locals }) => {
  try {
    // Step 1: Check authentication
    const supabase = locals.supabase;
    if (!supabase) {
      throw new UnauthorizedError();
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new UnauthorizedError();
    }

    // Step 2: Validate path parameters
    const paramsValidation = profileIdParamSchema.safeParse(params);
    if (!paramsValidation.success) {
      const details: Record<string, string> = {};
      paramsValidation.error.errors.forEach((err) => {
        const field = err.path.join(".");
        details[field] = err.message;
      });
      throw new ValidationError(details);
    }

    // Step 3: Validate query parameters
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const queryValidation = sessionListParamsSchema.safeParse(queryParams);
    if (!queryValidation.success) {
      const details: Record<string, string> = {};
      queryValidation.error.errors.forEach((err) => {
        const field = err.path.join(".");
        details[field] = err.message;
      });
      throw new ValidationError(details);
    }

    const { profileId } = paramsValidation.data;

    // Step 4: Verify profile ownership
    const profileService = new ProfileService(supabase);
    await profileService.validateOwnership(profileId, user.id);

    // Step 5: List sessions
    const sessionService = new SessionService(supabase);
    const result: PaginatedResponse<SessionDTO> = await sessionService.listSessions(
      profileId,
      user.id,
      queryValidation.data
    );

    // Step 6: Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 7: Handle errors (same as POST)
  }
};
```

**Weryfikacja:**
- Test z Postman: `GET /api/profiles/{profileId}/sessions`
- Test z filtrem: `GET /api/profiles/{profileId}/sessions?active=true`
- Test paginacji: `GET /api/profiles/{profileId}/sessions?page=2&pageSize=10`
- Sprawdź response 200 z PaginatedResponse<SessionDTO>
- Sprawdź błędy: 400 (invalid query), 401, 403, 404

---

### Krok 5: Utworzenie endpointu PATCH /sessions/{sessionId}/end

**Plik:** `src/pages/api/sessions/[sessionId]/end.ts`

**Zadanie:**
1. Utworzyć strukturę katalogów: `src/pages/api/sessions/[sessionId]/`
2. Utworzyć plik `end.ts`
3. Zaimportować wymagane zależności
4. Zaimplementować handler `PATCH: APIRoute`

**Struktura handlera PATCH:**
```typescript
import type { APIRoute } from "astro";
import { sessionIdParamSchema } from "@/lib/schemas/session.schema";
import { SessionService } from "@/lib/services/session.service";
import { ValidationError, UnauthorizedError, ForbiddenError, NotFoundError } from "@/lib/errors/api-errors";
import type { APIErrorResponse } from "@/types";

export const prerender = false;

export const PATCH: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Check authentication
    const supabase = locals.supabase;
    if (!supabase) {
      throw new UnauthorizedError();
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new UnauthorizedError();
    }

    // Step 2: Validate path parameters
    const validationResult = sessionIdParamSchema.safeParse(params);
    if (!validationResult.success) {
      const details: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path.join(".");
        details[field] = err.message;
      });
      throw new ValidationError(details);
    }

    const { sessionId } = validationResult.data;

    // Step 3: End session (includes ownership verification)
    const sessionService = new SessionService(supabase);
    await sessionService.endSession(sessionId, user.id);

    // Step 4: Return success response
    return new Response(
      JSON.stringify({ message: "Session ended successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Step 5: Handle errors
    // ... error handling (ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, 500)
  }
};
```

**Weryfikacja:**
- Test z Postman: `PATCH /api/sessions/{validSessionId}/end` z JWT
- Sprawdź response 200 z message
- Test double-end: drugi request powinien zwrócić 400 "already ended"
- Sprawdź błędy: 401, 403 (wrong parent), 404 (invalid session)

---

### Krok 6: Testy integracyjne

**Narzędzia:** Postman, curl, lub Thunder Client (VS Code)

**Scenariusze testowe:**

**Test 1: Rozpocznij nową sesję (happy path)**
```bash
POST /api/profiles/{profileId}/sessions
Authorization: Bearer {validJWT}

Expected: 201 Created
Response: { sessionId, startedAt, isActive: true }
```

**Test 2: Sprawdź automatyczne zamknięcie poprzedniej sesji**
```bash
1. POST /api/profiles/{profileId}/sessions → session1 (ends at T+10min)
2. POST /api/profiles/{profileId}/sessions → session2 (ends at T+10min)
3. GET /api/profiles/{profileId}/sessions?active=true

Expected: Tylko session2 jest aktywna, session1 ma ended_at = now
```

**Test 2a: Sprawdź wydłużanie sesji (refresh)**
```bash
1. POST /api/profiles/{profileId}/sessions → session (ends at T+10min)
2. POST /api/sessions/{sessionId}/refresh → (ends at T+12min)
3. POST /api/sessions/{sessionId}/refresh → (ends at T+14min)
4. GET /api/sessions (verify ended_at updated)

Expected: ended_at wydłużone o 2 minuty za każdym razem
```

**Test 3: Zakończ sesję ręcznie**
```bash
PATCH /api/sessions/{sessionId}/end
Authorization: Bearer {validJWT}

Expected: 200 OK
Response: { message: "Session ended successfully" }
```

**Test 4: Lista sesji z filtrowaniem**
```bash
GET /api/profiles/{profileId}/sessions?active=false&page=1&pageSize=10
Authorization: Bearer {validJWT}

Expected: 200 OK
Response: PaginatedResponse with inactive sessions only
```

**Test 5: Błędy autoryzacji**
```bash
# Bez JWT
POST /api/profiles/{profileId}/sessions
Expected: 401 Unauthorized

# Profil innego rodzica
POST /api/profiles/{anotherParentProfileId}/sessions
Authorization: Bearer {validJWT}
Expected: 403 Forbidden
```

**Test 6: Błędy walidacji**
```bash
# Niepoprawny UUID
POST /api/profiles/invalid-uuid/sessions
Expected: 400 Bad Request

# Niepoprawny query param
GET /api/profiles/{profileId}/sessions?active=invalid
Expected: 400 Bad Request
```

**Test 7: Nie można zakończyć już wygasłej sesji**
```bash
1. Zaczekaj aż sesja wygaśnie (ended_at <= now)
2. PATCH /api/sessions/{sessionId}/end → 400 Bad Request
Expected: "Session is already ended"
```

**Test 8: Nie można wydłużyć wygasłej sesji**
```bash
1. Zaczekaj aż sesja wygaśnie (ended_at <= now)
2. POST /api/sessions/{sessionId}/refresh → 400 Bad Request
Expected: "Session has already expired"
```

---

### Krok 7: Optymalizacja bazy danych (opcjonalnie)

**Plik:** `supabase/migrations/[timestamp]_add_sessions_indexes.sql`

**Zadanie:**
1. Utworzyć nową migrację Supabase
2. Dodać indeksy dla optymalizacji wydajności (jeśli jeszcze nie istnieją)

**SQL:**
```sql
-- Index for fast child_id lookups + sorting
CREATE INDEX IF NOT EXISTS idx_sessions_child_started 
ON sessions(child_id, started_at DESC);

-- Index for filtering active sessions (ended_at > now)
CREATE INDEX IF NOT EXISTS idx_sessions_active 
ON sessions(child_id, ended_at) 
WHERE ended_at > now();

-- Analyze table for query planner
ANALYZE sessions;
```

**Zastosowanie:**
```bash
# Lokalnie
npx supabase db push

# Produkcja (po review)
npx supabase db push --linked
```

**Weryfikacja:**
- Sprawdź EXPLAIN ANALYZE dla queries
- Porównaj query execution time przed i po

---

### Krok 8: Dokumentacja i kod review

**Zadanie:**
1. Dodać komentarze JSDoc do SessionService methods
2. Zaktualizować README (jeśli istnieje) z nowymi endpointami
3. Utworzyć przykłady użycia w dokumentacji API
4. Code review z team lead przed merge do main

**Przykładowy JSDoc:**
```typescript
/**
 * Starts a new game session for a child profile.
 * 
 * Business logic:
 * - Automatically closes any previous active sessions for this profile
 * - New session has 10-minute duration (ended_at = started_at + 10 min)
 * - Session can be extended using refreshSession() method
 * 
 * @param profileId - The child profile UUID
 * @param parentId - The authenticated parent's user ID
 * @returns SessionStartDTO with new session data (including endedAt)
 * @throws Error if database operation fails
 */
async startSession(profileId: string, parentId: string): Promise<SessionStartDTO>

/**
 * Extends an active session by 2 minutes.
 * 
 * Business logic:
 * - Only active sessions (ended_at > now) can be extended
 * - Each call adds exactly 2 minutes to ended_at
 * - Can be called multiple times
 * 
 * @param sessionId - The session UUID to extend
 * @param parentId - The authenticated parent's user ID
 * @returns SessionRefreshDTO with updated endedAt
 * @throws ValidationError if session has expired
 * @throws ForbiddenError if session doesn't belong to parent
 */
async refreshSession(sessionId: string, parentId: string): Promise<SessionRefreshDTO>
```

**Checklist przed merge:**
- [ ] Wszystkie testy przechodzą
- [ ] Kod jest sformatowany (prettier/eslint)
- [ ] TypeScript kompiluje się bez błędów
- [ ] Dokumentacja jest aktualna
- [ ] Security review (autoryzacja, RLS)
- [ ] Performance test (query execution time)
- [ ] Error handling test (wszystkie scenariusze)
- [ ] Code review approved

---

### Krok 9: Monitoring i deployment

**Po wdrożeniu:**
1. Monitoruj logi serwera dla błędów 500
2. Sprawdź metryki wydajności (response time)
3. Monitoruj użycie bazy danych (connection pool)
4. Ustaw alerty dla:
   - Error rate > 1% dla endpointów sessions
   - Response time > 200ms (p95)
   - Database connection pool exhaustion

**Narzędzia:**
- Supabase Dashboard → Logs
- Application monitoring (np. Sentry)
- Database monitoring (Supabase → Database → Performance)

---

## 10. Podsumowanie

Implementacja endpointów zarządzania sesjami obejmuje:

1. **4 endpointy REST API:**
   - POST /profiles/{profileId}/sessions - Rozpoczęcie sesji (10 min, zamyka poprzednie aktywne)
   - POST /sessions/{sessionId}/refresh - Wydłużenie sesji o 2 minuty
   - PATCH /sessions/{sessionId}/end - Zakończenie sesji (ustawia `ended_at = now()`)
   - GET /profiles/{profileId}/sessions - Lista sesji z filtrowaniem (status obliczany dynamicznie)

2. **Nowy SessionService** z metodami:
   - startSession() - zamyka poprzednie aktywne sesje, tworzy nową z `ended_at = started_at + 10 min`
   - refreshSession() - wydłuża sesję o 2 minuty (`ended_at = ended_at + 2 min`)
   - endSession() - ustawia `ended_at = now()`
   - listSessions() - oblicza `isActive` dla każdej sesji na podstawie `ended_at > now()`

3. **Walidacja za pomocą Zod schemas:**
   - profileIdParamSchema
   - sessionIdParamSchema
   - sessionListParamsSchema

4. **Bezpieczeństwo:**
   - Autentykacja przez Supabase JWT
   - Autoryzacja przez weryfikację ownership
   - RLS na poziomie bazy danych
   - Proper error handling i logging
   - Status sesji obliczany dynamicznie (nie przechowywany w bazie)

5. **Wydajność:**
   - Indeksy bazy danych dla fast lookups (`idx_sessions_child_started`, `idx_sessions_active`)
   - Paginacja dla list endpointów
   - Optymalizowane queries (LIMIT/OFFSET)
   - Obliczanie `isActive` w aplikacji lub w SELECT

6. **Testowanie:**
   - Testy integracyjne dla wszystkich scenariuszy (w tym refresh)
   - Error handling tests
   - Authorization tests
   - Performance benchmarks

**Szacowany czas implementacji:** 5-7 godzin (1-1.5 dnia roboczego)

**Priorytet:** Wysoki (wymagane dla funkcjonalności gry)

**Zależności:**
- ProfileService (istniejący)
- Typy SessionDTO, SessionStartDTO, SessionRefreshDTO (do utworzenia)
- Middleware autentykacji (istniejący)
- RLS policies (istniejące)

**Kluczowe zmiany względem poprzedniej wersji:**
- Usunięto kolumnę `is_active` z tabeli `sessions`
- Status sesji obliczany na podstawie `ended_at > now()` (nie przechowywany)
- **Nowe:** Automatyczne ustawienie `ended_at = started_at + 10 min` przy tworzeniu
- **Nowe:** Endpoint POST /refresh do wydłużania sesji o 2 minuty
- Aktualizacja poprzednich aktywnych sesji odbywa się w aplikacji (UPDATE ended_at = now())
- Usunięto unique constraint `ux_active_session_per_child`

**Następne kroki po implementacji:**
- Integracja z frontendem (GameContext)
- Automatyczne wywoływanie refresh co np. 8 minut aby przedłużyć sesję
- Testy E2E z frontendem
- Dokumentacja API dla zespołu frontendowego
- Monitoring i optimization w produkcji
- Rozważenie limitu maksymalnego czasu sesji (np. max 30 minut)