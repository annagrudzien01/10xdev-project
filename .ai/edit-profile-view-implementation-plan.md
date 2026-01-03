# Plan implementacji widoku Edycja Profilu

## 1. Przegląd

Widok „Edycja Profilu” (`/profiles/{id}/edit`) umożliwia rodzicowi modyfikację istniejącego profilu dziecka: zmianę imienia oraz daty urodzenia, a także usunięcie profilu (o ile nie ma aktywnej sesji gry). Widok ponownie wykorzystuje istniejący komponent `ProfileForm` działający w trybie edycji i integruje się z backendem Supabase poprzez operacje `GET`, `PATCH` i `DELETE` na zasobie `profiles/{id}`.

## 2. Routing widoku

- Plik strony Astro: `src/pages/profiles/[id]/edit.astro`
- Dynamiczny segment `id` zawiera identyfikator profilu (UUID).
- Ochrona trasy: tylko użytkownik zalogowany; wykorzystuje istniejący middleware (`src/middleware/index.ts`).

## 3. Struktura komponentów

```
EditProfilePage (React/Island)
 ├── ProfileForm (reuse, mode="edit")
 ├── DangerZone
 │   └── DeleteProfileButton
 │        └── ConfirmDialog
 └── ToastViewport (sonner)
```

## 4. Szczegóły komponentów

### EditProfilePage

- **Opis**: Kontener strony. Odpowiada za pobranie danych profilu, renderowanie stanu ładowania/błędu oraz przekazanie danych do `ProfileForm`.
- **Główne elementy**: wrapper `div`, nagłówek `<h1>`, `ProfileForm`, `DangerZone`.
- **Obsługiwane interakcje**:
  - Inicjalny fetch profilu (`useProfileQuery`).
  - Obsługa rezultatów mutacji (PATCH/DELETE) → toast + redirect.
- **Walidacja**: brak (delegowana do `ProfileForm`).
- **Typy**: `ChildProfileDTO` (response), `UpdateChildProfileCommand` (request).
- **Propsy**: none (dane z URL + hooków).

### ProfileForm (tryb edycji)

- **Opis**: Formularz imienia i d.o.b. z przyciskami „Zapisz” i „Anuluj”. W trybie edycji pola są wstępnie wypełnione danymi profilu.
- **Główne elementy**:
  - `Input` (shadcn/ui) – imię dziecka.
  - `DatePicker` – data urodzenia.
  - `Button` – „Zapisz”.
  - `Button` (variant="secondary") – „Anuluj”.
- **Obsługiwane interakcje**:
  - `onSubmit` → `useUpdateProfileMutation` (PATCH).
  - „Anuluj” → `router.back()` lub `navigate('/profiles')`.
- **Walidacja**:
  - Imię: regex `^[A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż\- ]+$` (frontend + zod schema).
  - Data urodzenia: musi być < `new Date()`.
- **Typy**: `UpdateChildProfileCommand` (payload), `z.infer<typeof updateProfileSchema>`.
- **Propsy**:
  - `mode: 'edit'` | 'create'.
  - `defaultValues: { profileName: string; dateOfBirth: string; }`.
  - `onSaveSuccess(): void` – callback po udanym PATCH.

### DangerZone

- **Opis**: Sekcja z destrukcyjnymi akcjami.
- **Główne elementy**: `DeleteProfileButton`.
- **Obsługiwane interakcje**: brak.
- **Walidacja**: brak.
- **Typy / Props**: none.

### DeleteProfileButton

- **Opis**: Przycisk „Usuń profil” + dialog potwierdzający.
- **Główne elementy**:
  - `Button` variant="destructive".
  - `AlertDialog` (shadcn/ui) – potwierdzenie.
- **Obsługiwane interakcje**:
  - Kliknięcie przycisku → otwiera dialog.
  - Potwierdzenie → `useDeleteProfileMutation` (DELETE).
- **Walidacja**: brak.
- **Typy**: brak dodatkowych.
- **Propsy**:
  - `profileId: string`.
  - `profileName: string` (do treści dialogu).
  - `onDeleteSuccess(): void`.

## 5. Typy

| Typ                         | Źródło         | Pola                                                                                                   |
| --------------------------- | -------------- | ------------------------------------------------------------------------------------------------------ |
| `ChildProfileDTO`           | `src/types.ts` | id, parentId, profileName, dateOfBirth, currentLevelId, lastPlayedAt, totalScore, createdAt, updatedAt |
| `UpdateChildProfileCommand` | `src/types.ts` | profileName?, dateOfBirth?                                                                             |
| `DeleteProfileResponse`     | **nowy**       | `message: string`                                                                                      |
| `EditProfileFormValues`     | **nowy**       | profileName: string; dateOfBirth: string;                                                              |

## 6. Zarządzanie stanem

