# Plan implementacji widoku Edycja Profilu

## 1. Przegląd

Widok „Edycja Profilu” (`/profiles/{id}/edit`) umożliwia rodzicowi modyfikację istniejącego profilu dziecka: zmianę imienia oraz daty urodzenia. Widok ponownie wykorzystuje istniejący komponent `ProfileForm` działający w trybie edycji i integruje się z backendem Supabase poprzez operacje `GET`, `PATCH` na zasobie `profiles/{id}`.

## 2. Routing widoku

- Plik strony Astro: `src/pages/profiles/[id]/edit.astro`
- Dynamiczny segment `id` zawiera identyfikator profilu (UUID).
- Ochrona trasy: tylko użytkownik zalogowany; wykorzystuje istniejący middleware (`src/middleware/index.ts`).

## 3. Struktura komponentów

```
EditProfileForm (React/Island)
 ├── ProfileForm (reuse, mode="edit")
```

## 4. Szczegóły komponentów

### EditProfileForm

- **Opis**: Kontener strony. Odpowiada za pobranie danych profilu, renderowanie stanu ładowania/błędu oraz przekazanie danych do `ProfileFormComponent`.
- **Główne elementy**: wrapper `div`, nagłówek `<h1>`, `ProfileFormComponent`
- **Obsługiwane interakcje**:
  - Inicjalny fetch profilu (`useProfileQuery`).
  - Obsługa rezultatów mutacji (PATCH) → inline error display + redirect.
- **Walidacja**: brak (delegowana do `ProfileFormComponent`).
- **Typy**: `ChildProfileDTO` (response), `UpdateChildProfileCommand` (request).
- **Propsy**: `profileId: string` (dane z URL).

### ProfileFormComponent (tryb edycji)

- **Opis**: Formularz imienia i d.o.b. z przyciskami „Zapisz" i „Anuluj". W trybie edycji pola są wstępnie wypełnione danymi profilu.
- **Główne elementy**:
  - `Input` (shadcn/ui) – imię dziecka.
  - `DatePicker` – data urodzenia.
  - `Button` – „Zapisz".
  - `Button` (variant="outline") – „Anuluj".
  - `FormError` – inline error display.
- **Obsługiwane interakcje**:
  - `onSubmit` → `useUpdateProfileMutation` (PATCH).
  - „Anuluj" → `navigate('/profiles')`.
- **Walidacja**:
  - Imię: regex `^[A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż\- ]+$` (frontend + zod schema).
  - Data urodzenia: musi być < `new Date()`.
- **Typy**: `UpdateChildProfileCommand` (payload), `z.infer<typeof updateProfileSchema>`.
- **Propsy**:
  - `mode: 'edit'`
  - `defaultValues: { profileName: string; dateOfBirth: string; }`.
  - `onSaveSuccess(): void` – callback po udanym PATCH.
  - `onCancel(): void` – callback po kliknięciu anuluj.
  - `isSubmitting?: boolean` – stan submisji.
  - `apiError?: string` – błąd z API.
  - `apiErrorField?: "profileName" | "dateOfBirth"` – pole błędu.

## 5. Typy

| Typ                         | Źródło         | Pola                                                                                                   |
| --------------------------- | -------------- | ------------------------------------------------------------------------------------------------------ |
| `ChildProfileDTO`           | `src/types.ts` | id, parentId, profileName, dateOfBirth, currentLevelId, lastPlayedAt, totalScore, createdAt, updatedAt |
| `UpdateChildProfileCommand` | `src/types.ts` | profileName?, dateOfBirth?                                                                             |
| `EditProfileFormValues`     | **nowy**       | profileName: string; dateOfBirth: string;                                                              |

## 6. Zarządzanie stanem

- **TanStack Query**
  - `useProfileQuery(id)` – `GET /api/profiles/{id}`. Cache key: `['profiles', id]`.
  - `useUpdateProfileMutation()` – `PATCH`. Po sukcesie: invalidate `['profiles']` i `['profiles', id]`.

- **Local State (React Hook Form)**
  - Kontrola pól formularza, detekcja `isDirty`, `isSubmitting`.
- **Navigation State**
  - Redirecty przy sukcesie; ostrzeżenie przy próbie wyjścia z brudnego formularza (`useBeforeUnload`).

## 7. Integracja API

| Akcja             | Endpoint                   | Typ zapytania               | Typ odpowiedzi    | Obsługa sukcesu                      | Obsługa błędu                                      |
| ----------------- | -------------------------- | --------------------------- | ----------------- | ------------------------------------ | -------------------------------------------------- |
| Pobierz profil    | `GET /api/profiles/{id}`   | –                           | `ChildProfileDTO` | Wypełnienie defaultValues formularza | 404 → Skeleton + komunikat „Profil nie znaleziony" |
| Aktualizuj profil | `PATCH /api/profiles/{id}` | `UpdateChildProfileCommand` | `ChildProfileDTO` | Inline success (optional), redirect  | 400/409 → inline FormError                         |

## 8. Interakcje użytkownika

| Interakcja                    | Wynik                                                                 |
| ----------------------------- | --------------------------------------------------------------------- |
| Otworzenie strony             | Pokazanie szkieletu, następnie wypełniony formularz lub komunikat 404 |
| Edycja pół formularza         | Aktywacja przycisku „Zapisz" po zmianach                              |
| Klik „Zapisz"                 | PATCH → disable form, spinner; po sukcesie redirect                   |
| Klik „Anuluj"                 | Nawigacja do `/profiles`                                              |
| Zamknięcie karty/brudna forma | Alert „Masz niezapisane zmiany"                                       |

## 9. Warunki i walidacja

1. Imię dziecka spełnia regex – inaczej komunikat błędu pod polem.
2. Data urodzenia jest w przeszłości i poprawnym formatem.
3. Maks. długość imienia 50 znaków.
4. Przycisk „Zapisz” disabled gdy:
   - Formularz niezmieniony (`!isDirty`)
   - Trwa mutacja (`isSubmitting`)

## 10. Obsługa błędów

- **400 Bad Request**: Wyświetlenie komunikatów walidacyjnych z backendu jako inline FormError pod odpowiednimi polami.
- **404 Not Found**: Komponent `NotFound` lub inline error + opcjonalny redirect.
- **409 Conflict**:
  - `duplicate name` → inline FormError pod polem profileName.
- **Network error**: Inline FormError „Błąd sieci, spróbuj ponownie".

## 11. Kroki implementacji

1. **Routing**: Utworzyć plik `src/pages/profiles/[id]/edit.astro` z klientowym komponentem `EditProfileForm` jako wyspą React.
2. **Hook useProfileQuery**: Zaimplementować w `src/lib/hooks/useProfileQuery.ts`.
3. **Hook useUpdateProfileMutation**: `src/lib/hooks/useUpdateProfileMutation.ts`.
4. **Zaktualizować ProfileFormComponent**: dodać propsy `mode`, `defaultValues`, `apiError`, `apiErrorField`, obsługę edycji.
5. **Komponent EditProfileForm** w `src/components/profiles/EditProfileForm.tsx` – logika pobierania, render, redirect, inline errors.
6. **Walidacja**: Zdefiniować `updateProfileSchema` (Zod) w `src/lib/schemas/profile.schema.ts`.
7. **Skeleton**: Dodać `SkeletonProfileForm` lub wykorzystać istniejący szkielet.
8. **Testy**: jednostkowe komponentów i e2e (Playwright) dla głównych ścieżek.
9. **Dokumentacja**: Uaktualnić README / .ai docs z instrukcją użycia.
