# Specyfikacja techniczna modułu autentykacji - Rytmik

## 1. WPROWADZENIE

### 1.1 Cel dokumentu

Niniejszy dokument stanowi szczegółową specyfikację techniczną modułu autentykacji dla aplikacji Rytmik. Specyfikacja obejmuje implementację funkcjonalności rejestracji, logowania i odzyskiwania hasła dla kont rodzicielskich (US-001, US-002, US-015) z wykorzystaniem Supabase Auth w architekturze Astro 5 SSR.

### 1.2 Zakres funkcjonalny

- Rejestracja nowego konta rodzica (e-mail + hasło)
- Logowanie istniejącego użytkownika
- Wylogowanie z usunięciem sesji
- Odzyskiwanie zapomnianego hasła (reset przez e-mail)
- Zarządzanie sesją użytkownika (token-based authentication)
- Ochrona tras wymagających autentykacji
- Przekierowania między stronami publicznymi i chronionymi

### 1.3 Wymagania niefunkcjonalne

- Bezpieczeństwo: HTTPS, bezpieczne przechowywanie tokenów, CSRF protection
- Wydajność: Server-side rendering dla szybkiego pierwszego renderowania
- Dostępność: WCAG 2.1 Level AA
- Responsywność: Obsługa tablet/desktop w trybie landscape
- Zgodność z istniejącą architekturą: Brak naruszenia działania profili dzieci i mechaniki gry

### 1.4 Mapowanie User Stories z PRD

**US-001: Rejestracja rodzica**

- ✅ Endpoint POST /api/auth/register
- ✅ Walidacja unikalności e-maila (Supabase Auth)
- ✅ Przekierowanie do /login po sukcesie
- ✅ Dane zapisywane w Supabase Auth (tabela auth.users)

**US-002: Logowanie rodzica**

- ✅ Endpoint POST /api/auth/login
- ✅ Przekierowanie do /profiles (ekran wyboru profilu) po sukcesie
- ✅ Komunikaty błędów dla nieprawidłowych danych
- ✅ Sesja trwa min. 24h (access token: 86400s) lub do wylogowania
- ✅ Refresh token: 7 dni dla przedłużenia sesji

**US-003: Bezpieczne sesje**

- ✅ Każde żądanie do API wymaga ważnego tokena (middleware sprawdza)
- ✅ Wylogowanie usuwa tokeny z cookies
- ⚠️ **Decyzja architektoniczna:** Używamy httpOnly cookies zamiast localStorage dla lepszego bezpieczeństwa (ochrona przed XSS)

**US-015: Odzyskiwanie hasła przez rodzica**

- ✅ Endpoint POST /api/auth/forgot-password
- ✅ Wysyłanie e-maila z linkiem resetującym
- ✅ Endpoint POST /api/auth/reset-password
- ✅ Walidacja tokenów z linku e-mail

**Wymagania funkcjonalne z PRD:**

- ✅ Punkt 1: Rejestracja i logowanie konta rodzica (e-mail + hasło)
- ✅ Punkt 3: Wybór profilu dziecka po zalogowaniu rodzica (przekierowanie do /profiles)
- ✅ Punkt 15: Bezpieczna sesja – token Supabase (JWT w httpOnly cookies), wylogowanie

**Granice produktu (zgodność):**

- ✅ Brak aplikacji mobilnej - UI zoptymalizowane pod tablet/desktop (landscape)
- ✅ Brak onboardingu/tutoriala wizualnego w MVP

---

## 2. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 2.1 Struktura stron i komponentów

#### 2.1.1 Strony Astro (SSR)

**A. `/src/pages/register.astro` - Strona rejestracji**

**Odpowiedzialność:**

- Server-side: Sprawdzenie czy użytkownik jest już zalogowany (przekierowanie do `/profiles`)
- Server-side: Renderowanie layoutu i osadzenie formularza React
- Client-side: Delegacja logiki formularza do komponentu React

**Struktura:**

```typescript
// Frontmatter (server-side)
- Odczyt cookie 'sb-access-token'
- Jeśli token istnieje: Astro.redirect('/profiles')
- Jeśli brak tokena: renderowanie strony

// Template
- Layout z tytułem "Rejestracja - Rytmik"
- Kontener z centrowaniem
- Komponent RegisterForm (client:load)
- Link do strony logowania
```

**Integracja z backendem:**

- Brak bezpośredniej integracji - strona tylko renderuje UI
- Formularz React komunikuje się z API endpoint `/api/auth/register`

---

**B. `/src/pages/login.astro` - Strona logowania**

**Odpowiedzialność:**

- Server-side: Sprawdzenie czy użytkownik jest już zalogowany (przekierowanie do `/profiles`)
- Server-side: Renderowanie layoutu i osadzenie formularza React
- Client-side: Delegacja logiki formularza do komponentu React

**Struktura:**

```typescript
// Frontmatter (server-side)
- Odczyt cookie 'sb-access-token'
- Jeśli token istnieje: Astro.redirect('/profiles')
- Jeśli brak tokena: renderowanie strony

// Template
- Layout z tytułem "Logowanie - Rytmik"
- Kontener z centrowaniem
- Komponent LoginForm (client:load)
- Link do strony rejestracji
- Link do strony odzyskiwania hasła
```

**Integracja z backendem:**

- Brak bezpośredniej integracji - strona tylko renderuje UI
- Formularz React komunikuje się z API endpoint `/api/auth/login`

---

**C. `/src/pages/forgot-password.astro` - Strona odzyskiwania hasła**

**Odpowiedzialność:**

- Server-side: Sprawdzenie czy użytkownik jest już zalogowany (przekierowanie do `/profiles`)
- Server-side: Renderowanie layoutu i osadzenie formularza React

**Struktura:**

```typescript
// Frontmatter (server-side)
- Odczyt cookie 'sb-access-token'
- Jeśli token istnieje: Astro.redirect('/profiles')
- Jeśli brak tokena: renderowanie strony

// Template
- Layout z tytułem "Odzyskiwanie hasła - Rytmik"
- Kontener z centrowaniem
- Komponent ForgotPasswordForm (client:load)
- Link powrotny do strony logowania
```

**Integracja z backendem:**

- Formularz React komunikuje się z API endpoint `/api/auth/forgot-password`

---

**D. `/src/pages/reset-password.astro` - Strona resetowania hasła**

**Odpowiedzialność:**

- Server-side: Walidacja tokena resetowania z URL query params
- Server-side: Renderowanie formularza zmiany hasła

**Struktura:**

```typescript
// Frontmatter (server-side)
- Odczyt parametrów: access_token i refresh_token z URL
- Jeśli brak tokenów: przekierowanie do /forgot-password z błędem
- Jeśli tokeny obecne: renderowanie strony

// Template
- Layout z tytułem "Ustaw nowe hasło - Rytmik"
- Kontener z centrowaniem
- Komponent ResetPasswordForm (client:load) z przekazaniem tokenów
```

**Integracja z backendem:**

- Formularz React komunikuje się z API endpoint `/api/auth/reset-password`

---

**E. `/src/pages/profiles.astro` - Strona wyboru profilu dziecka (CHRONIONA)**

**Odpowiedzialność:**

- Server-side: Weryfikacja autentykacji użytkownika
- Server-side: Pobranie listy profili dzieci dla zalogowanego rodzica
- Server-side: Renderowanie dashboardu z profilami

**Struktura:**

```typescript
// Frontmatter (server-side)
- Odczyt cookie 'sb-access-token'
- Jeśli brak tokena: Astro.redirect('/login')
- Weryfikacja tokena przez Supabase: supabase.auth.getUser()
- Jeśli token nieważny: usunięcie cookie i Astro.redirect('/login')
- Pobranie profili dzieci: GET /api/profiles (internal fetch z tokenem)
- Przekazanie danych do komponentu

// Template
- Layout z tytułem "Moje profile - Rytmik"
- HeaderAuthenticated (z przyciskiem wylogowania)
- ProfilesList (client:load) - lista profili z możliwością wyboru
- Przycisk "Dodaj nowy profil"
```

**Integracja z backendem:**

- Server-side fetch do `/api/profiles` z nagłówkiem Authorization
- Client-side: ProfilesList może odświeżać dane po dodaniu/usunięciu profilu

---

**F. Aktualizacja `/src/pages/index.astro` - Strona główna (publiczna)**

**Istniejąca funkcjonalność:**

```typescript
// Obecny kod (linie 9-15)
const token = Astro.cookies.get("sb-access-token");
const isAuthenticated = !!token?.value;

if (isAuthenticated) {
  return Astro.redirect("/profiles");
}
```

**Bez zmian** - mechanizm już istnieje i działa poprawnie.

---

#### 2.1.2 Komponenty React (Client-side)

**A. `/src/components/auth/RegisterForm.tsx` - Formularz rejestracji**

**Odpowiedzialność:**

- Zarządzanie stanem formularza (e-mail, hasło, potwierdzenie hasła)
- Walidacja danych po stronie klienta (przed wysłaniem)
- Komunikacja z API endpoint `/api/auth/register`
- Obsługa błędów i komunikatów sukcesu
- Przekierowanie po udanej rejestracji

**Stan komponentu:**

```typescript
interface RegisterFormState {
  email: string;
  password: string;
  confirmPassword: string;
  isSubmitting: boolean;
  errors: {
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  };
  successMessage?: string;
}
```

**Walidacja client-side:**

- E-mail: Format RFC 5322 (regex), niepusty
- Hasło: Min. 8 znaków, zawiera wielką literę, małą literę, cyfrę, znak specjalny
- Potwierdzenie hasła: Musi być identyczne z hasłem
- Walidacja na blur (onBlur) i przed submitem

