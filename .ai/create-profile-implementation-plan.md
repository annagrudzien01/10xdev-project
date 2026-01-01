# API Endpoint Implementation Plan: POST /profiles

## 1. Przegląd punktu końcowego

**Endpoint**: `POST /profiles`  
**Cel**: Utworzenie nowego profilu dziecka dla zalogowanego rodzica.

Ten endpoint pozwala uwierzytelnionemu użytkownikowi (rodzicowi) na stworzenie profilu dziecka w systemie Rytmik. Każdy rodzic może mieć maksymalnie 10 profili dzieci, a nazwy profili muszą być unikalne w obrębie rodzica. Nowo utworzony profil rozpoczyna od poziomu 1 z wyzerowanym wynikiem.

**Kluczowe funkcjonalności**:

- Walidacja danych wejściowych (regex dla nazwy, data urodzenia w przeszłości)
- Wymuszenie limitu 10 profili na rodzica
- Zapewnienie unikalności nazwy profilu w obrębie rodzica
- Automatyczne przypisanie początkowego poziomu (level 1)
- Wykorzystanie Row Level Security (RLS) dla bezpieczeństwa danych

---

## 2. Szczegóły żądania

### Metoda HTTP

`POST`

### Struktura URL

```
/profiles
```

### Nagłówki

- **Content-Type**: `application/json`
- **Authorization**: `Bearer <JWT_TOKEN>` (wymagany)

### Parametry

#### Parametry URL

Brak

#### Parametry Query

Brak

#### Request Body (wymagany)

Struktura JSON zgodna z `CreateChildProfileCommand`:

```json
{
  "profileName": "Anna",
  "dateOfBirth": "2018-05-24"
}
```

**Pola wymagane**:

- `profileName` (string):
  - Długość: 1-32 znaki
  - Regex: `^[A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż\- ]+$`
  - Dozwolone: litery (łacińskie + polskie), spacje, myślniki
- `dateOfBirth` (string):
  - Format: ISO 8601 date (`YYYY-MM-DD`)
  - Musi być datą z przeszłości
  - Rozsądny zakres: dziecko w wieku 2-18 lat

---

## 3. Wykorzystywane typy

### Command Model (Input)

```typescript
CreateChildProfileCommand {
  profileName: string;
  dateOfBirth: string;
}
```

### Response DTO (Output)

```typescript
ChildProfileDTO {
  id: string;                    // UUID
  parentId: string;              // UUID from auth.users
  profileName: string;
  dateOfBirth: string;           // ISO date
  currentLevelId: number;        // 1-20, starts at 1
  lastPlayedAt: string | null;   // ISO timestamp
  totalScore: number;            // starts at 0
  createdAt: string;             // ISO timestamp
  updatedAt: string | null;      // ISO timestamp
}
```

### Error Response

```typescript
APIErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}
```

### Helper Functions

- `toChildProfileDTO(entity: ChildProfileEntity): ChildProfileDTO` - transformacja z snake_case do camelCase

---

## 4. Szczegóły odpowiedzi

### Sukces: 201 Created

