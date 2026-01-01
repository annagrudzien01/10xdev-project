# 🚀 Quick Start Guide - Testing POST /api/profiles

## Option 1: Node.js Test Script (Recommended)

**Szybki test wszystkich scenariuszy:**

```bash
# 1. Uruchom serwer deweloperski (w osobnym terminalu)
npm run dev

# 2. Zdobądź JWT token (patrz sekcja "Getting JWT Token" poniżej)

# 3. Uruchom testy
node .ai/test-profiles-endpoint.mjs YOUR_JWT_TOKEN

# Lub z environment variable:
JWT_TOKEN=your_token node .ai/test-profiles-endpoint.mjs
```

## Option 2: Insomnia/Postman Collection

**Import gotowej kolekcji requestów:**

### Insomnia:

1. Otwórz Insomnia
2. `Application` → `Import/Export` → `Import Data` → `From File`
3. Wybierz `.ai/insomnia-collection.json`
4. W środowisku "Local Development" ustaw `jwt_token`
5. Kliknij dowolny request i "Send"

### Postman:

1. Otwórz Postman
2. `Import` → wybierz `.ai/insomnia-collection.json`
3. W Environments ustaw `jwt_token` i `base_url`
4. Uruchom collection runner

## Option 3: Manual curl Testing

```bash
# Test 1: Sukces (201)
curl -X POST http://localhost:4321/api/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"profileName":"Anna","dateOfBirth":"2018-05-24"}'

# Test 2: Brak autoryzacji (401)
curl -X POST http://localhost:4321/api/profiles \
  -H "Content-Type: application/json" \
  -d '{"profileName":"Jan","dateOfBirth":"2016-03-15"}'

# Test 3: Nieprawidłowa nazwa (400)
curl -X POST http://localhost:4321/api/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"profileName":"Anna123","dateOfBirth":"2018-05-24"}'
```

---

## Getting JWT Token

### Method 1: Supabase Dashboard

1. Przejdź do [Supabase Dashboard](https://app.supabase.com)
2. Wybierz swój projekt
3. `Authentication` → `Users`
4. Znajdź/stwórz użytkownika testowego
5. Kliknij na użytkownika → skopiuj "Access Token"

### Method 2: Manual Auth Request

```bash
# Najpierw załóż użytkownika testowego (jeśli nie istnieje)
curl -X POST 'https://YOUR_PROJECT.supabase.co/auth/v1/signup' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'

# Następnie zaloguj się aby dostać token
curl -X POST 'https://YOUR_PROJECT.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

Odpowiedź zawiera `access_token` - to jest Twój JWT.

### Method 3: Supabase CLI (jeśli masz lokalny stack)

```bash
# Załóż użytkownika
npx supabase auth signup --email test@example.com --password test123

# Token jest w odpowiedzi lub możesz go pobrać z dashboard
```

---

## Verifying Results

### ✅ Success Indicators:

- Status code 201 dla poprawnych requestów
- Zwrócony obiekt profilu zawiera wszystkie pola
- `currentLevelId` = 1
- `totalScore` = 0
- Security headers obecne w response

### ❌ Expected Failures:

- 401: brak/nieprawidłowy token
- 400: błędy walidacji
- 409: duplikat nazwy lub limit 10 profili

### Database Check:

```sql
-- W Supabase SQL Editor lub psql
SELECT * FROM child_profiles;
```

---

## Troubleshooting

**Server not running?**

```bash
npm run dev
# Server should start on http://localhost:4321
```

**Token expired?**

- Supabase tokens expire after 1 hour
- Get a new token using methods above

**CORS errors?**

- Not an issue for API-to-API calls
- If testing from browser, CORS is expected

**Database errors?**

```bash
# Check if migrations are applied
npm run db:migrate  # or your migration command
```

---

## Complete Testing Checklist

- [ ] Server is running (`npm run dev`)
- [ ] JWT token obtained and valid
- [ ] ✅ Test 1: Successful creation (201)
- [ ] ❌ Test 2: No auth (401)
- [ ] ❌ Test 3: Invalid name with numbers (400)
- [ ] ❌ Test 4: Future date (400)
- [ ] ❌ Test 5: Child too young (400)
- [ ] ❌ Test 6: Child too old (400)
- [ ] ❌ Test 7: Name too long (400)
- [ ] ❌ Test 8: Duplicate name (409)
- [ ] ✅ Test 9: Polish characters (201)
- [ ] ✅ Test 10: Hyphenated name (201)
- [ ] Security headers verified
- [ ] Database records verified

---

## Next Steps After Testing

1. ✅ All tests pass → Ready for production
2. 📝 Write automated tests (unit + integration)
3. 📊 Set up monitoring and logging
4. 🔒 Configure rate limiting (optional)
5. 📚 Document API for frontend team
6. 🚀 Deploy to staging/production

---

For detailed test cases and expected responses, see: `.ai/testing-post-profiles.md`
