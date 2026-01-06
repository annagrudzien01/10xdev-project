# Implementation Summary: GET /profiles/{profileId}/tasks/current

## Overview

This document summarizes the implementation of the `GET /api/profiles/{profileId}/tasks/current` endpoint, which allows the frontend to retrieve the currently active puzzle for a child profile, enabling game state persistence across page refreshes.

## Implementation Status: ✅ COMPLETE

All implementation steps from the plan have been completed successfully.

---

## Files Created

### 1. **Migration File**

`supabase/migrations/20260106000000_alter_task_results_completed_at.sql`

**Purpose:** Modifies the `task_results` table schema to support incomplete tasks.

**Changes:**

- Removed `NOT NULL` constraint and default value from `completed_at`
- Made `attempts_used` and `score` nullable (set when task is completed)
- Dropped unique constraint on `(child_id, level_id)` to allow multiple attempts
- Added index `idx_task_results_incomplete` for efficient querying of incomplete tasks
- Added unique constraint `ux_incomplete_task_per_child_sequence` to prevent duplicate incomplete tasks

**⚠️ IMPORTANT:** After running this migration, regenerate database types:

```bash
npx supabase gen types typescript --project-id <your-project-id> > src/db/database.types.ts
```

### 2. **Service Layer**

`src/lib/services/task.service.ts`

**Purpose:** Business logic for task/puzzle management.

**Exports:**

- `TaskService` class with `getCurrentTask(profileId)` method

**Key Features:**

- Queries `task_results` table with JOIN to `sequence` table
- Filters for incomplete tasks (`completed_at IS NULL`)
- Returns most recent incomplete task
- Calculates `expectedSlots` from `sequence_end`
- Throws `NotFoundError` if no active puzzle exists

### 3. **Validation Schema**

`src/lib/schemas/task.schema.ts`

**Purpose:** Zod schema for validating path parameters.

**Exports:**

- `profileIdParamSchema` - validates UUID format for `profileId` parameter

### 4. **API Endpoint**

`src/pages/api/profiles/[profileId]/tasks/current.ts`

**Purpose:** REST API endpoint handler.

**HTTP Method:** GET

**Path:** `/api/profiles/{profileId}/tasks/current`

**Flow:**

1. Validates authentication (Supabase JWT)
2. Validates `profileId` parameter (must be UUID)
3. Verifies profile ownership (using `ProfileService.validateOwnership`)
4. Retrieves current task (using `TaskService.getCurrentTask`)
5. Returns `CurrentPuzzleDTO`

**Response Codes:**

- `200 OK` - Active puzzle found and returned
- `400 Bad Request` - Invalid profileId format
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Profile doesn't belong to authenticated parent
- `404 Not Found` - No active puzzle found
- `500 Internal Server Error` - Unexpected error

---

## Files Modified

### 1. **Error Handling**

`src/lib/errors/api-errors.ts`

**Changes:**

- Added `ForbiddenError` class for HTTP 403 responses

### 2. **Type Definitions**

`src/types.ts`

**Changes:**

- Added `CurrentPuzzleDTO` interface
- Added `calculateExpectedSlots(sequenceEnd: string)` helper function

### 3. **Profile Service**

`src/lib/services/profile.service.ts`

**Changes:**

- Added `validateOwnership(profileId, parentId)` method
- Imported `ForbiddenError`

**Method Details:**

- Checks if profile exists (throws `NotFoundError` if not)
- Verifies profile belongs to parent (throws `ForbiddenError` if not)
- Can be reused by other endpoints requiring ownership validation

---

## Database Schema Changes

### Before Migration

```sql
CREATE TABLE task_results (
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attempts_used SMALLINT NOT NULL CHECK (attempts_used BETWEEN 1 AND 3),
  score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 10),
  UNIQUE (child_id, level_id)
);
```

### After Migration

```sql
CREATE TABLE task_results (
  completed_at TIMESTAMPTZ, -- nullable, no default
  attempts_used SMALLINT CHECK (attempts_used IS NULL OR attempts_used BETWEEN 1 AND 3),
  score SMALLINT CHECK (score IS NULL OR score BETWEEN 0 AND 10),
  -- unique constraint removed
);

-- New indexes
CREATE INDEX idx_task_results_incomplete
  ON task_results(child_id, created_at DESC)
  WHERE completed_at IS NULL;

CREATE UNIQUE INDEX ux_incomplete_task_per_child_sequence
  ON task_results(child_id, sequence_id)
  WHERE completed_at IS NULL;
```

---

## Workflow Integration

### Expected Game Flow

1. **Player starts new puzzle:**

   ```
   POST /api/profiles/{profileId}/tasks/next
   → Creates task_result with completed_at = NULL
   → Returns puzzle data
   ```

2. **Player refreshes page:**

   ```
   GET /api/profiles/{profileId}/tasks/current
   → Returns existing incomplete puzzle
   → No new task_result created
   ```

