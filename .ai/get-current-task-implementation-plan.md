# API Endpoint Implementation Plan: GET /profiles/{profileId}/tasks/current

## 1. Przegląd punktu końcowego

Punkt końcowy zwraca aktualnie aktywną zagadkę ("puzzle") dla profilu dziecka. Jeżeli dziecko rozpoczęło zadanie i nie ukończyło go jeszcze, frontend może wznowić stan gry po odświeżeniu strony bez generowania nowego zadania.

Korzyści:

- Persistencja gry między sesjami/przeładowaniami.
- Brak duplikacji zadań.
- Umożliwia wznowienie gry na innym urządzeniu.

## 2. Szczegóły żądania

- **HTTP Method:** `GET`
- **URL Pattern:** `/api/profiles/{profileId}/tasks/current`
- **Path Params:**
  - `profileId` (UUID, required) – identyfikator profilu dziecka, którego dotyczy zapytanie.
- **Query Params:** brak
- **Headers:**
  - `Authorization: Bearer <JWT>` – Supabase token rodzica (wymagane)
  - `Content-Type: application/json` (nie wymagany dla GET, ale middleware globalne ustawia)
- **Request Body:** brak

## 3. Wykorzystywane typy

```typescript
// DTO zwracany przez endpoint
export interface CurrentPuzzleDTO {
  sequenceId: string; // UUID zagadki (sequence.id)
  levelId: number; // Bieżący poziom trudności
  sequenceBeginning: string; // Np. "C4-E4-G4" (nuty z oktawami, rozdzielone myślnikiem)
  expectedSlots: number; // Ile nut użytkownik musi uzupełnić
  attemptsUsed: number; // Liczba wykorzystanych prób (0-3)
}
```

**Uwaga:** Od wersji z migracją `20260111000000_add_session_id_to_task_results.sql`, tabela `task_results` zawiera kolumnę `session_id`, która łączy zadanie z sesją gry.

## 4. Szczegóły odpowiedzi

| Status | Opis                         | Body                                                      |
| ------ | ---------------------------- | --------------------------------------------------------- |
| 200 OK | Pomyślnie znaleziono zagadkę | `CurrentPuzzleDTO`                                        |
| 404    | Brak bieżącej zagadki        | `{ "error": "not_found", "message": "No active puzzle" }` |
| 401    | Brak uwierzytelnienia        | `{ "error": "unauthenticated" }`                          |
| 403    | Profil nie należy do rodzica | `{ "error": "forbidden" }`                                |
| 429    | Rate-limit                   | `{ "error": "rate_limited" }`                             |
| 500    | Błąd serwera                 | `{ "error": "internal_error" }`                           |

## 5. Przepływ danych

1. Middleware `auth` → walidacja JWT, osadzenie `context.locals.user`.
2. Handler odczytuje `profileId` z paramów.
3. Service **ProfilesService.validateOwnership(profileId, parentId)** → 403 jeśli cudzy.
4. Service **TasksService.getCurrentTask(profileId)**:
   - Zapytanie SQL:
     ```sql
     SELECT 
       tr.sequence_id, 
       tr.level_id, 
       tr.attempts_used,
       tr.session_id,
       seq.sequence_beginning, 
       seq.sequence_end
     FROM task_results tr
     JOIN sequence seq ON seq.id = tr.sequence_id
     WHERE tr.child_id = $1 AND tr.completed_at IS NULL
     ORDER BY tr.created_at DESC
     LIMIT 1;
     ```
   - **Uwaga:** `session_id` jest pobierane z `task_results` i powinno być zawsze ustawione dla nowych zadań (od migracji `20260111000000`)
   - Jeżeli brak rekordu → 404.
5. Mapowanie kolumn na `CurrentPuzzleDTO`.
6. Zwrócenie `200 OK`.

## 6. Względy bezpieczeństwa

- **Authentication:** Supabase JWT (middleware)
- **Authorization:** weryfikacja właściciela profilu (SQL `child_profiles.parent_id = auth.uid()`).
- **RLS:** Tabela `task_results` ma RLS z tym samym warunkiem.
- **Rate limiting:** globalny limiter 100req/min.
- **Input validation:**
  - `profileId` musi być UUID.
  - Brak body → brak dodatkowej walidacji.

## 7. Obsługa błędów

| Scenariusz                   | Kod | Message           |
| ---------------------------- | --- | ----------------- |
| Niepoprawny UUID             | 400 | `invalid_request` |
| Brak JWT                     | 401 | `unauthenticated` |
| Profil nie należy do rodzica | 403 | `forbidden`       |
| Brak aktywnej zagadki        | 404 | `not_found`       |
| Błąd bazy lub nieoczekiwany  | 500 | `internal_error`  |

Logowanie: błędy 5xx logowane w `logger.error()` z kontekstem `userId`, `profileId`.

## 8. Rozważania dotyczące wydajności

- Indeks `idx_task_results_incomplete` na `task_results(child_id, created_at DESC) WHERE completed_at IS NULL` minimalizuje koszt zapytania.
- Indeks `idx_task_results_session` na `task_results(session_id, completed_at)` wspiera zapytania sesyjne.
- Limit 1 rekord.
- Odpowiedź ma <1kB.

## 9. Etapy wdrożenia

1. **SQL**: upewnić się, że migracje zostały uruchomione:
   - `20260106000000_alter_task_results_completed_at.sql` (nullable completed_at + indeksy)
   - `20260111000000_add_session_id_to_task_results.sql` (dodanie session_id)
2. **Service**: dodać metodę `getCurrentTask(profileId)` w `task.service.ts`.
3. **API Handler**: `src/pages/api/profiles/[profileId]/tasks/current.ts`.
4. **Zod**: schema paramów `{ profileId: z.string().uuid() }`.
5. **Testy jednostkowe**:
   - ownership OK → 200
   - brak puzzle → 404
   - cudzy profil → 403
   - sprawdzenie czy `attemptsUsed` jest zwracane
6. **E2E**: Cypress – odświeżenie strony gry → wznawia zagadkę.
7. **Docs**: zaktualizować `api-plan.md` (już zrobione) + Swagger.
8. **Monitoring**: dodać metricę `tasks_current_hit` (Prometheus).
9. **Deploy** + `npm run lint && npm run test`.
