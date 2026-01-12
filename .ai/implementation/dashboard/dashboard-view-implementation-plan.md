# Plan implementacji widoku Dashboard

## 1. Przegląd

Widok Dashboard to ekran podsumowania postępów wszystkich profili dzieci należących do zalogowanego rodzica. Rodzic widzi na jednym ekranie poziom, łączną liczbę punktów oraz datę ostatniej gry dla każdego dziecka. Widok ten umożliwia rodzicowi szybki monitoring aktywności i postępów dzieci w grze Rytmik.

Główne funkcje widoku:

- Wyświetlenie listy wszystkich profili dzieci z ich statystykami (poziom, punkty, ostatnia gra)
- Możliwość przejścia do szczegółowego widoku profili poprzez przycisk "Wróć do profili"
- Obsługa różnych stanów: ładowanie, błąd, brak danych
- Responsywny układ dostosowany do różnych rozmiarów ekranów
- Nagłówek z informacją o zalogowanym użytkowniku i możliwością wylogowania

## 2. Routing widoku

Widok Dashboard będzie dostępny pod ścieżką `/dashboard`.

Widok wymaga autoryzacji - niezalogowani użytkownicy będą przekierowywani na `/login`.

Struktura plików:

- Plik Astro: `src/pages/dashboard.astro` - główna strona z autoryzacją
- Komponent React: `src/components/dashboard/DashboardView.tsx` - główny kontener widoku

## 3. Struktura komponentów

```
DashboardView (src/components/dashboard/DashboardView.tsx)
├── QueryClientProvider (wrapper dla React Query)
└── DashboardViewContent
    ├── HeaderAuthenticated (istniejący komponent)
    ├── main
    │   ├── h1 (tytuł "Dashboard")
    │   ├── DashboardStats (podsumowanie: liczba profili, średni poziom)
    │   ├── ul (lista kart profili)
    │   │   └── li (wielokrotność)
    │   │       └── DashboardCard
    │   │           ├── Avatar (pierwsza litera imienia)
    │   │           ├── ProfileInfo (imię, wiek)
    │   │           ├── ProgressStats (poziom, punkty, ostatnia gra)
    │   │           └── Button ("Zobacz szczegóły" - rozwija historię zadań)
    │   ├── SkeletonDashboardCard (stan ładowania)
    │   ├── EmptyDashboardState (brak profili)
    │   └── ErrorState (błąd ładowania)
    └── footer
        └── Button ("Wróć do profili")
```

## 4. Szczegóły komponentów

### DashboardView

**Opis:** Główny komponent widoku Dashboard. Opakowuje logikę fetchowania danych w `QueryClientProvider` z TanStack Query. Odpowiedzialny za konfigurację providera i renderowanie `DashboardViewContent`.

**Główne elementy:**

- `QueryClientProvider` - provider dla React Query
- `DashboardViewContent` - komponent wewnętrzny z logiką widoku

**Obsługiwane zdarzenia:**

- Brak - komponent kontenerowy

**Warunki walidacji:**

- Brak - komponent kontenerowy

**Typy:**

- Brak - komponent kontenerowy

**Propsy:**

- Brak - komponent top-level

---

### DashboardViewContent

**Opis:** Wewnętrzny komponent zawierający całą logikę widoku Dashboard. Pobiera dane z API za pomocą hooka `useDashboardQuery`, zarządza stanem email użytkownika oraz renderuje odpowiednie stany (loading, error, empty, success).

**Główne elementy:**

- `HeaderAuthenticated` - nagłówek z nawigacją i wylogowaniem
- `main` - główny kontener widoku z:
  - Tytułem "Dashboard"
  - `DashboardStats` - statystyki ogólne
  - Lista `DashboardCard` - karty dla każdego profilu
  - `SkeletonDashboardCard` - szkielet podczas ładowania
  - `EmptyDashboardState` - komunikat gdy brak profili
  - `ErrorState` - komunikat o błędzie
- `footer` - przycisk "Wróć do profili"

**Obsługiwane zdarzenia:**

- Fetchowanie danych dashboard przy montowaniu komponentu
- Fetchowanie email użytkownika z `/api/auth/me`
- Kliknięcie przycisku "Wróć do profili" - nawigacja do `/profiles`

**Warunki walidacji:**

- Sprawdzenie czy użytkownik jest zalogowany (401 → redirect do `/login`)
- Sprawdzenie czy dane zostały poprawnie pobrane

**Typy:**

- `DashboardItemDTO[]` - tablica danych z API
- `DashboardItemVM[]` - tablica viewmodeli do wyświetlenia
- `string` - email użytkownika

**Propsy:**

- Brak - komponent wewnętrzny bez propsów

---

### DashboardCard

**Opis:** Karta pojedynczego profilu wyświetlająca avatar, podstawowe informacje, statystyki postępu oraz przycisk akcji. Komponent jest responsywny i obsługuje różne stany wyświetlania dat.

**Główne elementy:**

- Avatar `div` - okrągły avatar z pierwszą literą imienia
- Sekcja informacji podstawowych:
  - Imię profilu `h3`
  - Wiek `p`
- Sekcja statystyk:
  - Poziom `div` - z ikoną Trophy
  - Punkty `div` - z ikoną Star
  - Ostatnia gra `div` - z ikoną Calendar, formatowana data lub "Nigdy"
