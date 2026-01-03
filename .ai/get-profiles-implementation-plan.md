# API Endpoint Implementation Plan: GET /api/profiles

## 1. Przegląd punktu końcowego

Punkt końcowy zwraca listę profili dziecka należących do aktualnie uwierzytelnionego rodzica. Dane są pobierane z tabeli `child_profiles` oraz zwracane w formacie DTO, z obsługą paginacji.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Ścieżka URL:** `/api/profiles`
- **Parametry zapytania (query):**
  - `page` _(number, opcjonalny, domyślnie 1)_ – numer strony (≥ 1)
  - `pageSize` _(number, opcjonalny, domyślnie 20, maks. 100)_ – liczba elementów na stronę
- **Nagłówki:**
  - `Authorization: Bearer <JWT>` – generowany przez Supabase, przekazywany automatycznie w cookie
- **Body:** brak

## 3. Wykorzystywane typy

- `ChildProfileDTO` – struktura pojedynczego profilu (już zdefiniowana w `src/types.ts`)
- `PaginatedResponse<ChildProfileDTO>` – ogólny wrapper paginacji (również zdefiniowany)
- `PaginationParams` – interfejs parametrów paginacji (zdefiniowany)

## 4. Szczegóły odpowiedzi

| Kod | Opis                             | Treść                                |
| --- | -------------------------------- | ------------------------------------ |
| 200 | Pomyślnie zwrócono listę profili | `PaginatedResponse<ChildProfileDTO>` |
| 401 | Brak uwierzytelnienia            | `APIErrorResponse`                   |
| 500 | Błąd serwera                     | `APIErrorResponse`                   |

Przykład (`200 OK`):

```json
{
  "data": [
    {
      "id": "a1b2c3",
      "parentId": "u123",
      "profileName": "Anna",
      "dateOfBirth": "2018-05-24",
      "currentLevelId": 3,
      "lastPlayedAt": "2025-12-28T10:45:12Z",
      "totalScore": 1200,
      "createdAt": "2024-02-10T09:11:43Z",
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

## 5. Przepływ danych

1. Klient wysyła zapytanie GET `/api/profiles?page=1&pageSize=20` wraz z cookie sesyjnym Supabase.
2. Middleware `src/middleware/index.ts` dołącza obiekt `locals.supabase` do kontekstu.
3. Handler GET sprawdza uwierzytelnienie przez `supabase.auth.getUser()`.
4. Walidujemy parametry paginacji przy pomocy Zod (`paginationParamsSchema`).
5. Wywołujemy `ProfileService.listChildProfiles(parentId, { page, pageSize })`.
6. Service wykonuje zapytanie do Supabase:
   - `.from("child_profiles")`
   - `.select("*")` z `range(offset, offset+pageSize-1)`
   - `.eq("parent_id", parentId)`
   - `.order("created_at", { ascending: true })`
   - `.maybeSingle()` dla liczenia rekordów -> dodatkowe query `count("exact", { head: true })`.
7. Wynik mapowany przez `toChildProfileDTO` i pakowany w `PaginatedResponse`.
8. Handler zwraca odpowiedź JSON 200.

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie**: wymagany ważny JWT Supabase; brak tokenu ⇒ `401`.
- **Autoryzacja**: filtr `parent_id = user.id` gwarantuje, że użytkownicy widzą tylko swoje dane.
- **Wstrzyknięcia SQL**: Supabase query builder parametryzuje zapytania; brak ryzyka SQLi.
- **Rate-limiting / DoS**: opcjonalnie dodać middleware limiter (np. edge function) – poza zakresem tego wdrożenia.
- **Eksfiltracja danych**: DTO nie zawiera wrażliwych pól (np. brak adresu e-mail dziecka).

## 7. Obsługa błędów

| Sytuacja                     | Kod | `error`           | `message`                      |
| ---------------------------- | --- | ----------------- | ------------------------------ |
| Brak sesji lub tokenu wygasł | 401 | `unauthenticated` | „Authentication required”      |
| Nieoczekiwany błąd bazy      | 500 | `internal_error`  | „An unexpected error occurred” |

Wszystkie błędy logujemy przez `console.error` (lub przyszły logger) z timestampem i bez danych osobowych.

## 8. Rozważania dotyczące wydajności

- **Indeks** na `child_profiles.parent_id` (prawdopodobnie istnieje jako część FK) zapewnia szybkie wyszukiwanie.
- **Paginacja** zapobiega ładowaniu dużych zbiorów.
- Strumieniowanie JSON niepotrzebne—odczyty niewielkiej skali (< 100 rekordów).
- Możliwość dodania nagłówka `Cache-Control: no-store` (dane prywatne).

## 9. Etapy wdrożenia

1. **Schema Zod**
   - Utwórz `pagination.schema.ts` w `src/lib/schemas/` z eksportem `paginationParamsSchema`.
2. **Rozszerzenie ProfileService**
   - Dodaj metodę `listChildProfiles(parentId: string, params: PaginationParams): Promise<PaginatedResponse<ChildProfileDTO>>`.
3. **Handler GET**
   - W pliku `src/pages/api/profiles/index.ts` dodaj eksport `GET` obok istniejącego `POST`.
4. **Aktualizacja routes**
   - Ustaw `prerender = false` (już obecne).
5. **Obsługa błędów**
   - Ponowne wykorzystanie typów `APIErrorResponse`.
6. **Testy jednostkowe**
   - Mock Supabase, przetestuj ProfileService.listChildProfiles (paginacja, brak profili).
7. **Testy integracyjne**
   - E2E: wywołaj GET `/api/profiles` z tokenem i bez.
8. **Code review & lint**
9. **Deploy na środowisko testowe**
10. **Monitoring** – dodać logi do APM (poza zakresem kodowym).
