# BrainBolt – Low-Level Design (LLD)

## 1. Class / Module Responsibilities

| Module | Responsibility |
|--------|----------------|
| **AdaptiveEngine** (`lib/adaptive.ts`) | Computes next difficulty from current difficulty, correctness, and streak. Implements stabilizer (min streak to increase + hysteresis). |
| **ScoreService** (`lib/score.ts`) | Base points by difficulty, streak multiplier (capped), and score delta for a single answer. |
| **UserStateService** (in `lib/quiz-service.ts`) | getOrCreateUser, getUserState (with optional streak decay), getOrCreateUserState. Reads/writes user_state and Redis cache. |
| **QuestionService** (in `lib/quiz-service.ts`) | getQuestionIdsByDifficulty (with Redis cache), getQuestionById, pickNextQuestionId (with fallback to adjacent difficulties). |
| **LeaderboardService** (in `lib/quiz-service.ts` + API routes) | Upsert leaderboard_score and leaderboard_streak on each answer; compute rank; GET /leaderboard/score and /leaderboard/streak. |
| **Quiz API routes** (`app/api/v1/quiz/*`) | GET next (with rate limit), POST answer (idempotency, stateVersion), GET metrics. |
| **Rate limiter** (`lib/rate-limit.ts`) | Redis-based per-user, per-endpoint rate limit (e.g. 60/min). |

---

## 2. API Schemas

### GET /v1/quiz/next

- **Request**: Query `sessionId` (optional). Headers: `x-user-id` (or cookie `user-id`).
- **Response**:
  - `questionId`, `difficulty`, `prompt`, `choices` (string[]), `sessionId`, `stateVersion`, `currentScore`, `currentStreak`.

### POST /v1/quiz/answer

- **Request body**: `{ sessionId, questionId, answer, stateVersion, answerIdempotencyKey }`.
- **Response**: `correct`, `newDifficulty`, `newStreak`, `scoreDelta`, `totalScore`, `stateVersion`, `leaderboardRankScore`, `leaderboardRankStreak`.

### GET /v1/quiz/metrics

- **Request**: Headers: `x-user-id` (or cookie).
- **Response**: `currentDifficulty`, `streak`, `maxStreak`, `totalScore`, `accuracy`, `difficultyHistogram`, `recentPerformance`.

### GET /v1/leaderboard/score

- **Response**: Array of `{ rank, userId, totalScore, updatedAt }` ordered by totalScore DESC.

### GET /v1/leaderboard/streak

- **Response**: Array of `{ rank, userId, maxStreak, updatedAt }` ordered by maxStreak DESC.

---

## 3. DB Schema and Indexes

- **users**: `id` (PK), `created_at`.
- **questions**: `id` (PK), `difficulty`, `prompt`, `choices` (JSONB), `correct_answer_hash`, `tags` (JSONB). Index: `questions_difficulty_idx(difficulty)`.
- **user_state**: `user_id` (PK, FK users), `current_difficulty`, `streak`, `max_streak`, `total_score`, `last_question_id`, `last_answer_at`, `state_version`, `session_id`.
- **answer_log**: `id` (PK), `user_id`, `question_id`, `difficulty`, `answer`, `correct`, `score_delta`, `streak_at_answer`, `answered_at`, `idempotency_key`. Unique index on `idempotency_key`. Index: `answer_log_user_answered_idx(user_id, answered_at)`.
- **leaderboard_score**: `user_id` (PK), `total_score`, `updated_at`. Index: `leaderboard_score_total_score_idx(total_score)`.
- **leaderboard_streak**: `user_id` (PK), `max_streak`, `updated_at`. Index: `leaderboard_streak_max_streak_idx(max_streak)`.

---

## 4. Cache Strategy

| Key pattern | TTL | Invalidation |
|-------------|-----|--------------|
| `user_state:{userId}` | 1 hour | On answer: DEL after DB update. |
| `questions:difficulty:{d}` | 24h | On seed: flush or DEL keys. |
| `idempotency:{answerIdempotencyKey}` | 24h | None (natural expiry). |
| `ratelimit:{userId}:{endpoint}` | 60s | None (sliding window by key). |

- **Real-time**: Answer response returns new state and ranks in the same response. Next GET /next and GET /leaderboard/* read from DB (or cache); user state cache is invalidated on answer so next read is fresh.

---

## 5. Pseudocode: Adaptive Algorithm

```
MIN_DIFFICULTY = 1, MAX_DIFFICULTY = 10
MIN_STREAK_TO_INCREASE = 2

function getNextDifficulty(currentDifficulty, correct, currentStreak):
  d = clamp(currentDifficulty, MIN_DIFFICULTY, MAX_DIFFICULTY)
  if correct:
    if currentStreak >= MIN_STREAK_TO_INCREASE and d < MAX_DIFFICULTY:
      return d + 1
    return d
  else:
    if d > MIN_DIFFICULTY:
      return d - 1
    return MIN_DIFFICULTY
```

Stabilizer: (1) Require streak ≥ 2 to increase difficulty (avoids ping-pong on single correct). (2) One wrong step decreases by 1 (hysteresis).

---

## 6. Pseudocode: Score Calculation

```
BASE = 100, STREAK_FACTOR = 0.1, STREAK_CAP = 3

function basePoints(difficulty):
  return BASE * max(1, difficulty)

function streakMultiplier(streak):
  return min(1 + streak * STREAK_FACTOR, STREAK_CAP)

function scoreDelta(difficulty, streak, correct):
  if not correct: return 0
  return round(basePoints(difficulty) * streakMultiplier(streak))
```

---

## 7. Leaderboard Update Strategy

- On every successful answer (inside the same transaction as user_state and answer_log): upsert `leaderboard_score` (userId, totalScore, updatedAt) and `leaderboard_streak` (userId, maxStreak, updatedAt).
- Rank by score: `rank = 1 + COUNT(*) WHERE total_score > current_user_total_score`.
- Rank by streak: `rank = 1 + COUNT(*) WHERE max_streak > current_user_max_streak`.
- Ranks are returned in the POST /answer response; GET /leaderboard/score and GET /leaderboard/streak return top N rows.

---

## 8. Edge Cases

| Edge case | Handling |
|-----------|----------|
| Streak reset on wrong answer | On incorrect: set streak = 0 in user_state and in response. |
| Streak decay after inactivity | When loading state: if `lastAnswerAt` &gt; 24h ago, treat streak as 0 (in memory and when serving). |
| Duplicate answer (idempotency) | Check Redis `idempotency:{key}` first; if present return cached response. Else process and store response in Redis. DB unique index on idempotency_key prevents double insert. |
| First question | Default difficulty 1; getOrCreateUserState creates row with currentDifficulty=1. |
| Difficulty at min/max | Clamp in getNextDifficulty; at 1 wrong → stay 1; at 10 correct with enough streak → stay 10. |
| Ping-pong | Min streak ≥ 2 to increase; one wrong decreases by 1 only. |
| Empty question pool for difficulty | pickNextQuestionId falls back to nearest non-empty difficulty (lower first, then higher). |
| State version mismatch | POST /answer checks stateVersion; if different from server, return 409 and ask client to refresh. |