- Przycisk "Zobacz profil" - nawigacja do `/game/play?profileId={id}`

**Obsługiwane zdarzenia:**

- `onClick` przycisku "Zobacz profil" - nawigacja do gry z profilem

**Warunki walidacji:**

- Sprawdzenie czy `lastPlayedAt` nie jest `null` przed formatowaniem daty
- Wyświetlenie "Nigdy" gdy `lastPlayedAt === null`

**Typy:**

- `DashboardCardProps` - interfejs propsów
- `DashboardItemVM` - viewmodel z danymi profilu

**Propsy:**

```typescript
interface DashboardCardProps {
  item: DashboardItemVM;
}
```

---

### DashboardStats

**Opis:** Komponent wyświetlający ogólne statystyki dla wszystkich profili. Pokazuje liczbę profili oraz średni poziom (zaokrąglony do jednego miejsca po przecinku).

**Główne elementy:**

- Kontener `div` z dwoma kartami statystyk:
  - Karta 1: Liczba profili z ikoną Users
  - Karta 2: Średni poziom z ikoną TrendingUp

**Obsługiwane zdarzenia:**

- Brak - komponent prezentacyjny

**Warunki walidacji:**

- Sprawdzenie czy `count > 0` przed obliczeniem średniego poziomu
- Wyświetlenie "0" jako średni poziom gdy brak profili

**Typy:**

- `DashboardStatsProps` - interfejs propsów

**Propsy:**

```typescript
interface DashboardStatsProps {
  count: number;
  averageLevel: number;
}
```

---

### SkeletonDashboardCard

**Opis:** Komponent skeleton wyświetlany podczas ładowania danych. Imituje strukturę `DashboardCard` z animowanymi placeholderami.

**Główne elementy:**

- Kontener karty z animacją `animate-pulse`
- Szkielet avatara - okrągły placeholder
- Szkielety tekstowe - prostokątne placeholdery różnych rozmiarów
- Szkielet przycisku - prostokątny placeholder

**Obsługiwane zdarzenia:**

- Brak - komponent prezentacyjny

**Warunki walidacji:**

- Brak - komponent prezentacyjny

**Typy:**

- Brak

**Propsy:**

- Brak

---

### EmptyDashboardState

**Opis:** Komponent wyświetlany gdy rodzic nie ma jeszcze żadnych profili dzieci. Zawiera przyjazną ilustrację, komunikat oraz przycisk CTA do dodania pierwszego profilu.

**Główne elementy:**

- Kontener centrujący `div`
- Ikona dekoracyjna (emotikon lub ikona Users)
- Nagłówek `h2` - "Brak profili"
- Opis `p` - zachęta do dodania profilu
- Przycisk `Button` - "Dodaj pierwszy profil"

**Obsługiwane zdarzenia:**

- `onClick` przycisku - nawigacja do `/profiles`

**Warunki walidacji:**

- Brak

**Typy:**

- Brak

**Propsy:**

- Brak

---

### ErrorState

**Opis:** Komponent wyświetlany gdy wystąpi błąd podczas pobierania danych. Pokazuje komunikat o błędzie i przycisk do ponownej próby.

**Główne elementy:**

- Kontener centrujący `div`
- Ikona błędu (emotikon ⚠️)
- Nagłówek `h2` - "Wystąpił błąd"
- Opis `p` - komunikat o błędzie
- Przycisk `Button` - "Spróbuj ponownie"

**Obsługiwane zdarzenia:**

- `onClick` przycisku - wywołanie funkcji `refetch` z hooka

**Warunki walidacji:**

- Brak

**Typy:**

- `ErrorStateProps` - interfejs propsów

**Propsy:**

```typescript
interface ErrorStateProps {
  onRetry: () => void;
}
```

## 5. Typy

### Istniejące typy z `src/types.ts`

```typescript
/**
 * Dashboard Item DTO - Response item for GET /dashboard
 * Typ zwracany przez API endpoint GET /api/dashboard
 */
export interface DashboardItemDTO {
  profileId: string; // UUID profilu dziecka
  profileName: string; // Imię dziecka
  currentLevel: number; // Aktualny poziom (1-20)
  totalScore: number; // Łączna liczba punktów
  lastPlayedAt: string | null; // Data ostatniej gry (ISO timestamp) lub null
}
```

### Nowe typy do stworzenia w `src/lib/hooks/useDashboardQuery.ts`

```typescript
/**
 * Dashboard Item View Model - zoptymalizowany do wyświetlania w UI
 * Zawiera przetworzone dane z DashboardItemDTO
 */
export interface DashboardItemVM {
  id: string; // UUID profilu (profileId z DTO)
  profileName: string; // Imię dziecka
  age: number; // Wiek obliczony na podstawie dateOfBirth (wymaga pobrania z profilu)
  level: number; // Aktualny poziom (currentLevel z DTO)
  totalScore: number; // Łączna liczba punktów
  lastPlayedAt: string | null; // Data ostatniej gry lub null
}

/**
 * Hook result interface
 */
export interface UseDashboardQueryResult {
  items: DashboardItemVM[]; // Tablica elementów dashboard
  count: number; // Liczba profili
  averageLevel: number; // Średni poziom ze wszystkich profili
  isLoading: boolean; // Czy trwa ładowanie
  isError: boolean; // Czy wystąpił błąd
  refetch: () => void; // Funkcja do ponownego pobrania danych
}
```

