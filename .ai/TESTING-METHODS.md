# 🎯 Testowanie POST /api/profiles - Wszystkie Metody

Masz **4 sposoby** na przetestowanie endpointa. Wybierz najbardziej wygodny dla Ciebie:

---

## ⚡ Metoda 1: Automatyczny skrypt Node.js (NAJSZYBSZY)

**Zalecane dla szybkich testów wszystkich scenariuszy**

```bash
# 1. Zdobądź JWT token (patrz sekcja "Jak zdobyć JWT token" poniżej)

# 2. Uruchom testy
node .ai/test-profiles-endpoint.mjs YOUR_JWT_TOKEN
```

**Plusy:**

- ✅ Testuje wszystkie 8 scenariuszy automatycznie
- ✅ Sprawdza security headers
- ✅ Kolorowy output z wynikami
- ✅ Nie wymaga dodatkowego oprogramowania

---

## 🪟 Metoda 2: PowerShell Script (WINDOWS)

**Najlepsza dla użytkowników Windows**

```powershell
# Uruchom PowerShell i wykonaj:
.\.ai\quick-test.ps1

# Zostaniesz poproszony o podanie JWT tokenu
# Lub możesz pominąć i dostaniesz komendy do manual testów
```

**Plusy:**

- ✅ Natywnie dla Windows
- ✅ Kolorowy output
- ✅ Testuje główne scenariusze
- ✅ Interaktywny

---

## 🔧 Metoda 3: Postman/Insomnia (UI)

**Najlepsza dla visual testing i debugowania**

### Import kolekcji:

**Insomnia:**

1. Otwórz Insomnia
2. `Application` → `Import/Export` → `Import Data` → `From File`
3. Wybierz: `.ai/insomnia-collection.json`
4. W Environment "Local Development" ustaw `jwt_token`
5. Kliknij dowolny request → **Send**

**Postman:**

1. Otwórz Postman
2. `Import` → wybierz `.ai/insomnia-collection.json`
3. W Environments ustaw `jwt_token`
4. Uruchom Collection Runner

**Plusy:**

- ✅ Graficzny interfejs
- ✅ Łatwe debugowanie
- ✅ Historia requestów
- ✅ 10 pre-configured testów

---

## 💻 Metoda 4: Manual curl (COMMAND LINE)

**Najlepsza dla skryptów i CI/CD**

### Quick commands:

```bash
# Ustaw token jako zmienną
export JWT_TOKEN="your_jwt_token_here"

# Test 1: Sukces (201)
curl -X POST http://localhost:4321/api/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"profileName":"Anna","dateOfBirth":"2018-05-24"}'

# Test 2: Brak auth (401)
curl -X POST http://localhost:4321/api/profiles \
  -H "Content-Type: application/json" \
  -d '{"profileName":"Jan","dateOfBirth":"2016-03-15"}'

# Test 3: Nieprawidłowa nazwa (400)
curl -X POST http://localhost:4321/api/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"profileName":"Anna123","dateOfBirth":"2018-05-24"}'
```

**Plusy:**

- ✅ Nie wymaga dodatkowych narzędzi
- ✅ Łatwe do zautomatyzowania
- ✅ Działa wszędzie

---

## 🔑 Jak zdobyć JWT token?

### Opcja A: Supabase CLI (Lokalne)

```bash
# 1. Upewnij się że Supabase działa
npx supabase status

# 2. Załóż użytkownika (tylko raz)
curl -X POST 'http://127.0.0.1:54321/auth/v1/signup' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}'

# 3. Skopiuj "access_token" z odpowiedzi
```

**Jeśli użytkownik już istnieje, zaloguj się:**

```bash
curl -X POST 'http://127.0.0.1:54321/auth/v1/token?grant_type=password' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}'
```

### Opcja B: Supabase Studio

1. Otwórz: http://127.0.0.1:54323
2. `Authentication` → `Users` → `Add user`
3. Email: test@example.com, Password: testpassword123
4. ⚠️ Studio nie pokazuje tokenu bezpośrednio - użyj Opcji A

---

## 📋 Pre-flight Checklist

Przed testowaniem upewnij się że:

- [ ] **Supabase działa**: `npx supabase status`
- [ ] **Migracje zastosowane**: `npx supabase db reset` (lub `migration up`)
- [ ] **Dev server uruchomiony**: `npm run dev` (port 4321)
- [ ] **JWT token zdobyty**: Użyj jednej z metod powyżej
- [ ] **Tabela child_profiles istnieje**: Sprawdź w Studio

---

## 🎯 Moja rekomendacja

**Dla szybkiego testowania podczas developmentu:**

```bash
node .ai/test-profiles-endpoint.mjs YOUR_JWT_TOKEN
```

**Dla dokładnego debugowania:**

- Użyj Postman/Insomnia z kolekcją `.ai/insomnia-collection.json`

**Dla automatyzacji/CI:**

- Użyj curl commands w skryptach

---

## 📚 Więcej informacji

- **Szczegółowe test cases**: `.ai/testing-post-profiles.md`
- **Krok po kroku przewodnik**: `.ai/TEST-STEP-BY-STEP.md`
- **Quick start**: `.ai/QUICK-START-TESTING.md`

---

## 🆘 Troubleshooting

**"Connection refused" na port 4321?**

```bash
npm run dev
```

**"Connection refused" na Supabase?**

```bash
npx supabase start
```

**Token wygasł (401)?**

- Tokeny Supabase ważne 1 godzinę
- Zdobądź nowy przez login command

**Tabela nie istnieje?**

```bash
npx supabase db reset
```

---

## ✅ Gotowy do testowania?

Wybierz swoją metodę i rozpocznij! 🚀
