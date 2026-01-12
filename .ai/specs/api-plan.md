# REST API Plan – Rytmik MVP

## 1. Resources

| Resource              | Backing Table    | Description                                                          |
| --------------------- | ---------------- | -------------------------------------------------------------------- |
| Levels                | `levels`         | Read-only catalogue of difficulty levels (1-20)                      |
| Sequences             | `sequence`       | Melody fragments with correct answears linked o a level              |
| Child Profiles        | `child_profiles` | Playable child account belonging to a parent (`auth.users`)          |
| Sessions              | `sessions`       | A play session for a single child profile (status computed by dates) |
| Task Results          | `task_results`   | A puzzle attempt for a child profile, linked to a session            |
| Dashboard (aggregate) | —                | Derived view combining `child_profiles`, `task_results`, `sessions`  |

---

## 2. End-points

Below, **`{id}`** denotes a UUID unless noted otherwise.

### 2.1 Levels (public / read-only)

| Method | Path                | Description           | Query Params               |
| ------ | ------------------- | --------------------- | -------------------------- |
| GET    | `/levels`           | List levels           | `page`, `pageSize`, `sort` |
| GET    | `/levels/{levelId}` | Retrieve single level | –                          |

**Response – 200 OK**

```json
{
  "id": 1,
  "seqLength": 4,
  "tempo": 120,
  "useBlackKeys": false,
  "description": "Intro level"
}
```

---

### 2.2 Child Profiles

| Method | Path                    | Description                            |
| ------ | ----------------------- | -------------------------------------- |
| GET    | `/profiles`             | List child profiles for current parent |
| POST   | `/profiles`             | Create profile                         |
| GET    | `/profiles/{profileId}` | Get profile                            |
| PATCH  | `/profiles/{profileId}` | Update name / DOB                      |
| DELETE | `/profiles/{profileId}` | Delete profile (if no active session)  |

**Query Parameters for GET /profiles:**

| Parameter  | Type   | Default | Max | Description                    |
| ---------- | ------ | ------- | --- | ------------------------------ |
| `page`     | number | 1       | -   | Page number                    |
| `pageSize` | number | 20      | 100 | Number of items per page       |
| `sort`     | string | -       | -   | Sort field (e.g., "createdAt") |

**List Response – 200 OK**

