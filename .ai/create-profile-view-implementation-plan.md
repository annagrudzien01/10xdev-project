# Plan implementacji widoku Tworzenie Profilu

## 1. Przegląd

Widok „Tworzenie Profilu” (`/profiles/new`) umożliwia rodzicowi dodanie nowego profilu dziecka. Formularz zbiera imię oraz datę urodzenia dziecka, waliduje dane po stronie klienta (Zod) oraz serwera (Supabase RLS + endpoint REST). Po pomyślnym utworzeniu profilu widok wyświetla toast sukcesu i przekierowuje użytkownika na listę profili (`/profiles`).

## 2. Routing widoku

| Ścieżka         | Plik Astro                     | Opis                                                                                      |
| --------------- | ------------------------------ | ----------------------------------------------------------------------------------------- |
| `/profiles/new` | `src/pages/profiles/new.astro` | Strona tworzenia profilu, importuje layout główny i osadza komponent React `ProfileForm`. |

## 3. Struktura komponentów

```
└─ new.astro (strona)
   └─ ProfileForm (React, główny formularz)
      ├─ FormProvider (react-hook-form + Zod)
      ├─ InputText (UI/text input z shadcn)
      ├─ DatePicker (UI/datepicker z shadcn/react-day-picker)
      ├─ Button (UI – Zapisz)
      ├─ ButtonLink (UI – Anuluj)
      └─ FormError (komponent helper aria-live)
```

## 4. Szczegóły komponentów

### ProfileFormComponent (mode="create")

- **Opis**: Zawiera cały formularz tworzenia profilu, zarządza stanem, walidacją i wywołaniem mutation.
- **Główne elementy**:
  - `InputText` (label „Imię dziecka", autofocus)
  - `DatePicker` (label „Data urodzenia", max = dziś, min = 18 lat wstecz)
  - `Button` type="submit" (tekst „Zapisz", spinner podczas mutation)
  - `Button` variant="outline" (tekst „Anuluj", dialog confirm gdy dirty)
  - `FormError` (inline error display)
- **Obsługiwane interakcje**:
  1. Wpisywanie imienia → aktualizacja stanu + walidacja regex/min/max.
  2. Wybór daty → walidacja przeszłości i wieku 3-18.
  3. Submit → `onSubmit` uruchamia TanStack `useMutation`.
  4. Cancel → jeśli dirty → confirm, w przeciwnym razie nawigacja.
- **Walidacja**:
  - `profileName`: min 2, max 50, regex `/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/`.
  - `dateOfBirth`: data < `now` oraz wiek ∈ [3, 18].
  - Całość opisana w schemacie Zod importowanym z `src/lib/schemas/profile.schema.ts`.
- **Typy**:
  - `CreateChildProfileCommand` (back-end)
  - `ChildProfileDTO` (response)
  - `ProfileFormValues` (dane formularza, równa się schematowi Zod)
- **Propsy**: 
  - `mode: "create"`
  - `onSaveSuccess: (data: ProfileFormValues) => void`
  - `onCancel: () => void`
  - `isSubmitting?: boolean`
  - `apiError?: string`
  - `apiErrorField?: "profileName" | "dateOfBirth"`

### InputText, DatePicker, FormError

Wykorzystujemy istniejące komponenty z `src/components/ui`:

- `input.tsx` - podstawowy input z integracją react-hook-form
- `date-picker.tsx` - React Day Picker + Tailwind
- `form-error.tsx` - komponent z `role="alert" aria-live="assertive"` dla inline errors

## 5. Typy

```
// src/types.ts (istniejący)
export type CreateChildProfileCommand = {
  profileName: string;
  dateOfBirth: string; // ISO yyyy-mm-dd
};
export type ChildProfileDTO = { /* już istnieje */ };

// src/lib/view-models/create-profile.ts
export interface CreateProfileFormValues extends CreateChildProfileCommand {}
```

## 6. Zarządzanie stanem

- **react-hook-form** (controluje wartości, błędy, dirty state).
- **ZodResolver** do walidacji.
- **TanStack Query**:
  - `useCreateProfileMutation` (POST `/api/profiles`, `CreateChildProfileCommand`).
  - Po sukcesie `invalidateQueries(['profiles'])`.
- **Local state**: `isSubmitting` pobieramy z mutation.

## 7. Integracja API

| Zapytanie            | Typ żądania                 | Typ odpowiedzi    | Akcja UI                                                                      |
| -------------------- | --------------------------- | ----------------- | ----------------------------------------------------------------------------- |
| `POST /api/profiles` | `CreateChildProfileCommand` | `ChildProfileDTO` | Po sukcesie: redirect, po błędzie: mapowanie kodu status → inline FormError. |

## 8. Interakcje użytkownika

| Akcja            | Warunek                                  | Wynik                           |
| ---------------- | ---------------------------------------- | ------------------------------- |
| Wpisanie imienia | dowolne                                  | pokazuje/hide błąd regex/length |
| Wybór daty       | data w przeszłości, wiek 3-18            | błąd jeśli przekroczone         |
| Klik „Zapisz”    | formularz valid                          | spinner, mutation               |
| Klik „Anuluj”    | dirty = false                            | natychmiastowa nawigacja        |
| „Anuluj” + dirty | dialog confirm (native `window.confirm`) |

## 9. Warunki i walidacja

- Disabled submit gdy `!isValid || isSubmitting`.
- DatePicker ogranicza zakres `from={subYears(today, 18)}` do `to={subYears(today, 3)}`.
- Error inline mapowanie:
  - `400` → „Nieprawidłowe dane" (inline, general)
  - `409` duplicate → „Profil o tej nazwie już istnieje" (inline, field-specific: profileName)
  - `409` limit → „Osiągnięto limit 10 profilów" (inline, general)
  - `422` → iteracja po `details` → inline errors per field or general

## 10. Obsługa błędów

1. Inline pod polami (z react-hook-form) – walidacja klienta.
2. Inline FormError przy statusach serwera - wyświetlany jako:
   - Field-specific error (pod polem z czerwonym obramowaniem)
   - General error (na górze formularza w destructive box)
3. Fallback (exceptions) → inline error „Wystąpił nieoczekiwany błąd".
4. Mutation `onError` sprawdza `response.status` i parsuje JSON.

## 11. Kroki implementacji

1. **Routing**: utworzyć `src/pages/profiles/new.astro` z layoutem i importem `<AddProfileForm client:react />`.
2. **Schemat Zod**: dodać `src/lib/schemas/profile.schema.ts` (export `createProfileSchema`).
3. **UI components**: utworzyć `date-picker.tsx`, `form-error.tsx` w `src/components/ui`.
4. **ProfileFormComponent**: utworzyć `src/components/profiles/ProfileFormComponent.tsx` (reusable component).
5. **AddProfileForm**: utworzyć `src/components/profiles/AddProfileForm.tsx` (wrapper with logic).
6. **Hook TanStack**: w `src/lib/hooks/useCreateProfileMutation.ts` z `fetch`.
7. **Test manualny**: scenariusze sukces, błędy 400/409/422, limit profili.
8. **Accessibility**: dodać `aria-describedby` i `aria-invalid` do pól.
9. **Refaktor**: upewnić się, że komponenty są zgodne ze standardami projektu.
10. **Dokumentacja**: dodać wpis do CHANGELOG i README (Developer Notes).