**Flow interakcji:**

1. Użytkownik wypełnia formularz
2. Walidacja na blur dla każdego pola
3. Kliknięcie "Zarejestruj się":
   - Walidacja wszystkich pól
   - Jeśli błędy: wyświetlenie komunikatów, przerwanie
   - Jeśli OK: POST /api/auth/register
4. Odpowiedź API:
   - 201 Created: Komunikat sukcesu + przekierowanie do /login po 2s
   - 400 Bad Request: Wyświetlenie błędów walidacji
   - 409 Conflict: "Użytkownik z tym e-mailem już istnieje"
   - 500 Internal Error: "Wystąpił błąd, spróbuj ponownie"

**Dostępność (a11y):**

- Aria-labels dla pól formularza
- Aria-invalid i aria-describedby dla błędów walidacji
- Focus management (pierwszy błąd otrzymuje focus)
- Komunikaty błędów czytane przez screen reader (aria-live="polite")

---

**B. `/src/components/auth/LoginForm.tsx` - Formularz logowania**

**Odpowiedzialność:**

- Zarządzanie stanem formularza (e-mail, hasło)
- Walidacja danych po stronie klienta
- Komunikacja z API endpoint `/api/auth/login`
- Zapis tokena w cookie po udanym logowaniu
- Przekierowanie do `/profiles` po sukcesie

**Stan komponentu:**

```typescript
interface LoginFormState {
  email: string;
  password: string;
  isSubmitting: boolean;
  errors: {
    email?: string;
    password?: string;
    general?: string;
  };
}
```

**Walidacja client-side:**

- E-mail: Format RFC 5322, niepusty
- Hasło: Niepuste (brak dodatkowych wymagań przy logowaniu)

**Flow interakcji:**

1. Użytkownik wypełnia formularz
2. Kliknięcie "Zaloguj się":
   - Walidacja pól
   - Jeśli błędy: wyświetlenie komunikatów, przerwanie
   - Jeśli OK: POST /api/auth/login
3. Odpowiedź API:
   - 200 OK:
     - Zapisanie tokena w cookie (httpOnly, secure, sameSite=strict)
     - Przekierowanie do /profiles (window.location.href)
   - 400 Bad Request: Wyświetlenie błędów walidacji
   - 401 Unauthorized: "Nieprawidłowy e-mail lub hasło"
   - 500 Internal Error: "Wystąpił błąd, spróbuj ponownie"

**Uwaga:** Zapis cookie odbywa się przez API endpoint (Set-Cookie header), nie przez JavaScript.

---

**C. `/src/components/auth/ForgotPasswordForm.tsx` - Formularz odzyskiwania hasła**

**Odpowiedzialność:**

- Zarządzanie stanem formularza (e-mail)
- Walidacja e-maila
- Komunikacja z API endpoint `/api/auth/forgot-password`
- Wyświetlenie komunikatu o wysłaniu e-maila

**Stan komponentu:**

```typescript
interface ForgotPasswordFormState {
  email: string;
  isSubmitting: boolean;
  errors: {
    email?: string;
    general?: string;
  };
  successMessage?: string;
}
```

**Flow interakcji:**

1. Użytkownik wpisuje e-mail
2. Kliknięcie "Wyślij link resetujący":
   - Walidacja e-maila
   - POST /api/auth/forgot-password
3. Odpowiedź API:
   - 200 OK: "Link do resetowania hasła został wysłany na podany adres e-mail"
   - 400 Bad Request: Błąd walidacji
   - 500 Internal Error: "Wystąpił błąd, spróbuj ponownie"

**Uwaga bezpieczeństwa:** Zawsze zwracamy sukces, nawet jeśli e-mail nie istnieje w bazie (zapobieganie enumeracji użytkowników).

---

**D. `/src/components/auth/ResetPasswordForm.tsx` - Formularz resetowania hasła**

**Odpowiedzialność:**

- Zarządzanie stanem formularza (nowe hasło, potwierdzenie)
- Walidacja hasła
- Komunikacja z API endpoint `/api/auth/reset-password`
- Przekierowanie do logowania po sukcesie

**Props:**

```typescript
interface ResetPasswordFormProps {
  accessToken: string;
  refreshToken: string;
}
```

**Stan komponentu:**

```typescript
interface ResetPasswordFormState {
  password: string;
  confirmPassword: string;
  isSubmitting: boolean;
  errors: {
    password?: string;
    confirmPassword?: string;
    general?: string;
  };
  successMessage?: string;
}
```

**Flow interakcji:**

1. Użytkownik wpisuje nowe hasło i potwierdzenie
2. Kliknięcie "Ustaw nowe hasło":
   - Walidacja hasła (jak w rejestracji)
   - POST /api/auth/reset-password z tokenami
3. Odpowiedź API:
   - 200 OK: Komunikat sukcesu + przekierowanie do /login po 2s
   - 400 Bad Request: Błędy walidacji
   - 401 Unauthorized: "Link resetujący wygasł lub jest nieprawidłowy"
   - 500 Internal Error: "Wystąpił błąd, spróbuj ponownie"

---

**E. `/src/components/auth/HeaderAuthenticated.tsx` - Nagłówek dla zalogowanych użytkowników**

**Odpowiedzialność:**

- Wyświetlenie logo i nazwy aplikacji
- Wyświetlenie e-maila zalogowanego użytkownika
- Przycisk wylogowania z obsługą kliknięcia

**Props:**

```typescript
interface HeaderAuthenticatedProps {
  userEmail: string;
}
```

**Flow wylogowania:**

1. Kliknięcie "Wyloguj się"
2. POST /api/auth/logout
3. Odpowiedź API:
   - 200 OK: Przekierowanie do / (window.location.href)
   - Błąd: Wyświetlenie komunikatu, ale i tak przekierowanie

---

**F. Aktualizacja `/src/components/public/HeaderPublic.tsx`**

**Istniejący kod (linie 20-32):**

```tsx
<nav className="flex items-center space-x-4">
  <Button variant="ghost" asChild className="font-medium">
    <a href="/login">Zaloguj się</a>
  </Button>
  <Button asChild className="font-medium">
    <a href="/register">Zarejestruj się</a>
  </Button>
</nav>
```

**Bez zmian** - linki już prowadzą do właściwych stron.

---

#### 2.1.3 Komponenty współdzielone UI

**A. `/src/components/ui/input.tsx` - Komponent pola tekstowego (NOWY)**

**Odpowiedzialność:**

- Stylizowany input zgodny z Shadcn/ui
- Obsługa stanów: default, focus, error, disabled
- Integracja z aria-invalid i aria-describedby

