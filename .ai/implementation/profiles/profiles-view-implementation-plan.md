# Plan implementacji widoku Wybór Profilu (`/profiles`)

## 1. Przegląd

Widok "Wybór Profilu" jest głównym hubem rodzica po zalogowaniu. Umożliwia:

1. Wybranie profilu dziecka do rozpoczęcia gry.
2. Dodanie nowego profilu.
3. Szybki dostęp do dashboardu postępów i wylogowania.
   Widok prezentuje listę maksymalnie 10 profili dziecka wraz z informacjami o wieku i aktualnym poziomie.

## 2. Routing widoku

- **Ścieżka:** `/profiles`
- **Plik strony:** `src/pages/profiles.astro`
- Strona chroniona middleware `src/middleware/index.ts` (token Supabase wymagany).

## 3. Struktura komponentów

- `ProfilesPage` (Astro)  
  └─ `<Header />`  
  └─ `<ContentWrapper>` (div mx-auto px-4)  
   ├─ `<ProfileCounter />`  
   ├─ conditional: `<EmptyState />` _lub_  
   └─ `<ProfileList>` (grid)  
   ├─ many `<ProfileCard />`  
   └─ `<AddProfileCard />` (gdy count < 10)

## 4. Szczegóły komponentów

### Header

- **Opis:** Uniwersalny header publiczny z logo.
- **Główne elementy:** logo, przyciski „Dashboard”, „Wyloguj”.
- **Interakcje:**
  - click „Dashboard” → `navigate('/dashboard')`
  - click „Wyloguj” → `logout()` + `navigate('/login')`
- **Walidacja:** brak
- **Typy:** brak nowych
- **Propsy:** brak (statyczny)

### ProfileCounter

- **Opis:** Komponent tekstowy „X/10 profili” z aria-label.
- **Elementy:** `<p>` + Tailwind klasa `text-lg font-medium`.
- **Interakcje:** none
- **Walidacja:** none
- **Typy:** `{ count: number }`
- **Propsy:** `count`

### ProfileList

- **Opis:** Grid container (responsive).
- **Elementy:** `<ul>` z Tailwind grid; children to ProfileCard/AddProfileCard.
- **Interakcje:** klawiatura – `tabIndex=0` delegowany do kart.
- **Walidacja:** none
- **Typy:** `{ profiles: ProfileVM[]; canAdd: boolean }`
- **Propsy:** `profiles`, `canAdd`

### ProfileCard

- **Opis:** Karta profilu dziecka jako `<button>`.
- **Elementy:** avatar (ikonka generowana z inicjałów), imię, wiek, badge poziomu.
- **Interakcje:** click → `navigate('/game/start?profileId=...')`.
- **Walidacja:** none (nawigacja tylko gdy id istnieje).
- **Typy:** `ProfileVM` (zob. sekcja 5)
- **Propsy:** `profile: ProfileVM`

### AddProfileCard

- **Opis:** Karta z „+” prowadząca do `/profiles/new`.
- **Elementy:** plus icon, tooltip przy disabled.
- **Interakcje:** click → navigate; hover → tooltip.
- **Walidacja:** disabled if count ≥ 10.
- **Typy:** `{ disabled: boolean }`
- **Propsy:** `disabled`

### EmptyState

- **Opis:** Wyświetlany, gdy lista profili pusta.
- **Elementy:** ilustracja SVG, nagłówek, przycisk CTA „Dodaj profil”.
- **Interakcje:** click CTA → `/profiles/new`.
- **Typy:** none
- **Propsy:** none

## 5. Typy

```ts
// ViewModel profilu (przygotowany z DTO)
export interface ProfileVM {
  id: string;
  displayName: string;
  age: number; // wyliczony z dateOfBirth
  level: number; // currentLevelId
}
```

Hook `useProfilesQuery` zwraca:

```ts
interface UseProfilesQueryResult {
  profiles: ProfileVM[];
  count: number; // length
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}
```

## 6. Zarządzanie stanem

- Lokalny stan przez **TanStack Query**.
- Hook `useProfilesQuery`:
  - Key: `['profiles']`
  - Fetcher: `GET /api/profiles?page=1&pageSize=10`
  - `staleTime: 0`, `refetchOnWindowFocus: false`.
- Dodatkowy hook `useLogout` (już istnieje w auth).
- Brak globalnego state managera – wystarczy Query + Router.

## 7. Integracja API

- Endpoint: `GET /api/profiles` (paginated `PaginatedResponse<ChildProfileDTO>`)
- Request parametry: `page=1&pageSize=10` (stałe)
- Response mapping:
  1. Konwersja `ChildProfileDTO` → `ProfileVM` (funkcja `mapToVM`):
     - `displayName = profileName`
     - `age = calculateAge(dateOfBirth)`
     - `level = currentLevelId`
- Błędy HTTP 401/400/500 obsługiwane w hooku (toast + redirect przy 401).

## 8. Interakcje użytkownika

1. **Wejście na stronę** → skeleton loader → lista/empty state.
2. **Klik profilu** → nawigacja do gry).
3. **Klik „Dodaj profil”** → /profiles/new.
4. **Klik „Dashboard”** → /dashboard.
5. **Klik „Wyloguj”** → logout + redirect.
6. **Hover karty** → podniesienie cienia + skala.
7. **Tooltip** na disabled AddProfile.

## 9. Warunki i walidacja

- **Limit 10 profili:** `AddProfileCard.disabled = count >= 10`.
- **Autoryzacja:** middleware wymusza token; w hooku 401 → redirect do /login.
- **Brak profili:** render `EmptyState`.

## 10. Obsługa błędów

| Scenariusz       | Reakcja UI                                                     |
| ---------------- | -------------------------------------------------------------- |
| 401 Unauthorized | `authStore.logout()` + redirect `/login`                       |
| 400 Validation   | toast.error("Nieprawidłowe parametry zapytania")               |
| 500 Internal     | toast.error("Wystąpił błąd serwera. Spróbuj ponownie później") |
| Network error    | toast.error("Brak połączenia z internetem")                    |

## 11. Kroki implementacji

1. **Routing & plik strony** – utwórz `src/pages/profiles.astro` z importem `ProfilesView.tsx`.
2. **Hook `useProfilesQuery`** w `src/lib/hooks/useProfilesQuery.ts`.
3. **Komponenty UI** w `src/components/profiles/`:
   - `ProfileCard.tsx`, `AddProfileCard.tsx`, `ProfileList.tsx`, `ProfileCounter.tsx`, `EmptyState.tsx`.
4. **Header** – wykorzystaj istniejący `HeaderAuthenticated` lub rozszerz o przycisk „Dashboard”.
5. **Styling** – Tailwind classes dla grid i kart; dodać animacje `transition-transform`.
6. **Avatar generator** – funkcja util `getInitialIcon(name)` w `src/lib/utils.ts`.
7. **Walidacja limitu** – logika w `AddProfileCard` + tooltip z Shadcn/ui `Tooltip`.
8. **Accessibility** – ARIA label dla `ProfileCounter`, `role="list"` i `role="listitem"`.
9. **Skeleton Loader** – dodać `SkeletonProfileCard` komponent do listy w stanie `isLoading`.
10. **Testy** – jednostkowe dla mappera VM i hooka, e2e (Cypress) kliknięcie profilu/dodaj profil.
11. **Dokumentacja** – zaktualizuj README sekcję „Profile flow”.
