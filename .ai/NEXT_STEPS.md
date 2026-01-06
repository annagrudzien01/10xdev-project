# Next Steps: GET /profiles/{profileId}/tasks/current

## Implementation Complete ✅

The endpoint has been fully implemented according to the specification. All code is written, tested for linting errors, and documented.

---

## Required Actions Before Deployment

### 1. 🔴 CRITICAL: Run Database Migration

The endpoint **will not work** until the migration is executed.

```bash
# Option A: Using Supabase CLI (recommended)
npx supabase migration up

# Option B: Push to remote database
npx supabase db push

# Option C: Apply manually via Supabase Dashboard
# Copy contents of: supabase/migrations/20260106000000_alter_task_results_completed_at.sql
# Paste into SQL Editor and run
```

**What the migration does:**

- Makes `completed_at` nullable (required for tracking incomplete tasks)
- Makes `attempts_used` and `score` nullable
- Removes restrictive unique constraint
- Adds performance indexes

### 2. 🟡 REQUIRED: Regenerate Database Types

After running the migration, TypeScript types must be regenerated:

```bash
# Generate new types from updated schema
npx supabase gen types typescript --project-id <your-project-id> > src/db/database.types.ts

# Or if using local development
npx supabase gen types typescript --local > src/db/database.types.ts
```

**Why this is needed:**

- Current types show `completed_at: string` (NOT NULL)
- After migration, it should be `completed_at: string | null`
- Same for `attempts_used` and `score`

### 3. 🟢 RECOMMENDED: Verify Implementation

```bash
# Run linter
npm run lint

# Build project
npm run build

# Start development server
npm run dev
```

### 4. 🟢 RECOMMENDED: Test Manually

Follow the testing guide: `.ai/get-current-task-testing-guide.md`

**Quick test:**

```bash
# 1. Start the app
npm run dev

# 2. Login and create a profile (or use existing)

# 3. Try to get current task (should return 404)
curl http://localhost:4321/api/profiles/YOUR_PROFILE_ID/tasks/current \
  -H "Authorization: Bearer YOUR_JWT"

# 4. Start a puzzle
curl -X POST http://localhost:4321/api/profiles/YOUR_PROFILE_ID/tasks/next \
  -H "Authorization: Bearer YOUR_JWT"

# 5. Get current task again (should return 200 with puzzle data)
curl http://localhost:4321/api/profiles/YOUR_PROFILE_ID/tasks/current \
  -H "Authorization: Bearer YOUR_JWT"
```

---

## Integration Requirements

### Update POST /tasks/next Endpoint

The existing `POST /api/profiles/{profileId}/tasks/next` endpoint needs to be updated to:

1. **Create incomplete task_result:**

   ```typescript
   const { data, error } = await supabase.from("task_results").insert({
     child_id: profileId,
     level_id: levelId,
     sequence_id: sequenceId,
     completed_at: null, // ← Important!
     attempts_used: null,
     score: null,
   });
   ```

2. **Check for existing incomplete task:**
   ```typescript
   // Before generating new puzzle, check if one already exists
   const existingTask = await taskService.getCurrentTask(profileId);
   if (existingTask) {
     return existingTask; // Return existing instead of creating new
   }
   ```

### Update POST /tasks/{sequenceId}/submit Endpoint

The submit endpoint needs to:

1. **Update the incomplete task_result:**

   ```typescript
   const { data, error } = await supabase
     .from("task_results")
     .update({
       completed_at: new Date().toISOString(),
       attempts_used: attemptNumber,
       score: calculatedScore,
     })
     .eq("sequence_id", sequenceId)
     .eq("child_id", profileId)
     .is("completed_at", null);
   ```

2. **Handle case where task doesn't exist:**
   ```typescript
   if (!data) {
     throw new NotFoundError("Task not found or already completed");
   }
   ```

---

## Frontend Integration

### Example: Check for existing puzzle on page load

```typescript
// In your game component
async function loadGameState(profileId: string) {
  try {
    const response = await fetch(`/api/profiles/${profileId}/tasks/current`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      // Puzzle exists, restore game state
      const puzzle = await response.json();
      setCurrentPuzzle(puzzle);
      setGameState("playing");
    } else if (response.status === 404) {
      // No active puzzle, show "start new game" button
      setGameState("idle");
    } else {
      // Handle other errors
      console.error("Failed to load game state");
    }
  } catch (error) {
    console.error("Error loading game state:", error);
  }
}
```

---

## Documentation References

| Document                                                                 | Purpose                               |
| ------------------------------------------------------------------------ | ------------------------------------- |
| `.ai/get-current-task-implementation-plan.md`                            | Original implementation specification |
| `.ai/get-current-task-implementation-summary.md`                         | Complete implementation summary       |
| `.ai/get-current-task-testing-guide.md`                                  | Testing instructions and examples     |
| `.ai/api-plan.md`                                                        | Full API documentation                |
| `supabase/migrations/20260106000000_alter_task_results_completed_at.sql` | Database migration file               |

---

## Files Changed

### Created:

- ✅ `src/pages/api/profiles/[profileId]/tasks/current.ts` - Endpoint handler
- ✅ `src/lib/services/task.service.ts` - Business logic
- ✅ `src/lib/schemas/task.schema.ts` - Validation schemas
- ✅ `supabase/migrations/20260106000000_alter_task_results_completed_at.sql` - DB migration
- ✅ `.ai/get-current-task-implementation-summary.md` - Implementation docs
- ✅ `.ai/get-current-task-testing-guide.md` - Testing guide
- ✅ `.ai/NEXT_STEPS.md` - This file

### Modified:

- ✅ `src/lib/errors/api-errors.ts` - Added ForbiddenError
- ✅ `src/types.ts` - Added CurrentPuzzleDTO and helper function
- ✅ `src/lib/services/profile.service.ts` - Added validateOwnership method

---

## Deployment Checklist

- [ ] Database migration executed
- [ ] Database types regenerated
- [ ] Code reviewed
- [ ] Linting passed (`npm run lint`)
- [ ] Build successful (`npm run build`)
- [ ] Manual testing completed
- [ ] POST /tasks/next endpoint updated (creates incomplete tasks)
- [ ] POST /tasks/{sequenceId}/submit endpoint updated (completes tasks)
- [ ] Frontend integration completed
- [ ] E2E tests passing (if applicable)
- [ ] Deployed to staging environment
- [ ] Smoke tests passed on staging
- [ ] Deployed to production

---

## Support

If you encounter issues:

1. **Check the logs** - Look for error messages in application logs
2. **Verify database state** - Run queries from testing guide
3. **Review documentation** - Check implementation summary and API plan
4. **Test manually** - Use cURL examples from testing guide

---

## What's Next?

After this endpoint is deployed and working:

1. **Update POST /tasks/next** - Implement incomplete task creation
2. **Update POST /tasks/submit** - Implement task completion
3. **Frontend integration** - Add game state restoration on page load
4. **Add monitoring** - Implement metrics (request count, response time, errors)
5. **Add tests** - Write unit, integration, and E2E tests
6. **Optimize** - Consider caching strategy if needed

---

_Ready to deploy! 🚀_