3. **Player submits answer:**

   ```
   POST /api/profiles/{profileId}/tasks/{sequenceId}/submit
   → Updates task_result: sets completed_at, attempts_used, score
   → Returns scoring data
   ```

4. **Player requests next puzzle:**
   ```
   POST /api/profiles/{profileId}/tasks/next
   → Previous task is completed, creates new task_result
   → Returns new puzzle data
   ```

---

## Security Considerations

### Authentication

- Requires valid Supabase JWT token
- Handled by middleware: `context.locals.supabase`

### Authorization

- Profile ownership validated via `ProfileService.validateOwnership()`
- RLS policies on `task_results` table enforce parent-child relationship
- RLS policy: `EXISTS (SELECT 1 FROM child_profiles WHERE id = child_id AND parent_id = auth.uid())`

### Data Validation

- Path parameter `profileId` validated with Zod (must be UUID)
- No query parameters or request body (GET request)

### Error Handling

- All errors properly categorized (400, 401, 403, 404, 500)
- Internal errors logged without sensitive data (GDPR compliant)
- Error messages clear and actionable

---

## Testing Checklist

### Unit Tests (Recommended)

- [ ] `TaskService.getCurrentTask()` returns correct puzzle
- [ ] `TaskService.getCurrentTask()` throws NotFoundError when no active puzzle
- [ ] `ProfileService.validateOwnership()` allows valid parent
- [ ] `ProfileService.validateOwnership()` throws ForbiddenError for wrong parent
- [ ] `calculateExpectedSlots()` correctly counts notes

### Integration Tests (Recommended)

- [ ] GET endpoint returns 200 with valid data
- [ ] GET endpoint returns 404 when no active puzzle
- [ ] GET endpoint returns 401 without authentication
- [ ] GET endpoint returns 403 for wrong parent's profile
- [ ] GET endpoint returns 400 for invalid UUID

### E2E Tests (Recommended)

- [ ] Cypress: Start puzzle → refresh page → verify puzzle data persists
- [ ] Cypress: Complete puzzle → GET current → verify 404
- [ ] Cypress: Switch profiles → verify correct puzzle for each profile

---

## Deployment Steps

### 1. Run Migration

```bash
npx supabase migration up
# or
npx supabase db push
```

### 2. Regenerate Database Types

```bash
npx supabase gen types typescript --project-id <your-project-id> > src/db/database.types.ts
```

### 3. Verify Linting

```bash
npm run lint
```

### 4. Build and Test

```bash
npm run build
npm run test # if tests are set up
```

### 5. Deploy

Follow your standard deployment process.

---

## API Documentation

Full API documentation is available in `.ai/api-plan.md` (section 2.4).

### Example Request

```http
GET /api/profiles/123e4567-e89b-12d3-a456-426614174000/tasks/current HTTP/1.1
Authorization: Bearer <jwt-token>
```

### Example Success Response (200 OK)

```json
{
  "sequenceId": "987fcdeb-51a2-4b7f-9c3e-123456789abc",
  "levelId": 3,
  "sequenceBeginning": "C4-E4-G4-G#4",
  "expectedSlots": 2
}
```

### Example Error Response (404 Not Found)

```json
{
  "error": "not_found",
  "message": "No active puzzle found"
}
```

---

## Known Limitations & Future Improvements

### Current Limitations

1. Database types (`src/db/database.types.ts`) need manual regeneration after migration
2. No automated tests included in this implementation
3. No monitoring/metrics (e.g., Prometheus counter for `tasks_current_hit`)

### Recommended Improvements

1. Add comprehensive unit and integration tests
2. Implement rate limiting per user (currently global)
3. Add Swagger/OpenAPI documentation
4. Set up monitoring with Prometheus/Grafana
5. Consider caching strategy for frequently accessed puzzles
6. Add audit logging for security-sensitive operations

---

## Support & Troubleshooting

### Common Issues

**Issue:** "No active puzzle found" (404) immediately after starting puzzle

- **Cause:** POST /tasks/next endpoint not creating task_result with completed_at = NULL
- **Fix:** Verify POST /tasks/next implementation creates incomplete task records

**Issue:** Database query fails with "column does not exist"

- **Cause:** Database types not regenerated after migration
- **Fix:** Run `npx supabase gen types typescript` command

**Issue:** 403 Forbidden when accessing own profile

- **Cause:** RLS policies not properly configured or JWT token invalid
- **Fix:** Verify Supabase auth configuration and RLS policies

---

## Conclusion

The endpoint has been successfully implemented according to the specification. All code follows project conventions, includes proper error handling, security measures, and documentation. The implementation is production-ready pending migration execution and testing.

**Next Steps:**

1. Run the database migration
2. Regenerate database types
3. Test the endpoint manually or with automated tests
4. Deploy to staging/production environment

---

_Implementation completed: 2026-01-06_
_Implementation plan: `.ai/get-current-task-implementation-plan.md`_
_API specification: `.ai/api-plan.md`_
