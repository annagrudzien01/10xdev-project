# Testy E2E (End-to-End)

Ten katalog zawiera testy E2E napisane w Playwright.

## Struktura

```
e2e/
  ├── fixtures/          # Fixture i pomocnicze dane
  │   └── auth.ts       # Funkcje do logowania/wylogowania
  ├── utils/            # Funkcje pomocnicze
  │   └── test-helpers.ts
  ├── *.spec.ts         # Pliki testowe
  └── README.md         # Ten plik
```

## Uruchamianie Testów

```bash
# Wszystkie testy E2E
npm run test:e2e

# Z interfejsem UI
npm run test:e2e:ui

# Z widoczną przeglądarką
npm run test:e2e:headed

# W trybie debug
npm run test:e2e:debug
```

## Pisanie Nowych Testów

1. Utwórz nowy plik `*.spec.ts` w katalogu `e2e/`
2. Importuj helpers z `./utils/test-helpers`
3. Używaj Page Object Model dla skomplikowanych stron
4. Dodaj testy dostępności z `@axe-core/playwright`

## Przykład

```typescript
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { navigateTo } from "./utils/test-helpers";

test.describe("My Feature", () => {
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, "/my-feature");
  });

  test("should work correctly", async ({ page }) => {
    // Your test here
  });

  test("should have no a11y violations", async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
```

## Best Practices

- Używaj semantycznych selektorów (role, label, text)
- Zawsze testuj dostępność
- Użyj browser contexts dla izolacji
- Wykorzystuj test hooks (beforeEach/afterEach)
- Dodawaj visual regression tests dla krytycznych stron
