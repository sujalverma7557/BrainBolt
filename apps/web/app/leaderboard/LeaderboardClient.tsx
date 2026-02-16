'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { Button } from '@/components/ui';
import {
  fetchLeaderboardScore,
  fetchLeaderboardStreak,
  ensureUserId,
} from '@/lib/api-client';

type Tab = 'score' | 'streak';

export function LeaderboardClient() {
  const [tab, setTab] = useState<Tab>('score');
  const [scoreList, setScoreList] = useState<
    Array<{ rank: number; userId: string; totalScore: number; updatedAt: string | null }>
  >([]);
  const [streakList, setStreakList] = useState<
    Array<{ rank: number; userId: string; maxStreak: number; updatedAt: string | null }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const uid = ensureUserId();
    setCurrentUserId(uid);
    Promise.all([fetchLeaderboardScore(50), fetchLeaderboardStreak(50)])
      .then(([s, st]) => {
        setScoreList(s);
        setStreakList(st);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card padding="lg">
        <CardContent>Loading leaderboards…</CardContent>
      </Card>
    );
  }

  const rankEmoji = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`);

  return (
    <>
      <div
        style={{
          display: 'inline-flex',
          gap: '0',
          marginBottom: 'var(--spacing-6)',
          padding: 'var(--spacing-1)',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <button
          type="button"
          onClick={() => setTab('score')}
          style={{
            padding: 'var(--spacing-2) var(--spacing-4)',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: tab === 'score' ? 'var(--color-primary)' : 'transparent',
            color: tab === 'score' ? 'white' : 'var(--color-text-muted)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-weight-medium)',
            cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          By score
        </button>
        <button
          type="button"
          onClick={() => setTab('streak')}
          style={{
            padding: 'var(--spacing-2) var(--spacing-4)',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: tab === 'streak' ? 'var(--color-streak)' : 'transparent',
            color: tab === 'streak' ? 'white' : 'var(--color-text-muted)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-weight-medium)',
            cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          By streak
        </button>
      </div>

      <Card variant="elevated" padding="none" style={{ overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
        <CardContent style={{ padding: '0' }}>
          {tab === 'score' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', background: 'var(--color-surface)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--spacing-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-muted)' }}>Rank</th>
                  <th style={{ textAlign: 'left', padding: 'var(--spacing-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-muted)' }}>User</th>
                  <th style={{ textAlign: 'right', padding: 'var(--spacing-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-muted)' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {scoreList.map((r) => (
                  <tr
                    key={r.userId}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: r.userId === currentUserId ? 'color-mix(in srgb, var(--color-primary) 0.12, var(--color-surface))' : undefined,
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: 'var(--spacing-4)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)' }}>{rankEmoji(r.rank)}</td>
                    <td style={{ padding: 'var(--spacing-4)' }}>{r.userId}{r.userId === currentUserId ? ' (you)' : ''}</td>
                    <td style={{ padding: 'var(--spacing-4)', textAlign: 'right', fontWeight: 'var(--font-weight-semibold)' }}>{r.totalScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', background: 'var(--color-surface)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--spacing-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-muted)' }}>Rank</th>
                  <th style={{ textAlign: 'left', padding: 'var(--spacing-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-muted)' }}>User</th>
                  <th style={{ textAlign: 'right', padding: 'var(--spacing-4)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-muted)' }}>Max streak</th>
                </tr>
              </thead>
              <tbody>
                {streakList.map((r) => (
                  <tr
                    key={r.userId}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: r.userId === currentUserId ? 'color-mix(in srgb, var(--color-streak) 0.15, var(--color-surface))' : undefined,
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: 'var(--spacing-4)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-medium)' }}>{rankEmoji(r.rank)}</td>
                    <td style={{ padding: 'var(--spacing-4)' }}>{r.userId}{r.userId === currentUserId ? ' (you)' : ''}</td>
                    <td style={{ padding: 'var(--spacing-4)', textAlign: 'right', fontWeight: 'var(--font-weight-semibold)' }}>{r.maxStreak}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {scoreList.length === 0 && streakList.length === 0 && (
            <p style={{ color: 'var(--color-text-muted)', padding: 'var(--spacing-8)', textAlign: 'center' }}>
              No entries yet. Play the quiz to appear on the leaderboard!
            </p>
          )}
        </CardContent>
      </Card>

      <div style={{ marginTop: 'var(--spacing-6)' }}>
        <Link href="/quiz"><Button size="md">Play quiz</Button></Link>
      </div>
    </>
  );
}
