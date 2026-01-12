# Quick Start - Testowanie

Szybki przewodnik jak zacząć z testami w projekcie.

## 🚀 Pierwsze Kroki

### 1. Instalacja (już zrobione ✅)

Wszystkie zależności są już zainstalowane. Jeśli potrzebujesz przeinstalować:

```bash
npm install
npx playwright install chromium
```

### 2. Uruchom Testy Jednostkowe

```bash
# Tryb watch (automatyczne przeładowanie)
npm run test

# Jednokrotne uruchomienie
npm run test:run

# Z interfejsem UI
npm run test:ui
```

### 3. Uruchom Testy E2E

```bash
# Przed pierwszym uruchomieniem zbuduj projekt
npm run build

# Uruchom testy E2E
npm run test:e2e

# Z interfejsem UI
npm run test:e2e:ui
```

## 📝 Napisz Pierwszy Test Jednostkowy

Utwórz plik `src/components/MyComponent.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

Uruchom test:

```bash
npm run test -- MyComponent.test
```

## 🎭 Napisz Pierwszy Test E2E

Utwórz plik `e2e/my-feature.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should work', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/10x/i);
  });
});
```

Uruchom test:

```bash
npm run test:e2e -- my-feature.spec.ts
```

## 🔍 Debugowanie

### Vitest
```bash
# UI mode (najłatwiejszy)
npm run test:ui

# Konkretny test
npm run test -- -t "nazwa testu"
```

### Playwright
```bash
# Debug mode z Playwright Inspector
npm run test:e2e:debug

# Widoczna przeglądarka
npm run test:e2e:headed
```

## 📊 Coverage

```bash
# Uruchom z coverage
npm run test:coverage

# Otwórz raport
# Windows
start coverage/index.html

# macOS/Linux
open coverage/index.html
```

## 🎯 Najważniejsze Komendy

| Komenda | Opis |
|---------|------|
| `npm run test` | Testy jednostkowe (watch mode) |
| `npm run test:run` | Testy jednostkowe (jednokrotnie) |
| `npm run test:ui` | Testy jednostkowe (UI mode) |
| `npm run test:coverage` | Coverage testów jednostkowych |
| `npm run test:e2e` | Testy E2E |
| `npm run test:e2e:ui` | Testy E2E (UI mode) |
| `npm run test:e2e:debug` | Testy E2E (debug mode) |
| `npm run test:all` | Wszystkie testy |

## 📚 Więcej Informacji

- [TESTING.md](./TESTING.md) - Pełna dokumentacja
- [src/test/README.md](./src/test/README.md) - Testy jednostkowe
- [e2e/README.md](./e2e/README.md) - Testy E2E

## 🤔 FAQ

**Q: Jak przetestować komponent używający TanStack Query?**  
A: Użyj `renderWithProviders()` z `@/test/utils`

**Q: Jak mockować API calls?**  
A: Użyj MSW dla testów jednostkowych lub `page.route()` dla Playwright

**Q: Testy E2E nie działają**  
A: Upewnij się że:
1. Zbudowałeś projekt: `npm run build`
2. Zainstalowałeś Chromium: `npx playwright install chromium`

**Q: Jak uruchomić tylko wybrane testy?**  
A: 
- Vitest: `npm run test -- NazwaPliku.test.ts`
- Playwright: `npm run test:e2e -- nazwa-pliku.spec.ts`

**Q: Testy są wolne**  
A: 
- Vitest: Używaj watch mode (`npm run test`)
- Playwright: Używaj `test.only()` do uruchamiania pojedynczych testów podczas developmentu

## ✅ Checklist dla Nowych Feature'ów

- [ ] Napisz testy jednostkowe dla logiki biznesowej
- [ ] Napisz testy komponentów dla UI
- [ ] Dodaj testy E2E dla krytycznych flow
- [ ] Dodaj testy dostępności z `@axe-core/playwright`
- [ ] Upewnij się że coverage nie spadł
- [ ] Uruchom `npm run test:all` przed commitem

## 🎨 Przykłady

### Test Button Component

```typescript
// src/components/ui/button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/test/utils';
import { Button } from './button';

describe('Button', () => {
  it('handles clicks', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    
    renderWithProviders(<Button onClick={onClick}>Click</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### Test E2E Navigation

```typescript
// e2e/navigation.spec.ts
import { test, expect } from '@playwright/test';

test('navigates to demo', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /demo/i }).click();
  await expect(page).toHaveURL(/demo/);
});
```

### Test Accessibility

```typescript
// e2e/home.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('no a11y violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

---

**Happy Testing! 🎉**