**Props:**

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}
```

**Styl:**

- Bazuje na Tailwind 4
- Warianty: default, error (czerwona obwódka)
- Focus ring zgodny z buttonVariants
- Disabled: opacity-50, pointer-events-none

---

**B. `/src/components/ui/label.tsx` - Komponent etykiety (NOWY)**

**Odpowiedzialność:**

- Stylizowana etykieta dla pól formularza
- Obsługa required indicator (\*)

**Props:**

```typescript
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}
```

---

**C. `/src/components/ui/alert.tsx` - Komponent komunikatu (NOWY)**

**Odpowiedzialność:**

- Wyświetlanie komunikatów: sukces, błąd, info, ostrzeżenie
- Ikony odpowiadające typowi komunikatu

**Props:**

```typescript
interface AlertProps {
  variant: "success" | "error" | "info" | "warning";
  children: React.ReactNode;
}
```

---

### 2.2 Walidacja i komunikaty błędów

#### 2.2.1 Walidacja po stronie klienta (React)

**E-mail:**

- Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Komunikat błędu: "Podaj prawidłowy adres e-mail"

**Hasło (przy rejestracji i resecie):**

- Min. 8 znaków: "Hasło musi mieć co najmniej 8 znaków"
- Wielka litera: "Hasło musi zawierać co najmniej jedną wielką literę"
- Mała litera: "Hasło musi zawierać co najmniej jedną małą literę"
- Cyfra: "Hasło musi zawierać co najmniej jedną cyfrę"
- Znak specjalny: "Hasło musi zawierać co najmniej jeden znak specjalny (!@#$%^&\*)"

**Potwierdzenie hasła:**

- Musi być identyczne: "Hasła muszą być identyczne"

#### 2.2.2 Komunikaty błędów API

**Rejestracja:**

- 400 Bad Request: Wyświetlenie szczegółowych błędów walidacji z API
- 409 Conflict: "Użytkownik z tym adresem e-mail już istnieje"
- 500 Internal Error: "Wystąpił błąd podczas rejestracji. Spróbuj ponownie później."

**Logowanie:**

- 400 Bad Request: Wyświetlenie błędów walidacji
- 401 Unauthorized: "Nieprawidłowy adres e-mail lub hasło"
- 500 Internal Error: "Wystąpił błąd podczas logowania. Spróbuj ponownie później."

**Odzyskiwanie hasła:**

- 400 Bad Request: Błędy walidacji e-maila
- 200 OK (zawsze): "Jeśli podany adres e-mail istnieje w naszej bazie, wyślemy na niego link do resetowania hasła"

**Resetowanie hasła:**

- 400 Bad Request: Błędy walidacji hasła
- 401 Unauthorized: "Link resetujący wygasł lub jest nieprawidłowy. Wygeneruj nowy link."
- 500 Internal Error: "Wystąpił błąd podczas resetowania hasła. Spróbuj ponownie później."

#### 2.2.3 Komunikaty sukcesu

**Rejestracja:**

- "Konto zostało utworzone! Za chwilę zostaniesz przekierowany do strony logowania."

**Logowanie:**

- Brak komunikatu (natychmiastowe przekierowanie)

**Odzyskiwanie hasła:**

- "Link do resetowania hasła został wysłany na podany adres e-mail. Sprawdź swoją skrzynkę."

**Resetowanie hasła:**

- "Hasło zostało zmienione! Za chwilę zostaniesz przekierowany do strony logowania."

---

### 2.3 Obsługa najważniejszych scenariuszy

#### 2.3.1 Scenariusz: Udana rejestracja

1. Użytkownik otwiera `/register`
2. Wypełnia formularz: e-mail, hasło, potwierdzenie hasła
3. Kliknięcie "Zarejestruj się"
4. Walidacja client-side: OK
5. POST /api/auth/register
6. API: 201 Created
7. Wyświetlenie komunikatu sukcesu
8. Automatyczne przekierowanie do `/login` po 2 sekundach

#### 2.3.2 Scenariusz: Rejestracja - użytkownik już istnieje

1. Użytkownik otwiera `/register`
2. Wypełnia formularz z istniejącym e-mailem
3. Kliknięcie "Zarejestruj się"
4. POST /api/auth/register
5. API: 409 Conflict
6. Wyświetlenie błędu: "Użytkownik z tym adresem e-mail już istnieje"
7. Focus na polu e-mail
8. Użytkownik może poprawić dane lub przejść do logowania

#### 2.3.3 Scenariusz: Udane logowanie

1. Użytkownik otwiera `/login`
2. Wypełnia formularz: e-mail, hasło
3. Kliknięcie "Zaloguj się"
4. POST /api/auth/login
5. API: 200 OK + Set-Cookie (sb-access-token, sb-refresh-token)
6. Natychmiastowe przekierowanie do `/profiles`
7. Server-side: Weryfikacja tokena, pobranie profili dzieci
8. Wyświetlenie dashboardu z profilami

#### 2.3.4 Scenariusz: Logowanie - błędne dane

1. Użytkownik otwiera `/login`
2. Wypełnia formularz z błędnym hasłem
3. Kliknięcie "Zaloguj się"
4. POST /api/auth/login
5. API: 401 Unauthorized
6. Wyświetlenie błędu: "Nieprawidłowy adres e-mail lub hasło"
7. Focus na polu hasła
8. Użytkownik może spróbować ponownie lub przejść do odzyskiwania hasła

#### 2.3.5 Scenariusz: Odzyskiwanie hasła

1. Użytkownik otwiera `/forgot-password`
2. Wpisuje e-mail
3. Kliknięcie "Wyślij link resetujący"
4. POST /api/auth/forgot-password
5. API: 200 OK
6. Wyświetlenie komunikatu: "Link wysłany na e-mail"
7. Użytkownik sprawdza pocztę
8. Kliknięcie linku w e-mailu: otwiera `/reset-password?access_token=...&refresh_token=...`
9. Wpisanie nowego hasła i potwierdzenia
10. POST /api/auth/reset-password
11. API: 200 OK
12. Komunikat sukcesu + przekierowanie do `/login`

#### 2.3.6 Scenariusz: Próba dostępu do chronionej strony bez logowania

1. Użytkownik (niezalogowany) próbuje otworzyć `/profiles`
2. Server-side: Brak cookie 'sb-access-token'
3. Astro.redirect('/login')
4. Wyświetlenie strony logowania

#### 2.3.7 Scenariusz: Wylogowanie

1. Użytkownik (zalogowany) jest na `/profiles`
2. Kliknięcie "Wyloguj się" w HeaderAuthenticated
3. POST /api/auth/logout
4. API: 200 OK + Clear-Cookie (usunięcie tokenów)
5. Przekierowanie do `/` (strona główna)

---

## 3. LOGIKA BACKENDOWA

### 3.1 Struktura endpointów API

Wszystkie endpointy autentykacji znajdują się w `/src/pages/api/auth/`.

#### 3.1.1 POST `/api/auth/register` - Rejestracja użytkownika

**Lokalizacja:** `/src/pages/api/auth/register.ts`

**Odpowiedzialność:**

- Walidacja danych wejściowych (e-mail, hasło)
- Rejestracja użytkownika przez Supabase Auth
- Zwrócenie odpowiedzi sukcesu lub błędu

**Request Body:**

```typescript
{
  email: string; // RFC 5322 format
  password: string; // Min. 8 znaków, wymagania jak w walidacji client-side
}
```

**Response:**

_201 Created:_

```typescript
{
  message: "Użytkownik został zarejestrowany pomyślnie";
}
```

_400 Bad Request:_

```typescript
{
  error: "invalid_request",
  message: "Validation failed",
  details: {
    email?: string,
    password?: string
  }
}
```

_409 Conflict:_

```typescript
{
  error: "conflict",
  message: "Użytkownik z tym adresem e-mail już istnieje"
}
```

_500 Internal Server Error:_

```typescript
{
  error: "internal_error",
  message: "An unexpected error occurred"
}
```

**Implementacja:**

1. Walidacja request body przez Zod schema (`registerSchema`)
2. Wywołanie `supabase.auth.signUp({ email, password })`
3. Obsługa błędów:
   - Supabase zwraca błąd "User already registered": 409 Conflict
   - Inne błędy: 500 Internal Server Error
4. Sukces: 201 Created

**Uwaga:** Nie logujemy użytkownika automatycznie po rejestracji. Użytkownik musi się zalogować.

---

#### 3.1.2 POST `/api/auth/login` - Logowanie użytkownika

**Lokalizacja:** `/src/pages/api/auth/login.ts`

**Odpowiedzialność:**

- Walidacja danych wejściowych
- Logowanie przez Supabase Auth
- Ustawienie cookie z tokenami sesji (httpOnly, secure, sameSite)
- Zwrócenie odpowiedzi sukcesu lub błędu

**Request Body:**

```typescript
{
  email: string;
  password: string;
}
```

**Response:**

_200 OK:_

```typescript
{
  message: "Zalogowano pomyślnie";
}
```

**Headers:**

```
Set-Cookie: sb-access-token=<JWT>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400
Set-Cookie: sb-refresh-token=<REFRESH_TOKEN>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800
```

_400 Bad Request:_

```typescript
{
  error: "invalid_request",
  message: "Validation failed",
  details: { ... }
}
```

_401 Unauthorized:_

```typescript
{
  error: "unauthorized",
  message: "Nieprawidłowy adres e-mail lub hasło"
}
```

_500 Internal Server Error:_

```typescript
{
  error: "internal_error",
  message: "An unexpected error occurred"
}
```

**Implementacja:**

1. Walidacja request body przez Zod schema (`loginSchema`)
2. Wywołanie `supabase.auth.signInWithPassword({ email, password })`
3. Obsługa błędów:
   - Supabase zwraca błąd autentykacji: 401 Unauthorized
   - Inne błędy: 500 Internal Server Error
4. Sukces:
   - Ustawienie cookie `sb-access-token` (access token)
   - Ustawienie cookie `sb-refresh-token` (refresh token)
   - Zwrócenie 200 OK

**Parametry cookie:**

- `HttpOnly`: Zapobiega dostępowi przez JavaScript (XSS protection)
- `Secure`: Tylko HTTPS (w produkcji)
- `SameSite=Strict`: CSRF protection
- `Max-Age`: 86400s (24h) dla access token, 604800s (7 dni) dla refresh token

**Uwaga dotycząca US-002:** PRD wymaga sesji trwającej minimum 24h. Access token jest ustawiony na 24h, co spełnia to wymaganie. Refresh token (7 dni) pozwala na przedłużenie sesji bez ponownego logowania.

---

#### 3.1.3 POST `/api/auth/logout` - Wylogowanie użytkownika

**Lokalizacja:** `/src/pages/api/auth/logout.ts`

**Odpowiedzialność:**

- Wylogowanie użytkownika z Supabase Auth
- Usunięcie cookie z tokenami
- Zwrócenie odpowiedzi sukcesu

**Request:** Brak body

**Response:**

_200 OK:_

```typescript
{
  message: "Wylogowano pomyślnie";
}
```

**Headers:**

```
Set-Cookie: sb-access-token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0
Set-Cookie: sb-refresh-token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0
```

**Implementacja:**

1. Odczyt tokena z cookie `sb-access-token`
2. Jeśli token istnieje: `supabase.auth.signOut()`
3. Usunięcie cookie (Max-Age=0)
4. Zwrócenie 200 OK

**Uwaga:** Endpoint nie wymaga autentykacji (może być wywołany nawet bez tokena).

---

#### 3.1.4 POST `/api/auth/forgot-password` - Wysłanie linku resetującego hasło

**Lokalizacja:** `/src/pages/api/auth/forgot-password.ts`

**Odpowiedzialność:**

- Walidacja e-maila
- Wysłanie e-maila z linkiem resetującym przez Supabase Auth
- Zwrócenie odpowiedzi sukcesu (zawsze, nawet jeśli e-mail nie istnieje)

**Request Body:**

```typescript
{
  email: string;
}
```

**Response:**

_200 OK (zawsze):_

```typescript
{
  message: "Jeśli podany adres e-mail istnieje w naszej bazie, wyślemy na niego link do resetowania hasła";
}
```

_400 Bad Request:_

```typescript
{
  error: "invalid_request",
  message: "Validation failed",
  details: { email: string }
}
```

**Implementacja:**

1. Walidacja e-maila przez Zod schema
2. Wywołanie `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://app.rytmik.pl/reset-password' })`
3. Zwrócenie 200 OK (niezależnie od wyniku)