**Body**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "parentId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "profileName": "Anna",
  "dateOfBirth": "2018-05-24",
  "currentLevelId": 1,
  "lastPlayedAt": null,
  "totalScore": 0,
  "createdAt": "2025-12-31T10:00:00.000Z",
  "updatedAt": null
}
```

### Błędy

#### 400 Bad Request

Nieprawidłowe dane wejściowe lub błędy walidacji.

```json
{
  "error": "invalid_request",
  "message": "Validation failed",
  "details": {
    "profileName": "Profile name must match the pattern ^[A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż\\- ]+$",
    "dateOfBirth": "Date of birth must be in the past"
  }
}
```

Przykładowe przypadki:

- Brak wymaganych pól
- `profileName` nie pasuje do regex
- `dateOfBirth` jest w przyszłości lub nieprawidłowy format
- `dateOfBirth` wskazuje na wiek < 2 lub > 18 lat

#### 401 Unauthorized

Brak lub nieprawidłowy token JWT.

```json
{
  "error": "unauthenticated",
  "message": "Authentication required"
}
```

#### 409 Conflict

Naruszenie reguł biznesowych lub ograniczeń unikalności.

```json
{
  "error": "conflict",
  "message": "Parent already has 10 child profiles (maximum allowed)"
}
```

lub

```json
{
  "error": "conflict",
  "message": "A profile with this name already exists for this parent"
}
```

Przypadki:

- Rodzic ma już 10 profili (limit wyczerpany)
- Nazwa profilu już istnieje dla tego rodzica (UNIQUE constraint)

#### 500 Internal Server Error

Nieoczekiwany błąd serwera.

```json
{
  "error": "internal_error",
  "message": "An unexpected error occurred"
}
```

---

## 5. Przepływ danych

### Diagram przepływu

```
1. Client → POST /profiles + JWT
2. Astro Middleware → weryfikacja JWT, dodanie supabase do context.locals
3. API Route Handler → ekstrakcja parentId z auth.uid()
4. Zod Schema → walidacja request body
5. ProfileService.createChildProfile(parentId, command)
   ├─ 5a. Sprawdzenie liczby profili (COUNT query)
   ├─ 5b. Jeśli >= 10 → rzuć ConflictError
   ├─ 5c. INSERT do child_profiles (RLS automatycznie wymusza parent_id)
   ├─ 5d. Supabase zwraca ChildProfileEntity lub błąd (duplicate name)
   └─ 5e. Transformacja do ChildProfileDTO
6. API Route → return Response 201 + ChildProfileDTO
7. Client ← JSON response
```

### Interakcje z bazą danych

#### Zapytanie 1: Sprawdzenie limitu profili

```sql
SELECT COUNT(*) FROM child_profiles WHERE parent_id = $1;
```

**Parametry**: `parentId` (UUID z `auth.uid()`)  
**Oczekiwany wynik**: liczba od 0 do 10

#### Zapytanie 2: Wstawienie nowego profilu

```sql
INSERT INTO child_profiles (
  parent_id,
  profile_name,
  date_of_birth,
  current_level_id,
  total_score
) VALUES ($1, $2, $3, 1, 0)
RETURNING *;
```

**Parametry**:

- `$1`: `parentId` (UUID)
- `$2`: `profileName` (string)
- `$3`: `dateOfBirth` (date)

**Domyślne wartości**:

- `id`: UUID (auto-generated)
- `current_level_id`: 1
- `total_score`: 0
- `last_played_at`: NULL
- `created_at`: now() (auto)
- `updated_at`: NULL

**Zwracana wartość**: `ChildProfileEntity` (pełny wiersz)

### Row Level Security (RLS)

Polityka `child_profiles_owner` zapewnia, że:

```sql
CREATE POLICY child_profiles_owner ON child_profiles
USING (parent_id = auth.uid());
```

- INSERT automatycznie weryfikuje, że `parent_id = auth.uid()`
- Użytkownik nie może utworzyć profilu dla innego rodzica

---

## 6. Względy bezpieczeństwa

### Uwierzytelnianie

- **JWT Bearer Token** wymagany w nagłówku `Authorization`
- Token weryfikowany przez Supabase Auth w middleware Astro
- Nieprawidłowy lub wygasły token → 401 Unauthorized

### Autoryzacja

- `parent_id` ekstraowany z `auth.uid()` (nie z request body)
- RLS policy `child_profiles_owner` wymusza `parent_id = auth.uid()`
- Użytkownik nie może tworzyć profili dla innych rodziców

### Walidacja danych wejściowych

- **Zod schema** waliduje wszystkie dane przed przekazaniem do bazy
- **Regex** dla `profileName` zapobiega injection attacks i XSS
- **Date validation** zapewnia rozsądny zakres dat
- **Length limits** chronią przed DoS przez duże payloady

### Ochrona przed atakami

#### SQL Injection

- **Ochrona**: Prepared statements w Supabase Client
- Wszystkie parametry przekazywane jako bindingi, nie konkatenacja stringów

#### XSS (Cross-Site Scripting)

- **Ochrona**: Walidacja regex dla `profileName`
- Frontend powinien dodatkowo escapować dane przy renderowaniu

#### CSRF (Cross-Site Request Forgery)

- **Ochrona**: JWT token w nagłówku (nie w cookies)
- SameSite cookies dla sesji Supabase

#### Rate Limiting

- **Limit**: 100 żądań/minutę per token (zgodnie z api-plan.md)
- Implementacja w middleware lub API Gateway
- Zwracany kod: 429 Too Many Requests

### Nagłówki bezpieczeństwa

Middleware Astro powinien ustawiać:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

### Logowanie i audyt

- Logować wszystkie nieudane próby utworzenia profilu
- Logować przekroczenie limitu 10 profili (potencjalne nadużycie)
- NIE logować pełnych danych osobowych (RODO/GDPR)
- Logować tylko: `parentId`, timestamp, błąd

---

## 7. Obsługa błędów

### Hierarchia błędów

```typescript
// Custom error classes
class ValidationError extends Error {
  constructor(public details: Record<string, string>) {
    super("Validation failed");
  }
}

