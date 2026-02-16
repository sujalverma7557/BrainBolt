import { NextRequest, NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db, schema } from '@/lib/db';

const TOP_N = 100;

export async function GET(request: NextRequest) {
  const n = Math.min(Number(request.nextUrl.searchParams.get('limit')) || TOP_N, 100);
  try {
    const rows = await db
      .select({
        userId: schema.leaderboardStreak.userId,
        maxStreak: schema.leaderboardStreak.maxStreak,
        updatedAt: schema.leaderboardStreak.updatedAt,
      })
      .from(schema.leaderboardStreak)
      .orderBy(desc(schema.leaderboardStreak.maxStreak))
      .limit(n);
    return NextResponse.json(
      rows.map((r, i) => ({
        rank: i + 1,
        userId: r.userId,
        maxStreak: r.maxStreak,
        updatedAt: r.updatedAt?.toISOString(),
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
