# Game State Persistence Implementation

## Overview

This document describes the implementation of automatic game state persistence in the GameContext, which allows players to resume their game after page refresh or when switching devices.

## Implementation Status: ✅ COMPLETE

---

## Problem Statement

**Before Implementation:**

- Page refresh during gameplay would reset the game state
- Players would lose their current puzzle progress
- A new puzzle was always generated, even if one was already in progress
- Poor user experience for players with unstable connections

**After Implementation:**

- Game state persists across page refreshes
- Players can resume their current puzzle
- Seamless continuation of gameplay
- Support for multi-device play (same puzzle on mobile and desktop)

---

## Architecture

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    GameProvider Mount                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │ loadCurrentOrNextTask()    │
         └────────────┬───────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │ GET /tasks/current         │
         └────────────┬───────────────┘
                      │
            ┌─────────┴─────────┐
            │                   │
            ▼                   ▼
      ┌──────────┐        ┌──────────┐
      │ 200 OK   │        │ 404 Not  │
      │          │        │  Found   │
      └────┬─────┘        └────┬─────┘
           │                   │
           ▼                   ▼
    ┌─────────────┐    ┌──────────────┐
    │ Restore     │    │ loadNextTask()│
    │ existing    │    │              │
    │ puzzle      │    │ POST /next   │
    └─────────────┘    └──────────────┘
```

### Component Integration

```typescript
// GameProvider wraps the game UI
<GameProvider profileId={profileId} initialLevel={1} initialScore={0}>
  <GameApp />
</GameProvider>

// GameProvider automatically:
// 1. Calls loadCurrentOrNextTask() on mount
// 2. Restores game state if puzzle exists
// 3. Generates new puzzle if none exists
```

---

## API Endpoints Used

### 1. GET /api/profiles/{profileId}/tasks/current

**Purpose:** Retrieve currently active (incomplete) puzzle

**Response (200 OK):**

```json
{
  "sequenceId": "uuid",
  "levelId": 1,
  "sequenceBeginning": "C4-E4-G4",
  "expectedSlots": 2
}
```

**Response (404 Not Found):**

```json
{
  "error": "not_found",
  "message": "No active puzzle found"
}
```

### 2. POST /api/profiles/{profileId}/tasks/next

**Purpose:** Generate a new puzzle

**Response (200 OK):**

```json
{
  "sequenceId": "uuid",
  "levelId": 1,
  "sequenceBeginning": "C4-E4-G4",
  "expectedSlots": 2
}
```

---

## GameContext Methods

### `loadCurrentOrNextTask()`

**Purpose:** Smart loader that tries to restore existing puzzle or creates new one

**Return Type:** `Promise<CurrentPuzzleDTO | GeneratePuzzleDTO>`

**Logic:**

```typescript
1. Try GET /tasks/current
2. If 200 OK → Restore puzzle state
3. If 404 Not Found → Call loadNextTask()
4. If other error → Throw error
```

**Usage:**

- ✅ Automatically called on GameProvider mount
- ✅ Can be manually called to refresh game state
- ❌ Don't call after completing a puzzle (use `loadNextTask` instead)

**Example:**

```typescript
const { loadCurrentOrNextTask } = useGame();

// Manual refresh (e.g., after error)
await loadCurrentOrNextTask();
```

### `loadNextTask()`

**Purpose:** Always generate a new puzzle

**Return Type:** `Promise<GeneratePuzzleDTO>`

**Logic:**

```typescript
1. POST /tasks/next
2. Create new task_result record
3. Update game state
```

**Usage:**

- ✅ Call after completing a puzzle
- ✅ Call when user explicitly wants new puzzle
- ❌ Don't call on initial load (use `loadCurrentOrNextTask` instead)

**Example:**

```typescript
const { loadNextTask } = useGame();

// After completing puzzle
const handleComplete = async () => {
  await submitAnswer();
  await loadNextTask(); // Get next puzzle
};
```

---

## User Scenarios

### Scenario 1: First Time Playing

```
User Action: Opens game page for the first time
═══════════════════════════════════════════════

