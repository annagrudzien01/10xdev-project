# Page Object Model (POM) - Dokumentacja

## Przegląd

Ten katalog zawiera wszystkie Page Object Models (POM) używane w testach E2E Playwright.

## Istniejące Page Objects

### BasePage
**Plik**: `BasePage.ts`  
**Opis**: Klasa bazowa dla wszystkich Page Objects zawierająca wspólną funkcjonalność.

**Metody**:
- `goto(path)` - nawigacja do ścieżki
- `getByTestId(testId)` - pobieranie elementu po data-testid
- `waitForPageLoad()` - czekanie na załadowanie strony
- `isVisible(testId)` - sprawdzenie widoczności elementu
- `screenshot(name)` - zrobienie screenshota

---

### ProfilesPage
**Plik**: `ProfilesPage.ts`  
**URL**: `/profiles`  
**Opis**: Page Object dla strony z listą profili dzieci.

**Locatory**:
- `pageTitle` - tytuł strony "Wybierz profil"
- `profilesList` - lista profili
- `addProfileCard` - przycisk dodawania nowego profilu
- `profileCounter` - licznik profili (X/10)
- `loadingState` - stan ładowania
- `errorState` - stan błędu
- `emptyState` - pusty stan
- `maxLimitMessage` - komunikat o osiągnięciu limitu

**Główne metody**:
```typescript
async navigate(): Promise<void>
async clickAddProfile(): Promise<void>
async clickAddProfileFromEmptyState(): Promise<void>
async getProfileCount(): Promise<number>
async hasProfile(profileName: string): Promise<boolean>
async clickProfileByName(profileName: string): Promise<void>
async waitForProfilesLoad(): Promise<void>
async isLoading(): Promise<boolean>
async hasError(): Promise<boolean>
async isEmpty(): Promise<boolean>
async isAtMaxLimit(): Promise<boolean>
async verifyPageLoaded(): Promise<void>
async openProfileMenu(profileName: string, action: "edit" | "delete"): Promise<void>
async deleteProfile(profileName: string): Promise<void>
async cancelDeleteProfile(profileName: string): Promise<void>
async isDeleteDialogVisible(): Promise<boolean>
async getDeleteErrorMessage(): Promise<string>
```

**Przykład użycia**:
```typescript
const profilesPage = new ProfilesPage(page);
await profilesPage.navigate();
await profilesPage.verifyPageLoaded();
await profilesPage.clickAddProfile();

// Deleting a profile
await profilesPage.deleteProfile("Anna");

// Or with manual steps
await profilesPage.openProfileMenu("Anna", "delete");
expect(await profilesPage.isDeleteDialogVisible()).toBe(true);
```

---

### AddProfilePage
**Plik**: `AddProfilePage.ts`  
**URL**: `/profiles/new`  
**Opis**: Page Object dla formularza dodawania nowego profilu.

**Locatory**:
- `pageTitle` - tytuł strony
- `form` - kontener formularza
- `nameInput` - pole imienia
- `dateInput` - pole daty urodzenia
- `submitButton` - przycisk zapisu
- `cancelButton` - przycisk anulowania
- `generalError` - ogólny błąd API
- `nameError` - błąd walidacji imienia
- `dateError` - błąd walidacji daty

**Główne metody**:
```typescript
async navigate(): Promise<void>
async fillName(name: string): Promise<void>
async fillDateOfBirth(date: string): Promise<void>
async fillForm(name: string, dateOfBirth: string): Promise<void>
async submit(): Promise<void>
async cancel(): Promise<void>
async createProfile(name: string, dateOfBirth: string): Promise<void>
async isSubmitDisabled(): Promise<boolean>
async isSubmitting(): Promise<boolean>
async hasNameError(): Promise<boolean>
async hasDateError(): Promise<boolean>
async getNameErrorMessage(): Promise<string>
async verifyPageLoaded(): Promise<void>
async waitForSubmitSuccess(): Promise<void>
getValidDateForAge(age: number): string
```

**Przykład użycia**:
```typescript
const addProfilePage = new AddProfilePage(page);
await addProfilePage.navigate();
await addProfilePage.verifyPageLoaded();
await addProfilePage.createProfile("Anna", addProfilePage.getValidDateForAge(5));
await addProfilePage.waitForSubmitSuccess();
```

---

## Tworzenie Nowego Page Object

### Krok 1: Utwórz plik klasy

```typescript
// e2e/page-objects/MyNewPage.ts
import { type Page, type Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class MyNewPage extends BasePage {
  readonly path = "/my-route";
  
  // Locatory
  readonly myElement: Locator;
  
  constructor(page: Page) {
    super(page);
    this.myElement = this.getByTestId("my-element");
  }
  
  // Nawigacja
  async navigate(): Promise<void> {
    await this.goto(this.path);
    await this.waitForPageLoad();
  }
  
  // Akcje
  async clickMyElement(): Promise<void> {
    await this.myElement.click();
  }
  
  // Weryfikacje
  async verifyPageLoaded(): Promise<void> {
    await expect(this.myElement).toBeVisible();
  }
}
```