### Typy dla komponentów

```typescript
// DashboardCard
interface DashboardCardProps {
  item: DashboardItemVM;
}

// DashboardStats
interface DashboardStatsProps {
  count: number;
  averageLevel: number;
}

// ErrorState
interface ErrorStateProps {
  onRetry: () => void;
}
```

## 6. Zarządzanie stanem

### Custom Hook: `useDashboardQuery`

**Lokalizacja:** `src/lib/hooks/useDashboardQuery.ts`

**Cel:** Centralizacja logiki pobierania i przetwarzania danych dashboard z API. Hook wykorzystuje TanStack Query do cache'owania i zarządzania stanem asynchronicznym.

**Funkcjonalność:**

1. Wywołanie `GET /api/dashboard` za pomocą `fetch`
2. Transformacja `DashboardItemDTO[]` do `DashboardItemVM[]`
3. Obliczenie statystyk: liczba profili, średni poziom
4. Obsługa błędów (401 → redirect do login)
5. Zwrócenie danych, stanów loading/error oraz funkcji refetch

**Funkcje pomocnicze:**

```typescript
/**
 * Oblicza średni poziom z tablicy profili
 */
function calculateAverageLevel(items: DashboardItemDTO[]): number {
  if (items.length === 0) return 0;
  const sum = items.reduce((acc, item) => acc + item.currentLevel, 0);
  return Math.round((sum / items.length) * 10) / 10; // Zaokrąglenie do 1 miejsca po przecinku
}

/**
 * Mapuje DashboardItemDTO do DashboardItemVM
 * Uwaga: wiek nie jest dostępny w DashboardItemDTO,
 * więc musimy pobrać go z osobnego endpointu lub pominąć
 */
function mapToDashboardItemVM(dto: DashboardItemDTO): DashboardItemVM {
  return {
    id: dto.profileId,
    profileName: dto.profileName,
    age: 0, // Placeholder - wiek wymaga dodatkowego API call lub zmiany API
    level: dto.currentLevel,
    totalScore: dto.totalScore,
    lastPlayedAt: dto.lastPlayedAt,
  };
}

/**
 * Pobiera dane dashboard z API
 */
async function fetchDashboard(): Promise<DashboardItemDTO[]> {
  const response = await fetch("/api/dashboard", {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
  }

  return await response.json();
}
```

**Konfiguracja React Query:**

```typescript
const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ["dashboard"],
  queryFn: fetchDashboard,
  staleTime: 0,
  refetchOnWindowFocus: false,
});
```

### Stan lokalny w komponentach

**DashboardViewContent:**

- `userEmail: string` - email zalogowanego użytkownika, pobierany z `/api/auth/me`

**DashboardCard:**

- Brak stanu lokalnego - komponent prezentacyjny

## 7. Integracja API

### Endpoint: `GET /api/dashboard`

**Typ żądania:** Brak body, autoryzacja przez cookie

**Typ odpowiedzi:** `DashboardItemDTO[]`