**Uwaga bezpieczeństwa:** Zawsze zwracamy sukces, aby uniemożliwić enumerację użytkowników.

**Konfiguracja Supabase:**

- Redirect URL: `https://app.rytmik.pl/reset-password` (lub `http://localhost:3000/reset-password` w dev)
- E-mail template: Supabase domyślny lub customowy z linkiem zawierającym `access_token` i `refresh_token`

---

#### 3.1.5 POST `/api/auth/reset-password` - Ustawienie nowego hasła

**Lokalizacja:** `/src/pages/api/auth/reset-password.ts`

**Odpowiedzialność:**

- Walidacja tokena resetowania z body
- Walidacja nowego hasła
- Ustawienie nowego hasła przez Supabase Auth
- Zwrócenie odpowiedzi sukcesu lub błędu

**Request Body:**

```typescript
{
  accessToken: string; // Token z linku w e-mailu
  refreshToken: string; // Token z linku w e-mailu
  password: string; // Nowe hasło
}
```

**Response:**

_200 OK:_

```typescript
{
  message: "Hasło zostało zmienione pomyślnie";
}
```

_400 Bad Request:_

```typescript
{
  error: "invalid_request",
  message: "Validation failed",
  details: { password: string }
}
```

_401 Unauthorized:_

```typescript
{
  error: "unauthorized",
  message: "Link resetujący wygasł lub jest nieprawidłowy"
}
```

_500 Internal Server Error:_

```typescript
{
  error: "internal_error",
  message: "An unexpected error occurred"
}
```

**Implementacja:**

1. Walidacja request body przez Zod schema (`resetPasswordSchema`)
2. Utworzenie Supabase client z tokenami:
   ```typescript
   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
     global: {
       headers: {
         Authorization: `Bearer ${accessToken}`,
       },
     },
   });
   ```
3. Wywołanie `supabase.auth.updateUser({ password })`
4. Obsługa błędów:
   - Token nieważny/wygasły: 401 Unauthorized
   - Inne błędy: 500 Internal Server Error
5. Sukces: 200 OK

---

### 3.2 Schematy walidacji Zod

**Lokalizacja:** `/src/lib/schemas/auth.schema.ts`

#### 3.2.1 registerSchema

```typescript
export const registerSchema = z.object({
  email: z.string().min(1, "E-mail jest wymagany").email("Podaj prawidłowy adres e-mail"),
  password: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę")
    .regex(/[a-z]/, "Hasło musi zawierać co najmniej jedną małą literę")
    .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Hasło musi zawierać co najmniej jeden znak specjalny"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
```

#### 3.2.2 loginSchema

```typescript
export const loginSchema = z.object({
  email: z.string().min(1, "E-mail jest wymagany").email("Podaj prawidłowy adres e-mail"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

#### 3.2.3 forgotPasswordSchema

```typescript
export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "E-mail jest wymagany").email("Podaj prawidłowy adres e-mail"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
```

#### 3.2.4 resetPasswordSchema

```typescript
export const resetPasswordSchema = z.object({
  accessToken: z.string().min(1, "Token dostępu jest wymagany"),
  refreshToken: z.string().min(1, "Token odświeżania jest wymagany"),
  password: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę")
    .regex(/[a-z]/, "Hasło musi zawierać co najmniej jedną małą literę")
    .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Hasło musi zawierać co najmniej jeden znak specjalny"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
```

---

### 3.3 Serwis autentykacji

**Lokalizacja:** `/src/lib/services/auth.service.ts`

**Odpowiedzialność:**

- Enkapsulacja logiki biznesowej autentykacji
- Komunikacja z Supabase Auth
- Transformacja błędów Supabase na wewnętrzne typy błędów

#### 3.3.1 Interfejs AuthService

```typescript
export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Rejestracja nowego użytkownika
   * @throws ConflictError jeśli użytkownik już istnieje
   * @throws Error dla innych błędów
   */
  async register(email: string, password: string): Promise<void>;

  /**
   * Logowanie użytkownika
   * @returns { accessToken, refreshToken }
   * @throws UnauthorizedError jeśli dane nieprawidłowe
   * @throws Error dla innych błędów
   */
  async login(
    email: string,
    password: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }>;

  /**
   * Wylogowanie użytkownika
   */
  async logout(): Promise<void>;

  /**
   * Wysłanie e-maila z linkiem resetującym hasło
   * @param redirectUrl URL do przekierowania po kliknięciu linku
   */
  async sendPasswordResetEmail(email: string, redirectUrl: string): Promise<void>;

  /**
   * Resetowanie hasła z tokenem
   * @throws UnauthorizedError jeśli token nieważny
   * @throws Error dla innych błędów
   */
  async resetPassword(accessToken: string, refreshToken: string, newPassword: string): Promise<void>;

  /**
   * Weryfikacja czy użytkownik jest zalogowany
   * @returns User object lub null
   */
  async getCurrentUser(): Promise<User | null>;
}
```

#### 3.3.2 Implementacja metod

**register:**

```typescript
async register(email: string, password: string): Promise<void> {
  const { error } = await this.supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("already registered")) {
      throw new ConflictError("Użytkownik z tym adresem e-mail już istnieje");
    }
    throw new Error(`Registration failed: ${error.message}`);
  }
}
```

**login:**

```typescript
async login(email: string, password: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const { data, error } = await this.supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new UnauthorizedError("Nieprawidłowy adres e-mail lub hasło");
  }

  if (!data.session) {
    throw new Error("No session returned from Supabase");
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
}
```

**logout:**

```typescript
async logout(): Promise<void> {
  await this.supabase.auth.signOut();
}
```

**sendPasswordResetEmail:**

```typescript
async sendPasswordResetEmail(email: string, redirectUrl: string): Promise<void> {
  await this.supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });
  // Zawsze sukces (nie rzucamy błędu nawet jeśli e-mail nie istnieje)
}
```

**resetPassword:**

```typescript
async resetPassword(
  accessToken: string,
  refreshToken: string,
  newPassword: string
): Promise<void> {
  // Utworzenie klienta z tokenami
  const supabaseWithToken = createClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );

  const { error } = await supabaseWithToken.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    if (error.message.includes("expired") || error.message.includes("invalid")) {
      throw new UnauthorizedError("Link resetujący wygasł lub jest nieprawidłowy");
    }
    throw new Error(`Password reset failed: ${error.message}`);
  }
}
```

**getCurrentUser:**

```typescript
async getCurrentUser(): Promise<User | null> {
  const { data, error } = await this.supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}