```json
{
  "data": [
    {
      "id": "uuid",
      "profileName": "Anna",
      "dateOfBirth": "2018-05-24",
      "currentLevelId": 1,
      "totalScore": 0,
      "lastPlayedAt": null,
      "createdAt": "2025-01-01T10:00:00Z",
      "updatedAt": "2025-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

**Create / Update Request**

```json
{
  "profileName": "Anna",
  "dateOfBirth": "2018-05-24"
}
```

**Single Profile Response – 200 OK (GET /profiles/{profileId})**

```json
{
  "id": "uuid",
  "profileName": "Anna",
  "dateOfBirth": "2018-05-24",
  "currentLevelId": 1,
  "totalScore": 0,
  "lastPlayedAt": null,
  "createdAt": "2025-01-01T10:00:00Z",
  "updatedAt": "2025-01-01T10:00:00Z"
}
```

**Success Codes**

- 200 OK – success (GET, PATCH, DELETE)
- 201 Created – returns full profile (POST)
- 400 Bad Request – validation (name regex, DOB future, missing fields)
- 401 Unauthorized – not authenticated
- 403 Forbidden – profile doesn't belong to user
- 404 Not Found – profile not found
- 409 Conflict – >10 profiles or duplicate name

---

### 2.3 Sessions

| Method | Path                             | Description                                               |
| ------ | -------------------------------- | --------------------------------------------------------- |
| POST   | `/profiles/{profileId}/sessions` | Start new session (10 min duration, auto-closes previous) |
| POST   | `/sessions/{sessionId}/refresh`  | Extend session by 2 minutes                               |
| PATCH  | `/sessions/{sessionId}/end`      | End current session immediately (sets ended_at to now)    |
| GET    | `/profiles/{profileId}/sessions` | List sessions (filter `active=true` computed)             |

**Note:**

- Session duration: **10 minutes** by default
- Session status is computed based on `started_at` and `ended_at`:
  - **Active:** `ended_at > current_time`
  - **Inactive:** `ended_at <= current_time`
- New sessions automatically set `ended_at = started_at + 10 minutes`
- Sessions can be extended with `/refresh` endpoint (+2 minutes each time)
- Previous uncompleted sessions are auto-closed when starting a new one

**Start Session Response – 201 Created**

```json
{
  "sessionId": "uuid",
  "startedAt": "2025-12-31T10:00:00Z",
  "endedAt": "2025-12-31T10:10:00Z",
  "isActive": true
}
```

**Note:** `isActive` is computed field. `endedAt` is automatically set to `startedAt + 10 minutes`.

**Refresh Session Response – 200 OK**

```json
{
  "sessionId": "uuid",
  "endedAt": "2025-12-31T10:12:00Z",
  "message": "Session extended by 2 minutes"
}
```

---

### 2.4 Game Tasks

| Method | Path                                              | Description                                                        |
| ------ | ------------------------------------------------- | ------------------------------------------------------------------ |
| POST   | `/profiles/{profileId}/tasks/next`                | Generate & return next puzzle for current level (requires session) |
| GET    | `/profiles/{profileId}/tasks/current`             | Get current puzzle (if exists)                                     |
| POST   | `/profiles/{profileId}/tasks/{sequenceId}/submit` | Submit answer – returns score (linked to active session)           |
| GET    | `/profiles/{profileId}/tasks/history`             | Paginated list of task results                                     |

**Generate Puzzle Response – 200 OK (POST /profiles/{profileId}/tasks/next)**

```json
{
  "sequenceId": "uuid",
  "sessionId": "uuid",
  "levelId": 3,
  "sequenceBeginning": "C4-E4-G4-G#4",
  "expectedSlots": 2
}
```

**Note:**

- `sequenceBeginning` is returned as a `string` with notes separated by hyphens, including octave numbers (e.g., `"C4-E4-G4"`). Frontend must parse it using `split("-")` to get an array.
- Requires an active session for the profile. If no active session exists, returns `400 Bad Request` with message `"No active session found. Please start a session first."`
- The generated task is automatically linked to the active session via `session_id` in `task_results`.

**Get Current Puzzle Response – 200 OK (GET /profiles/{profileId}/tasks/current)**

```json
{
  "sequenceId": "uuid",
  "sessionId": "uuid",
  "levelId": 3,
  "sequenceBeginning": "C4-E4-G4-G#4",
  "expectedSlots": 2
}
```

**Note:**

- Returns the current puzzle if one exists. Returns `404 Not Found` if no current puzzle exists (user needs to call `POST /tasks/next` to generate a new one).
- Includes `sessionId` to track which session the task belongs to.

**Submit Answer Request**

```json
{
  "answer": "C4-E4-G4-G#4"
}
```

**Note:** Answer format must include octave numbers (e.g., `"C4-E4"` instead of `"C-E"`).

**Submit Answer Response – 200 OK**

```json
{
  "score": 10,
  "attemptsUsed": 1,
  "levelCompleted": false,
  "nextLevel": 3,
  "sessionId": "uuid"
}
```

**Note:**

- `score` is `10` for correct answer, `0` for incorrect.
- `sessionId` confirms which session the result was recorded to.

**Error Codes**

- 400 Bad Request – wrong answer format, missing required fields, or no active session
- 401 Unauthorized – not authenticated
- 403 Forbidden – profile doesn't belong to user
- 404 Not Found – profile, sequence, or current puzzle not found
- 409 Conflict – exceeds 3 attempts (response includes correct sequence)

---

### 2.5 Dashboard

| Method | Path         | Description                                             |
| ------ | ------------ | ------------------------------------------------------- |
| GET    | `/dashboard` | Summary of each child (level, totalScore, lastPlayedAt) |

**Response – 200 OK**

```json
[
  {
    "profileId": "uuid",
    "profileName": "Anna",
    "currentLevel": 4,
    "totalScore": 320,
    "lastPlayedAt": "2025-12-31T09:50:00Z"
  }
]
```

---

## 3. Authentication & Authorisation

1. **Supabase Auth** – Bearer JWT in `Authorization` header.
2. **Row Level Security** (`db-plan.md §4`) ensures that `parent_id = auth.uid()` for all data access.
3. End-points additionally verify ownership in service layer.
4. **Rate limiting** – 100 requests / minute per token (`429 Too Many Requests`).

---

## 4. Validation & Business Logic

| Resource      | Validation Rules (DB & API)                                                                             | Business Logic                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Levels        | `id` 1-20, `seq_length`>0, `tempo`>0                                                                    | Read-only catalogue                                                                                                             |
| Child Profile | `profile_name` regex, unique per parent, ≤10 profiles, DOB past                                         | Trigger updates `updated_at` ; index `one_parent_ten_profiles` prevents >10                                                     |
| Session       | `ended_at > started_at`, session duration 10 min default                                                | Auto-set `ended_at = started_at + 10 min` on create ; refresh adds 2 min to `ended_at`                                          |
| Task Result   | `attempts_used` 0-3, `score` 0-10, requires active `session_id`, unique per child+sequence (incomplete) | After 5 successes → level+1 (max 20) implemented in service ; trigger updates `total_score` ; session_id required for analytics |

Common error codes

- 400 `invalid_request`
- 401 `unauthenticated`
- 403 `forbidden`
- 404 `not_found`
- 409 `conflict`
- 422 `validation_failed`
- 429 `rate_limited`
- 500 `internal_error`

---

### Performance & Security Notes

- All list endpoints support **pagination** (`pageSize` default 20, max 100) and **sorting** (whitelist columns).
  - Example: `GET /api/profiles?page=1&pageSize=20&sort=createdAt`
- DB indexes (`idx_child_parent`, `idx_task_completed_at`, `idx_task_results_session`, `idx_sessions_child_started`) support frequent queries (dashboard, history, session analytics).
- **Session tracking**: All task operations require an active session (WHERE `ended_at > current_time`). The `session_id` is automatically linked to task_results for analytics and metrics (e.g., "tasks per session" metric).
- **Session duration**: 10 minutes by default, extendable by 2 minutes via refresh endpoint. Maximum session duration can be limited in application logic.
- **Session status**: Computed dynamically based on timestamps, not stored in database. `isActive = (ended_at > current_time)`.
- HTTPS + HSTS + security headers via middleware.
- Audit trigger `set_updated_at()` maintains `updated_at` consistency.
- Row Level Security (RLS) enforces `parent_id = auth.uid()` on all resources.

---

_Assumptions_: Parent/child IDs come from Supabase Auth; puzzle generation runs inside the `next` task endpoint; scoreboard aggregation via trigger on `task_results`. **Note:** Sequence format includes octave numbers (e.g., `"C4-E4-G4"` instead of `"C-E-G"`). Frontend must parse sequences using `split("-")`. All task operations require an active session (WHERE `ended_at > current_time`) - the API automatically uses the active session for the profile and links all task_results to it via `session_id`. Session status (`isActive`) is computed based on `ended_at > current_time`, not stored as a boolean column. Sessions have 10-minute duration by default and can be extended by 2 minutes via refresh endpoint.