**Przykład odpowiedzi:**

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
    "profileId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "profileName": "Janek",
    "currentLevel": 2,
    "totalScore": 85,
    "lastPlayedAt": "2026-01-11T08:30:00Z"
  }
]
```

**Kody statusu:**

- `200 OK` - sukces, zwraca tablicę profili (może być pusta)
- `401 Unauthorized` - brak autoryzacji, redirect do `/login`
- `500 Internal Server Error` - błąd serwera, wyświetlenie `ErrorState`

**Sposób wywołania:**

```typescript
const response = await fetch("/api/dashboard", {
  method: "GET",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
});
```

**Obsługa odpowiedzi:**

- Sukces (200): Parsowanie JSON i mapowanie do `DashboardItemVM[]`
- Błąd (401): Automatyczne przekierowanie do `/login`
- Błąd (500): Ustawienie stanu `isError` i wyświetlenie `ErrorState`

### Pomocniczy endpoint: `GET /api/auth/me`

**Cel:** Pobranie emaila zalogowanego użytkownika dla wyświetlenia w `HeaderAuthenticated`

**Typ żądania:** Brak body, autoryzacja przez cookie

**Typ odpowiedzi:** `AuthUserDTO`

```typescript
interface AuthUserDTO {
  id: string;
  email: string;
}
```

**Sposób wywołania:**

```typescript
const response = await fetch("/api/auth/me", {
  credentials: "include",
});
if (response.ok) {
  const data = await response.json();
  setUserEmail(data.email || "");
}
```

## 8. Interakcje użytkownika

### 1. Wejście na stronę Dashboard

**Akcja:** Użytkownik klika "Dashboard" w nagłówku lub wpisuje `/dashboard` w pasku adresu

**Przepływ:**

1. Middleware Astro sprawdza token autoryzacji
2. Jeśli brak tokenu → redirect do `/login`
3. Jeśli token OK → renderowanie `DashboardView`
4. Komponent wywołuje `useDashboardQuery()`
5. Wyświetlenie stanu ładowania (3 `SkeletonDashboardCard`)
6. Po załadowaniu danych → wyświetlenie listy kart lub stanu pustego

**Oczekiwany wynik:**

- Wyświetlenie nagłówka z emailem użytkownika
- Tytuł "Dashboard"
- Statystyki ogólne (liczba profili, średni poziom)
- Lista kart profili z danymi lub stan pusty

---

### 2. Przeglądanie statystyk profilu

**Akcja:** Użytkownik przegląda karty profili

**Przepływ:**

1. Wyświetlenie `DashboardCard` dla każdego profilu
2. Odczytanie informacji: imię, poziom, punkty, ostatnia gra

**Oczekiwany wynik:**

- Czytelna prezentacja danych w formie kart
- Formatowana data ostatniej gry (np. "11 sty 2026, 14:30") lub "Nigdy"
- Wyświetlenie poziomu i punktów z odpowiednimi ikonami

---

### 3. Przejście do profilu

**Akcja:** Użytkownik klika przycisk "Zobacz profil" na karcie

**Przepływ:**

1. Obsługa zdarzenia `onClick`
2. Nawigacja do `/game/play?profileId={profileId}`

**Oczekiwany wynik:**

- Przekierowanie do widoku gry z wybranym profilem
- Możliwość rozpoczęcia sesji gry dla tego profilu

---

### 4. Powrót do listy profili

**Akcja:** Użytkownik klika przycisk "Wróć do profili" w stopce

**Przepływ:**

1. Obsługa zdarzenia `onClick`
2. Nawigacja do `/profiles`

**Oczekiwany wynik:**

- Przekierowanie do widoku listy profili
- Możliwość dodania, edycji lub usunięcia profili

---

### 5. Ponowienie próby po błędzie

**Akcja:** Użytkownik klika "Spróbuj ponownie" w stanie błędu

**Przepływ:**

1. Obsługa zdarzenia `onClick` w `ErrorState`
2. Wywołanie funkcji `refetch()` z hooka
3. Ponowne wywołanie API
4. Przejście do stanu ładowania

**Oczekiwany wynik:**

- Wyświetlenie stanu ładowania
- Ponowne pobranie danych z API
- Wyświetlenie danych lub ponowne wyświetlenie błędu

---

### 6. Dodanie pierwszego profilu (stan pusty)

**Akcja:** Użytkownik klika "Dodaj pierwszy profil" w `EmptyDashboardState`

**Przepływ:**

1. Obsługa zdarzenia `onClick`
2. Nawigacja do `/profiles`

**Oczekiwany wynik:**

- Przekierowanie do widoku profili
- Automatyczne otwarcie formularza dodawania profilu (jeśli zaimplementowane) lub wyświetlenie stanu pustego z CTA

## 9. Warunki i walidacja

### Warunki autoryzacji (Astro middleware)

**Komponent:** `src/pages/dashboard.astro`

**Warunek:** Sprawdzenie obecności tokenu `sb-access-token` w cookies

**Implementacja:**

```typescript
const token = Astro.cookies.get("sb-access-token");
if (!token?.value) {
  return Astro.redirect("/login");
}
```

**Wpływ na UI:** Niezalogowani użytkownicy są automatycznie przekierowywani na stronę logowania przed renderowaniem widoku.

---

### Warunki w hooku `useDashboardQuery`

**Warunek 1: Odpowiedź 401 Unauthorized**

- **Weryfikacja:** Sprawdzenie `response.status === 401`
- **Akcja:** Przekierowanie do `/login` za pomocą `window.location.href`
- **Wpływ na UI:** Użytkownik jest przekierowywany, nie widzi komunikatu błędu

**Warunek 2: Odpowiedź błędna (nie 200)**

- **Weryfikacja:** Sprawdzenie `!response.ok`
- **Akcja:** Rzucenie wyjątku, React Query ustawia `isError = true`
- **Wpływ na UI:** Wyświetlenie komponentu `ErrorState` z komunikatem błędu

---

### Warunki w komponencie `DashboardViewContent`

**Warunek 1: Stan ładowania**

- **Weryfikacja:** `isLoading === true`
- **Akcja:** Renderowanie 3 komponentów `SkeletonDashboardCard`
- **Wpływ na UI:** Wyświetlenie animowanych placeholderów zamiast danych

**Warunek 2: Stan błędu**

- **Weryfikacja:** `isError === true && !isLoading`
- **Akcja:** Renderowanie komponentu `ErrorState`
- **Wpływ na UI:** Wyświetlenie komunikatu błędu i przycisku ponowienia próby

**Warunek 3: Stan pusty**

- **Weryfikacja:** `!isLoading && !isError && count === 0`
- **Akcja:** Renderowanie komponentu `EmptyDashboardState`
- **Wpływ na UI:** Wyświetlenie zachęty do dodania pierwszego profilu

**Warunek 4: Stan sukcesu**

- **Weryfikacja:** `!isLoading && !isError && count > 0`
- **Akcja:** Renderowanie `DashboardStats` oraz listy `DashboardCard`
- **Wpływ na UI:** Wyświetlenie pełnych danych dashboard

---

### Warunki w komponencie `DashboardCard`

**Warunek: Formatowanie daty ostatniej gry**

- **Weryfikacja:** `item.lastPlayedAt === null`
- **Akcja prawda:** Wyświetlenie tekstu "Nigdy"
- **Akcja fałsz:** Formatowanie daty za pomocą `formatDate(item.lastPlayedAt)`
- **Wpływ na UI:** Czytelna prezentacja daty lub informacji o braku gry

**Funkcja pomocnicza:**

```typescript
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
```

---

### Warunki w komponencie `DashboardStats`

**Warunek: Obliczanie średniego poziomu**

- **Weryfikacja:** `count === 0`
- **Akcja prawda:** Wyświetlenie "0.0" jako średni poziom
- **Akcja fałsz:** Obliczenie i wyświetlenie średniej
- **Wpływ na UI:** Uniknięcie dzielenia przez zero i błędu wyświetlania

## 10. Obsługa błędów

### Błędy autoryzacji

**Typ błędu:** 401 Unauthorized

**Miejsce wystąpienia:**

- Middleware Astro (brak tokenu w cookies)
- API endpoint `/api/dashboard` (nieprawidłowy token)

**Obsługa:**

1. **W Astro:** Redirect do `/login` przed renderowaniem
2. **W hooku:** `window.location.href = "/login"` + rzucenie wyjątku

**Komunikat dla użytkownika:** Brak (automatyczne przekierowanie)

---

### Błędy sieciowe

**Typ błędu:** Network error, timeout, brak połączenia

**Miejsce wystąpienia:** Funkcja `fetchDashboard()` w hooku

**Obsługa:**

1. `fetch` rzuca wyjątek
2. React Query przechwytuje i ustawia `isError = true`
3. Renderowanie `ErrorState`

**Komunikat dla użytkownika:**

```
⚠️ Wystąpił błąd
Nie udało się załadować danych. Sprawdź połączenie internetowe i spróbuj ponownie.
[Przycisk: Spróbuj ponownie]
```

---

### Błędy serwera

**Typ błędu:** 500 Internal Server Error

**Miejsce wystąpienia:** API endpoint `/api/dashboard`

**Obsługa:**

1. `response.ok === false`
2. Rzucenie wyjątku w `fetchDashboard()`
3. React Query ustawia `isError = true`
4. Renderowanie `ErrorState`

**Komunikat dla użytkownika:**

```
⚠️ Wystąpił błąd
Nie udało się załadować danych. Spróbuj ponownie później.
[Przycisk: Spróbuj ponownie]
```

---

### Błędy parsowania danych

**Typ błędu:** Nieprawidłowy format odpowiedzi JSON

**Miejsce wystąpienia:** `response.json()` w `fetchDashboard()`

**Obsługa:**

1. `response.json()` rzuca wyjątek
2. React Query przechwytuje i ustawia `isError = true`
3. Renderowanie `ErrorState`

**Komunikat dla użytkownika:** Jak w przypadku błędów sieciowych

---

### Błędy formatowania daty

**Typ błędu:** Nieprawidłowy format daty ISO

**Miejsce wystąpienia:** Funkcja `formatDate()` w `DashboardCard`

**Obsługa:**

```typescript
function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return "Data nieznana";
    }
    return new Intl.DateTimeFormat("pl-PL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "Data nieznana";
  }
}
```

**Komunikat dla użytkownika:** "Data nieznana" zamiast nieprawidłowej daty

---

### Błędy pobierania emaila użytkownika

**Typ błędu:** Niepowodzenie wywołania `/api/auth/me`

**Miejsce wystąpienia:** `useEffect` w `DashboardViewContent`

**Obsługa:**

```typescript
try {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
  });
  if (response.ok) {
    const data = await response.json();
    setUserEmail(data.email || "");
  }
} catch {
  // Silently fail - header will show empty email
}
```

**Komunikat dla użytkownika:** Brak (ciche niepowodzenie, header wyświetla pusty string)

---

### Przypadki brzegowe

**Przypadek 1: Brak profili (pusta tablica)**

- **Obsługa:** Wyświetlenie `EmptyDashboardState`
- **Komunikat:** "Brak profili. Dodaj pierwszy profil, aby zobaczyć postępy dziecka."

**Przypadek 2: Wszystkie profile bez gier (`lastPlayedAt === null`)**

- **Obsługa:** Wyświetlenie "Nigdy" w każdej karcie
- **Komunikat:** Normalny widok kart z tekstem "Nigdy"

**Przypadek 3: Bardzo długie imię profilu**

- **Obsługa:** CSS `text-overflow: ellipsis` + `overflow: hidden`
- **Efekt:** Obcięcie z wielokropkiem

**Przypadek 4: Bardzo duża liczba punktów**

- **Obsługa:** Formatowanie liczby z separatorem tysięcy
- **Funkcja pomocnicza:**

```typescript
function formatScore(score: number): string {
  return new Intl.NumberFormat("pl-PL").format(score);
}
```

- **Przykład:** 1234567 → "1 234 567"

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików

1. Utworzyć katalog `src/components/dashboard/`
2. Utworzyć plik `src/components/dashboard/DashboardView.tsx` (główny komponent)
3. Utworzyć plik `src/components/dashboard/DashboardCard.tsx`
4. Utworzyć plik `src/components/dashboard/DashboardStats.tsx`
5. Utworzyć plik `src/components/dashboard/SkeletonDashboardCard.tsx`
6. Utworzyć plik `src/components/dashboard/EmptyDashboardState.tsx`
7. Utworzyć plik `src/components/dashboard/ErrorState.tsx`
8. Utworzyć plik `src/lib/hooks/useDashboardQuery.ts`
9. Utworzyć plik `src/pages/dashboard.astro`

---

### Krok 2: Implementacja custom hooka `useDashboardQuery`

1. Zaimportować niezbędne zależności: `useQuery` z `@tanstack/react-query`, typy z `@/types`
2. Zdefiniować interfejsy: `DashboardItemVM`, `UseDashboardQueryResult`
3. Zaimplementować funkcję `calculateAverageLevel(items: DashboardItemDTO[]): number`
4. Zaimplementować funkcję `mapToDashboardItemVM(dto: DashboardItemDTO): DashboardItemVM`
5. Zaimplementować funkcję async `fetchDashboard(): Promise<DashboardItemDTO[]>`
   - Wywołanie `fetch("/api/dashboard")`
   - Obsługa błędu 401 (redirect do login)
   - Obsługa innych błędów (rzucenie wyjątku)
6. Zaimplementować hook `useDashboardQuery()`:
   - Użycie `useQuery` z kluczem `["dashboard"]`
   - Transformacja danych: `data.map(mapToDashboardItemVM)`
   - Obliczenie `count` i `averageLevel`
   - Zwrócenie obiektu z typem `UseDashboardQueryResult`
7. Przetestować hook w izolacji (opcjonalnie)

---

### Krok 3: Implementacja komponentów prezentacyjnych

**3.1. SkeletonDashboardCard**

1. Utworzyć komponent funkcyjny bez propsów
2. Zaimplementować strukturę HTML:
   - Kontener `div` z klasami Tailwind: `bg-card`, `rounded-lg`, `border`, `shadow-sm`, `p-6`, `animate-pulse`
   - Skeleton avatara: okrągły `div` z `bg-muted` (np. `w-20 h-20 rounded-full`)
   - Skeleton tekstowe: prostokątne `div` z `bg-muted` różnych szerokości
   - Skeleton przycisku: prostokątny `div` z `bg-muted`
3. Dodać atrybuty dostępności: `aria-hidden="true"`

**3.2. EmptyDashboardState**

1. Utworzyć komponent funkcyjny bez propsów
2. Zaimportować ikonę `Users` z `lucide-react`
3. Zaimportować `Button` z `@/components/ui/button`
4. Zaimplementować strukturę HTML:
   - Kontener centrujący z flexboxem
   - Ikona dekoracyjna (duża, w kole z przezroczystym tłem)
   - Nagłówek `h2`: "Brak profili"
   - Paragraf `p`: "Dodaj pierwszy profil, aby zobaczyć postępy dziecka."
   - Przycisk: "Dodaj pierwszy profil" z handler `onClick` nawigujący do `/profiles`
5. Stylować za pomocą Tailwind

**3.3. ErrorState**

1. Utworzyć komponent funkcyjny z propsem `onRetry: () => void`
2. Zaimportować `Button` z `@/components/ui/button`
3. Zaimplementować strukturę HTML:
   - Kontener centrujący
   - Ikona błędu (emotikon ⚠️ lub ikona z `lucide-react`)
   - Nagłówek `h2`: "Wystąpił błąd"
   - Paragraf `p`: "Nie udało się załadować danych. Spróbuj ponownie później."
   - Przycisk: "Spróbuj ponownie" z handler `onClick={onRetry}`
4. Stylować za pomocą Tailwind

**3.4. DashboardStats**

1. Utworzyć interfejs `DashboardStatsProps` z polami `count: number`, `averageLevel: number`
2. Zaimportować ikony `Users`, `TrendingUp` z `lucide-react`
3. Zaimplementować strukturę HTML:
   - Kontener `div` z grid (2 kolumny na desktop, 1 na mobile)
   - Karta 1: Liczba profili
     - Ikona `Users`
     - Etykieta "Liczba profili"
     - Wartość `count`
   - Karta 2: Średni poziom
     - Ikona `TrendingUp`
     - Etykieta "Średni poziom"
     - Wartość `averageLevel.toFixed(1)`
4. Stylować karty za pomocą Tailwind: tło, border, padding, zaokrąglenie
5. Obsłużyć przypadek `count === 0` (wyświetlić "0.0" jako średnią)

**3.5. DashboardCard**

1. Utworzyć interfejs `DashboardCardProps` z polem `item: DashboardItemVM`
2. Zaimportować ikony `Trophy`, `Star`, `Calendar` z `lucide-react`
3. Zaimportować `Button` z `@/components/ui/button`
4. Zaimplementować funkcję pomocniczą `formatDate(isoString: string): string` z obsługą błędów
5. Zaimplementować funkcję pomocniczą `formatScore(score: number): string` (separatory tysięcy)
6. Zaimplementować strukturę HTML:
   - Kontener karty: `div` z klasami Tailwind
   - Avatar: okrągły `div` z pierwszą literą imienia (uppercase)
   - Sekcja informacji:
     - Imię: `h3`
     - Wiek: `p` (opcjonalnie, jeśli dostępny)
   - Sekcja statystyk (grid 3 kolumny):
     - Poziom: ikona `Trophy` + wartość
     - Punkty: ikona `Star` + wartość (formatowana)
     - Ostatnia gra: ikona `Calendar` + data (formatowana lub "Nigdy")
   - Przycisk: "Zobacz profil" z handler nawigującym do `/game/play?profileId={item.id}`
7. Stylować za pomocą Tailwind: hover effects, responsive layout
8. Dodać atrybuty dostępności: `role="listitem"`

---

### Krok 4: Implementacja głównego komponentu `DashboardView`

**4.1. DashboardViewContent (komponent wewnętrzny)**

1. Zaimportować `useState`, `useEffect` z `react`
2. Zaimportować hook `useDashboardQuery`
3. Zaimportować `HeaderAuthenticated` z `@/components/auth/HeaderAuthenticated`
4. Zaimportować wszystkie komponenty dashboard z kroku 3
5. Zaimportować `Button` z `@/components/ui/button`
6. Zdefiniować stan lokalny: `const [userEmail, setUserEmail] = useState<string>("")`
7. Zaimplementować `useEffect` do pobierania emaila użytkownika:
   ```typescript
   useEffect(() => {
     const fetchUserEmail = async () => {
       try {
         const response = await fetch("/api/auth/me", { credentials: "include" });
         if (response.ok) {
           const data = await response.json();
           setUserEmail(data.email || "");
         }
       } catch {
         // Silently fail
       }
     };
     fetchUserEmail();
   }, []);
   ```
8. Wywołać hook: `const { items, count, averageLevel, isLoading, isError, refetch } = useDashboardQuery();`
9. Zaimplementować renderowanie warunkowe:
   - `isLoading === true`: Renderować `HeaderAuthenticated`, tytuł, 3x `SkeletonDashboardCard`
   - `isError === true && !isLoading`: Renderować `HeaderAuthenticated`, tytuł, `ErrorState` z `onRetry={refetch}`
   - `!isLoading && !isError && count === 0`: Renderować `HeaderAuthenticated`, tytuł, `EmptyDashboardState`
   - `!isLoading && !isError && count > 0`: Renderować pełen widok:
     - `HeaderAuthenticated`
     - `main`:
       - Tytuł `h1`: "Dashboard"
       - `DashboardStats` z propsami `count` i `averageLevel`
       - Lista `ul` z mapowaniem `items` do `DashboardCard`
     - `footer`:
       - Przycisk "Wróć do profili" nawigujący do `/profiles`
10. Stylować za pomocą Tailwind: layout, spacing, responsive

**4.2. DashboardView (komponent główny)**

1. Zaimportować `QueryClient`, `QueryClientProvider` z `@tanstack/react-query`
2. Utworzyć instancję: `const queryClient = new QueryClient()`
3. Zaimplementować komponent:
   ```typescript
   export default function DashboardView() {
     return (
       <QueryClientProvider client={queryClient}>
         <DashboardViewContent />
       </QueryClientProvider>
     );
   }
   ```

---

### Krok 5: Utworzenie strony Astro

1. Utworzyć plik `src/pages/dashboard.astro`
2. Zaimportować `Layout` z `@/layouts/Layout.astro`
3. Zaimportować `DashboardView` z `@/components/dashboard/DashboardView`
4. Dodać guard autoryzacji w sekcji frontmatter:
   ```typescript
   const token = Astro.cookies.get("sb-access-token");
   if (!token?.value) {
     return Astro.redirect("/login");
   }
   ```
5. Dodać `export const prerender = false;`
6. Zaimplementować strukturę HTML:
   ```astro
   <Layout title="Dashboard - Rytmik">
     <div class="min-h-screen flex flex-col bg-background">
       <DashboardView client:load />
     </div>
   </Layout>
   ```

---

### Krok 6: Aktualizacja nawigacji

1. **HeaderAuthenticated już zawiera link do Dashboard** - sprawdzić czy działa poprawnie
2. Sprawdzić, czy po kliknięciu "Dashboard" w nagłówku następuje poprawna nawigacja

---

### Krok 7: Testy manualne

**7.1. Test scenariusza sukcesu**

1. Zalogować się jako rodzic z przynajmniej 2 profilami dzieci
2. Przejść do `/dashboard`
3. Sprawdzić:
   - Czy wyświetla się nagłówek z emailem
   - Czy tytuł to "Dashboard"
   - Czy statystyki pokazują poprawną liczbę profili i średni poziom
   - Czy wszystkie karty profili są wyświetlone
   - Czy dane są poprawne (imię, poziom, punkty, ostatnia gra)
   - Czy przyciski "Zobacz profil" działają
   - Czy przycisk "Wróć do profili" działa

**7.2. Test stanu pustego**

1. Zalogować się jako rodzic bez profili
2. Przejść do `/dashboard`
3. Sprawdzić:
   - Czy wyświetla się `EmptyDashboardState`
   - Czy przycisk "Dodaj pierwszy profil" przekierowuje do `/profiles`

**7.3. Test stanu ładowania**

1. Dodać sztuczne opóźnienie w hooku (dev only)
2. Przejść do `/dashboard`
3. Sprawdzić:
   - Czy wyświetlają się 3 szkielety kart
   - Czy animacja `pulse` działa poprawnie

**7.4. Test błędów**

1. Wyłączyć backend lub API endpoint
2. Przejść do `/dashboard`
3. Sprawdzić:
   - Czy wyświetla się `ErrorState`
   - Czy przycisk "Spróbuj ponownie" wywołuje refetch

**7.5. Test autoryzacji**

1. Wylogować się
2. Spróbować wejść na `/dashboard` bezpośrednio
3. Sprawdzić:
   - Czy następuje redirect do `/login`

**7.6. Test responsywności**

1. Przetestować widok na różnych rozmiarach ekranu:
   - Mobile (< 640px): 1 kolumna kart
   - Tablet (640-1024px): 2 kolumny kart
   - Desktop (> 1024px): 3-4 kolumny kart
2. Sprawdzić czy statystyki wyświetlają się poprawnie (2 kolumny na desktop, 1 na mobile)

**7.7. Test formatowania danych**

1. Sprawdzić formatowanie daty:
   - Profil z `lastPlayedAt === null` → "Nigdy"
   - Profil z poprawną datą → format "11 sty 2026, 14:30"
2. Sprawdzić formatowanie dużych liczb:
   - Score > 1000 → separatory tysięcy "1 234"

---

### Krok 8: Poprawa błędów i optymalizacja

1. Sprawdzić logi konsoli - usunąć wszystkie błędy i ostrzeżenia
2. Zweryfikować poprawność typów TypeScript - brak błędów `tsc`
3. Zoptymalizować re-renderowanie:
   - Rozważyć użycie `React.memo()` dla `DashboardCard` jeśli lista jest długa
   - Użyć `useCallback` dla handlerów zdarzeń
4. Sprawdzić dostępność (accessibility):
   - Użyć narzędzia axe DevTools
   - Sprawdzić nawigację klawiaturą
   - Sprawdzić kontrast kolorów
5. Sprawdzić wydajność:
   - Czas ładowania danych
   - Czas renderowania komponentów (React DevTools Profiler)

---

### Krok 9: Dokumentacja (opcjonalnie)

1. Dodać komentarze JSDoc do wszystkich exportowanych funkcji i komponentów
2. Zaktualizować README projektu (jeśli istnieje) o informację o widoku Dashboard
3. Dodać przykłady użycia hooka `useDashboardQuery` w komentarzach

---

### Krok 10: Code review i merge

1. Utworzyć pull request z implementacją
2. Sprawdzić kod pod kątem:
   - Zgodności z konwencjami projektu
   - Poprawności implementacji
   - Kompletności testów
3. Poprawić uwagi z review
4. Zmerge'ować do głównej gałęzi

---

## Dodatkowe uwagi implementacyjne

### Problem z wiekiem w DashboardItemDTO

API endpoint `/api/dashboard` **nie zwraca** pola `dateOfBirth`, a więc obliczenie wieku nie jest możliwe bez dodatkowego wywołania API dla każdego profilu. Proponowane rozwiązania:

**Opcja A (Zalecana):** Zrezygnować z wyświetlania wieku w `DashboardCard`

- Usunąć pole `age` z `DashboardItemVM`
- Nie wyświetlać wieku w karcie

**Opcja B:** Rozszerzyć API endpoint `/api/dashboard` o pole `dateOfBirth`

- Zmodyfikować `DashboardItemDTO` w `src/types.ts`
- Zmodyfikować endpoint w `src/pages/api/dashboard.ts`
- Obliczyć wiek w hooku `useDashboardQuery`

**Opcja C:** Pobierać profile osobno dla każdego profilu

- Wywołać `GET /api/profiles/{profileId}` dla każdego profilu
- Nieefektywne (N+1 problem), niezalecane

**Decyzja:** Wybrać **Opcję A** dla MVP, rozważyć Opcję B w przyszłości jeśli wiek jest kluczową informacją.

### Formatowanie liczb i dat

Użyć API `Intl.NumberFormat` i `Intl.DateTimeFormat` dla prawidłowej lokalizacji (język polski).

Przykłady:

```typescript
// Liczby
new Intl.NumberFormat("pl-PL").format(1234567); // "1 234 567"