class ConflictError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class UnauthorizedError extends Error {
  constructor(message: string = "Authentication required") {
    super(message);
  }
}
```

### Mapowanie błędów na kody HTTP

| Błąd                               | Kod HTTP | Error Code        | Message                                                   |
| ---------------------------------- | -------- | ----------------- | --------------------------------------------------------- |
| Brak JWT / nieprawidłowy JWT       | 401      | `unauthenticated` | "Authentication required"                                 |
| Zod validation error               | 400      | `invalid_request` | "Validation failed" + details                             |
| Profile count >= 10                | 409      | `conflict`        | "Parent already has 10 child profiles (maximum allowed)"  |
| Duplicate profile name             | 409      | `conflict`        | "A profile with this name already exists for this parent" |
| Database error (unique constraint) | 409      | `conflict`        | Specyficzny message z DB                                  |
| Database connection error          | 500      | `internal_error`  | "An unexpected error occurred"                            |
| Unexpected error                   | 500      | `internal_error`  | "An unexpected error occurred"                            |

### Szczegółowe scenariusze błędów

#### Scenariusz 1: Nieprawidłowa nazwa profilu

**Input**:

```json
{
  "profileName": "Anna123",
  "dateOfBirth": "2018-05-24"
}
```

**Response**: 400 Bad Request

```json
{
  "error": "invalid_request",
  "message": "Validation failed",
  "details": {
    "profileName": "Profile name must contain only letters, spaces, and hyphens"
  }
}
```

#### Scenariusz 2: Data urodzenia w przyszłości

**Input**:

```json
{
  "profileName": "Anna",
  "dateOfBirth": "2030-01-01"
}
```

**Response**: 400 Bad Request

```json
{
  "error": "invalid_request",
  "message": "Validation failed",
  "details": {
    "dateOfBirth": "Date of birth must be in the past"
  }
}
```

#### Scenariusz 3: Przekroczenie limitu 10 profili

**Response**: 409 Conflict

```json
{
  "error": "conflict",
  "message": "Parent already has 10 child profiles (maximum allowed)"
}
```

#### Scenariusz 4: Duplikat nazwy profilu

**Input**: Nazwa "Anna" już istnieje dla tego rodzica

**Response**: 409 Conflict

```json
{
  "error": "conflict",
  "message": "A profile with this name already exists for this parent"
}
```

#### Scenariusz 5: Błąd bazy danych

**Response**: 500 Internal Server Error

```json
{
  "error": "internal_error",
  "message": "An unexpected error occurred"
}
```

**Logowanie**: Pełne szczegóły błędu logowane po stronie serwera

---

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

#### 1. Zapytanie COUNT dla weryfikacji limitu

**Problem**: Dodatkowe zapytanie przed każdym INSERT  
**Optymalizacja**:

- Indeks `idx_child_parent` na `parent_id` (już istnieje w db-plan.md)
- Alternatywnie: użycie database function/trigger do sprawdzania limitu
- Cache liczby profili w Redis (jeśli wielu użytkowników tworzy profile równocześnie)

**Oczekiwana wydajność**: < 5ms na zapytanie COUNT z indeksem

#### 2. Unique constraint check

**Problem**: PostgreSQL musi sprawdzić unikalność `(parent_id, profile_name)`  
**Optymalizacja**:

- Composite unique constraint w bazie (już istnieje: `UNIQUE(parent_id, profile_name)`)
- B-tree index automatycznie tworzony dla unique constraint

**Oczekiwana wydajność**: < 10ms na INSERT z unique check

#### 3. RLS policy evaluation

**Problem**: RLS policy sprawdzana przy każdym INSERT  
**Optymalizacja**:

- RLS policy jest prosta (`parent_id = auth.uid()`)
- Minimalny overhead, Postgres cache'uje plan wykonania

**Oczekiwana wydajność**: < 2ms overhead na RLS check

### Strategie optymalizacji

#### Database-level

1. **Indeksy** (już zdefiniowane):

   ```sql
   CREATE INDEX idx_child_parent ON child_profiles(parent_id);
   ```

2. **Partial index dla limitu 10** (opcjonalnie, w db-plan.md):

   ```sql
   CREATE UNIQUE INDEX one_parent_ten_profiles
   ON child_profiles(parent_id, id)
   WHERE (SELECT count(*) FROM child_profiles c WHERE c.parent_id = parent_id) >= 10;
   ```

   **Uwaga**: Ten indeks może być problematyczny (subquery w WHERE). Lepiej użyć funkcji PL/pgSQL lub check w aplikacji.

3. **Database function** (alternatywa):

   ```sql
   CREATE OR REPLACE FUNCTION create_child_profile(
     p_parent_id UUID,
     p_profile_name VARCHAR(32),
     p_date_of_birth DATE
   ) RETURNS child_profiles AS $$
   DECLARE
     profile_count INT;
     new_profile child_profiles;
   BEGIN
     SELECT COUNT(*) INTO profile_count
     FROM child_profiles WHERE parent_id = p_parent_id;

     IF profile_count >= 10 THEN
       RAISE EXCEPTION 'profile_limit_exceeded';
     END IF;

     INSERT INTO child_profiles (parent_id, profile_name, date_of_birth, current_level_id, total_score)
     VALUES (p_parent_id, p_profile_name, p_date_of_birth, 1, 0)
     RETURNING * INTO new_profile;

     RETURN new_profile;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

   **Korzyści**: Atomiczna operacja, jeden roundtrip do DB

