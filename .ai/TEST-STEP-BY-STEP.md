# 🧪 Testowanie Endpointa POST /api/profiles - Przewodnik Krok po Kroku

## Krok 1: Sprawdzenie czy Supabase działa lokalnie

```bash
# Sprawdź czy Supabase jest uruchomiony
npx supabase status

# Jeśli nie działa, uruchom:
npx supabase start

# Poczekaj aż wszystkie serwisy się uruchomią (może potrwać 1-2 minuty)
```

Po uruchomieniu powinieneś zobaczyć:

```
API URL: http://127.0.0.1:54321
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Krok 2: Zastosowanie migracji bazy danych

```bash
# Zastosuj migrację (jeśli jeszcze nie została zastosowana)
npx supabase db reset

# Lub tylko migracje:
npx supabase migration up
```

Sprawdź czy tabela `child_profiles` istnieje:

```bash
# Otwórz Supabase Studio
# Przejdź do: http://127.0.0.1:54323
# Table Editor -> child_profiles (powinna być pusta)
```

---

## Krok 3: Utworzenie testowego użytkownika i zdobycie JWT

### Opcja A: Przez Supabase Studio (Łatwiejsze)

1. Otwórz: http://127.0.0.1:54323
2. Przejdź do: **Authentication** → **Users**
3. Kliknij: **Add user** → **Create new user**
4. Email: `test@example.com`
5. Password: `testpassword123`
6. Zaznacz: **Auto Confirm User**
7. Kliknij: **Create user**

**Aby zdobyć JWT token:**

1. Kliknij na utworzonego użytkownika
2. W prawym panelu znajdź **"User UID"** (skopiuj - to będzie parent_id)
3. Niestety Studio nie pokazuje tokenu bezpośrednio, więc użyj Opcji B

### Opcja B: Przez curl (Zalecane dla testów)

```bash
# 1. Załóż użytkownika (tylko raz)
curl -X POST 'http://127.0.0.1:54321/auth/v1/signup' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

**Odpowiedź zawiera `access_token` - SKOPIUJ GO!**

Jeśli użytkownik już istnieje, zaloguj się:

```bash
# 2. Zaloguj się aby dostać nowy token
curl -X POST 'http://127.0.0.1:54321/auth/v1/token?grant_type=password' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

**Skopiuj `access_token` z odpowiedzi!**

---

## Krok 4: Test manualny z curl

### Test 1: Sukces - utworzenie profilu (201)

```bash
curl -X POST http://localhost:4321/api/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TWÓJ_ACCESS_TOKEN_TUTAJ" \
  -d '{
    "profileName": "Anna",
    "dateOfBirth": "2018-05-24"
  }'
```

**Oczekiwany wynik:**

```json
{
  "id": "550e8400-...",
  "parentId": "7c9e6679-...",
  "profileName": "Anna",
  "dateOfBirth": "2018-05-24",
  "currentLevelId": 1,
  "lastPlayedAt": null,
  "totalScore": 0,
  "createdAt": "2025-01-01T...",
  "updatedAt": null
}
```

### Test 2: Brak autoryzacji (401)

```bash
curl -X POST http://localhost:4321/api/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "profileName": "Jan",
    "dateOfBirth": "2016-03-15"
  }'
```

**Oczekiwany wynik:**

```json
{
  "error": "unauthenticated",
  "message": "Authentication required"
}
```

### Test 3: Nieprawidłowa nazwa (400)

```bash
curl -X POST http://localhost:4321/api/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TWÓJ_ACCESS_TOKEN_TUTAJ" \
  -d '{
    "profileName": "Anna123",
    "dateOfBirth": "2018-05-24"
  }'
```

**Oczekiwany wynik:**

```json
{
  "error": "invalid_request",
  "message": "Validation failed",
  "details": {
    "profileName": "Profile name must contain only letters, spaces, and hyphens"
  }
}
```

---

## Krok 5: Automatyczne testy z Node.js

Po zdobyciu JWT tokenu:

```bash
# Uruchom wszystkie testy automatycznie
node .ai/test-profiles-endpoint.mjs TWÓJ_ACCESS_TOKEN_TUTAJ
```

**Przykładowy output:**

```
🧪 Testing POST /api/profiles endpoint