### Krok 2: Eksportuj w index.ts

```typescript
// e2e/page-objects/index.ts
export { MyNewPage } from "./MyNewPage";
```

### Krok 3: Użyj w testach

```typescript
import { test } from "@playwright/test";
import { MyNewPage } from "./page-objects";

test("my test", async ({ page }) => {
  const myPage = new MyNewPage(page);
  await myPage.navigate();
  await myPage.verifyPageLoaded();
  await myPage.clickMyElement();
});
```

---

## Best Practices

### 1. Locatory jako readonly properties
```typescript
// ✅ Dobrze
readonly submitButton: Locator;

// ❌ Źle
getSubmitButton() {
  return this.page.getByTestId("submit");
}
```

### 2. Używaj data-testid
```typescript
// ✅ Dobrze
this.submitButton = this.getByTestId("submit-button");

// ❌ Unikaj
this.submitButton = this.page.locator(".btn-submit");
```

### 3. Metody zwracają Promise
```typescript
// ✅ Dobrze
async clickButton(): Promise<void> {
  await this.button.click();
}

// ❌ Źle (brak async/await)
clickButton() {
  this.button.click();
}
```

### 4. Assertions w testach, nie w Page Objects
```typescript
// ✅ Dobrze w teście
await expect(myPage.successMessage).toBeVisible();

// ⚠️ Wyjątek: metody verify* w Page Object
async verifyPageLoaded(): Promise<void> {
  await expect(this.pageTitle).toBeVisible();
}
```

### 5. Semantic naming
```typescript
// ✅ Dobrze - opisowe nazwy akcji
async createProfile(name: string, date: string): Promise<void>

// ❌ Źle - zbyt ogólne
async submit(): Promise<void>
```

### 6. Grupuj powiązane metody
```typescript
export class MyPage extends BasePage {
  // 1. Properties (path, locators)
  readonly path = "/my-path";
  readonly button: Locator;
  
  // 2. Constructor
  constructor(page: Page) { }
  
  // 3. Navigation
  async navigate(): Promise<void> { }
  
  // 4. Actions (user interactions)
  async clickButton(): Promise<void> { }
  
  // 5. Getters (read data)
  async getValue(): Promise<string> { }
  
  // 6. Verifications
  async verifyPageLoaded(): Promise<void> { }
  
  // 7. Helpers
  private formatDate(date: Date): string { }
}
```

---

## Testowanie z POM

### Struktura testu (Arrange, Act, Assert)

```typescript
test("should create profile", async ({ page }) => {
  // Arrange - przygotowanie
  const profilesPage = new ProfilesPage(page);
  const addProfilePage = new AddProfilePage(page);
  await profilesPage.navigate();
  
  // Act - akcja
  await profilesPage.clickAddProfile();
  await addProfilePage.createProfile("Anna", "2018-05-15");
  
  // Assert - weryfikacja
  await addProfilePage.waitForSubmitSuccess();
  expect(await profilesPage.hasProfile("Anna")).toBe(true);
});
```

### Reuse w beforeEach

```typescript
test.describe("My Feature", () => {
  let myPage: MyPage;
  
  test.beforeEach(async ({ page }) => {
    myPage = new MyPage(page);
    await myPage.navigate();
  });
  
  test("test 1", async () => {
    await myPage.doSomething();
  });
  
  test("test 2", async () => {
    await myPage.doSomethingElse();
  });
});
```

---

## FAQ

### Kiedy tworzyć nowy Page Object?
- Dla każdej unikalnej strony/route w aplikacji
- Dla złożonych komponentów używanych w wielu testach
- Gdy ta sama sekwencja akcji powtarza się w testach

### Czy Page Object może używać innego Page Object?
Tak, ale uważaj na circular dependencies:
```typescript
export class CheckoutPage extends BasePage {
  private cartPage: CartPage;
  
  constructor(page: Page) {
    super(page);
    this.cartPage = new CartPage(page);
  }
}
```

### Jak obsługiwać dialogi?
```typescript
async deleteWithConfirmation(): Promise<void> {
  // Setup dialog handler before action
  this.page.on("dialog", (dialog) => dialog.accept());
  await this.deleteButton.click();
}
```

### Jak obsługiwać navigation/redirect?
```typescript
async submitAndWaitForRedirect(): Promise<void> {
  await this.submitButton.click();
  await this.page.waitForURL("/success");
}
```

---

## Maintenance

### Gdy zmienia się UI
1. Zaktualizuj tylko locator w Page Object
2. Testy pozostają bez zmian
3. Jedna zmiana zamiast 20+

### Gdy dodajesz nowy element
1. Dodaj `data-testid` w komponencie
2. Dodaj locator w Page Object
3. Dodaj metodę interakcji (jeśli potrzebna)
4. Użyj w testach

---

## Przykładowy kompletny test

Zobacz `e2e/profile-management.spec.ts` dla pełnego przykładu testów używających POM.