```

---

### 3.4 Obsługa wyjątków

Wszystkie endpointy API używają wspólnego wzorca obsługi błędów:

```typescript
try {
  // Logika endpointu
} catch (error) {
  if (error instanceof ValidationError) {
    return new Response(
      JSON.stringify({
        error: "invalid_request",
        message: "Validation failed",
        details: error.details,
      } as APIErrorResponse),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

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
        error: "unauthorized",
        message: error.message,
      } as APIErrorResponse),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Log unexpected errors (bez danych wrażliwych)
  console.error("Unexpected error in API endpoint:", {
    error: error instanceof Error ? error.message : "Unknown error",
    timestamp: new Date().toISOString(),
  });

  return new Response(
    JSON.stringify({
      error: "internal_error",
      message: "An unexpected error occurred",
    } as APIErrorResponse),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

**Rozszerzenie istniejących klas błędów:**

Plik `/src/lib/errors/api-errors.ts` już zawiera wszystkie potrzebne klasy:

- `ValidationError` (400)
- `ConflictError` (409)
- `UnauthorizedError` (401)
- `NotFoundError` (404)

Nie wymaga zmian.

---

### 3.5 Aktualizacja renderowania server-side

#### 3.5.1 Middleware Astro

**Lokalizacja:** `/src/middleware/index.ts`

**Istniejący kod (linie 19-39):**

```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  // Extract JWT from Authorization header
  const authHeader = context.request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  // Create Supabase client with token (if present)
  if (token) {
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    context.locals.supabase = supabase;
  } else {
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
    context.locals.supabase = supabase;
  }

  const response = await next();
  // ... security headers ...
  return response;
});
```

**Wymagana modyfikacja:**

Middleware musi również sprawdzać cookie `sb-access-token` (nie tylko nagłówek Authorization):

```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  // Extract JWT from Authorization header OR cookie
  const authHeader = context.request.headers.get("Authorization");
  let token = authHeader?.replace("Bearer ", "");

  // If no Authorization header, check cookie
  if (!token) {
    const cookieToken = context.cookies.get("sb-access-token");
    token = cookieToken?.value;
  }

  // Create Supabase client with token (if present)
  if (token) {
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    context.locals.supabase = supabase;
  } else {
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
    context.locals.supabase = supabase;
  }

  const response = await next();
  // ... security headers (bez zmian) ...
  return response;
});
```

**Uzasadnienie:**

- Endpointy API używają nagłówka `Authorization` (z frontendu React)
- Strony Astro SSR używają cookie `sb-access-token`
- Middleware musi obsługiwać oba przypadki

---

#### 3.5.2 Strony chronione

**Wzorzec dla stron wymagających autentykacji:**

```typescript
---
// Przykład: /src/pages/profiles.astro

// Sprawdzenie autentykacji
const token = Astro.cookies.get('sb-access-token');

if (!token?.value) {
  return Astro.redirect('/login');
}

// Weryfikacja tokena
const supabase = Astro.locals.supabase;
const { data: { user }, error } = await supabase.auth.getUser();

if (error || !user) {
  // Token nieważny - usunięcie cookie i przekierowanie
  Astro.cookies.delete('sb-access-token');
  Astro.cookies.delete('sb-refresh-token');
  return Astro.redirect('/login');
}

// Token OK - pobranie danych
// ... logika strony ...
---
```

**Zastosowanie:**

- `/src/pages/profiles.astro` - dashboard profili dzieci
- Przyszłe strony gry (poza zakresem tej specyfikacji)

---

## 4. SYSTEM AUTENTYKACJI

### 4.1 Wykorzystanie Supabase Auth

#### 4.1.1 Konfiguracja Supabase

**Zmienne środowiskowe:**

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Konfiguracja w Supabase Dashboard:**

1. **Authentication > Providers:**
   - Email provider: Enabled
   - Confirm email: Disabled (dla MVP, można włączyć później)
   - Secure email change: Enabled

2. **Authentication > Email Templates:**
   - Reset Password template:
     ```html
     <h2>Zresetuj hasło</h2>
     <p>Kliknij poniższy link, aby ustawić nowe hasło:</p>
     <p><a href="{{ .ConfirmationURL }}">Zresetuj hasło</a></p>
     <p>Link wygasa po 1 godzinie.</p>
     ```
   - Confirmation URL format: `{{ .SiteURL }}/reset-password?access_token={{ .Token }}&refresh_token={{ .RefreshToken }}`

3. **Authentication > URL Configuration:**
   - Site URL: `https://app.rytmik.pl` (produkcja) lub `http://localhost:3000` (dev)
   - Redirect URLs:
     - `https://app.rytmik.pl/reset-password`
     - `http://localhost:3000/reset-password`

4. **Authentication > Settings:**
   - JWT expiry: 86400 seconds (24 hours) - zgodnie z US-002
   - Refresh token expiry: 604800 seconds (7 days)
   - Minimum password length: 8

---

#### 4.1.2 Flow rejestracji

```
User                    Frontend (React)         API Endpoint           Supabase Auth
  |                           |                        |                      |
  |-- Wypełnia formularz ---->|                        |                      |
  |                           |                        |                      |
  |-- Kliknięcie "Zarejestruj"|                       |                      |
  |                           |                        |                      |
  |                           |-- POST /api/auth/register                    |
  |                           |                        |                      |
  |                           |                        |-- signUp(email, pwd) |
  |                           |                        |                      |
  |                           |                        |<-- User created -----|
  |                           |                        |                      |
  |                           |<-- 201 Created --------|                      |
  |                           |                        |                      |
  |<-- Komunikat sukcesu -----|                        |                      |
  |                           |                        |                      |
  |-- Przekierowanie do /login                         |                      |
```

**Uwagi:**

- Użytkownik nie jest automatycznie logowany po rejestracji
- Brak e-maila potwierdzającego w MVP (można włączyć później)
- Hasło jest hashowane przez Supabase (bcrypt)

---

#### 4.1.3 Flow logowania

```
User                    Frontend (React)         API Endpoint           Supabase Auth
  |                           |                        |                      |
  |-- Wypełnia formularz ---->|                        |                      |
  |                           |                        |                      |
  |-- Kliknięcie "Zaloguj" ---|                        |                      |
  |                           |                        |                      |
  |                           |-- POST /api/auth/login |                      |
  |                           |                        |                      |
  |                           |                        |-- signInWithPassword |
  |                           |                        |                      |
  |                           |                        |<-- Session + tokens--|
  |                           |                        |                      |
  |                           |<-- 200 OK + Set-Cookie |                      |
  |                           |    (sb-access-token)   |                      |
  |                           |    (sb-refresh-token)  |                      |
  |                           |                        |                      |
  |-- Przekierowanie do /profiles                      |                      |
  |                           |                        |                      |
  |-- GET /profiles (SSR) ----|                        |                      |
  |                           |                        |                      |
  |<-- Strona z profilami ----|                        |                      |
```

**Uwagi:**

- Tokeny są zapisywane w httpOnly cookies (nie dostępne dla JavaScript)
- Access token wygasa po 24 godzinach (zgodnie z US-002: sesja min. 24h)
- Refresh token wygasa po 7 dniach
- Refresh token może być użyty do uzyskania nowego access tokena (poza zakresem MVP)

---

#### 4.1.4 Flow odzyskiwania hasła

```
User                    Frontend (React)         API Endpoint           Supabase Auth         Email
  |                           |                        |                      |                  |
  |-- Wpisuje e-mail -------->|                        |                      |                  |
  |                           |                        |                      |                  |
  |-- Kliknięcie "Wyślij" ----|                        |                      |                  |
  |                           |                        |                      |                  |
  |                           |-- POST /api/auth/forgot-password             |                  |
  |                           |                        |                      |                  |
  |                           |                        |-- resetPasswordForEmail                 |
  |                           |                        |                      |                  |
  |                           |                        |                      |-- Wysyła e-mail->|
  |                           |                        |                      |                  |
  |                           |<-- 200 OK -------------|                      |                  |
  |                           |                        |                      |                  |
  |<-- Komunikat sukcesu -----|                        |                      |                  |
  |                           |                        |                      |                  |
  |<-- E-mail z linkiem ---------------------------------------------------- |
  |                           |                        |                      |                  |
  |-- Kliknięcie linku w e-mailu                       |                      |                  |
  |                           |                        |                      |                  |
  |-- GET /reset-password?access_token=...&refresh_token=...                 |                  |
  |                           |                        |                      |                  |
  |<-- Strona resetowania ----|                        |                      |                  |
  |                           |                        |                      |                  |
  |-- Wpisuje nowe hasło ---->|                        |                      |                  |
  |                           |                        |                      |                  |
  |                           |-- POST /api/auth/reset-password              |                  |
  |                           |    (accessToken, refreshToken, password)     |                  |
  |                           |                        |                      |                  |
  |                           |                        |-- updateUser(password)                  |
  |                           |                        |                      |                  |
  |                           |                        |<-- Password updated--|                  |
  |                           |                        |                      |                  |
  |                           |<-- 200 OK -------------|                      |                  |
  |                           |                        |                      |                  |
  |<-- Komunikat sukcesu -----|                        |                      |                  |
  |                           |                        |                      |                  |
  |-- Przekierowanie do /login                         |                      |                  |
```

**Uwagi:**

- Link resetujący wygasa po 1 godzinie
- Link może być użyty tylko raz
- E-mail zawiera `access_token` i `refresh_token` jako query params

---

#### 4.1.5 Flow wylogowania

```
User                    Frontend (React)         API Endpoint           Supabase Auth
  |                           |                        |                      |
  |-- Kliknięcie "Wyloguj" -->|                        |                      |
  |                           |                        |                      |
  |                           |-- POST /api/auth/logout                       |
  |                           |                        |                      |
  |                           |                        |-- signOut() -------->|
  |                           |                        |                      |
  |                           |                        |<-- OK ---------------|
  |                           |                        |                      |
  |                           |<-- 200 OK + Clear-Cookie                      |
  |                           |    (sb-access-token)   |                      |
  |                           |    (sb-refresh-token)  |                      |
  |                           |                        |                      |
  |-- Przekierowanie do / ----|                        |                      |
```

---

### 4.2 Zarządzanie sesją

#### 4.2.1 Przechowywanie tokenów

**Cookies (preferowane dla stron Astro SSR):**

- `sb-access-token`: JWT access token
- `sb-refresh-token`: Refresh token

**Parametry:**

- `HttpOnly`: true (zapobiega XSS)
- `Secure`: true w produkcji (tylko HTTPS)
- `SameSite`: Strict (zapobiega CSRF)
- `Path`: /
- `Max-Age`: 86400s (24h) dla access token, 604800s (7 dni) dla refresh token

**Dlaczego cookies, a nie localStorage?**

- HttpOnly cookies są niedostępne dla JavaScript (ochrona przed XSS)
- Cookies są automatycznie wysyłane z każdym żądaniem SSR
- Cookies obsługują SameSite (ochrona przed CSRF)

**Uwaga dotycząca US-003:** PRD wspomina o "LocalStorage/cookies", ale ze względów bezpieczeństwa implementacja używa wyłącznie httpOnly cookies. LocalStorage jest podatny na ataki XSS, ponieważ JavaScript może odczytać tokeny. HttpOnly cookies są niedostępne dla JavaScript, co znacząco zwiększa bezpieczeństwo aplikacji.

---

#### 4.2.2 Weryfikacja sesji

**W stronach Astro (SSR):**

```typescript
const token = Astro.cookies.get("sb-access-token");

if (!token?.value) {
  return Astro.redirect("/login");
}

const supabase = Astro.locals.supabase;
const {
  data: { user },
  error,
} = await supabase.auth.getUser();

if (error || !user) {
  Astro.cookies.delete("sb-access-token");
  Astro.cookies.delete("sb-refresh-token");
  return Astro.redirect("/login");
}

// User zalogowany - kontynuuj
```

**W komponentach React (client-side):**

```typescript
// Komponenty React nie mają bezpośredniego dostępu do httpOnly cookies
// Weryfikacja odbywa się przez wywołanie API endpoint

const checkAuth = async () => {
  const response = await fetch("/api/auth/me", {
    credentials: "include", // Wysyła cookies
  });

  if (!response.ok) {
    // Niezalogowany - przekierowanie
    window.location.href = "/login";
  }

  const user = await response.json();
  return user;
};
```

**Nowy endpoint:** `/src/pages/api/auth/me.ts`

**Odpowiedzialność:**

- Zwrócenie danych zalogowanego użytkownika
- Używany przez komponenty React do weryfikacji sesji

**Response:**

```typescript
// 200 OK
{
  id: string;
  email: string;
}

// 401 Unauthorized
{
  error: "unauthorized",
  message: "Authentication required"
}
```

---

#### 4.2.3 Odświeżanie tokena

**Poza zakresem MVP**, ale warto zaplanować:

Supabase automatycznie odświeża access token gdy:

- Access token wygasł (po 24 godzinach)
- Refresh token jest nadal ważny (do 7 dni)
- Wywołano `supabase.auth.getSession()` lub `supabase.auth.getUser()`

**Implementacja w przyszłości:**

- Middleware sprawdza czy access token wygasł (po 24h)
- Jeśli tak, próbuje odświeżyć używając refresh tokena
- Jeśli refresh token również wygasł (po 7 dniach), przekierowuje do logowania
- Dzięki 24h czasowi życia access tokena, użytkownik może korzystać z aplikacji przez cały dzień bez przerwy (zgodnie z US-002)

---

### 4.3 Bezpieczeństwo

#### 4.3.1 Ochrona przed atakami

**XSS (Cross-Site Scripting):**

- HttpOnly cookies (tokeny niedostępne dla JavaScript)
- CSP headers (już zaimplementowane w middleware)
- Sanityzacja danych wejściowych (React automatycznie escapuje)

**CSRF (Cross-Site Request Forgery):**

- SameSite=Strict cookies
- Origin checking w middleware (opcjonalnie)

**SQL Injection:**

- Supabase używa prepared statements
- RLS policies ograniczają dostęp do danych

**Brute Force:**

- Rate limiting (poza zakresem MVP, można dodać w przyszłości)
- Supabase ma wbudowane rate limiting dla auth endpoints

**Session Hijacking:**

- HTTPS only w produkcji
- Secure cookies
- Czas życia access tokena: 24h (zgodnie z US-002)

---

#### 4.3.2 Polityki Row Level Security (RLS)

**Istniejące polityki (bez zmian):**

Plik `/supabase/migrations/20251229123500_create_initial_schema.sql` już zawiera RLS policies dla:

- `child_profiles`: Dostęp tylko dla parent_id = auth.uid()
- `sessions`: Dostęp tylko dla profili należących do auth.uid()
- `task_results`: Dostęp tylko dla profili należących do auth.uid()

**Weryfikacja:**

- Middleware ustawia `context.locals.supabase` z tokenem użytkownika
- Wszystkie zapytania do bazy używają tego klienta
- RLS automatycznie filtruje wyniki według auth.uid()

**Brak zmian w schemacie bazy danych.**

---

#### 4.3.3 Walidacja danych

**Warstwy walidacji:**

1. **Client-side (React):**
   - Natychmiastowy feedback dla użytkownika
   - Walidacja na blur i przed submitem
   - Nie zastępuje walidacji server-side

2. **Server-side (API endpoints):**
   - Zod schemas dla wszystkich requestów
   - Walidacja przed wywołaniem Supabase
   - Zwracanie szczegółowych błędów

3. **Database (PostgreSQL):**
   - Constraints (NOT NULL, CHECK, UNIQUE)
   - Triggers (enforce_child_profile_limit)
   - RLS policies

**Przykład walidacji wielowarstwowej:**

```
User input: email = "invalid-email"

1. Client-side (React):
   - Regex check: FAIL
   - Wyświetlenie błędu: "Podaj prawidłowy adres e-mail"
   - Request nie jest wysyłany

User input: email = "test@example.com"

1. Client-side: PASS
2. Server-side (Zod):
   - Email format check: PASS
   - Min length check: PASS
3. Supabase Auth:
   - Email format check: PASS
   - Unique check: PASS (lub FAIL jeśli istnieje)
```

---

## 5. TYPY I KONTRAKTY

### 5.1 Typy TypeScript dla autentykacji

**Lokalizacja:** `/src/types.ts` (rozszerzenie istniejącego pliku)

```typescript
// ============================================================================
// Authentication DTOs
// ============================================================================

/**
 * Auth User DTO - Response for GET /api/auth/me
 *
 * Minimal user information for authenticated requests.
 */
export interface AuthUserDTO {
  /** User ID from Supabase Auth */
  id: string;
  /** User email address */
  email: string;
}

/**
 * Register Response DTO - Response for POST /api/auth/register
 */
export interface RegisterResponseDTO {
  /** Success message */
  message: string;
}

/**
 * Login Response DTO - Response for POST /api/auth/login
 */
export interface LoginResponseDTO {
  /** Success message */
  message: string;
}

/**
 * Logout Response DTO - Response for POST /api/auth/logout
 */
export interface LogoutResponseDTO {
  /** Success message */
  message: string;
}

/**
 * Forgot Password Response DTO - Response for POST /api/auth/forgot-password
 */
export interface ForgotPasswordResponseDTO {
  /** Success message (always returned, even if email doesn't exist) */
  message: string;
}

/**
 * Reset Password Response DTO - Response for POST /api/auth/reset-password
 */
export interface ResetPasswordResponseDTO {
  /** Success message */
  message: string;
}
```

---

### 5.2 Kontrakty API

#### 5.2.1 POST /api/auth/register

**Request:**

```typescript
{
  email: string; // RFC 5322 format
  password: string; // Min 8 chars, uppercase, lowercase, digit, special char
}
```

**Response:**

- 201 Created: `RegisterResponseDTO`
- 400 Bad Request: `APIErrorResponse` (z details)
- 409 Conflict: `APIErrorResponse`
- 500 Internal Server Error: `APIErrorResponse`

---

#### 5.2.2 POST /api/auth/login

**Request:**

```typescript
{
  email: string;
  password: string;
}
```

**Response:**

- 200 OK: `LoginResponseDTO` + Set-Cookie headers
- 400 Bad Request: `APIErrorResponse`
- 401 Unauthorized: `APIErrorResponse`
- 500 Internal Server Error: `APIErrorResponse`

---

#### 5.2.3 POST /api/auth/logout

**Request:** Brak body

**Response:**

- 200 OK: `LogoutResponseDTO` + Clear-Cookie headers

---

#### 5.2.4 POST /api/auth/forgot-password

**Request:**

```typescript
{
  email: string;
}
```

**Response:**

- 200 OK: `ForgotPasswordResponseDTO` (zawsze)
- 400 Bad Request: `APIErrorResponse`

---

#### 5.2.5 POST /api/auth/reset-password

**Request:**

```typescript
{
  accessToken: string;
  refreshToken: string;
  password: string; // Min 8 chars, uppercase, lowercase, digit, special char
}
```

**Response:**

- 200 OK: `ResetPasswordResponseDTO`
- 400 Bad Request: `APIErrorResponse`
- 401 Unauthorized: `APIErrorResponse`
- 500 Internal Server Error: `APIErrorResponse`

---

#### 5.2.6 GET /api/auth/me

**Request:** Brak body (token w cookie)

**Response:**

- 200 OK: `AuthUserDTO`
- 401 Unauthorized: `APIErrorResponse`

---

## 6. PLAN IMPLEMENTACJI

### 6.1 Kolejność implementacji

**Faza 1: Backend (API endpoints i serwisy)**

1. Utworzenie schematów Zod (`/src/lib/schemas/auth.schema.ts`)
2. Utworzenie serwisu autentykacji (`/src/lib/services/auth.service.ts`)
3. Implementacja endpointów API:
   - POST /api/auth/register
   - POST /api/auth/login
   - POST /api/auth/logout
   - POST /api/auth/forgot-password
   - POST /api/auth/reset-password
   - GET /api/auth/me
4. Aktualizacja middleware (`/src/middleware/index.ts`)
5. Testy endpointów (curl/Postman)

**Faza 2: Frontend - Komponenty UI**

1. Utworzenie komponentów UI:
   - `/src/components/ui/input.tsx`
   - `/src/components/ui/label.tsx`
   - `/src/components/ui/alert.tsx`
2. Utworzenie komponentów autentykacji:
   - `/src/components/auth/RegisterForm.tsx`
   - `/src/components/auth/LoginForm.tsx`
   - `/src/components/auth/ForgotPasswordForm.tsx`
   - `/src/components/auth/ResetPasswordForm.tsx`
   - `/src/components/auth/HeaderAuthenticated.tsx`

**Faza 3: Frontend - Strony Astro**

1. Utworzenie stron:
   - `/src/pages/register.astro`
   - `/src/pages/login.astro`
   - `/src/pages/forgot-password.astro`
   - `/src/pages/reset-password.astro`
2. Aktualizacja strony `/src/pages/profiles.astro` (dodanie weryfikacji auth)

**Faza 4: Integracja i testy**

1. Testy flow rejestracji
2. Testy flow logowania
3. Testy flow odzyskiwania hasła
4. Testy przekierowań (chronione strony, już zalogowany użytkownik)
5. Testy wylogowania
6. Testy dostępności (a11y)
7. Testy responsywności

**Faza 5: Konfiguracja Supabase**

1. Konfiguracja email templates w Supabase Dashboard
2. Konfiguracja redirect URLs
3. Testy wysyłania e-maili

---

### 6.2 Zależności między komponentami

```
Middleware (index.ts)
    ↓
API Endpoints (auth/*.ts)
    ↓
Auth Service (auth.service.ts)
    ↓
Supabase Client (supabase.client.ts)
    ↓
Supabase Auth (external)

---

Astro Pages (*.astro)
    ↓
React Components (auth/*.tsx)
    ↓
UI Components (ui/*.tsx)
    ↓
API Endpoints (auth/*.ts)
```

---

### 6.3 Checklist implementacji

**Backend:**

- [ ] Utworzenie `/src/lib/schemas/auth.schema.ts`
- [ ] Utworzenie `/src/lib/services/auth.service.ts`
- [ ] Utworzenie `/src/pages/api/auth/register.ts`
- [ ] Utworzenie `/src/pages/api/auth/login.ts`
- [ ] Utworzenie `/src/pages/api/auth/logout.ts`
- [ ] Utworzenie `/src/pages/api/auth/forgot-password.ts`
- [ ] Utworzenie `/src/pages/api/auth/reset-password.ts`
- [ ] Utworzenie `/src/pages/api/auth/me.ts`
- [ ] Aktualizacja `/src/middleware/index.ts` (obsługa cookie)
- [ ] Rozszerzenie `/src/types.ts` (Auth DTOs)

**Frontend - UI Components:**

- [ ] Utworzenie `/src/components/ui/input.tsx`
- [ ] Utworzenie `/src/components/ui/label.tsx`
- [ ] Utworzenie `/src/components/ui/alert.tsx`

**Frontend - Auth Components:**

- [ ] Utworzenie `/src/components/auth/RegisterForm.tsx`
- [ ] Utworzenie `/src/components/auth/LoginForm.tsx`
- [ ] Utworzenie `/src/components/auth/ForgotPasswordForm.tsx`
- [ ] Utworzenie `/src/components/auth/ResetPasswordForm.tsx`
- [ ] Utworzenie `/src/components/auth/HeaderAuthenticated.tsx`

**Frontend - Pages:**

- [ ] Utworzenie `/src/pages/register.astro`
- [ ] Utworzenie `/src/pages/login.astro`
- [ ] Utworzenie `/src/pages/forgot-password.astro`
- [ ] Utworzenie `/src/pages/reset-password.astro`
- [ ] Aktualizacja `/src/pages/profiles.astro` (weryfikacja auth)

**Konfiguracja:**

- [ ] Konfiguracja Supabase Auth (email templates, redirect URLs)
- [ ] Konfiguracja JWT expiry: 86400s (24h) zgodnie z US-002
- [ ] Zmienne środowiskowe (SUPABASE_URL, SUPABASE_KEY)

**Testy zgodności z User Stories:**

- [ ] US-001: Rejestracja z unikalnym e-mailem, przekierowanie do logowania
- [ ] US-002: Logowanie przekierowuje do /profiles, sesja trwa 24h
- [ ] US-003: Chronione endpointy wymagają tokena, wylogowanie usuwa cookies
- [ ] US-015: Odzyskiwanie hasła przez e-mail działa poprawnie

**Testy funkcjonalne:**

- [ ] Testy flow rejestracji (sukces, błędy)
- [ ] Testy flow logowania (sukces, błędy)
- [ ] Testy flow odzyskiwania hasła
- [ ] Testy flow resetowania hasła
- [ ] Testy wylogowania
- [ ] Testy przekierowań (chronione strony)
- [ ] Testy dostępności (a11y)

---

## 7. ZGODNOŚĆ Z PRD I DECYZJE ARCHITEKTONICZNE

### 7.0 Wyjaśnienie różnic między PRD a specyfikacją

#### 7.0.1 Czas trwania sesji (US-002)

**PRD:** "Sesja trwa min. 24 h lub do wylogowania"

**Implementacja:**

- Access token: 86400s (24 godziny)
- Refresh token: 604800s (7 dni)

**Uzasadnienie:** Access token jest ustawiony dokładnie na 24h zgodnie z wymaganiem. Refresh token (7 dni) pozwala użytkownikowi na przedłużenie sesji bez ponownego logowania, jeśli wróci do aplikacji w ciągu tygodnia.

---

#### 7.0.2 Przechowywanie tokenów (US-003)

**PRD:** "Wylogowanie usuwa token z LocalStorage/cookies"

**Implementacja:** Używamy wyłącznie httpOnly cookies (nie localStorage)

**Uzasadnienie:**

- **Bezpieczeństwo:** HttpOnly cookies są niedostępne dla JavaScript, co chroni przed atakami XSS
- **Zgodność z SSR:** Cookies są automatycznie wysyłane z żądaniami server-side
- **CSRF protection:** SameSite=Strict zapobiega atakom CSRF
- **Best practices:** Supabase i większość nowoczesnych aplikacji używa httpOnly cookies dla tokenów autentykacji

LocalStorage jest podatny na XSS - jeśli atakujący wstrzyknie złośliwy JavaScript, może odczytać tokeny z localStorage. HttpOnly cookies są całkowicie niedostępne dla JavaScript.

---

#### 7.0.3 Profil dziecka - wiek vs data urodzenia (US-004)

**PRD:** "Formularz imię+wiek"

**Istniejący schemat bazy:** Pole `date_of_birth` (data urodzenia)

**Uwaga:** US-004 dotyczy CRUD profili dzieci, który jest poza zakresem tej specyfikacji autentykacji. Istniejący kod już używa `date_of_birth`, co jest lepszym rozwiązaniem niż przechowywanie wieku (wiek zmienia się co roku, data urodzenia jest stała).

---

#### 7.0.4 Metryka sukcesu - tabela logins

**PRD (Metryki sukcesu):** "liczona z tabeli logins w bazie"

**Istniejący schemat bazy:** Tabela `sessions` (nie `logins`)

**Uwaga:** Metryka retencji powinna być liczona z tabeli `sessions`, która już istnieje w schemacie bazy danych. Tabela `sessions` zawiera wszystkie potrzebne informacje: `child_id`, `started_at`, `ended_at`.

---

## 7. PODSUMOWANIE

### 7.1 Kluczowe decyzje architektoniczne

1. **Cookies zamiast localStorage:**
   - HttpOnly cookies dla bezpieczeństwa (ochrona przed XSS)
   - Automatyczne wysyłanie z żądaniami SSR
   - SameSite=Strict dla ochrony przed CSRF

2. **Supabase Auth jako backend autentykacji:**
   - Gotowe rozwiązanie z hashowaniem haseł (bcrypt)
   - Wbudowane rate limiting
   - Obsługa e-maili resetujących hasło
   - JWT tokens z automatycznym odświeżaniem

3. **Walidacja wielowarstwowa:**
   - Client-side (React) dla UX
   - Server-side (Zod) dla bezpieczeństwa
   - Database (constraints, triggers) dla integralności danych

4. **Separacja odpowiedzialności:**
   - Strony Astro: Renderowanie SSR, weryfikacja auth, przekierowania
   - Komponenty React: Interaktywne formularze, walidacja client-side
   - API endpoints: Logika biznesowa, komunikacja z Supabase
   - Serwisy: Enkapsulacja logiki autentykacji

5. **Bezpieczeństwo jako priorytet:**
   - Wszystkie tokeny w httpOnly cookies
   - HTTPS only w produkcji
   - CSP headers
   - RLS policies w bazie danych
   - Brak enumeracji użytkowników (forgot-password zawsze zwraca sukces)

---

### 7.2 Zgodność z istniejącą architekturą

**Bez zmian:**

- Schemat bazy danych (brak nowych tabel)
- RLS policies (już obsługują auth.uid())
- Istniejące API endpoints (/api/profiles)
- Istniejące komponenty UI (Button, HeaderPublic)
- Middleware (tylko rozszerzenie o obsługę cookie)

**Nowe elementy:**

- Strony autentykacji (register, login, forgot-password, reset-password)
- Komponenty formularzy (RegisterForm, LoginForm, etc.)
- API endpoints autentykacji (/api/auth/\*)
- Serwis autentykacji (AuthService)
- Schematy walidacji (auth.schema.ts)
- Komponenty UI (Input, Label, Alert)

**Integracja:**

- Strona `/profiles` wymaga teraz autentykacji (weryfikacja tokena)
- HeaderPublic już zawiera linki do /login i /register (bez zmian)
- Istniejące API endpoints (/api/profiles) działają z tokenem z cookie (po aktualizacji middleware)

---

### 7.3 Następne kroki

Po implementacji modułu autentykacji:

1. **Implementacja CRUD profili dzieci:**
   - Strona dodawania profilu
   - Strona edycji profilu
   - Usuwanie profilu
   - Dashboard z listą profili

2. **Implementacja mechaniki gry:**
   - Wybór profilu dziecka
   - Generowanie zagadek
   - Wirtualne pianinko
   - Walidacja odpowiedzi
   - System punktacji i poziomów

3. **Dodatkowe funkcjonalności autentykacji (opcjonalnie):**
   - Potwierdzenie e-maila po rejestracji
   - Zmiana hasła dla zalogowanego użytkownika
   - Zmiana e-maila
   - Automatyczne odświeżanie tokena
   - Rate limiting dla auth endpoints

---

### 7.4 Metryki sukcesu implementacji

**Funkcjonalne (zgodność z User Stories):**

- [ ] US-001: Użytkownik może się zarejestrować z unikalnym e-mailem i hasłem
- [ ] US-001: Po rejestracji widzi ekran logowania
- [ ] US-002: Użytkownik może się zalogować z prawidłowym e-mailem/hasłem
- [ ] US-002: Po logowaniu jest przekierowywany do ekranu wyboru profilu (/profiles)
- [ ] US-002: Błędne dane pokazują komunikat o błędzie
- [ ] US-002: Sesja trwa minimum 24 godziny (access token: 86400s)
- [ ] US-003: Każde żądanie do API wymaga ważnego tokena
- [ ] US-003: Wylogowanie usuwa tokeny z cookies
- [ ] US-015: Użytkownik może odzyskać hasło przez e-mail
- [ ] US-015: Link w e-mailu prowadzi do formularza zmiany hasła
- [ ] Chronione strony wymagają logowania (przekierowanie do /login)
- [ ] Zalogowany użytkownik jest przekierowywany z /login i /register do /profiles
- [ ] Tokeny są bezpiecznie przechowywane w httpOnly cookies

**Niefunkcjonalne:**

- [ ] Czas odpowiedzi API < 500ms (95th percentile)
- [ ] Strony SSR renderują się < 1s (95th percentile)
- [ ] Brak błędów krytycznych w logach
- [ ] Wszystkie formularze spełniają WCAG 2.1 Level AA
- [ ] Aplikacja działa na tablet/desktop w trybie landscape

**Bezpieczeństwo:**

- [ ] Tokeny są httpOnly, secure, sameSite=strict
- [ ] Hasła są hashowane przez Supabase (bcrypt)
- [ ] RLS policies działają poprawnie
- [ ] Brak enumeracji użytkowników
- [ ] CSP headers są ustawione

---

## 8. ZAŁĄCZNIKI

### 8.1 Przykładowe requesty/responses

**POST /api/auth/register - Sukces:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent@example.com",
    "password": "SecurePass123!"
  }'

# Response: 201 Created
{
  "message": "Użytkownik został zarejestrowany pomyślnie"
}
```

**POST /api/auth/login - Sukces:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent@example.com",
    "password": "SecurePass123!"
  }'

# Response: 200 OK
# Set-Cookie: sb-access-token=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400
# Set-Cookie: sb-refresh-token=v1.abc...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800
{
  "message": "Zalogowano pomyślnie"
}
```

**GET /api/auth/me - Sukces:**

```bash
curl -X GET http://localhost:3000/api/auth/me \
  --cookie "sb-access-token=eyJhbGc..."

# Response: 200 OK
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "parent@example.com"
}
```

---

### 8.2 Diagram przepływu danych

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. GET /register
       ▼
┌─────────────────────┐
│  register.astro     │ (SSR)
│  - Check cookie     │
│  - Render form      │
└──────┬──────────────┘
       │
       │ 2. Render
       ▼
┌─────────────────────┐
│  RegisterForm.tsx   │ (Client)
│  - User input       │
│  - Validation       │
└──────┬──────────────┘
       │
       │ 3. POST /api/auth/register
       ▼
┌─────────────────────┐
│  register.ts        │ (API)
│  - Validate (Zod)   │
│  - Call service     │
└──────┬──────────────┘
       │
       │ 4. signUp()
       ▼
┌─────────────────────┐
│  AuthService        │
│  - Supabase Auth    │
└──────┬──────────────┘
       │
       │ 5. User created
       ▼
┌─────────────────────┐
│  Supabase Auth      │
│  - Hash password    │
│  - Store user       │
└─────────────────────┘
```

---

### 8.3 Przykładowy kod komponentu

**RegisterForm.tsx (szkielet):**

```typescript
import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const validateEmail = (email: string): string | null => {
    if (!email) return 'E-mail jest wymagany';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Podaj prawidłowy adres e-mail';
    }
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return 'Hasło musi mieć co najmniej 8 znaków';
    if (!/[A-Z]/.test(password)) return 'Hasło musi zawierać wielką literę';
    if (!/[a-z]/.test(password)) return 'Hasło musi zawierać małą literę';
    if (!/[0-9]/.test(password)) return 'Hasło musi zawierać cyfrę';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Hasło musi zawierać znak specjalny';
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    // Walidacja
    const newErrors: Record<string, string> = {};
    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Hasła muszą być identyczne';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Wysłanie do API
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        setSuccessMessage('Konto zostało utworzone! Za chwilę zostaniesz przekierowany...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        const data = await response.json();
        if (data.details) {
          setErrors(data.details);
        } else {
          setErrors({ general: data.message });
        }
      }
    } catch (error) {
      setErrors({ general: 'Wystąpił błąd. Spróbuj ponownie.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {errors.general && <Alert variant="error">{errors.general}</Alert>}

      <div>
        <Label htmlFor="email" required>E-mail</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={!!errors.email}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && <span id="email-error" className="text-sm text-destructive">{errors.email}</span>}
      </div>

      <div>
        <Label htmlFor="password" required>Hasło</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={!!errors.password}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && <span id="password-error" className="text-sm text-destructive">{errors.password}</span>}
      </div>

      <div>
        <Label htmlFor="confirmPassword" required>Powtórz hasło</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={!!errors.confirmPassword}
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
        />
        {errors.confirmPassword && <span id="confirm-error" className="text-sm text-destructive">{errors.confirmPassword}</span>}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Rejestrowanie...' : 'Zarejestruj się'}
      </Button>
    </form>
  );
}
```

---

---

## 9. HISTORIA ZMIAN I WERYFIKACJA ZGODNOŚCI Z PRD

### 9.1 Zmiany wprowadzone po analizie zgodności z PRD

**Data weryfikacji:** 2026-01-02

**Zidentyfikowane rozbieżności i wprowadzone poprawki:**

1. **Czas życia access tokena (US-002)**
   - **Przed:** 3600s (1 godzina)
   - **Po:** 86400s (24 godziny)
   - **Uzasadnienie:** PRD wymaga sesji trwającej minimum 24h

2. **Dokumentacja przechowywania tokenów (US-003)**
   - **Dodano:** Wyjaśnienie dlaczego używamy httpOnly cookies zamiast localStorage
   - **Uzasadnienie:** Bezpieczeństwo (ochrona przed XSS)

3. **Konfiguracja Supabase**
   - **Zaktualizowano:** JWT expiry z 3600s na 86400s
   - **Dodano:** Uwagi o zgodności z US-002

4. **Dokumentacja**
   - **Dodano:** Sekcję 1.4 - Mapowanie User Stories z PRD
   - **Dodano:** Sekcję 7.0 - Wyjaśnienie różnic między PRD a specyfikacją
   - **Zaktualizowano:** Metryki sukcesu z odniesieniami do konkretnych User Stories
   - **Dodano:** Testy zgodności z User Stories w checkliście

### 9.2 Potwierdzenie zgodności z User Stories

**US-001: Rejestracja rodzica** ✅

- Endpoint POST /api/auth/register implementuje pełną funkcjonalność
- Walidacja unikalności e-maila przez Supabase Auth
- Przekierowanie do /login po sukcesie
- Dane zapisywane w auth.users

**US-002: Logowanie rodzica** ✅

- Endpoint POST /api/auth/login implementuje pełną funkcjonalność
- Przekierowanie do /profiles (ekran wyboru profilu)
- Komunikaty błędów dla nieprawidłowych danych
- Sesja trwa 24h (access token) + 7 dni (refresh token)

**US-003: Bezpieczne sesje** ✅

- Middleware weryfikuje tokeny dla wszystkich żądań API
- Wylogowanie usuwa tokeny z cookies
- HttpOnly cookies dla lepszego bezpieczeństwa niż localStorage

**US-015: Odzyskiwanie hasła** ✅

- Endpoint POST /api/auth/forgot-password
- Wysyłanie e-maila z linkiem resetującym
- Endpoint POST /api/auth/reset-password
- Pełny flow resetowania hasła

### 9.3 Zgodność z wymaganiami funkcjonalnymi PRD

| Wymaganie                                   | Status | Uwagi                          |
| ------------------------------------------- | ------ | ------------------------------ |
| 1. Rejestracja i logowanie (e-mail + hasło) | ✅     | Pełna implementacja            |
| 3. Wybór profilu po zalogowaniu             | ✅     | Przekierowanie do /profiles    |
| 15. Bezpieczna sesja (token Supabase)       | ✅     | JWT w httpOnly cookies         |
| 15. Wylogowanie                             | ✅     | Endpoint POST /api/auth/logout |

### 9.4 Zgodność z granicami produktu

| Granica                    | Status | Uwagi                             |
| -------------------------- | ------ | --------------------------------- |
| Brak aplikacji mobilnej    | ✅     | UI dla tablet/desktop (landscape) |
| Brak onboardingu/tutoriala | ✅     | Poza zakresem MVP                 |
| Bezpieczna sesja           | ✅     | Token-based auth z Supabase       |

### 9.5 Potencjalne rozbieżności w PRD (do rozważenia)

1. **Tabela "logins" w metrykach sukcesu**
   - PRD wspomina tabelę `logins`, ale schemat bazy ma tabelę `sessions`
   - Rekomendacja: Używać tabeli `sessions` do liczenia metryk retencji

2. **Pole "wiek" vs "data urodzenia" (US-004)**
   - PRD wspomina "wiek", ale schemat używa `date_of_birth`
   - Rekomendacja: Zachować `date_of_birth` (lepsze rozwiązanie)
   - Uwaga: US-004 jest poza zakresem specyfikacji autentykacji

---

## KONIEC SPECYFIKACJI

**Wersja:** 1.1 (zaktualizowana po weryfikacji zgodności z PRD)

**Status:** Dokument zawiera kompletną specyfikację techniczną modułu autentykacji dla aplikacji Rytmik, w pełni zgodną z wymaganiami US-001, US-002, US-003 i US-015 z pliku PRD. Wszystkie zidentyfikowane rozbieżności zostały rozwiązane. Specyfikacja jest gotowa do implementacji przez zespół deweloperski.

**Kluczowe zmiany w wersji 1.1:**

- Czas życia access tokena zwiększony z 1h do 24h (zgodnie z US-002)
- Dodano szczegółowe mapowanie User Stories na elementy specyfikacji
- Dodano wyjaśnienia decyzji architektonicznych (cookies vs localStorage)
- Zaktualizowano wszystkie przykłady i konfiguracje
