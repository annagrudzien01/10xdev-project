# Testing Guide: GET /profiles/{profileId}/tasks/current

This guide provides practical examples for testing the `GET /api/profiles/{profileId}/tasks/current` endpoint.

---

## Prerequisites

1. ✅ Migration `20260106000000_alter_task_results_completed_at.sql` has been run
2. ✅ Database types have been regenerated
3. ✅ Application is running (locally or deployed)
4. ✅ Valid Supabase authentication token available
5. ✅ Test child profile exists
6. ✅ Test data seeded (levels, sequences)

---

## Manual Testing with cURL

### 1. Setup: Get Authentication Token

First, authenticate and get a JWT token:

```bash
# Login to get session token
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

Store the JWT token from the response cookie or use browser DevTools to extract it from the `sb-access-token` cookie.

### 2. Create Test Profile

```bash
# Create a child profile
curl -X POST http://localhost:4321/api/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "profileName": "Test Child",
    "dateOfBirth": "2015-01-01"
  }'

# Save the returned profileId for next steps
```

### 3. Test Scenario: No Active Puzzle (404)

When no puzzle has been started yet, expect 404:

```bash
curl -X GET http://localhost:4321/api/profiles/YOUR_PROFILE_ID/tasks/current \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -v

# Expected Response:
# HTTP/1.1 404 Not Found
# {
#   "error": "not_found",
#   "message": "No active puzzle found"
# }
```

### 4. Start a New Puzzle

```bash
curl -X POST http://localhost:4321/api/profiles/YOUR_PROFILE_ID/tasks/next \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -v

# Expected Response:
# HTTP/1.1 200 OK
# {
#   "sequenceId": "uuid-here",
#   "levelId": 1,
#   "sequenceBeginning": "C4-E4-G4-C4-E4-G4",
#   "expectedSlots": 2
# }
```

### 5. Test Scenario: Retrieve Active Puzzle (200)

Now retrieve the same puzzle:

```bash
curl -X GET http://localhost:4321/api/profiles/YOUR_PROFILE_ID/tasks/current \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -v

# Expected Response:
# HTTP/1.1 200 OK
# {
#   "sequenceId": "same-uuid-as-above",
#   "levelId": 1,
#   "sequenceBeginning": "C4-E4-G4-C4-E4-G4",
#   "expectedSlots": 2,
#   "attemptsUsed": 0
# }
```

**Verify:** 
- `sequenceId` matches the one from step 4
- `attemptsUsed` is 0 (no submission attempts yet)

### 6. Test Scenario: Invalid UUID (400)

```bash
curl -X GET http://localhost:4321/api/profiles/invalid-uuid/tasks/current \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -v

# Expected Response:
# HTTP/1.1 400 Bad Request
# {
#   "error": "invalid_request",
#   "message": "Validation failed",
#   "details": {
#     "profileId": "Invalid profile ID format"
#   }
# }
```

### 7. Test Scenario: No Authentication (401)

```bash
curl -X GET http://localhost:4321/api/profiles/YOUR_PROFILE_ID/tasks/current \
  -v

# Expected Response:
# HTTP/1.1 401 Unauthorized
# {
#   "error": "unauthenticated",
#   "message": "Authentication required"
# }
```

### 8. Test Scenario: Wrong Parent (403)

```bash
# Login as a different user
curl -X POST http://localhost:4321/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "other-user@example.com",
    "password": "password123"
  }'

# Try to access first user's profile with second user's token
curl -X GET http://localhost:4321/api/profiles/FIRST_USERS_PROFILE_ID/tasks/current \
  -H "Authorization: Bearer SECOND_USERS_JWT_TOKEN" \
  -v