#### Application-level

1. **Connection pooling**: Supabase Client używa poolingu
2. **Request timeout**: 5s timeout dla długotrwałych operacji
3. **Circuit breaker**: Jeśli DB nie odpowiada, zwróć 503 Service Unavailable

#### Monitoring

1. **Metryki do śledzenia**:
   - Średni czas odpowiedzi endpointa (target: < 200ms)
   - Liczba 409 Conflict (profil limit) per użytkownika
   - Liczba 500 Internal Server Error (monitorowanie DB health)
2. **Alerty**:
   - Czas odpowiedzi > 500ms dla 95 percentyla
   - Error rate > 5% w ciągu 5 minut

### Szacowana wydajność

- **P50**: < 100ms (bez obciążenia)
- **P95**: < 200ms (średnie obciążenie)
- **P99**: < 500ms (wysokie obciążenie)
- **Throughput**: ~100 żądań/s per instancja (ograniczenie rate limit: 100/min per user)

---

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie schematu walidacji (Zod)

**Plik**: `src/lib/schemas/profile.schema.ts`

```typescript
import { z } from "zod";

export const createChildProfileSchema = z.object({
  profileName: z
    .string()
    .min(1, "Profile name is required")
    .max(32, "Profile name must not exceed 32 characters")
    .regex(/^[A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż\- ]+$/, "Profile name must contain only letters, spaces, and hyphens"),
  dateOfBirth: z
    .string()
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, "Invalid date format")
    .refine((val) => {
      const date = new Date(val);
      const today = new Date();
      return date < today;
    }, "Date of birth must be in the past")
    .refine((val) => {
      const date = new Date(val);
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      return age >= 2 && age <= 18;
    }, "Child must be between 2 and 18 years old"),
});

export type CreateChildProfileInput = z.infer<typeof createChildProfileSchema>;
```

**Test cases**:

- Valid input: `{ profileName: "Anna", dateOfBirth: "2018-05-24" }`
- Invalid name: `{ profileName: "Anna123", ... }` → error
- Future date: `{ ..., dateOfBirth: "2030-01-01" }` → error
- Age < 2: `{ ..., dateOfBirth: "2024-01-01" }` → error

