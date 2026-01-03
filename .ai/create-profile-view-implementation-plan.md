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

### ProfileForm

- **Opis**: Zawiera cały formularz tworzenia profilu, zarządza stanem, walidacją i wywołaniem mutation.
- **Główne elementy**:
  - `InputText` (label „Imię dziecka”, autofocus)
  - `DatePicker` (label „Data urodzenia”, max = dziś, min = 18 lat wstecz)
  - `Button` type="submit" (tekst „Zapisz”, spinner podczas mutation)
  - `ButtonLink` to="/profiles" (tekst „Anuluj”, dialog confirm gdy dirty)
  - `Toaster` (sonner) do komunikatów sukces/błąd
- **Obsługiwane interakcje**:
  1. Wpisywanie imienia → aktualizacja stanu + walidacja regex/min/max.
  2. Wybór daty → walidacja przeszłości i wieku 3-18.
  3. Submit → `onSubmit` uruchamia TanStack `useMutation`.
  4. Cancel → jeśli dirty → confirm, w przeciwnym razie nawigacja.
- **Walidacja**:
  - `profileName`: min 2, max 50, regex `/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/`.
  - `dateOfBirth`: data < `now` oraz wiek ∈ [3, 18].
  - Całość opisana w schemacie Zod importowanym z `src/lib/schemas/profile.schema.ts` (nowy plik).
- **Typy**:
  - `CreateChildProfileCommand` (back-end)
  - `ChildProfileDTO` (response)
  - `CreateProfileFormValues` (lokalny alias dla danych formularza, równa się schematowi Zod)
- **Propsy**: brak (osadza się bezpośrednio w stronie).

### InputText, DatePicker, FormError

Wykorzystujemy istniejące komponenty z `src/components/ui` lub rozszerzamy je o integrację z react-hook-form. Jeśli brakuje, tworzymy w `src/components/ui`:

- `input.tsx` zawiera już podstawy; dodać wrapper `FormInput`.
- `date-picker.tsx` (React Day Picker + Tailwind) – nowy plik.
- `form-error.tsx` – prosty komponent z `role="alert" aria-live="assertive"`.

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

| Zapytanie            | Typ żądania                 | Typ odpowiedzi    | Akcja UI                                                                         |
| -------------------- | --------------------------- | ----------------- | -------------------------------------------------------------------------------- |
| `POST /api/profiles` | `CreateChildProfileCommand` | `ChildProfileDTO` | Po sukcesie: toast + redirect, po błędzie: mapowanie kodu status → toast/inline. |

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
- Error toast mapowanie:
  - `400` → „Nieprawidłowe dane”
  - `409` duplicate → „Profil o tej nazwie już istnieje”
  - `409` limit → „Osiągnięto limit 10 profilów”
  - `422` → iteracja po `details` → sonner.toast(errors.join("\n"))

## 10. Obsługa błędów

1. Inline pod polami (z react-hook-form) – walidacja klienta.
2. Toast błędu przy statusach serwera.
3. Fallback (exceptions) → toast „Wystąpił nieoczekiwany błąd”.
4. Mutation `onError` sprawdza `response.status` i parsuje JSON.

## 11. Kroki implementacji

1. **Routing**: utworzyć `src/pages/profiles/new.astro` z layoutem i importem `<ProfileForm client:react />`.
2. **Schemat Zod**: dodać `src/lib/schemas/profile.schema.ts` (export `createProfileSchema`).
3. **UI components**: jeśli brak – utworzyć `date-picker.tsx`, `form-error.tsx` w `src/components/ui`.
4. **ProfileForm**: utworzyć `src/components/profiles/ProfileForm.tsx`.
5. **Hook TanStack**: w `src/lib/hooks/useCreateProfileMutation.ts` z `axios`/`fetch`.
6. **Toast provider**: upewnić się, że root Layout zawiera `<Toaster/>` (już jest w `src/components/ui/sonner.tsx`).
7. **Test manualny**: scenariusze sukces, błędy 400/409/422, limit profili.
8. **Accessibility**: dodać `aria-describedby` i `aria-invalid` do pól.
9. **Refaktor**: przenieść wspólne UI (InputText, DatePicker) jeśli potrzebne.
10. **Dokumentacja**: dodać wpis do CHANGELOG i README (Developer Notes).
