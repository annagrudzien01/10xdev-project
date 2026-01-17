# Testy E2E (End-to-End)

Ten katalog zawiera testy E2E napisane w Playwright.

## Struktura

```
e2e/
  ├── page-objects/     # Page Object Model classes
  │   ├── BasePage.ts        # Base class for all pages
  │   ├── ProfilesPage.ts    # Profiles list page
  │   ├── AddProfilePage.ts  # Add profile form page
  │   └── index.ts           # Central exports
  ├── fixtures/         # Fixture i pomocnicze dane
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
2. Importuj Page Objects z `./page-objects`
3. Używaj Page Object Model dla wszystkich stron
4. Dodaj testy dostępności z `@axe-core/playwright`
5. Stosuj wzorzec **Arrange, Act, Assert** dla czytelności

## Page Object Model (POM)

### Dlaczego POM?

- **Maintainability**: Zmiany w UI wymagają aktualizacji tylko w jednym miejscu
- **Reusability**: Wspólne akcje można używać w wielu testach
- **Readability**: Testy są bardziej czytelne i opisowe
- **Type Safety**: TypeScript zapewnia bezpieczeństwo typów

### Struktura POM

```typescript
// BasePage - klasa bazowa z wspólną funkcjonalnością
export class BasePage {
  protected readonly page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  // Wspólne metody dla wszystkich stron
  async goto(path: string): Promise<void> { }
  getByTestId(testId: string): Locator { }
}

// Konkretna strona dziedziczy po BasePage
export class ProfilesPage extends BasePage {
  readonly addProfileCard: Locator;
  
  constructor(page: Page) {
    super(page);
    this.addProfileCard = this.getByTestId('add-profile-card');
  }
  
  async clickAddProfile(): Promise<void> {
    await this.addProfileCard.click();
  }
}
```

### Przykład z POM

```typescript
import { test, expect } from "@playwright/test";
import { ProfilesPage, AddProfilePage } from "./page-objects";

test.describe("Profile Management", () => {
  let profilesPage: ProfilesPage;
  let addProfilePage: AddProfilePage;

  test.beforeEach(async ({ page }) => {
    // Arrange - Initialize Page Objects
    profilesPage = new ProfilesPage(page);
    addProfilePage = new AddProfilePage(page);
  });

  test("should create a new profile", async () => {
    // Arrange
    await profilesPage.navigate();
    
    // Act
    await profilesPage.clickAddProfile();
    await addProfilePage.createProfile("Anna", "2018-05-15");
    
    // Assert
    await addProfilePage.waitForSubmitSuccess();
    expect(await profilesPage.hasProfile("Anna")).toBe(true);
  });
});
```

## Tworzenie Nowych Page Objects

1. Utwórz nowy plik w `e2e/page-objects/`
2. Rozszerz klasę `BasePage`
3. Zdefiniuj locatory jako readonly properties
4. Stwórz metody dla akcji użytkownika
5. Dodaj metody weryfikacyjne (assertions)
6. Eksportuj z `index.ts`

### Szablon Page Object

```typescript
import { type Page, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class MyFeaturePage extends BasePage {
  readonly path = "/my-feature";
  
  // Locators
  readonly myButton: Locator;
  readonly myInput: Locator;
  
  constructor(page: Page) {
    super(page);
    this.myButton = this.getByTestId("my-button");
    this.myInput = this.getByTestId("my-input");
  }
  
  // Navigation
  async navigate(): Promise<void> {
    await this.goto(this.path);
  }
  
  // Actions
  async clickButton(): Promise<void> {
    await this.myButton.click();
  }
  
  // Verifications
  async verifyPageLoaded(): Promise<void> {
    await expect(this.myButton).toBeVisible();
  }
}
```

## Best Practices

### Selektory
- **Priorytet 1**: `data-testid` - najbardziej stabilne
- **Priorytet 2**: Role selectors - `page.getByRole('button', { name: 'Submit' })`
- **Priorytet 3**: Text selectors - `page.getByText('Welcome')`
- **Unikaj**: CSS selectors, XPath - kruche i trudne w maintenance

### Struktura testów
- Stosuj wzorzec **Arrange, Act, Assert**
- Jedna assertion na test (gdy możliwe)
- Opisowe nazwy testów w stylu "should [expected behavior] when [condition]"
- Grupuj powiązane testy w `describe` blocks

### Page Object Model
- Wszystkie interakcje ze stroną przez Page Objects
- Page Objects zawierają tylko locatory i akcje
- Assertions w testach, nie w Page Objects (wyjątek: metody `verify*`)
- Jedna klasa Page Object = jedna strona/komponent

### Izolacja i czystość
- Każdy test niezależny od innych
- Użyj browser contexts dla izolacji sesji
- Cleanup w `afterEach` jeśli potrzebny
- Wykorzystuj test hooks (beforeEach/afterEach)

### Performance
- Wykorzystaj parallel execution
- Minimalizuj `page.waitForTimeout()` - użyj `waitFor*` zamiast
- Reuse Page Objects w `beforeEach`

### Debugging
- Wykorzystaj trace viewer dla failed tests
- Dodaj screenshots w key moments
- Użyj `test.step()` dla lepszej czytelności trace
- Visual regression tests dla krytycznych stron
