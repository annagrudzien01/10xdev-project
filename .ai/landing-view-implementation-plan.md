# Plan implementacji widoku Landing Page

## 1. Przegląd

Landing Page ( `/` ) jest punktem wejścia do aplikacji Rytmik. Jego głównym zadaniem jest szybkie przedstawienie wartości produktu i przekierowanie użytkownika do odpowiedniej dalszej akcji (logowanie, rejestracja lub demo). Widok obsługuje zarówno użytkowników zalogowanych, jak i niezalogowanych, zapewniając błyskawiczne przekierowanie tych pierwszych do ekranu wyboru profilu.

## 2. Routing widoku

- **Ścieżka**: `/`
- **Middleware**: Public route (dostępna dla każdego), jednak zawiera logikę natychmiastowego przekierowania użytkowników posiadających ważny token do `/profiles`.

## 3. Struktura komponentów

```
LandingPage (Astro) ↴
├─ <HeaderPublic />           # Logo + przyciski Logowanie / Rejestracja
├─ <HeroSection />           # Tytuł + krótki opis + ilustracja
├─ <ActionsSection />        # 3 przyciski CTA
└─ <OrientationNotice />     # Komunikat o preferowanej orientacji (mobile)
```

## 4. Szczegóły komponentów

### HeaderPublic

- **Opis**: Pasek nagłówka widoczny na publicznych stronach.
- **Główne elementy**: Logo (link do `/`), przyciski "Zaloguj się" i "Zarejestruj się".
- **Interakcje**:
  - Klik logo → przeładowanie `/` (scroll to top).
  - Klik "Zaloguj się" → `router.push('/login')`.
  - Klik "Zarejestruj się" → `router.push('/register')`.
- **Walidacja**: Brak.
- **Typy**: Brak propów (statyczny).
- **Propsy**: —

### HeroSection

- **Opis**: Sekcja hero z nazwą aplikacji, krótkim opisem i ilustracją/animacją pianina.
- **Główne elementy**: `h1`, `p`, `<PianoIllustration />` (opcjonalne lottie/gif).
- **Interakcje**: Brak.
- **Walidacja**: Brak.
- **Typy**: —
- **Propsy**: —

### ActionsSection

- **Opis**: Zestaw przycisków CTA prowadzących do dalszych akcji.
- **Główne elementy**: 3 przyciski (`<Button>` z Shadcn/ui):
  1. „Zaloguj się” (primary)
  2. „Zarejestruj się” (outline)
  3. „Wypróbuj demo” (ghost)
- **Interakcje**:
  - Klik 1 → `router.push('/login')`
  - Klik 2 → `router.push('/register')`
  - Klik 3 → `router.push('/demo')`
- **Walidacja**: Brak.
- **Typy**: —
- **Propsy**: —

### OrientationNotice

- **Opis**: Komunikat dla ekranów < 768 px o preferowanej orientacji poziomej.
- **Główne elementy**: `<div role="alert">` z ikoną i tekstem.
- **Interakcje**: Ukrywa się na `md` breakpoint.
- **Walidacja**: Brak.
- **Typy**: —
- **Propsy**: —

## 5. Typy

Dla Landing Page nie są wymagane nowe DTO ani ViewModel-e. Wykorzystujemy istniejące typy globalne `AuthState` (z AuthContext) jedynie do sprawdzenia, czy użytkownik jest zalogowany.

## 6. Zarządzanie stanem

- **AuthContext** (już istnieje): wykorzystujemy `auth.user` / `auth.token` do warunkowego przekierowania.
- **Brak lokalnego stanu** – widok jest w pełni statyczny.
- **Hooki używane**: `useAuth()` (odczyt tokenu), `useEffect` do redirectu.

## 7. Integracja API

- **Brak bezpośrednich wywołań API**. Jedyną zależnością jest obecność ważnego tokenu w ciasteczku (walidowane w middleware) oraz w `AuthContext`.

## 8. Interakcje użytkownika

| Akcja                           | Wynik                                          |
| ------------------------------- | ---------------------------------------------- |
| Wejście na `/` z ważnym tokenem | Natychmiastowy redirect do `/profiles`.        |
| Wejście na `/` bez tokenu       | Wyświetlenie Landing Page.                     |
| Klik „Zaloguj się”              | Przejście do `/login`.                         |
| Klik „Zarejestruj się”          | Przejście do `/register`.                      |
| Klik „Wypróbuj demo”            | Przejście do `/demo`.                          |
| Otwarcie na mobile (<768 px)    | Wyświetlenie komunikatu o orientacji poziomej. |

## 9. Warunki i walidacja

- **Redirect**: `if (auth.token) router.replace('/profiles')` w efekcie po mount.
- **Orientacja**: CSS util `md:hidden` na `<OrientationNotice />`.
- **Kontrast**: korzystamy z kolorów Tailwind/Tailwind Theme spełniających ≥ 4.5:1.

## 10. Obsługa błędów

- Widok nie wykonuje operacji asynchronicznych – brak specyficznej obsługi błędów.
- Potencjalny błąd pobrania ilustracji → fallback do placeholdera (HTML `<img onError>`).

## 11. Kroki implementacji

1. **Routing** – dodać plik `src/pages/index.astro`.
2. **Redirect logic** – w komponencie strony:
   ```tsx
   const { user } = useAuth();
   useEffect(() => {
     if (user) router.replace("/profiles");
   }, [user]);
   ```
3. **Utworzyć komponent `HeaderPublic.tsx`** w `src/components/public/`.
4. **Stworzyć `HeroSection.tsx`** z tytułem, opisem, opcjonalnie ilustracją (import assetu).
5. **Stworzyć `ActionsSection.tsx`** z trzema przyciskami `<Button>` (import z Shadcn/ui).
6. **Stworzyć `OrientationNotice.tsx`** (komunikat mobile) z klasami Tailwind `md:hidden`.
7. **Złożyć komponenty w `LandingPage.astro`** (import React via `<Framework>` slot) lub czysty React w `index.astro`.
8. **Stylowanie** – wykorzystać Tailwind utility klases; dla hero prosty gradient/background.
9. **Dostępność** – upewnić się, że przyciski mają `aria-label` = tekst widoczny; orient notice `role="alert"`.
10. **Testy manualne** –
    - Desktop: poprawne CTA, brak orientation notice.
    - Mobile portrait: orientation notice widoczny.
    - Zalogowany użytkownik: redirect.
11. **Commit & PR** – opis: „feat: Landing Page view”.
