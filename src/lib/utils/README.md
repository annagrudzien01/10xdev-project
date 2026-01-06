# Utilities

This directory contains utility functions and helpers used throughout the application.

## API Client (`api-client.ts`)

Helper functions for making API requests with automatic authentication handling.

### Features

- ✅ Automatic 401 redirect to login
- ✅ Type-safe responses with TypeScript
- ✅ JSON parsing and error handling
- ✅ Cookie cleanup on unauthorized access

### Quick Start

```typescript
import { fetchWithAuth, apiClient } from "@/lib/utils/api-client";

// Simple fetch with auth handling
const response = await fetchWithAuth("/api/profiles");
const data = await response.json();

// Type-safe API client (recommended)
const profile = await apiClient<ChildProfileDTO>("/api/profiles/123");
```

### API Reference

#### `fetchWithAuth(input, init?)`

Enhanced `fetch` wrapper that automatically handles 401 responses.

**Parameters:**

- `input`: `RequestInfo | URL` - The resource to fetch
- `init?`: `RequestInit` - Fetch options (optional)

**Returns:** `Promise<Response>`

**Example:**

```typescript
const response = await fetchWithAuth("/api/profiles/123/tasks/current", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
});

if (response.ok) {
  const data = await response.json();
  console.log(data);
}
```

#### `apiClient<T>(url, options?)`

Type-safe API client with automatic JSON parsing and error handling.

**Parameters:**

- `url`: `string` - API endpoint URL
- `options?`: `RequestInit & { skipAuthRedirect?: boolean }` - Request options

**Returns:** `Promise<T>`

**Example:**

```typescript
import type { CurrentPuzzleDTO } from "@/types";

try {
  const puzzle = await apiClient<CurrentPuzzleDTO>("/api/profiles/123/tasks/current");
  console.log(`Puzzle ID: ${puzzle.sequenceId}`);
} catch (error) {
  console.error("Failed to fetch puzzle:", error.message);
}
```

**With POST:**

```typescript
import type { ChildProfileDTO, CreateChildProfileCommand } from "@/types";

const newProfile = await apiClient<ChildProfileDTO>("/api/profiles", {
  method: "POST",
  body: JSON.stringify({
    profileName: "Jan",
    dateOfBirth: "2015-01-01",
  } as CreateChildProfileCommand),
});
```

**Skip Auth Redirect:**

```typescript
// For cases where you want to handle 401 manually
try {
  const data = await apiClient("/api/auth/me", {
    skipAuthRedirect: true,
  });
} catch (error) {
  // Handle 401 yourself
  console.log("Not authenticated");
}
```

#### `handleUnauthorized()`

Manually trigger the unauthorized handler (clear cookies and redirect to login).

**Returns:** `void`

**Example:**

```typescript
import { handleUnauthorized } from "@/lib/utils/api-client";

// Manually trigger logout/redirect
function logout() {
  handleUnauthorized();
}
```

#### `isAPIError(error)`

Type guard to check if an error is an API error response.

**Parameters:**

- `error`: `unknown` - The error to check

**Returns:** `boolean`

**Example:**

```typescript
import { apiClient, isAPIError } from "@/lib/utils/api-client";

try {
  await apiClient("/api/profiles");
} catch (error) {
  if (isAPIError(error)) {
    console.error("API Error:", error.message);
  } else {
    console.error("Unknown error:", error);
  }
}
```

---

## Best Practices

### ✅ DO

```typescript
// Use apiClient for type safety
const profile = await apiClient<ChildProfileDTO>("/api/profiles/123");

// Handle errors properly
try {
  const data = await apiClient("/api/endpoint");
} catch (error) {
  if (isAPIError(error)) {
    toast.error(error.message);
  }
}

// Use skipAuthRedirect for auth checks
const isAuthenticated = await apiClient("/api/auth/me", {
  skipAuthRedirect: true,
}).then(
  () => true,
  () => false
);
```

### ❌ DON'T

```typescript
// Don't use plain fetch without type safety
const response = await fetch("/api/profiles/123");
const profile = await response.json(); // No TypeScript types

// Don't ignore errors
apiClient("/api/endpoint"); // Missing try-catch

// Don't manually parse JSON when using apiClient
const profile = await apiClient("/api/profiles/123");
const data = await profile.json(); // apiClient already parses JSON!
```

---

## Migration Guide

### From Plain Fetch

**Before:**

```typescript
const response = await fetch("/api/profiles/123");
if (response.ok) {
  const profile = await response.json();
  // Use profile
} else if (response.status === 401) {
  // Manually handle auth
  window.location.href = "/login";
} else {
  console.error("Error");
}
```

**After:**

```typescript
import { apiClient } from "@/lib/utils/api-client";
import type { ChildProfileDTO } from "@/types";

try {
  const profile = await apiClient<ChildProfileDTO>("/api/profiles/123");
  // Use profile (automatically redirects on 401)
} catch (error) {
  console.error("Error:", error.message);
}
```

---

## Testing

### Mock in Tests

```typescript
import { vi } from "vitest";

// Mock apiClient
vi.mock("@/lib/utils/api-client", () => ({
  apiClient: vi.fn(),
  fetchWithAuth: vi.fn(),
  handleUnauthorized: vi.fn(),
}));

// Use in tests
import { apiClient } from "@/lib/utils/api-client";

it("should fetch profile", async () => {
  (apiClient as any).mockResolvedValue({ id: "123", profileName: "Jan" });

  const profile = await apiClient("/api/profiles/123");
  expect(profile.profileName).toBe("Jan");
});
```

---

## Troubleshooting

### Issue: "Cannot read property 'json' of undefined"

**Cause:** Using `await response.json()` on apiClient result

**Solution:** `apiClient` already returns parsed JSON:

```typescript
// ❌ Wrong
const data = await apiClient("/api/profiles/123");
const profile = await data.json();

// ✅ Correct
const profile = await apiClient("/api/profiles/123");
```

### Issue: Redirects to login too often

**Cause:** Endpoint returns 401 but you want to handle it

**Solution:** Use `skipAuthRedirect: true`:

```typescript
const data = await apiClient("/api/endpoint", {
  skipAuthRedirect: true,
});
```

### Issue: TypeScript errors with response type

**Cause:** Missing type parameter

**Solution:** Add type parameter:

```typescript
// ❌ Wrong - no type safety
const profile = await apiClient("/api/profiles/123");

// ✅ Correct - type safe
const profile = await apiClient<ChildProfileDTO>("/api/profiles/123");
```

---

## See Also

- [401 Redirect Implementation](.ai/401-redirect-implementation.md) - Full documentation
- [API Plan](.ai/api-plan.md) - API endpoint specifications
- [Types](../types.ts) - TypeScript type definitions
