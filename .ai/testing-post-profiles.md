# Manual Testing Guide for POST /api/profiles

## Prerequisites

1. **Supabase Setup**: Ensure Supabase is running and database migrations are applied
2. **REST Client**: Install one of:
   - [Postman](https://www.postman.com/)
   - [Insomnia](https://insomnia.rest/)
   - [Thunder Client](https://www.thunderclient.com/) (VS Code extension)
   - curl (command line)

## Getting Started

### 1. Create a Test User

First, you need a valid JWT token. Create a test user in Supabase:

```bash
# Using Supabase CLI (if available)
supabase auth signup --email test@example.com --password testpassword123

# Or use Supabase Dashboard:
# Go to Authentication > Users > Add user
```

### 2. Get JWT Token

After signup/login, you'll receive a JWT token. You can get it via:

- Supabase Dashboard: Authentication > Users > Copy access token
- Or by calling the Supabase auth endpoint directly

**Example Login Request:**

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

Response will contain `access_token` - this is your JWT.

---

## Test Cases

### ✅ Test 1: Successful Profile Creation (201)

**Request:**

```http
POST http://localhost:4321/api/profiles
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE

{
  "profileName": "Anna",
  "dateOfBirth": "2018-05-24"
}
```

**Expected Response (201 Created):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "parentId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "profileName": "Anna",
  "dateOfBirth": "2018-05-24",
  "currentLevelId": 1,
  "lastPlayedAt": null,
  "totalScore": 0,
  "createdAt": "2025-01-01T10:00:00.000Z",
  "updatedAt": null
}
```

**Verify:**

- Status code is 201
- Response contains all required fields
- `currentLevelId` is 1
- `totalScore` is 0
- Security headers are present (check in network tab)

---

### ❌ Test 2: Missing Authentication (401)

**Request:**

```http
POST http://localhost:4321/api/profiles
Content-Type: application/json

{
  "profileName": "Jan",
  "dateOfBirth": "2016-03-15"
}
```

**Expected Response (401 Unauthorized):**

```json
{
  "error": "unauthenticated",
  "message": "Authentication required"
}
```

---

### ❌ Test 3: Invalid Profile Name - Numbers (400)

**Request:**

```http
POST http://localhost:4321/api/profiles
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE

{
  "profileName": "Anna123",
  "dateOfBirth": "2018-05-24"
}
```

**Expected Response (400 Bad Request):**

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

### ❌ Test 4: Invalid Profile Name - Special Characters (400)

**Request:**

```http
POST http://localhost:4321/api/profiles
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE

{
  "profileName": "Anna@#$",
  "dateOfBirth": "2018-05-24"
}
```

**Expected Response (400 Bad Request):**

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

### ❌ Test 5: Profile Name Too Long (400)

**Request:**

```http
POST http://localhost:4321/api/profiles
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE

{
  "profileName": "Anna Maria Katarzyna Joanna Aleksandra Smith",
  "dateOfBirth": "2018-05-24"
}
```

**Expected Response (400 Bad Request):**

```json
{
  "error": "invalid_request",
  "message": "Validation failed",
  "details": {
    "profileName": "Profile name must not exceed 32 characters"
  }
}
```

---

### ❌ Test 6: Future Date of Birth (400)

**Request:**

```http
POST http://localhost:4321/api/profiles
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE

{
  "profileName": "Anna",
  "dateOfBirth": "2030-01-01"
}
```

**Expected Response (400 Bad Request):**

```json
{
  "error": "invalid_request",
  "message": "Validation failed",
  "details": {
    "dateOfBirth": "Date of birth must be in the past"
  }
}
```

---

### ❌ Test 7: Child Too Young (400)

**Request:**

```http
POST http://localhost:4321/api/profiles
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE

{
  "profileName": "Baby",
  "dateOfBirth": "2024-01-01"
}
```

**Expected Response (400 Bad Request):**

```json
{
  "error": "invalid_request",
  "message": "Validation failed",
  "details": {
    "dateOfBirth": "Child must be between 2 and 18 years old"
  }
}
```

---

### ❌ Test 8: Child Too Old (400)

**Request:**

```http
POST http://localhost:4321/api/profiles
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE

{
  "profileName": "Jan",
  "dateOfBirth": "2000-01-01"
}
```

**Expected Response (400 Bad Request):**

```json
{
  "error": "invalid_request",
  "message": "Validation failed",
  "details": {
    "dateOfBirth": "Child must be between 2 and 18 years old"
  }
}
```

---

### ❌ Test 9: Duplicate Profile Name (409)

**Setup:** First create a profile with name "Anna"

**Request:**

```http
POST http://localhost:4321/api/profiles
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE

{
  "profileName": "Anna",
  "dateOfBirth": "2016-08-10"
}
```

**Expected Response (409 Conflict):**

```json
{
  "error": "conflict",
  "message": "A profile with this name already exists for this parent"
}
```

---

### ❌ Test 10: Maximum Profile Limit (409)

**Setup:** Create 10 profiles first

**Request:**

```http
POST http://localhost:4321/api/profiles
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE

{
  "profileName": "Eleventh Child",
  "dateOfBirth": "2018-05-24"
}
```

**Expected Response (409 Conflict):**

```json
{
  "error": "conflict",
  "message": "Parent already has 10 child profiles (maximum allowed)"
}
```

---

### ✅ Test 11: Polish Characters in Name (201)

**Request:**

```http
POST http://localhost:4321/api/profiles
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE

{
  "profileName": "Łukasz Żółkowski",
  "dateOfBirth": "2015-11-20"
}
```

**Expected Response (201 Created):**

```json
{
  "id": "...",
  "profileName": "Łukasz Żółkowski",
  ...
}
```

---

### ✅ Test 12: Hyphenated Name (201)

**Request:**

```http
POST http://localhost:4321/api/profiles
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE

{
  "profileName": "Anna-Maria",
  "dateOfBirth": "2017-06-15"
}
```

**Expected Response (201 Created):**

```json
{
  "id": "...",
  "profileName": "Anna-Maria",
  ...
}
```

---

## curl Commands

If you prefer using curl:

### Successful creation:

```bash
curl -X POST http://localhost:4321/api/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"profileName":"Anna","dateOfBirth":"2018-05-24"}'
```

### No auth (401):

```bash
curl -X POST http://localhost:4321/api/profiles \
  -H "Content-Type: application/json" \
  -d '{"profileName":"Anna","dateOfBirth":"2018-05-24"}'
```

### Invalid name (400):

```bash
curl -X POST http://localhost:4321/api/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"profileName":"Anna123","dateOfBirth":"2018-05-24"}'
```

---

## Security Headers Verification

After making any request, verify these headers are present in the response:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';
```

**In Postman/Insomnia:** Check the "Headers" tab in the response
**In curl:** Add `-i` flag to see headers: `curl -i ...`

---

## Database Verification

After successful profile creation, verify in Supabase:

1. Go to Supabase Dashboard > Table Editor
2. Select `child_profiles` table
3. Verify:
   - New row exists with correct data
   - `parent_id` matches your user ID
   - `current_level_id` is 1
   - `total_score` is 0
   - `created_at` is set
   - `updated_at` is NULL

---

## Troubleshooting

### "Authentication required" but I have a token

- Check if token is expired (Supabase tokens expire after 1 hour by default)
- Verify token format: `Bearer YOUR_TOKEN` (with space)
- Ensure no extra quotes or whitespace

### "Failed to check profile count"

- Verify Supabase connection in `.env`
- Check if migrations are applied
- Verify RLS policies are set correctly

### "A profile with this name already exists"

- Check existing profiles in database
- Remember: names are case-sensitive in database
- Use different name for testing

### Server not responding

- Ensure dev server is running: `npm run dev`
- Check correct port (usually 4321 for Astro)
- Verify no firewall blocking

---

## Next Steps

After manual testing:

1. ✅ All 12 test cases pass
2. ✅ Security headers are present
3. ✅ Database records are correct
4. 📝 Consider writing automated tests
5. 📝 Set up monitoring/logging
6. 📝 Configure rate limiting (optional)
