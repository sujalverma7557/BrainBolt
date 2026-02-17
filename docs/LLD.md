# BrainBolt – Low-Level Design

## Overview

This doc covers the architecture and design decisions for BrainBolt. I've organized it by component and then the key algorithms and edge cases.

## Components

**AdaptiveEngine** (`lib/adaptive.ts`) handles difficulty calculation. It takes the current difficulty, whether the answer was correct, and the current streak, then returns the next difficulty level. The main thing here is the stabilizer to prevent ping-pong — requires a streak of at least 2 before increasing difficulty, and wrong answers decrease by 1 (hysteresis).

**ScoreService** (`lib/score.ts`) calculates points. Base points scale with difficulty, then we multiply by a streak multiplier that's capped at 3x. Wrong answers give zero points.

**UserStateService** (inside `lib/quiz-service.ts`) manages user state. Functions like `getOrCreateUser`, `getUserState`, and `getOrCreateUserState` handle reading/writing to both the DB and Redis cache. The streak decay logic is here too — if someone hasn't answered in 24 hours, we reset their streak to 0.

**QuestionService** (also in `lib/quiz-service.ts`) deals with questions. `getQuestionIdsByDifficulty` fetches question IDs for a given difficulty level (cached in Redis). `pickNextQuestionId` picks the next question, excluding ones already shown in the session. If we run out at the current difficulty, it falls back to adjacent difficulties.

**LeaderboardService** (in `lib/quiz-service.ts` plus the API routes) updates leaderboards on every answer. We upsert both `leaderboard_score` and `leaderboard_streak` tables, then compute ranks. The API routes return top N users.

**Quiz API routes** (`app/api/v1/quiz/*`) are the main endpoints. GET `/next` returns the next question with rate limiting. POST `/answer` handles submissions with idempotency and state version checks. GET `/metrics` returns user stats.

**Rate limiter** (`lib/rate-limit.ts`) uses Redis to limit requests per user per endpoint. Currently set to 60 requests per minute.

## API Endpoints

### GET /v1/quiz/next

Takes an optional `sessionId` query param and requires `x-user-id` header (or `user-id` cookie). Returns the next question with `questionId`, `difficulty`, `prompt`, `choices` array, `sessionId`, `stateVersion`, `currentScore`, and `currentStreak`.

### POST /v1/quiz/answer

Request body needs `sessionId`, `questionId`, `answer`, `stateVersion`, and `answerIdempotencyKey`. Response includes whether it was `correct`, the `newDifficulty`, `newStreak`, `scoreDelta`, `totalScore`, updated `stateVersion`, and both `leaderboardRankScore` and `leaderboardRankStreak`.

### GET /v1/quiz/metrics

Requires `x-user-id` header. Returns `currentDifficulty`, `streak`, `maxStreak`, `totalScore`, `accuracy`, `difficultyHistogram`, and `recentPerformance` (last 10 answers).

### GET /v1/leaderboard/score

Returns an array of users sorted by total score descending. Each entry has `rank`, `userId`, `totalScore`, and `updatedAt`.

### GET /v1/leaderboard/streak

Same structure but sorted by max streak descending.

## Database Schema

**users** table: just `id` (primary key) and `created_at`. Simple.

**questions** table: `id`, `difficulty` (1-10), `prompt`, `choices` (JSONB array), `correct_answer_hash` (SHA256), and `tags` (JSONB). Indexed on `difficulty` for fast lookups.

**user_state** table: `user_id` (PK, references users), `current_difficulty`, `streak`, `max_streak`, `total_score`, `last_question_id`, `last_answer_at`, `state_version` (for optimistic locking), and `session_id`.

**answer_log** table: logs every answer. Fields include `id`, `user_id`, `question_id`, `difficulty`, `answer`, `correct` (0 or 1), `score_delta`, `streak_at_answer`, `answered_at`, and `idempotency_key`. Unique index on `idempotency_key` prevents duplicates. Also indexed on `(user_id, answered_at)` for metrics queries.

**leaderboard_score** table: `user_id` (PK), `total_score`, `updated_at`. Indexed on `total_score` for ranking.

**leaderboard_streak** table: `user_id` (PK), `max_streak`, `updated_at`. Indexed on `max_streak`.

## Caching

I'm using Redis for a few things:

- `user_state:{userId}` — cached user state, TTL 1 hour. Invalidated (DEL) right after we update the DB on answer submission so the next read is fresh.

- `questions:difficulty:{d}` — list of question IDs for each difficulty level, TTL 24 hours. When we seed new questions, we flush these keys.

- `idempotency:{answerIdempotencyKey}` — cached answer responses, TTL 24 hours. Prevents duplicate processing.

- `ratelimit:{userId}:{endpoint}` — sliding window counter, TTL 60 seconds.

- `session_asked:{userId}:{sessionId}` — set of question IDs already shown in this session, TTL 2 hours. Used to prevent repeats.

For real-time updates, the answer response includes the new state and ranks immediately. Subsequent GET requests read from DB (or cache if still valid), but we invalidate user state cache on every answer so it's always fresh.

## Adaptive Algorithm

The difficulty adjustment logic is pretty straightforward:

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

The stabilizer prevents ping-pong: you need at least 2 correct in a row to level up. Wrong answers decrease by 1 (hysteresis). This stops the difficulty from bouncing back and forth on alternating correct/wrong answers.

## Score Calculation

Points are calculated like this:

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

Base points scale linearly with difficulty (level 1 = 100, level 5 = 500, etc.). Streak multiplier starts at 1x and increases by 0.1 per streak, capped at 3x. So a streak of 10+ gives 3x multiplier. Wrong answers give zero points.

## Leaderboard Updates

Every time someone submits an answer, we update both leaderboard tables in the same transaction (along with user_state and answer_log). We upsert `leaderboard_score` with the new total score and `leaderboard_streak` with the new max streak if it's higher.

Ranking is done with a simple COUNT query: `rank = 1 + COUNT(*) WHERE total_score > current_user_total_score` (same for streak). Ranks are computed on-demand and returned in the POST /answer response. The GET endpoints return top N rows sorted by score/streak.

## Edge Cases

**Streak reset on wrong answer** — When someone gets a question wrong, we set streak to 0 in both the DB and the response.

**Streak decay after inactivity** — If `lastAnswerAt` is more than 24 hours ago, we treat the streak as 0. This is checked when loading state from cache or DB.

**Duplicate answer submission** — We check Redis first for the idempotency key. If it exists, return the cached response. Otherwise process it and store the response in Redis. The DB unique index on `idempotency_key` prevents double inserts.

**First question** — New users start at difficulty 1. `getOrCreateUserState` creates the row with `currentDifficulty=1`.

**Difficulty at min/max** — The clamp function handles bounds. At level 1, wrong answers keep you at 1. At level 10, correct answers keep you at 10 (even with streak ≥ 2).

**Ping-pong** — The streak requirement (≥ 2) plus hysteresis (decrease by 1) prevents rapid oscillation. You can't go up and down on every other answer.

**Empty question pool** — If we've shown all questions at the current difficulty in this session, `pickNextQuestionId` falls back to adjacent difficulties (lower first, then higher). Still excludes questions already shown this session.

**State version mismatch** — POST /answer checks the `stateVersion` from the client. If it doesn't match the server's version, we return 409 Conflict and ask the client to refresh. This handles concurrent updates.
