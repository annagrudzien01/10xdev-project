# Dokumentacja Testowania

## Przegląd

Projekt wykorzystuje dwa główne narzędzia do testowania:

- **Vitest** - testy jednostkowe i integracyjne
- **Playwright** - testy E2E (end-to-end)

## Testy Jednostkowe (Vitest)

### Konfiguracja

Konfiguracja znajduje się w pliku `vitest.config.ts`. Projekt wykorzystuje:

- **jsdom** jako środowisko testowe dla komponentów React
- **@testing-library/react** do testowania komponentów
- **@testing-library/user-event** do symulacji interakcji użytkownika
- **MSW** (Mock Service Worker) do mockowania wywołań API

### Struktura Testów

```
src/
  ├── components/
  │   └── ui/
  │       ├── button.tsx
  │       └── button.test.tsx          # Testy komponentów
  ├── lib/
  │   ├── utils.ts
  │   ├── utils.test.ts                # Testy funkcji pomocniczych
  │   └── hooks/
  │       ├── useDemoGame.ts
  │       └── useDemoGame.test.ts      # Testy hooków
  └── test/
      ├── setup.ts                      # Setup globalny dla testów
      └── utils.tsx                     # Pomocnicze funkcje testowe
```

### Uruchamianie Testów Jednostkowych

```bash
# Uruchom testy w trybie watch
npm run test

# Uruchom testy jednokrotnie
npm run test:run

# Uruchom testy z interfejsem UI
npm run test:ui

# Uruchom testy z coverage
npm run test:coverage

# Uruchom testy w trybie watch z filtrem
npm run test:watch -- -t "nazwa testu"
```

### Pisanie Testów Jednostkowych

#### Testowanie Komponentów React

```typescript
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/test/utils';
import { Button } from './button';

describe('Button', () => {
  it('should render correctly', () => {
    renderWithProviders(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });

    expect(button).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });

    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Testowanie Funkcji Pomocniczych

```typescript
import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("should merge class names", () => {
    const result = cn("class1", "class2");
    expect(result).toBe("class1 class2");
  });
});
```

#### Mockowanie z vi.mock()

```typescript
import { vi } from "vitest";

// Mock na poziomie modułu
vi.mock("@/lib/api", () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: "test" })),
}));

// Mock w teście
const mockFn = vi.fn();
mockFn.mockImplementation(() => "mocked value");
mockFn.mockReturnValue("mocked value");
```

### Best Practices dla Vitest

1. **Używaj `vi` do mocków** - `vi.fn()`, `vi.spyOn()`, `vi.stubGlobal()`
2. **Factory pattern dla `vi.mock()`** - umieszczaj factory functions na początku pliku
3. **Setup files** - globalne mocki i matchery w `src/test/setup.ts`
4. **Inline snapshots** - `expect(value).toMatchInlineSnapshot()`
5. **Struktura testów** - AAA pattern (Arrange-Act-Assert)
6. **Descriptive blocks** - używaj `describe` do grupowania
7. **TypeScript** - zachowuj typy w mockach

## Testy E2E (Playwright)

### Konfiguracja

Konfiguracja znajduje się w pliku `playwright.config.ts`. Projekt wykorzystuje:

- **Chromium** jako jedyny browser (zgodnie z guidelines)
- **Page Object Model** dla maintainable testów
- **@axe-core/playwright** dla testów dostępności (WCAG 2.1)

### Struktura Testów E2E

```
e2e/
  ├── fixtures/
  │   └── auth.ts                      # Fixture dla autentykacji
  ├── utils/
  │   └── test-helpers.ts              # Pomocnicze funkcje
  ├── home.spec.ts                     # Testy strony głównej
  ├── navigation.spec.ts               # Testy nawigacji
  └── demo-game.spec.ts                # Testy gry demo
```

### Uruchamianie Testów E2E

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Uruchom testy z interfejsem UI
npm run test:e2e:ui

# Uruchom testy z widoczną przeglądarką
npm run test:e2e:headed

# Uruchom testy w trybie debug
npm run test:e2e:debug

# Wyświetl raport z testów
npm run test:e2e:report
```

### Pisanie Testów E2E

#### Podstawowy Test

```typescript
import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load successfully", async ({ page }) => {
    await expect(page).toHaveTitle(/10x/i);
  });
});
```

#### Testy Dostępności