1. GameProvider mounts
2. useEffect triggers loadCurrentOrNextTask()
3. GET /tasks/current → 404 (no puzzle yet)
4. Automatically calls loadNextTask()
5. POST /tasks/next → Creates new puzzle
6. Game displays puzzle
7. User starts playing

Result: ✅ New puzzle generated automatically
```

### Scenario 2: Page Refresh During Game

```
User Action: Playing, then refreshes page (F5)
═══════════════════════════════════════════════

1. User is solving puzzle: sequenceId = "abc-123"
2. User presses F5 (refresh)
3. GameProvider re-mounts
4. useEffect triggers loadCurrentOrNextTask()
5. GET /tasks/current → 200 OK (puzzle exists!)
6. Restores puzzle: sequenceId = "abc-123" (same!)
7. User continues playing

Result: ✅ Game state restored, no progress lost
```

### Scenario 3: Completing a Puzzle

```
User Action: Submits correct answer
═══════════════════════════════════════════════

1. User completes all slots
2. Clicks "Submit Answer"
3. POST /tasks/{id}/submit → Marks puzzle complete
4. Component calls loadNextTask() (NOT loadCurrentOrNextTask!)
5. POST /tasks/next → Creates new puzzle
6. Game displays next puzzle

Result: ✅ New puzzle generated (doesn't restore old one)
```

### Scenario 4: Multi-Device Play

```
User Action: Starts on desktop, continues on mobile
═══════════════════════════════════════════════

1. Desktop: User starts puzzle (sequenceId = "xyz-789")
2. Desktop: User leaves page (puzzle incomplete)
3. Mobile: User opens game
4. Mobile: GET /tasks/current → 200 OK
5. Mobile: Restores same puzzle (sequenceId = "xyz-789")
6. Mobile: User completes puzzle
7. Desktop: User refreshes page
8. Desktop: GET /tasks/current → 404 (puzzle completed)
9. Desktop: Automatically loads next puzzle

Result: ✅ Seamless cross-device experience
```

### Scenario 5: Network Error Recovery

```
User Action: Network fails during game
═══════════════════════════════════════════════

1. User is playing
2. Network disconnects
3. User refreshes page
4. GET /tasks/current → Network error
5. Error is caught and logged
6. User sees error message
7. Network reconnects
8. User clicks "Retry" button
9. Manually calls loadCurrentOrNextTask()
10. GET /tasks/current → 200 OK
11. Game restored

Result: ✅ Graceful error handling, manual recovery possible
```

---

## Database State

### Task Lifecycle

```sql
-- 1. New puzzle generated (POST /tasks/next)
INSERT INTO task_results (
  child_id,
  level_id,
  sequence_id,
  completed_at,  -- NULL (incomplete)
  attempts_used, -- NULL (not yet attempted)
  score          -- NULL (not yet scored)
) VALUES (...);

-- 2. Puzzle is active (GET /tasks/current returns it)
SELECT * FROM task_results
WHERE child_id = '...'
  AND completed_at IS NULL
ORDER BY created_at DESC
LIMIT 1;

-- 3. User submits answer (POST /tasks/submit)
UPDATE task_results
SET
  completed_at = now(),
  attempts_used = 1,
  score = 10
WHERE sequence_id = '...'
  AND child_id = '...';

-- 4. Next GET /tasks/current returns 404 (no incomplete tasks)
```

---

## Error Handling

### Network Errors

```typescript
try {
  await loadCurrentOrNextTask();
} catch (error) {
  // Error logged to console
  // Component can show error UI
  // User can retry manually
}
```

### 401 Unauthorized

```typescript
// Automatically handled by global fetch interceptor
// User is redirected to /login with returnUrl
// After login, returns to game page
// loadCurrentOrNextTask() runs again
// Game state restored
```

### API Errors (500, etc.)

```typescript
// Error is caught and logged
// Component shows error message
// User can retry or navigate away
```

---

## Performance Considerations

### Initial Load Time

| Scenario                  | API Calls      | Response Time |
| ------------------------- | -------------- | ------------- |
| First game                | 2 (GET + POST) | ~100-200ms    |
| Resume game               | 1 (GET)        | ~50-100ms     |
| New puzzle after complete | 1 (POST)       | ~50-100ms     |

### Optimization

1. **Parallel Loading:** Game loads while UI renders
2. **Caching:** Browser caches API responses
3. **No Unnecessary Calls:** Smart loader prevents duplicate requests
4. **Optimistic UI:** Can show loading state immediately

---

## Testing

### Unit Tests

```typescript
describe("GameContext - loadCurrentOrNextTask", () => {
  it("should restore existing puzzle", async () => {
    // Mock GET /tasks/current → 200 OK
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sequenceId: "abc-123",
        levelId: 1,
        sequenceBeginning: "C4-E4",
        expectedSlots: 2,
      }),
    });

    const { result } = renderHook(() => useGame(), {
      wrapper: GameProvider,
    });

    await waitFor(() => {
      expect(result.current.currentTask?.sequenceId).toBe("abc-123");
    });
  });

  it("should generate new puzzle when none exists", async () => {
    // Mock GET /tasks/current → 404
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    // Mock POST /tasks/next → 200 OK
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sequenceId: "new-puzzle",
        levelId: 1,
        sequenceBeginning: "A4-B4",
        expectedSlots: 2,
      }),
    });

    const { result } = renderHook(() => useGame(), {
      wrapper: GameProvider,
    });

    await waitFor(() => {
      expect(result.current.currentTask?.sequenceId).toBe("new-puzzle");
    });
  });
});
```

### E2E Tests (Cypress)

```typescript
describe("Game State Persistence", () => {
  it("should restore puzzle after refresh", () => {
    cy.login();
    cy.visit("/game");

    // Wait for puzzle to load
    cy.get('[data-testid="sequence-id"]').invoke("text").as("originalId");

    // Refresh page
    cy.reload();

    // Verify same puzzle
    cy.get("@originalId").then((id) => {
      cy.get('[data-testid="sequence-id"]').should("have.text", id);
    });
  });
});
```

---

## Migration Guide

### For Developers Using Old API

**Before (Manual Approach):**

```typescript
const GamePage = ({ profileId }) => {
  const [puzzle, setPuzzle] = useState(null);

  useEffect(() => {
    // Always load new puzzle
    fetch(`/api/profiles/${profileId}/tasks/next`, { method: "POST" })
      .then(r => r.json())
      .then(setPuzzle);
  }, []);

  return <Game puzzle={puzzle} />;
};
```

**After (Automatic Approach):**

```typescript
const GamePage = ({ profileId }) => {
  return (
    <GameProvider profileId={profileId} initialLevel={1} initialScore={0}>
      <GameApp />
      {/* Puzzle loads automatically, no manual fetch needed */}
    </GameProvider>
  );
};
```

---

## Best Practices

### ✅ DO

```typescript
// Use loadCurrentOrNextTask for initial load
useEffect(() => {
  loadCurrentOrNextTask();
}, []);