📍 API URL: http://localhost:4321/api/profiles
🔑 JWT Token: eyJhbGciOiJIUzI1NiIsI...

✅ Valid profile creation
   Status: 201
   Response: {
     "id": "...",
     "profileName": "Anna",
     ...
   }

❌ No authentication
   Status: 401
   ...

═══════════════════════════════════════════════════════════
📊 Results: 7 passed, 1 failed out of 8 tests
═══════════════════════════════════════════════════════════
```

---

## Krok 6: Weryfikacja w bazie danych

Po utworzeniu profili, sprawdź w Supabase Studio:

1. Otwórz: http://127.0.0.1:54323
2. **Table Editor** → **child_profiles**
3. Sprawdź czy profile są tam widoczne

Lub przez SQL:

```sql
SELECT * FROM child_profiles;
```

---

## Krok 7: Test duplikatu nazwy (409)

Po utworzeniu profilu "Anna", spróbuj utworzyć kolejny z tą samą nazwą:

```bash
curl -X POST http://localhost:4321/api/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TWÓJ_ACCESS_TOKEN_TUTAJ" \
  -d '{
    "profileName": "Anna",
    "dateOfBirth": "2016-08-10"
  }'
```

**Oczekiwany wynik:**

```json
{
  "error": "conflict",
  "message": "A profile with this name already exists for this parent"
}
```

---

## Krok 8: Test limitu 10 profili

Utwórz 10 profili z różnymi nazwami, a potem spróbuj utworzyć 11.:

```bash
# Profile 1-10
for i in {1..10}; do
  curl -X POST http://localhost:4321/api/profiles \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer TWÓJ_TOKEN" \
    -d "{\"profileName\":\"Child$i\",\"dateOfBirth\":\"2015-01-0$i\"}"
done

# Profile 11 (powinien zawieść)
curl -X POST http://localhost:4321/api/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TWÓJ_TOKEN" \
  -d '{"profileName":"Child11","dateOfBirth":"2015-01-11"}'
```

**Oczekiwany wynik dla 11. profilu:**

```json
{
  "error": "conflict",
  "message": "Parent already has 10 child profiles (maximum allowed)"
}
```

---

## Troubleshooting

### "Failed to check profile count"

```bash
# Sprawdź czy Supabase działa
npx supabase status

# Sprawdź logi
npx supabase logs

# Restart Supabase
npx supabase stop
npx supabase start
```

### "Authentication required" mimo tokenu

- Token wygasł (ważny 1h) - zdobądź nowy przez login
- Sprawdź czy token ma prefix "Bearer " w nagłówku
- Upewnij się że Supabase URL w .env jest poprawny

### Server nie odpowiada

```bash
# Sprawdź czy dev server działa
curl http://localhost:4321/

# Jeśli nie, uruchom:
npm run dev
```

### Tabela nie istnieje

```bash
# Zastosuj migracje
npx supabase db reset
```

---

## Checklist testowania ✅

- [ ] Supabase działa (`npx supabase status`)
- [ ] Migracje zastosowane (`npx supabase db reset`)
- [ ] Dev server uruchomiony (`npm run dev`)
- [ ] Użytkownik testowy utworzony
- [ ] JWT token zdobyty
- [ ] ✅ Test 1: Sukces (201)
- [ ] ❌ Test 2: Brak auth (401)
- [ ] ❌ Test 3: Nieprawidłowa nazwa (400)
- [ ] ❌ Test 4: Przyszła data (400)
- [ ] ❌ Test 5: Duplikat nazwy (409)
- [ ] ❌ Test 6: Limit 10 profili (409)
- [ ] Profile widoczne w bazie danych
- [ ] Security headers w response

---

## Wszystko działa? 🎉

Jeśli wszystkie testy przeszły:

1. ✅ Endpoint jest gotowy
2. ✅ Walidacja działa poprawnie
3. ✅ Security headers są ustawione
4. ✅ RLS policies działają

**Możesz przejść do implementacji kolejnych endpointów!**
