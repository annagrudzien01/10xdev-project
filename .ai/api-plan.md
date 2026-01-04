# REST API Plan – Rytmik MVP

## 1. Resources

| Resource              | Backing Table    | Description                                                         |
| --------------------- | ---------------- | ------------------------------------------------------------------- |
| Levels                | `levels`         | Read-only catalogue of difficulty levels (1-20)                     |
| Sequences             | `sequence`       | Melody fragments with correct answears linked o a level             |
| Child Profiles        | `child_profiles` | Playable child account belonging to a parent (`auth.users`)         |
| Sessions              | `sessions`       | A play session for a single child profile (max 1 active)            |
| Task Results          | `task_results`   | A puzzle attempt for a child profile                                |
| Dashboard (aggregate) | —                | Derived view combining `child_profiles`, `task_results`, `sessions` |

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

**Create / Update Request**

```json
{
  "profileName": "Anna",
  "dateOfBirth": "2018-05-24"
}
```

**Success Codes**

- 201 Created – returns full profile
- 400 Bad Request – validation (name regex, DOB future)
- 409 Conflict – >10 profiles or duplicate name

---

### 2.3 Sessions

| Method | Path                             | Description                              |
| ------ | -------------------------------- | ---------------------------------------- |
| POST   | `/profiles/{profileId}/sessions` | Start new session (deactivates previous) |
| PATCH  | `/sessions/{sessionId}/end`      | End current session                      |
| GET    | `/profiles/{profileId}/sessions` | List sessions (filter `active=true`)     |

**Start Session Response – 201 Created**

```json
{
  "sessionId": "uuid",
  "startedAt": "2025-12-31T10:00:00Z",
  "isActive": true
}
```

---

### 2.4 Game Tasks

| Method | Path                                              | Description                                     |
| ------ | ------------------------------------------------- | ----------------------------------------------- |
| POST   | `/profiles/{profileId}/tasks/next`                | Generate & return next puzzle for current level |
| POST   | `/profiles/{profileId}/tasks/{sequenceId}/submit` | Submit answer – returns score                   |
| GET    | `/profiles/{profileId}/tasks/history`             | Paginated list of task results                  |

**Generate Puzzle Response – 200 OK**

```json
{
  "sequenceId": "uuid",
  "levelId": 3,
  "sequenceBeginning": "C-E-G-G#",
  "expectedSlots": 2
}
```

**Submit Answer Request**

```json
{
  "answer": "C-E-G-G#"
}
```

**Submit Answer Response – 200 OK**

```json
{
  "score": 0,
  "attemptsUsed": 1,
  "levelCompleted": false,
  "nextLevel": 3
}
```

Error Codes

- 400 Bad Request – wrong answer format
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

| Resource      | Validation Rules (DB & API)                                     | Business Logic                                                                              |
| ------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Levels        | `id` 1-20, `seq_length`>0, `tempo`>0                            | Read-only catalogue                                                                         |
| Child Profile | `profile_name` regex, unique per parent, ≤10 profiles, DOB past | Trigger updates `updated_at` ; index `one_parent_ten_profiles` prevents >10                 |
| Session       | Only one active per child (`ux_active_session_per_child`)       | Trigger `deactivate_last_session()` auto-closes previous                                    |
| Task Result   | `attempts_used` 1-3, `score` 0-10, unique child+level           | After 5 successes → level+1 (max 20) implemented in service ; trigger updates `total_score` |

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

- All list endpoints require **pagination** (`pageSize` default 20, max 100) and support **sorting** (whitelist columns).
- DB indexes (`idx_child_parent`, `ux_child_level`, `idx_task_completed_at`) support frequent queries (dashboard, history).
- HTTPS + HSTS + security headers via middleware.
- Audit trigger `set_updated_at()` maintains `updated_at` consistency.

---

_Assumptions_: Parent/child IDs come from Supabase Auth; puzzle generation runs inside the `next` task endpoint; scoreboard aggregation via trigger on `task_results`.
