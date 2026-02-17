import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateUserState,
  pickNextQuestionId,
  getQuestionById,
} from '@/lib/quiz-service';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id') || request.cookies.get('user-id')?.value;
  if (!userId) {
    return NextResponse.json({ error: 'Missing x-user-id header or user-id cookie' }, { status: 401 });
  }
  const { allowed } = await checkRateLimit(userId, 'quiz/next');
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const sessionIdFromQuery = request.nextUrl.searchParams.get('sessionId') || undefined;

  try {
    const state = await getOrCreateUserState(userId, sessionIdFromQuery);
    const difficulty = state.currentDifficulty;
    const lastQuestionId = state.lastQuestionId ?? null;
    // Using persisted session so we don't repeat questions even if user omits sessionId once
    const effectiveSessionId = state.sessionId || sessionIdFromQuery;
    const session = effectiveSessionId ? { userId, sessionId: effectiveSessionId } : undefined;
    const questionId = await pickNextQuestionId(difficulty, lastQuestionId, session);
    if (!questionId) {
      return NextResponse.json(
        { error: 'No questions available. Run seed script.' },
        { status: 503 }
      );
    }
    const question = await getQuestionById(questionId);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    return NextResponse.json({
      questionId: question.id,
      difficulty: question.difficulty,
      prompt: question.prompt,
      choices: question.choices,
      sessionId: state.sessionId || sessionIdFromQuery,
      stateVersion: state.stateVersion,
      currentScore: state.totalScore,
      currentStreak: state.streak,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