# Expected Response:
# HTTP/1.1 403 Forbidden
# {
#   "error": "forbidden",
#   "message": "Profile does not belong to this parent"
# }
```

---

## Testing with Postman/Insomnia

### Import Collection

Create a new collection with these requests:

**Environment Variables:**

```json
{
  "baseUrl": "http://localhost:4321",
  "authToken": "",
  "profileId": ""
}
```

**Request 1: Get Current Task (Success)**

- Method: `GET`
- URL: `{{baseUrl}}/api/profiles/{{profileId}}/tasks/current`
- Headers:
  - `Authorization: Bearer {{authToken}}`
- Tests:

  ```javascript
  pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
  });

  pm.test("Response has required fields", () => {
    const json = pm.response.json();
    pm.expect(json).to.have.property("sequenceId");
    pm.expect(json).to.have.property("levelId");
    pm.expect(json).to.have.property("sequenceBeginning");
    pm.expect(json).to.have.property("expectedSlots");
    pm.expect(json).to.have.property("attemptsUsed");
  });

  pm.test("sequenceId is a valid UUID", () => {
    const json = pm.response.json();
    pm.expect(json.sequenceId).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  pm.test("attemptsUsed is within valid range", () => {
    const json = pm.response.json();
    pm.expect(json.attemptsUsed).to.be.a("number");
    pm.expect(json.attemptsUsed).to.be.at.least(0);
    pm.expect(json.attemptsUsed).to.be.at.most(3);
  });
  ```

**Request 2: Get Current Task (Not Found)**

- Method: `GET`
- URL: `{{baseUrl}}/api/profiles/{{profileId}}/tasks/current`
- Headers:
  - `Authorization: Bearer {{authToken}}`
- Tests:

  ```javascript
  pm.test("Status code is 404 when no active puzzle", () => {
    pm.response.to.have.status(404);
  });

  pm.test("Error response structure is correct", () => {
    const json = pm.response.json();
    pm.expect(json).to.have.property("error", "not_found");
    pm.expect(json).to.have.property("message");
  });
  ```

---

## Automated Testing with Vitest

### Unit Test: TaskService

```typescript
// src/lib/services/__tests__/task.service.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { TaskService } from "../task.service";
import { NotFoundError } from "../../errors/api-errors";

describe("TaskService", () => {
  let taskService: TaskService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };
    taskService = new TaskService(mockSupabase);
  });

  it("should return current puzzle when one exists", async () => {
    const mockData = {
      sequence_id: "123e4567-e89b-12d3-a456-426614174000",
      level_id: 1,
      attempts_used: 0,
      session_id: "456e7890-e12b-34d5-a678-912345678000",
      sequence: {
        sequence_beginning: "C4-E4-G4",
        sequence_end: "C4-E4",
      },
    };

    mockSupabase.single.mockResolvedValue({ data: mockData, error: null });

    const result = await taskService.getCurrentTask("profile-id");

    expect(result).toEqual({
      sequenceId: "123e4567-e89b-12d3-a456-426614174000",
      levelId: 1,
      sequenceBeginning: "C4-E4-G4",
      expectedSlots: 2,
      attemptsUsed: 0,
    });
  });

  it("should throw NotFoundError when no active puzzle exists", async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { code: "PGRST116" },
    });

    await expect(taskService.getCurrentTask("profile-id")).rejects.toThrow(NotFoundError);
  });
});
```

### Integration Test: Endpoint

```typescript
// src/pages/api/profiles/__tests__/current-task.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { GET } from "../[profileId]/tasks/current";

describe("GET /api/profiles/{profileId}/tasks/current", () => {
  let mockLocals: any;
  let mockParams: any;

  beforeEach(() => {
    // Setup mock Supabase client
    mockLocals = {
      supabase: {
        auth: {
          getUser: vi.fn(),
        },
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn(),
      },
    };

    mockParams = {
      profileId: "123e4567-e89b-12d3-a456-426614174000",
    };
  });

  it("should return 401 when not authenticated", async () => {
    mockLocals.supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Not authenticated"),
    });

    const response = await GET({
      params: mockParams,
      locals: mockLocals,
    } as any);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("unauthenticated");
  });

  it("should return 400 when profileId is invalid", async () => {
    mockLocals.supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-id" } },
      error: null,
    });

    const response = await GET({
      params: { profileId: "invalid-uuid" },
      locals: mockLocals,
    } as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("invalid_request");
  });

  // Add more test cases...
});
```

---

## E2E Testing with Cypress

### Test: Puzzle State Persistence

```typescript
// cypress/e2e/game/puzzle-persistence.cy.ts
describe("Puzzle State Persistence", () => {
  beforeEach(() => {
    // Login
    cy.login("test@example.com", "testpassword123");

    // Create or select test profile
    cy.visit("/profiles");
    cy.get('[data-testid="profile-card"]').first().click();
  });

  it("should persist puzzle state after page refresh", () => {
    // Start a new puzzle
    cy.get('[data-testid="start-puzzle-btn"]').click();

    // Wait for puzzle to load
    cy.get('[data-testid="puzzle-container"]').should("be.visible");

    // Get sequence data
    cy.get('[data-testid="sequence-id"]').invoke("text").as("originalSequenceId");

    // Refresh the page
    cy.reload();

    // Verify puzzle is restored
    cy.get('[data-testid="puzzle-container"]').should("be.visible");
    cy.get("@originalSequenceId").then((originalId) => {
      cy.get('[data-testid="sequence-id"]').invoke("text").should("equal", originalId);
    });
  });

  it("should return 404 when no active puzzle", () => {
    // Intercept API call
    cy.intercept("GET", "/api/profiles/*/tasks/current").as("getCurrentTask");

    // Visit game page without starting puzzle
    cy.visit("/game");

    // Wait for API call
    cy.wait("@getCurrentTask");

    // Verify 404 response
    cy.get("@getCurrentTask").its("response.statusCode").should("equal", 404);

    // Verify UI shows "start new puzzle" message
    cy.get('[data-testid="start-new-puzzle-msg"]').should("be.visible");
  });

  it("should handle puzzle completion", () => {
    // Start puzzle
    cy.get('[data-testid="start-puzzle-btn"]').click();
    cy.get('[data-testid="puzzle-container"]').should("be.visible");

    // Complete puzzle (submit correct answer)
    cy.get('[data-testid="note-C4"]').click();
    cy.get('[data-testid="note-E4"]').click();
    cy.get('[data-testid="submit-answer-btn"]').click();

    // Wait for completion
    cy.get('[data-testid="success-message"]').should("be.visible");

    // Verify GET current returns 404
    cy.request({
      url: "/api/profiles/test-profile-id/tasks/current",
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.equal(404);
    });
  });
});
```

---

## Database Verification

### Check for Incomplete Tasks

```sql
-- Verify incomplete tasks exist
SELECT
  tr.id,
  tr.child_id,
  tr.session_id,
  tr.sequence_id,
  tr.level_id,
  tr.completed_at,
  tr.attempts_used,
  tr.score,
  tr.created_at,
  seq.sequence_beginning,
  seq.sequence_end