// Use loadNextTask after completing puzzle
const handleComplete = async () => {
  await submitAnswer();
  await loadNextTask();
};

// Handle errors gracefully
try {
  await loadCurrentOrNextTask();
} catch (error) {
  showErrorToast("Failed to load game");
}
```

### ❌ DON'T

```typescript
// Don't use loadCurrentOrNextTask after completing puzzle
const handleComplete = async () => {
  await submitAnswer();
  await loadCurrentOrNextTask(); // ❌ Wrong - might restore old puzzle
};

// Don't call both functions
await loadCurrentOrNextTask();
await loadNextTask(); // ❌ Wrong - creates duplicate puzzles

// Don't ignore errors
loadCurrentOrNextTask(); // ❌ Missing await and error handling
```

---

## Troubleshooting

### Issue: Always gets new puzzle (doesn't restore)

**Diagnosis:**

```sql
-- Check for incomplete tasks
SELECT * FROM task_results
WHERE child_id = 'your-profile-id'
  AND completed_at IS NULL;
```

**Possible Causes:**

1. POST /tasks/next not setting `completed_at = NULL`
2. Migration not run (table schema incorrect)
3. Task was auto-completed (check database triggers)

### Issue: Gets old puzzle after completing it

**Diagnosis:**
Check if submit endpoint marks task as complete:

```sql
-- Should have completed_at set
SELECT completed_at FROM task_results
WHERE sequence_id = 'just-completed-puzzle';
```

**Possible Causes:**

1. POST /submit not updating `completed_at`
2. Using wrong sequence_id in submit
3. Database transaction rolled back

### Issue: Multiple incomplete tasks exist

**Diagnosis:**

```sql
-- Should only have 1 incomplete task per child
SELECT COUNT(*) FROM task_results
WHERE child_id = 'profile-id'
  AND completed_at IS NULL;
