import { createHash } from 'crypto';
import { eq, and, gt, sql } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { redis, cacheKeys, TTL } from '@/lib/redis';
import { getNextDifficulty } from '@/lib/adaptive';
import { scoreDelta } from '@/lib/score';

const STREAK_DECAY_HOURS = 24;

function hashAnswer(answer: string): string {
  return createHash('sha256').update(answer.trim().toLowerCase()).digest('hex');
}

export async function getOrCreateUser(userId: string): Promise<void> {
  await db
    .insert(schema.users)
    .values({ id: userId })
    .onConflictDoNothing();
}

export async function getUserState(userId: string) {
  const key = cacheKeys.userState(userId);
  const cached = await redis.get(key);
  if (cached) {
    const parsed = JSON.parse(cached);
    // Streak decay: if lastAnswerAt older than STREAK_DECAY_HOURS, then reset streak
    if (parsed.lastAnswerAt) {
      const last = new Date(parsed.lastAnswerAt).getTime();
      if (Date.now() - last > STREAK_DECAY_HOURS * 60 * 60 * 1000) {
        parsed.streak = 0;
        await db
          .update(schema.userState)
          .set({ streak: 0 })
          .where(eq(schema.userState.userId, userId));
        await redis.setex(key, TTL.userState, JSON.stringify(parsed));
      }
    }
    return parsed;
  }
  const [state] = await db
    .select()
    .from(schema.userState)
    .where(eq(schema.userState.userId, userId));
  if (!state) return null;
  const lastAnswerAt = state.lastAnswerAt?.getTime();
  const decay =
    lastAnswerAt && Date.now() - lastAnswerAt > STREAK_DECAY_HOURS * 60 * 60 * 1000;
  const streak = decay ? 0 : state.streak;
  const out = {
    currentDifficulty: state.currentDifficulty,
    streak,
    maxStreak: state.maxStreak,
    totalScore: Number(state.totalScore),
    lastQuestionId: state.lastQuestionId,
    lastAnswerAt: state.lastAnswerAt?.toISOString() ?? null,
    stateVersion: state.stateVersion,
    sessionId: state.sessionId,
  };
  await redis.setex(key, TTL.userState, JSON.stringify(out));
  return out;
}

export async function getOrCreateUserState(userId: string, sessionId?: string) {
  await getOrCreateUser(userId);
  let state = await getUserState(userId);
  if (!state) {
    await db.insert(schema.userState).values({
      userId,
      currentDifficulty: 1,
      streak: 0,
      maxStreak: 0,
      totalScore: 0,
      stateVersion: 0,
      sessionId: sessionId ?? null,
    });
    state = await getUserState(userId);
  }
  if (state && sessionId && state.sessionId !== sessionId) {
    await db
      .update(schema.userState)
      .set({ sessionId })
      .where(eq(schema.userState.userId, userId));
    await redis.del(cacheKeys.userState(userId));
    state = await getUserState(userId);
  }
  return state!;
}

export async function getQuestionIdsByDifficulty(difficulty: number): Promise<number[]> {
  const key = cacheKeys.questionPool(difficulty);
  const cached = await redis.lrange(key, 0, -1);
  if (cached.length > 0) return cached.map(Number);
  const rows = await db
    .select({ id: schema.questions.id })
    .from(schema.questions)
    .where(eq(schema.questions.difficulty, difficulty));
  const ids = rows.map((r) => r.id);
  if (ids.length > 0) {
    await redis.del(key);
    for (const id of ids) await redis.rpush(key, String(id));
    await redis.expire(key, TTL.questionPool);
  }
  return ids;
}

export async function getQuestionById(questionId: number) {
  const [q] = await db
    .select()
    .from(schema.questions)
    .where(eq(schema.questions.id, questionId));
  return q ?? null;
}