```typescript
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("should have no accessibility violations", async ({ page }) => {
  await page.goto("/");

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

#### Visual Regression Tests

```typescript
test("should match screenshot", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveScreenshot("home-page.png", {
    fullPage: true,
    maxDiffPixels: 100,
  });
});
```

#### Używanie Helpers

```typescript
import { navigateTo, clickButton, fillField } from "./utils/test-helpers";

test("should submit form", async ({ page }) => {
  await navigateTo(page, "/login");

  await fillField(page, "Email", "test@example.com");
  await fillField(page, "Password", "password123");

  await clickButton(page, /sign in/i);

  await page.waitForURL("/dashboard");
});
```

### Best Practices dla Playwright

1. **Tylko Chromium** - zgodnie z guidelines, używamy tylko Chromium
2. **Browser contexts** - izolacja środowiska testowego
3. **Page Object Model** - dla maintainable testów
4. **Locators** - używaj resilient selectors (role, label, text)
5. **API testing** - testuj backend przez API
6. **Visual comparison** - `expect(page).toHaveScreenshot()`
7. **Codegen** - używaj `npx playwright codegen` do nagrywania testów
8. **Trace viewer** - debuguj z `npx playwright show-trace`
9. **Test hooks** - setup i teardown w `beforeEach`/`afterEach`
10. **Parallel execution** - domyślnie włączone

## Coverage

### Wyświetlanie Coverage

```bash
# Uruchom testy z coverage
npm run test:coverage

# Raport będzie dostępny w ./coverage/index.html
```

### Thresholdy Coverage

Projekt ma ustawione następujące minimalne progi:

- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

## Continuous Integration

### Uruchamianie Wszystkich Testów

```bash
# Uruchom testy jednostkowe i E2E
npm run test:all
```

### GitHub Actions (przykład)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:run

      - name: Install Playwright Browsers
        run: npx playwright install chromium

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugowanie Testów

### Vitest

```bash
# Uruchom testy w trybie UI
npm run test:ui

# Uruchom konkretny test
npm run test -- src/components/ui/button.test.tsx

# Uruchom z filtrem nazwy
npm run test -- -t "should render"
```

### Playwright

```bash
# Tryb debug z Playwright Inspector
npm run test:e2e:debug

# Tryb headed (widoczna przeglądarka)
npm run test:e2e:headed

# Trace viewer dla konkretnego testu
npx playwright test --trace on
npx playwright show-trace trace.zip
```

## Mockowanie API

### MSW dla Testów Jednostkowych

```typescript
import { setupServer } from "msw/node";
import { rest } from "msw";

const server = setupServer(
  rest.get("/api/data", (req, res, ctx) => {
    return res(ctx.json({ data: "mocked" }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Route Mocking w Playwright

```typescript
test("should mock API", async ({ page }) => {
  await page.route("/api/data", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: "mocked" }),
    });
  });

  await page.goto("/");
});
```

## Wskazówki

1. **Pisz testy przed bugfixami** - TDD pomaga w reprodukcji bugów
2. **Jeden assert na test** - lub grupuj logicznie powiązane asserty
3. **Opisowe nazwy testów** - test powinien być dokumentacją
4. **Izolacja testów** - każdy test powinien być niezależny
5. **Cleanup** - używaj hooks do czyszczenia po testach
6. **Selektory semantyczne** - używaj role, label, text zamiast klas CSS
7. **Async/await** - zawsze używaj await dla operacji asynchronicznych
8. **Timeouty** - unikaj `waitForTimeout`, używaj `waitFor` z warunkami

## Rozwiązywanie Problemów

### Vitest

**Problem**: Test nie znajduje modułu  
**Rozwiązanie**: Sprawdź alias w `vitest.config.ts`

**Problem**: jsdom nie wspiera API przeglądarki  
**Rozwiązanie**: Dodaj mock w `src/test/setup.ts`

### Playwright

**Problem**: Test timeout  
**Rozwiązanie**: Zwiększ timeout w `playwright.config.ts` lub użyj `test.setTimeout()`

**Problem**: Selector nie znaleziony  
**Rozwiązanie**: Użyj `npx playwright codegen` do znalezienia odpowiedniego selectora

**Problem**: Flaky test  
**Rozwiązanie**: Użyj `waitForLoadState`, `waitForSelector` zamiast fixed delays

## Zasoby

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Axe Accessibility](https://www.deque.com/axe/)