```

**Possible Causes:**

1. Unique constraint missing (check migration)
2. POST /next called multiple times
3. Race condition in parallel requests

---

## Future Enhancements

### Potential Improvements

1. **Store Attempts Used**
   - Currently we reset to 3 attempts on restore
   - Could track actual attempts in incomplete task

2. **Store Selected Notes**
   - Save user's partial answer
   - Restore exact game state including progress

3. **Timestamp Validation**
   - Expire old incomplete tasks (e.g., after 24 hours)
   - Automatically clean up abandoned puzzles

4. **Offline Support**
   - Cache puzzle in localStorage
   - Sync when connection restored

5. **Progress Indicators**
   - Show "Resuming game..." vs "Starting new game..."
   - Display time since last play

---

## Related Documentation

- [GET /tasks/current Implementation](.ai/get-current-task-implementation-summary.md)
- [API Plan](.ai/api-plan.md)
- [Database Plan](.ai/db-plan.md)
- [401 Redirect Implementation](.ai/401-redirect-implementation.md)

---

## Conclusion

Game state persistence is now fully implemented and working. Players can:

- ✅ Resume their game after page refresh
- ✅ Continue on different devices
- ✅ Recover from network errors
- ✅ Experience seamless gameplay

The implementation is automatic, requires no changes to existing components, and provides excellent user experience.

---

## Feedback System

### Overview

The game provides automatic feedback and task progression when a puzzle is completed (either successfully or after 3 failed attempts).

### Feedback State

```typescript
interface GameFeedback {
  type: "success" | "failed" | null;
  message: string;
  score: number;
}
```

### Feedback Logic

```typescript
// After submit answer:
1. Check if task is completed (score > 0 OR attemptsUsed >= 3)
2. If completed:
   a. Show feedback message (2 seconds)
   b. Display score animation
   c. Automatically load next task
3. If not completed:
   a. Update attemptsLeft
   b. Allow retry
```

### Feedback Messages

| Condition           | Message                                    | Type    | Score |
| ------------------- | ------------------------------------------ | ------- | ----- |
| 1st attempt correct | "Perfekcyjnie! 🌟"                         | success | 10    |
| 2nd attempt correct | "Bardzo dobrze! ⭐"                        | success | 7     |
| 3rd attempt correct | "Dobrze! ✨"                               | success | 5     |
| 3 failed attempts   | "Wykorzystano 3 szanse. Spróbuj ponownie!" | failed  | 0     |

### UI Implementation

```tsx
{
  feedback && (
    <div
      className={`animate-in fade-in slide-in-from-top-5 ${
        feedback.type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
      }`}
    >
      <p>{feedback.message}</p>
      {feedback.score > 0 && <p className="text-2xl font-extrabold">+{feedback.score} punktów!</p>}
    </div>
  );
}
```

### Automatic Task Progression

```typescript
// In GameContext.tsx - submitAnswer()
if (isTaskCompleted) {
  setFeedback({ type, message, score });

  setTimeout(async () => {
    setFeedback(null);
    await loadNextTask(); // Auto-load next puzzle
  }, 2000);
}
```

### User Experience Flow

```
1. User submits answer
   ↓
2. Show feedback (2s)
   - Success: Green box with score
   - Failed: Red box with message
   ↓
3. Piano disabled during feedback
   ↓
4. Automatically load next task
   ↓
5. Clear feedback
   ↓
6. User can start new puzzle
```

---

_Implementation completed: 2026-01-06_  
_Updated with feedback system: 2026-01-06_  
_File: `src/lib/contexts/GameContext.tsx`_  
_Related endpoints: GET `/api/profiles/{profileId}/tasks/current`, POST `/api/profiles/{profileId}/tasks/next`, POST `/api/profiles/{profileId}/tasks/{sequenceId}/submit`_