// Daty
new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
}).format(new Date()); // "11 sty 2026, 14:30"
```

### Ikony

Projekt używa biblioteki `lucide-react`. Zalecane ikony:

- `Trophy` - dla poziomu
- `Star` - dla punktów
- `Calendar` - dla daty ostatniej gry
- `Users` - dla stanu pustego i statystyk liczby profili
- `TrendingUp` - dla średniego poziomu
- `AlertCircle` lub emotikon ⚠️ - dla błędów

### Responsywność

Użyć breakpointów Tailwind:

- `sm:` - 640px+
- `md:` - 768px+
- `lg:` - 1024px+
- `xl:` - 1280px+

Layout kart:

```
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6
```

### Dostępność (a11y)

- Użyć semantic HTML: `<main>`, `<header>`, `<footer>`, `<ul>`, `<li>`
- Dodać `aria-label` do list: `<ul aria-label="Lista profili dzieci">`
- Dodać `aria-hidden="true"` do ikon dekoracyjnych
- Zapewnić kontrast kolorów zgodny z WCAG AA (minimum 4.5:1)
- Umożliwić nawigację klawiaturą (wszystkie przyciski fokusowalne)
- Użyć `role="listitem"` dla kart profili (jeśli nie są wewnątrz `<ul>`)

### Performance

- Użyć `React.memo()` dla `DashboardCard` jeśli lista jest długa (> 10 profili)
- Rozważyć lazy loading obrazów (jeśli będą dodane awatary)
- Cache'ować dane z React Query (już zaimplementowane)
- Unikać niepotrzebnych re-renderów (użyć `useCallback`, `useMemo`)