export async function pickNextQuestionId(
  difficulty: number,
  excludeQuestionId: number | null
): Promise<number | null> {
  let ids = await getQuestionIdsByDifficulty(difficulty);
  if (excludeQuestionId !== null) ids = ids.filter((id) => id !== excludeQuestionId);
  if (ids.length === 0) {
    // Fallback: try adjacent difficulties
    for (let d = difficulty - 1; d >= 1; d--) {
      ids = await getQuestionIdsByDifficulty(d);
      if (ids.length > 0) break;
    }
    if (ids.length === 0) {
      for (let d = difficulty + 1; d <= 10; d++) {
        ids = await getQuestionIdsByDifficulty(d);
        if (ids.length > 0) break;
      }
    }
  }
  if (ids.length === 0) return null;
  return ids[Math.floor(Math.random() * ids.length)];
}

export async function getCachedIdempotencyResponse(
  idempotencyKey: string
): Promise<string | null> {
  return redis.get(cacheKeys.idempotency(idempotencyKey));
}

export async function setCachedIdempotencyResponse(
  idempotencyKey: string,
  response: string
): Promise<void> {
  await redis.setex(cacheKeys.idempotency(idempotencyKey), TTL.idempotency, response);
}

export async function processAnswer(params: {
  userId: string;
  sessionId: string;
  questionId: number;
  answer: string;
  stateVersion: number;
  answerIdempotencyKey: string;
}): Promise<{
  correct: boolean;
  newDifficulty: number;
  newStreak: number;
  scoreDelta: number;
  totalScore: number;
  stateVersion: number;
  leaderboardRankScore: number;
  leaderboardRankStreak: number;
}> {
  const { userId, sessionId, questionId, answer, stateVersion, answerIdempotencyKey } =
    params;
  const question = await getQuestionById(questionId);
  if (!question) throw new Error('Question not found');
  const correct = hashAnswer(answer) === question.correctAnswerHash;
  const state = await getOrCreateUserState(userId, sessionId);
  const newDifficulty = getNextDifficulty(
    state.currentDifficulty,
    correct,
    state.streak
  );
  const newStreak = correct ? state.streak + 1 : 0;
  const delta = scoreDelta(question.difficulty, state.streak, correct);
  const newTotalScore = state.totalScore + delta;
  const newMaxStreak = Math.max(state.maxStreak, newStreak);

  await db.transaction(async (tx) => {
    await tx
      .update(schema.userState)
      .set({
        currentDifficulty: newDifficulty,
        streak: newStreak,
        maxStreak: newMaxStreak,
        totalScore: newTotalScore,
        lastQuestionId: questionId,
        lastAnswerAt: new Date(),
        stateVersion: state.stateVersion + 1,
        sessionId,
      })
      .where(
        and(
          eq(schema.userState.userId, userId),
          eq(schema.userState.stateVersion, stateVersion)
        )
      );
    await tx.insert(schema.answerLog).values({
      userId,
      questionId,
      difficulty: question.difficulty,
      answer,
      correct: correct ? 1 : 0,
      scoreDelta: delta,
      streakAtAnswer: state.streak,
      idempotencyKey: answerIdempotencyKey,
    });
    await tx
      .insert(schema.leaderboardScore)
      .values({
        userId,
        totalScore: newTotalScore,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.leaderboardScore.userId,
        set: {
          totalScore: newTotalScore,
          updatedAt: new Date(),
        },
      });
    await tx
      .insert(schema.leaderboardStreak)
      .values({
        userId,
        maxStreak: newMaxStreak,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.leaderboardStreak.userId,
        set: {
          maxStreak: newMaxStreak,
          updatedAt: new Date(),
        },
      });
  });

  await redis.del(cacheKeys.userState(userId));

  const scoreRankRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.leaderboardScore)
    .where(gt(schema.leaderboardScore.totalScore, newTotalScore));
  const rankScoreVal = (scoreRankRows[0]?.count ?? 0) + 1;

  const streakRankRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.leaderboardStreak)
    .where(gt(schema.leaderboardStreak.maxStreak, newMaxStreak));
  const rankStreakVal = (streakRankRows[0]?.count ?? 0) + 1;

  return {
    correct,
    newDifficulty,
    newStreak,
    scoreDelta: delta,
    totalScore: newTotalScore,
    stateVersion: state.stateVersion + 1,
    leaderboardRankScore: rankScoreVal,
    leaderboardRankStreak: rankStreakVal,
  };
}