FROM task_results tr
JOIN sequence seq ON seq.id = tr.sequence_id
WHERE tr.completed_at IS NULL
ORDER BY tr.created_at DESC;
```

**Note:** All incomplete tasks should have `session_id` populated (since migration `20260111000000`).

### Check Index Usage

```sql
-- Verify index is being used
EXPLAIN ANALYZE
SELECT 
  tr.sequence_id, 
  tr.level_id, 
  tr.attempts_used,
  tr.session_id,
  seq.sequence_beginning, 
  seq.sequence_end
FROM task_results tr
JOIN sequence seq ON seq.id = tr.sequence_id
WHERE tr.child_id = 'test-profile-id'
  AND tr.completed_at IS NULL
ORDER BY tr.created_at DESC
LIMIT 1;

-- Should show "Index Scan using idx_task_results_incomplete"
```

---

## Performance Testing

### Load Test with Artillery

```yaml
# artillery-config.yml
config:
  target: "http://localhost:4321"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Load test"
  variables:
    authToken: "your-jwt-token"
    profileId: "test-profile-id"

scenarios:
  - name: "Get current task"
    flow:
      - get:
          url: "/api/profiles/{{ profileId }}/tasks/current"
          headers:
            Authorization: "Bearer {{ authToken }}"
          expect:
            - statusCode:
                - 200
                - 404
```

Run with:

```bash
artillery run artillery-config.yml
```

---

## Monitoring & Logging

### Check Application Logs

```bash
# Filter for endpoint-specific logs
tail -f logs/app.log | grep "GET /api/profiles/.*/tasks/current"

# Check for errors
tail -f logs/error.log | grep "getCurrentTask"
```

### Verify Metrics (if configured)

```promql
# Request count
http_requests_total{endpoint="/api/profiles/{profileId}/tasks/current", method="GET"}

# Response time
http_request_duration_seconds{endpoint="/api/profiles/{profileId}/tasks/current"}

# Error rate
rate(http_requests_total{endpoint="/api/profiles/{profileId}/tasks/current", status="5xx"}[5m])
```

---

## Troubleshooting Common Issues

### Issue: Always returns 404 even after starting puzzle

**Diagnosis:**

```sql
-- Check if task_result was created
SELECT * FROM task_results
WHERE child_id = 'your-profile-id'
ORDER BY created_at DESC
LIMIT 1;
```

**Possible Causes:**

1. POST /tasks/next not creating task_result correctly
2. Task_result created with completed_at != NULL
3. Wrong profile ID being used

### Issue: 403 Forbidden on own profile

**Diagnosis:**

```sql
-- Verify profile ownership
SELECT id, parent_id FROM child_profiles WHERE id = 'your-profile-id';

-- Check auth.uid()
SELECT auth.uid();
```

**Possible Causes:**

1. JWT token belongs to different user
2. Profile doesn't exist
3. RLS policies misconfigured

---

## Success Criteria

✅ Endpoint returns 200 with correct puzzle data when active puzzle exists  
✅ Endpoint returns 404 when no active puzzle exists  
✅ Endpoint returns 401 without authentication  
✅ Endpoint returns 403 for unauthorized profile access  
✅ Endpoint returns 400 for invalid UUID  
✅ Database query uses index efficiently  
✅ Response time < 100ms for 95th percentile  
✅ No sensitive data in error logs  
✅ Page refresh preserves game state

---

_Testing guide version: 1.0_  
_Last updated: 2026-01-06_