---

### Krok 2: Implementacja custom error classes

**Plik**: `src/lib/errors/api-errors.ts`

```typescript
export class ValidationError extends Error {
  constructor(public details: Record<string, string>) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
```

---

### Krok 3: Utworzenie Profile Service

**Plik**: `src/lib/services/profile.service.ts`

```typescript
import type { SupabaseClient } from "../db/supabase.client";
import type { CreateChildProfileCommand, ChildProfileDTO } from "../../types";
import { toChildProfileDTO } from "../../types";
import { ConflictError } from "../errors/api-errors";

export class ProfileService {
  constructor(private supabase: SupabaseClient) {}

  async createChildProfile(parentId: string, command: CreateChildProfileCommand): Promise<ChildProfileDTO> {
    // Step 1: Check profile count
    const { count, error: countError } = await this.supabase
      .from("child_profiles")
      .select("*", { count: "exact", head: true })
      .eq("parent_id", parentId);

    if (countError) {
      throw new Error(`Failed to check profile count: ${countError.message}`);
    }

    if (count !== null && count >= 10) {
      throw new ConflictError("Parent already has 10 child profiles (maximum allowed)");
    }

    // Step 2: Insert new profile
    const { data, error } = await this.supabase
      .from("child_profiles")
      .insert({
        parent_id: parentId,
        profile_name: command.profileName,
        date_of_birth: command.dateOfBirth,
        current_level_id: 1,
        total_score: 0,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (duplicate name)
      if (error.code === "23505") {
        throw new ConflictError("A profile with this name already exists for this parent");
      }
      throw new Error(`Failed to create profile: ${error.message}`);
    }

    return toChildProfileDTO(data);
  }
}
```

**Testy jednostkowe**:

- Mock Supabase Client
- Test: sukces utworzenia profilu
- Test: rzucenie ConflictError przy count >= 10
- Test: rzucenie ConflictError przy duplicate name (error.code === '23505')
- Test: propagacja innych błędów DB

---

### Krok 4: Implementacja API Route Handler

**Plik**: `src/pages/api/profiles/index.ts`

```typescript
import type { APIRoute } from "astro";
import { createChildProfileSchema } from "../../../lib/schemas/profile.schema";
import { ProfileService } from "../../../lib/services/profile.service";
import { ValidationError, ConflictError, UnauthorizedError } from "../../../lib/errors/api-errors";
import type { APIErrorResponse } from "../../../types";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Check authentication
    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: "unauthenticated",
          message: "Authentication required",
        } as APIErrorResponse),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 2: Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: "unauthenticated",
          message: "Authentication required",
        } as APIErrorResponse),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 3: Parse and validate request body
    const body = await request.json();
    const validationResult = createChildProfileSchema.safeParse(body);

    if (!validationResult.success) {
      const details: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path.join(".");
        details[field] = err.message;
      });

      return new Response(
        JSON.stringify({
          error: "invalid_request",
          message: "Validation failed",
          details,
        } as APIErrorResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 4: Create profile via service
    const profileService = new ProfileService(supabase);
    const profile = await profileService.createChildProfile(user.id, validationResult.data);

    // Step 5: Return success response
    return new Response(JSON.stringify(profile), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 6: Handle errors
    if (error instanceof ConflictError) {
      return new Response(
        JSON.stringify({
          error: "conflict",
          message: error.message,
        } as APIErrorResponse),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    if (error instanceof UnauthorizedError) {
      return new Response(
        JSON.stringify({
          error: "unauthenticated",
          message: error.message,
        } as APIErrorResponse),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log unexpected errors
    console.error("Unexpected error in POST /profiles:", error);

    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: "An unexpected error occurred",
      } as APIErrorResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

---

### Krok 5: Aktualizacja middleware (jeśli potrzebne)

**Plik**: `src/middleware/index.ts`

Upewnij się, że middleware:

1. Inicjalizuje Supabase Client z JWT z nagłówka Authorization
2. Dodaje `supabase` do `context.locals`
3. Obsługuje przypadki braku tokenu (pozwala na 401 w route handlerze)

```typescript
import type { MiddlewareHandler } from "astro";
import { createSupabaseClient } from "../db/supabase.client";

