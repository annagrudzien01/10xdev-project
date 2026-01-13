# 🧪 Testy jednostkowe - Dokumentacja

## 📂 Struktura katalogów

Katalog `__tests__/` zawiera wszystkie testy jednostkowe w strukturze **mirror** odpowiadającej strukturze `src/`:

```
src/
├── lib/
│   ├── schemas/
│   │   ├── auth.schema.ts
│   │   └── profile.schema.ts
│   ├── hooks/
│   │   └── useDemoGame.ts
│   └── utils.ts
├── components/
│   └── ui/
│       ├── button.tsx
│       └── input.tsx
│
└── __tests__/                          ← Dedykowany katalog testów
    ├── lib/
    │   ├── schemas/
    │   │   ├── auth.schema.test.ts
    │   │   ├── auth.schema.enhanced.test.ts
    │   │   └── AUTH_SCHEMA_TESTS_README.md
    │   ├── hooks/
    │   │   └── useDemoGame.test.ts
    │   └── utils.test.ts
    ├── components/
    │   └── ui/
    │       └── button.test.tsx
    └── README.md                       ← Ten plik
```

## 🎯 Zalety struktury mirror

### ✅ Korzyści:

1. **Czysta separacja** - kod produkcyjny vs testy
2. **Łatwe odnalezienie** - structure mapping 1:1
3. **Build optimization** - łatwe wykluczenie z bundle
4. **Git-friendly** - przejrzyste code review
5. **Import aliases** - niezależne od lokalizacji

### 📏 Konwencje nazewnicze:

- Testy jednostkowe: `*.test.ts` / `*.test.tsx`
- Testy integracyjne: `*.integration.test.ts`
- Testy E2E: poza `src/` w katalogu `e2e/`

## 🔧 Import paths

**ZAWSZE używaj aliasów `@/` zamiast względnych ścieżek:**

```typescript
// ✅ DOBRZE
import { loginSchema } from "@/lib/schemas/auth.schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { renderWithProviders } from "@/test/utils";

// ❌ ŹLE - nie używaj względnych ścieżek
import { loginSchema } from "../../../lib/schemas/auth.schema";
import { Button } from "../../../components/ui/button";
```

**Skonfigurowane aliasy (vitest.config.ts):**

```typescript
{
  '@': './src',
  '@/components': './src/components',
  '@/lib': './src/lib',
  '@/db': './src/db',
}
```

## 🚀 Uruchomienie testów

### Wszystkie testy:

```bash
npm run test
```

### Watch mode (development):

```bash
npm run test -- --watch
```

### Specific test file:

```bash
npm run test -- auth.schema.test.ts
npm run test -- button.test.tsx
```

### Filter by test name:

```bash
npm run test -- -t "should validate email"
npm run test -- -t "loginSchema"
```

### Coverage:

```bash
npm run test -- --coverage
```

### UI mode:

```bash
npm run test -- --ui
```

## 📝 Tworzenie nowych testów

### 1. Utwórz plik w odpowiedniej lokalizacji:

Dla pliku: `src/lib/services/user.service.ts`  
Utwórz test: `src/__tests__/lib/services/user.service.test.ts`

### 2. Użyj template:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { functionToTest } from "@/lib/services/user.service";

describe("user.service", () => {
  describe("functionToTest", () => {
    it("should do something specific", () => {
      // Arrange
      const input = "test";

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe("expected");
    });
  });
});
```

### 3. Użyj AAA pattern:

- **Arrange** - przygotuj dane testowe
- **Act** - wykonaj testowaną funkcję
- **Assert** - sprawdź wynik

## 🧩 Kategorie testów

### Unit Tests (`__tests__/`)

```typescript
// Testuj izolowane funkcje/komponenty
import { cn } from "@/lib/utils";

it("should merge class names", () => {
  expect(cn("a", "b")).toBe("a b");
});
```

### Integration Tests (jeśli używane)

```typescript
// Testuj współpracę modułów
import { authService } from "@/lib/services/auth.service";

it("should login user and set session", async () => {
  const result = await authService.login(email, password);
  expect(result.session).toBeDefined();
});
```

### E2E Tests (`e2e/`)

```typescript
// Testuj pełne user flows (Playwright)
test("user can login", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", "user@example.com");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/dashboard");
});
```

## 🎨 Best Practices

### ✅ DO:

1. **Mirror structure** - odpowiadaj strukturze src/
2. **Use aliases** - zawsze `@/` zamiast `../`
3. **Descriptive names** - jasne nazwy testów
4. **AAA pattern** - Arrange-Act-Assert
5. **One assertion per test** - (gdy możliwe)
6. **Mock external deps** - izoluj kod
7. **Test edge cases** - null, undefined, empty
8. **Group with describe** - logiczne grupowanie

### ❌ DON'T:

1. **Relative imports** - nie używaj `../../`
2. **Test implementation** - testuj behavior, nie implementację
3. **Skip tests** - napraw zamiast skipować
4. **Hardcode values** - użyj zmiennych/constów
5. **Long tests** - podziel na mniejsze
6. **Ignore linter** - popraw błędy
7. **Test external libs** - nie testuj Zod/React/etc.

## 🔍 Utilities testowe

### Test helpers (`src/test/utils.tsx`):

```typescript
import { renderWithProviders } from '@/test/utils';

// Renderuj komponenty React z providers
renderWithProviders(<Button>Click</Button>);
```

### Setup file (`src/test/setup.ts`):

- Konfiguracja środowiska testowego
- Globalne mocki (matchMedia, IntersectionObserver)
- Custom matchers

## 📊 Coverage

### Targets (vitest.config.ts):

- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

### Exclude from coverage:

- `src/__tests__/**` - pliki testowe
- `src/test/**` - utilities testowe
- `src/**/*.d.ts` - deklaracje TypeScript
- `src/db/database.types.ts` - wygenerowane typy

### Sprawdź coverage:

```bash
npm run test -- --coverage

# Otwórz HTML report:
open coverage/index.html  # macOS
start coverage/index.html # Windows
```

## 📚 Dodatkowe zasoby

### Dokumentacja szczegółowa:

- **Auth Schema Tests**: `__tests__/lib/schemas/AUTH_SCHEMA_TESTS_README.md`
- **Vitest Guidelines**: `.cursor/rules/vitest.mdc`
- **Testing Overview**: `TESTING.md` (root)
- **Quick Start**: `TESTING_QUICKSTART.md` (root)

### External docs:

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🆘 Troubleshooting

### Import errors:

```
Error: Failed to resolve import "./utils"
```

**Fix:** Użyj aliasu `@/lib/utils` zamiast względnej ścieżki

### Type errors:

```
Cannot find module '@/lib/utils'
```

**Fix:** Sprawdź `vitest.config.ts` - aliasy muszą być skonfigurowane

### Test timeout:

```
Test timed out after 10000ms
```

**Fix:** Zwiększ timeout w `vitest.config.ts` lub konkretnym teście

### Mock not working:

```
vi.mock() is not a function
```

**Fix:** Import `vi` from 'vitest' i użyj go na początku pliku

## 📈 Metrics

### Aktualne statystyki:

- **Test files**: 5
- **Total tests**: 182
- **Pass rate**: 100%
- **Duration**: ~14s
- **Coverage**: >95% dla testowanych modułów

---

**Last updated**: 2026-01-12  
**Maintained by**: Development Team  
**Questions?**: Sprawdź TESTING.md lub zapytaj team