- **TanStack Query**
  - `useProfileQuery(id)` – `GET /api/profiles/{id}`. Cache key: `['profiles', id]`.
  - `useUpdateProfileMutation()` – `PATCH`. Po sukcesie: invalidate `['profiles']` i `['profiles', id]`.
  - `useDeleteProfileMutation()` – `DELETE`. Po sukcesie: invalidate `['profiles']`.
- **Local State (React Hook Form)**
  - Kontrola pól formularza, detekcja `isDirty`, `isSubmitting`.
- **Navigation State**
  - Redirecty przy sukcesie; ostrzeżenie przy próbie wyjścia z brudnego formularza (`useBeforeUnload`).

## 7. Integracja API

| Akcja             | Endpoint                    | Typ zapytania               | Typ odpowiedzi          | Obsługa sukcesu                            | Obsługa błędu                                      |
| ----------------- | --------------------------- | --------------------------- | ----------------------- | ------------------------------------------ | -------------------------------------------------- |
| Pobierz profil    | `GET /api/profiles/{id}`    | –                           | `ChildProfileDTO`       | Wypełnienie domyślnych wartości formularza | 404 → Skeleton + komunikat „Profil nie znaleziony” |
| Aktualizuj profil | `PATCH /api/profiles/{id}`  | `UpdateChildProfileCommand` | `ChildProfileDTO`       | Toast „Profil zaktualizowany”, redirect    | 400/409 → error toast                              |
| Usuń profil       | `DELETE /api/profiles/{id}` | –                           | `DeleteProfileResponse` | Toast „Profil usunięty”, redirect          | 409 active session → error toast                   |

## 8. Interakcje użytkownika

| Interakcja                    | Wynik                                                                 |
| ----------------------------- | --------------------------------------------------------------------- |
| Otworzenie strony             | Pokazanie szkieletu, następnie wypełniony formularz lub komunikat 404 |
| Edycja pól formularza         | Aktywacja przycisku „Zapisz” po zmianach                              |
| Klik „Zapisz”                 | PATCH → disable form, spinner; po sukcesie toast + redirect           |
| Klik „Anuluj”                 | Nawigacja do `/profiles`                                              |
| Klik „Usuń profil”            | Otwarcie dialogu                                                      |
| Potwierdzenie w dialogu       | DELETE; po sukcesie toast + redirect                                  |
| Zamknięcie karty/brudna forma | Alert „Masz niezapisane zmiany”                                       |

## 9. Warunki i walidacja

1. Imię dziecka spełnia regex – inaczej komunikat błędu pod polem.
2. Data urodzenia jest w przeszłości i poprawnym formatem.
3. Maks. długość imienia 50 znaków.
4. Przycisk „Zapisz” disabled gdy:
   - Formularz niezmieniony (`!isDirty`)
   - Trwa mutacja (`isSubmitting`)
5. Przycisk „Usuń profil” disabled gdy trwa inna mutacja.

## 10. Obsługa błędów

- **400 Bad Request**: Wyświetlenie komunikatów walidacyjnych z backendu pod odpowiednimi polami.
- **404 Not Found**: Komponent `NotFound` lub toast + redirect.
- **409 Conflict**:
  - `duplicate name` → toast z treścią błędu.
  - `active session` przy DELETE → toast „Nie można usunąć profilu z aktywną sesją”.
- **Network error**: Toast „Błąd sieci, spróbuj ponownie”.

## 11. Kroki implementacji

1. **Routing**: Utworzyć plik `src/pages/profiles/[id]/edit.astro` z klientowym komponentem `EditProfilePage` jako wyspą React.
2. **Hook useProfileQuery**: Zaimplementować w `src/lib/hooks/useProfileQuery.ts`.
3. **Hook useUpdateProfileMutation**: `src/lib/hooks/useUpdateProfileMutation.ts`.
4. **Hook useDeleteProfileMutation**: `src/lib/hooks/useDeleteProfileMutation.ts`.
5. **Zaktualizować ProfileForm**: dodać propsy `mode`, `defaultValues`, obsługę edycji.
6. **Utworzyć DeleteProfileButton** w `src/components/profiles`.
7. **Komponent EditProfilePage** w `src/components/profiles/EditProfilePage.tsx` – logika pobierania, render, redirect.
8. **Walidacja**: Zdefiniować `updateProfileSchema` (Zod) w `src/lib/schemas/profile.schema.ts`.
9. **Toast & dialog**: Wykorzystać `sonner` oraz `AlertDialog` z shadcn/ui.
10. **Skeleton**: Dodać `SkeletonProfileForm` lub wykorzystać istniejący szkielet.
11. **Testy**: jednostkowe komponentów i e2e (Playwright) dla głównych ścieżek.
12. **Dokumentacja**: Uaktualnić README / .ai docs z instrukcją użycia.
