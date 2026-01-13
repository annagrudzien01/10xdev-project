# Testy Jednostkowe

Ten katalog zawiera pliki pomocnicze dla testów jednostkowych.

## Pliki

### `setup.ts`

Globalny setup dla wszystkich testów jednostkowych. Zawiera:

- Import `@testing-library/jest-dom` dla custom matchers
- Cleanup po każdym teście
- Mocki dla Web APIs (matchMedia, IntersectionObserver, ResizeObserver)
- Rozszerzenia dla `expect`

### `utils.tsx`

Funkcje pomocnicze dla testów komponentów React:

- `renderWithProviders()` - render z QueryClientProvider
- `createTestQueryClient()` - tworzenie test QueryClient
- Re-eksport wszystkich funkcji z `@testing-library/react`
- Eksport `userEvent` dla symulacji interakcji

## Użycie

### Testowanie Komponentów

```typescript
import { renderWithProviders, screen, userEvent } from '@/test/utils';
import { MyComponent } from './MyComponent';

test('should render and interact', async () => {
  const user = userEvent.setup();

  renderWithProviders(<MyComponent />);

  const button = screen.getByRole('button');
  await user.click(button);

  expect(screen.getByText('Clicked')).toBeInTheDocument();
});
```

### Testowanie z TanStack Query

```typescript
import { renderWithProviders, screen, waitFor } from '@/test/utils';
import { MyQueryComponent } from './MyQueryComponent';

test('should fetch and display data', async () => {
  renderWithProviders(<MyQueryComponent />);

  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

### Dodawanie Custom Matchers

W `setup.ts`:

```typescript
expect.extend({
  toBeValidEmail(received: string) {
    const pass = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received);
    return {
      pass,
      message: () => `expected ${received} to be a valid email`,
    };
  },
});
```

## Mockowanie

### Global Mocks

Dodaj do `setup.ts`:

```typescript
vi.stubGlobal("fetch", vi.fn());
```

### Module Mocks

Na początku pliku testowego:

```typescript
vi.mock("@/lib/api", () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: "test" })),
}));
```

## Best Practices

1. Używaj `renderWithProviders` dla komponentów używających Context
2. Cleanup jest automatyczny (w `setup.ts`)
3. Używaj `userEvent` zamiast `fireEvent` dla realistycznych interakcji
4. Dodawaj custom matchers w `setup.ts` dla reużywalności
5. Mockuj API calls z MSW dla integracyjnych testów
