import { NextRequest, NextResponse } from 'next/server';
import { eq, and, gte, sql } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { getUserState } from '@/lib/quiz-service';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id') || request.cookies.get('user-id')?.value;
  if (!userId) {
    return NextResponse.json({ error: 'Missing x-user-id header or user-id cookie' }, { status: 401 });
  }

  try {
    const state = await getUserState(userId);
    if (!state) {
      return NextResponse.json({
        currentDifficulty: 1,
        streak: 0,
        maxStreak: 0,
        totalScore: 0,
        accuracy: 0,
        difficultyHistogram: [],
        recentPerformance: [],
      });
    }

    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const logs = await db
      .select({
        difficulty: schema.answerLog.difficulty,
        correct: schema.answerLog.correct,
      })
      .from(schema.answerLog)
      .where(
        and(
          eq(schema.answerLog.userId, userId),
          gte(schema.answerLog.answeredAt, tenDaysAgo)
        )
      )
      .orderBy(sql`${schema.answerLog.answeredAt} DESC`)
      .limit(100);

    const total = logs.length;
    const correctCount = logs.filter((l) => l.correct === 1).length;
    const accuracy = total > 0 ? correctCount / total : 0;
    const difficultyHistogram = Array.from({ length: 10 }, (_, i) => i + 1).map(
      (d) => ({
        difficulty: d,
        count: logs.filter((l) => l.difficulty === d).length,
      })
    );
    const recentPerformance = logs.slice(0, 10).map((l) => ({
      difficulty: l.difficulty,
      correct: l.correct === 1,
    }));

    return NextResponse.json({
      currentDifficulty: state.currentDifficulty,
      streak: state.streak,
      maxStreak: state.maxStreak,
      totalScore: state.totalScore,
      accuracy: Math.round(accuracy * 100) / 100,
      difficultyHistogram,
      recentPerformance,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