export const onRequest: MiddlewareHandler = async ({ request, locals }, next) => {
  // Extract JWT from Authorization header
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  // Create Supabase client with token (if present)
  locals.supabase = createSupabaseClient(token);

  return next();
};
```

**Uwaga**: Middleware NIE powinien blokować żądań bez tokenu - pozwól route handlerowi zwrócić 401.

---

### Krok 6: Aktualizacja typu `locals` w env.d.ts

**Plik**: `src/env.d.ts`

```typescript
/// <reference types="astro/client" />

import type { SupabaseClient } from "./db/supabase.client";

declare namespace App {
  interface Locals {
    supabase?: SupabaseClient;
  }
}
```

---

### Krok 7: Testy integracyjne

**Plik**: `tests/api/profiles.test.ts` (przykład)

**Test cases**:

1. **Sukces**: Utworzenie profilu z prawidłowymi danymi → 201
2. **Walidacja**: Nieprawidłowa nazwa profilu → 400
3. **Walidacja**: Data urodzenia w przyszłości → 400
4. **Autoryzacja**: Brak tokenu JWT → 401
5. **Autoryzacja**: Nieprawidłowy token JWT → 401
6. **Conflict**: 11. profil dla rodzica → 409
7. **Conflict**: Duplikat nazwy profilu → 409

**Setup**:

- Mock Supabase auth i database
- Test database z seed data (rodzic z 0, 9, 10 profilami)
- Cleanup po każdym teście

---

### Krok 8: Dokumentacja API (opcjonalnie)

**Plik**: `docs/api/POST-profiles.md` lub OpenAPI spec

- Pełna specyfikacja endpointa
- Przykłady żądań i odpowiedzi
- Kody błędów i ich znaczenie
- Rate limiting info

---

### Krok 9: Monitoring i logowanie

**Implementacja**:

1. Dodaj metryki:
   - `api.profiles.create.success` (201)
   - `api.profiles.create.validation_error` (400)
   - `api.profiles.create.conflict` (409)
   - `api.profiles.create.duration_ms`

2. Logowanie błędów:

   ```typescript
   console.error("Profile creation failed", {
     parentId: user.id,
     error: error.message,
     timestamp: new Date().toISOString(),
   });
   ```

3. Nie loguj danych osobowych (`profileName`, `dateOfBirth`)

---

### Krok 10: Security headers w middleware

**Plik**: `src/middleware/index.ts`

Dodaj security headers do wszystkich odpowiedzi:

```typescript
export const onRequest: MiddlewareHandler = async (context, next) => {
  // ... existing code ...

  const response = await next();

  // Add security headers
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
};
```

---

## 10. Checklist wdrożenia

- [ ] Utworzenie schematu walidacji Zod (`profile.schema.ts`)
- [ ] Implementacja custom error classes (`api-errors.ts`)
- [ ] Utworzenie Profile Service (`profile.service.ts`)
- [ ] Implementacja API route handler (`src/pages/api/profiles/index.ts`)
- [ ] Aktualizacja middleware dla Supabase Client
- [ ] Aktualizacja typu `locals` w `env.d.ts`
- [ ] Napisanie testów jednostkowych dla service
- [ ] Napisanie testów integracyjnych dla endpointa
- [ ] Dodanie security headers w middleware
- [ ] Konfiguracja monitoringu i logowania
- [ ] Weryfikacja RLS policies w Supabase
- [ ] Test manualny z Postman/Insomnia
- [ ] Dokumentacja API (jeśli wymagana)
- [ ] Code review

---

## 11. Dodatkowe uwagi

### Rate Limiting

Rozważ implementację rate limitingu na poziomie middleware:

- 100 żądań/minutę per użytkownika (zgodnie z api-plan.md)
- Użyj Redis lub in-memory cache (node-cache) do śledzenia limitów
- Zwracaj `429 Too Many Requests` z nagłówkiem `Retry-After`

### Metryki biznesowe

Śledź:

- Średnią liczbę profili na rodzica
- % rodziców z max 10 profilami (potencjalny problem?)
- Najpopularniejsze dni tygodnia dla tworzenia profili
