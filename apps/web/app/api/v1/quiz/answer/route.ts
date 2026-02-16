import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateUserState,
  processAnswer,
  getCachedIdempotencyResponse,
  setCachedIdempotencyResponse,
} from '@/lib/quiz-service';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id') || request.cookies.get('user-id')?.value;
  if (!userId) {
    return NextResponse.json({ error: 'Missing x-user-id header or user-id cookie' }, { status: 401 });
  }
  const { allowed } = await checkRateLimit(userId, 'quiz/answer');
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: {
    sessionId: string;
    questionId: number;
    answer: string;
    stateVersion: number;
    answerIdempotencyKey: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { sessionId, questionId, answer, stateVersion, answerIdempotencyKey } = body;
  if (
    typeof sessionId !== 'string' ||
    typeof questionId !== 'number' ||
    typeof answer !== 'string' ||
    typeof stateVersion !== 'number' ||
    !answerIdempotencyKey
  ) {
    return NextResponse.json(
      { error: 'Missing or invalid: sessionId, questionId, answer, stateVersion, answerIdempotencyKey' },
      { status: 400 }
    );
  }

  const idempotencyKey = String(answerIdempotencyKey).slice(0, 64);
  const cached = await getCachedIdempotencyResponse(idempotencyKey);
  if (cached) {
    return NextResponse.json(JSON.parse(cached));
  }

  try {
    const state = await getOrCreateUserState(userId, sessionId);
    if (state.stateVersion !== stateVersion) {
      return NextResponse.json(
        { error: 'State version mismatch; refresh and retry' },
        { status: 409 }
      );
    }
    const result = await processAnswer({
      userId,
      sessionId,
      questionId,
      answer,
      stateVersion,
      answerIdempotencyKey: idempotencyKey,
    });
    const response = {
      correct: result.correct,
      newDifficulty: result.newDifficulty,
      newStreak: result.newStreak,
      scoreDelta: result.scoreDelta,
      totalScore: result.totalScore,
      stateVersion: result.stateVersion,
      leaderboardRankScore: result.leaderboardRankScore,
      leaderboardRankStreak: result.leaderboardRankStreak,
    };
    await setCachedIdempotencyResponse(idempotencyKey, JSON.stringify(response));
    return NextResponse.json(response);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
