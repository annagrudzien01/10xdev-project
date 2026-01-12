# Dashboard Endpoint - Manual Testing Guide

## Endpoint Details

- **URL:** `GET /api/dashboard`
- **Authentication:** Required (JWT Bearer token)
- **Response:** Array of `DashboardItemDTO` objects

## Test Scenarios

### 1. Test Without Authentication (Expected: 401 Unauthorized)

**Request:**

```bash
curl -X GET http://localhost:4321/api/dashboard
```

**Expected Response:**

```json
{
  "error": "unauthenticated",
  "message": "Authentication required"
}
```

**Expected Status Code:** `401 Unauthorized`

---

### 2. Test With Invalid Token (Expected: 401 Unauthorized)

**Request:**

```bash
curl -X GET http://localhost:4321/api/dashboard \
  -H "Authorization: Bearer invalid-token-12345"
```

**Expected Response:**

```json
{
  "error": "unauthenticated",
  "message": "Authentication required"
}
```

**Expected Status Code:** `401 Unauthorized`

---

### 3. Test With Valid Token - No Profiles (Expected: 200 OK, Empty Array)

**Request:**

```bash
curl -X GET http://localhost:4321/api/dashboard \
  -H "Authorization: Bearer <your-valid-jwt-token>"
```

**Expected Response:**

```json
[]
```

**Expected Status Code:** `200 OK`

**Note:** This response is expected for a parent user with no child profiles.

---

### 4. Test With Valid Token - With Profiles (Expected: 200 OK, Array with Data)

**Request:**

```bash
curl -X GET http://localhost:4321/api/dashboard \
  -H "Authorization: Bearer <your-valid-jwt-token>"
```

**Expected Response:**

```json
[
  {
    "profileId": "550e8400-e29b-41d4-a716-446655440000",
    "profileName": "Anna",
    "currentLevel": 4,
    "totalScore": 320,
    "lastPlayedAt": "2025-12-31T09:50:00Z"
  },
  {
    "profileId": "660e8400-e29b-41d4-a716-446655440001",
    "profileName": "Marek",
    "currentLevel": 7,
    "totalScore": 580,
    "lastPlayedAt": "2026-01-10T14:23:15Z"
  }
]
```

**Expected Status Code:** `200 OK`

**Field Validation:**

- `profileId`: UUID string
- `profileName`: Non-empty string (2-50 characters)
- `currentLevel`: Integer (1-20)
- `totalScore`: Integer (>= 0)
- `lastPlayedAt`: ISO timestamp string or `null`

---

## How to Get JWT Token

### Option 1: Using Browser DevTools

1. Open the application in browser: `http://localhost:4321`
2. Login with a parent account
3. Open Browser DevTools (F12)
4. Go to **Application** tab → **Cookies** → `http://localhost:4321`
5. Find cookie with auth token (usually `sb-access-token` or similar)
6. Copy the token value

### Option 2: Using API Login Endpoint

```bash
# Login request
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parent@example.com",
    "password": "your-password"
  }'

# Response will include cookies with auth token
```

### Option 3: From Supabase Dashboard

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Find your test user
4. Click on user to see details
5. Copy the JWT token from user details

---

## Testing in Browser

### Using Fetch API in Console

1. Open browser at `http://localhost:4321`
2. Login with parent account
3. Open DevTools Console (F12)
4. Run:

```javascript
fetch("/api/dashboard")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

**Expected:** Array of child profiles or empty array

---

## Postman / Insomnia Testing

### Setup

1. Create new GET request
2. Set URL: `http://localhost:4321/api/dashboard`
3. Add Header: `Authorization: Bearer <your-jwt-token>`
4. Send request

### Expected Results

- **Status:** 200 OK (with valid token) or 401 Unauthorized (without/invalid token)
- **Body:** JSON array of dashboard items

---

## Edge Cases to Test

### 1. Profile with null lastPlayedAt

Create a new profile that has never been used for playing.

**Expected:**

```json
{
  "profileId": "...",
  "profileName": "NewProfile",
  "currentLevel": 1,
  "totalScore": 0,
  "lastPlayedAt": null
}
```

### 2. Maximum Profiles (10 per parent)

Parent with 10 child profiles.

**Expected:** Array with exactly 10 items, ordered by `created_at`.

### 3. Profiles at Different Levels

Multiple profiles at various levels (1, 5, 10, 15, 20).

**Expected:** Array showing different `currentLevel` values (1-20).

### 4. Profiles with High Scores

Profile with significant `totalScore` value.

**Expected:** Correct integer value displayed (e.g., 1500).

---

## Performance Testing

### Response Time

- **Expected:** < 200ms for typical case (3-5 profiles)
- **Maximum:** < 500ms for 10 profiles

### Measurement in Browser

```javascript
console.time("dashboard");
fetch("/api/dashboard")
  .then((res) => res.json())
  .then((data) => {
    console.timeEnd("dashboard");
    console.log(data);
  });
```

---

## Troubleshooting

### Issue: 401 Unauthorized with valid token

**Possible Causes:**

- Token expired (check expiration time)
- Token belongs to different environment (dev vs prod)
- Cookie not being sent (check cookie settings)

**Solution:**

- Re-login to get fresh token
- Check Supabase Auth settings
- Verify middleware is working correctly

### Issue: 500 Internal Server Error

**Possible Causes:**

- Database connection error
- ProfileService error
- Unexpected exception in code

**Solution:**

- Check server logs in terminal
- Verify Supabase connection
- Check database RLS policies

### Issue: Empty array when profiles exist

**Possible Causes:**

- RLS policy blocking access
- Wrong parent user ID
- Profiles belong to different parent

**Solution:**

- Check `parent_id` in `child_profiles` table
- Verify RLS policy: `parent_id = auth.uid()`
- Check if logged in as correct parent user

---

## Verification Checklist

After testing, verify:

- [ ] Returns 401 without authentication
- [ ] Returns 401 with invalid token
- [ ] Returns 200 with valid token
- [ ] Returns empty array `[]` when no profiles exist
- [ ] Returns array with correct structure when profiles exist
- [ ] All required fields present: `profileId`, `profileName`, `currentLevel`, `totalScore`, `lastPlayedAt`
- [ ] `lastPlayedAt` can be `null`
- [ ] Response time < 200ms (typical case)
- [ ] Maximum 10 profiles returned
- [ ] Profiles sorted by creation date
- [ ] No sensitive data exposed
- [ ] Error messages are user-friendly

---

## Next Steps

After manual testing is complete:

1. **Create automated integration tests** (optional)
2. **Update API documentation** with examples
3. **Create frontend hook** (`useDashboardQuery`)
4. **Integrate with Dashboard UI component**
5. **Add monitoring/analytics** for endpoint usage

---

## Notes

- This endpoint does **not** require pagination (max 10 profiles enforced by database)
- RLS automatically filters profiles by `parent_id`
- Response is sorted by `created_at` ascending (oldest first)
- All timestamps are in ISO 8601 format
- Token must be in `Authorization: Bearer <token>` header format
