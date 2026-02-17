'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader } from '@/components/ui';
import { Button, Badge } from '@/components/ui';
import { fetchMetrics, ensureUserId } from '@/lib/api-client';

function MetricsContent() {
  const [data, setData] = useState<{
    currentDifficulty: number;
    streak: number;
    maxStreak: number;
    totalScore: number;
    accuracy: number;
    difficultyHistogram: Array<{ difficulty: number; count: number }>;
    recentPerformance: Array<{ difficulty: number; correct: boolean }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureUserId();
    fetchMetrics()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, []);

  if (error) {
    return (
      <main style={{ padding: 'var(--spacing-6)', maxWidth: '40rem', margin: '0 auto' }}>
        <Card padding="lg">
          <CardHeader>Error</CardHeader>
          <CardContent>{error}</CardContent>
          <Link href="/quiz"><Button>Back to Quiz</Button></Link>
        </Card>
      </main>
    );
  }

  if (!data) {
    return (
      <main style={{ padding: 'var(--spacing-6)', maxWidth: '40rem', margin: '0 auto' }}>
        <Card padding="lg"><CardContent>Loading metrics…</CardContent></Card>
      </main>
    );
  }

  const maxCount = Math.max(1, ...data.difficultyHistogram.map((h) => h.count));

  return (
    <main style={{ padding: 'var(--spacing-6)', maxWidth: '40rem', margin: '0 auto' }}>
      <div
        style={{
          marginBottom: 'var(--spacing-8)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(8rem, 1fr))',
          gap: 'var(--spacing-4)',
        }}
      >
        <Card variant="elevated" padding="md" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>{data.totalScore}</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-1)' }}>Total score</div>
        </Card>
        <Card variant="elevated" padding="md" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-streak)' }}>{data.streak}</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-1)' }}>Current streak</div>
        </Card>
        <Card variant="elevated" padding="md" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-weight-bold)' }}>{data.maxStreak}</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-1)' }}>Max streak</div>
        </Card>
        <Card variant="elevated" padding="md" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-weight-bold)', color: data.accuracy >= 0.7 ? 'var(--color-success)' : 'var(--color-text)' }}>{(data.accuracy * 100).toFixed(0)}%</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-1)' }}>Accuracy</div>
        </Card>
        <Card variant="elevated" padding="md" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-weight-bold)' }}>{data.currentDifficulty}</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-1)' }}>Difficulty</div>
        </Card>
      </div>

      <Card variant="elevated" padding="lg" style={{ marginBottom: 'var(--spacing-6)', boxShadow: 'var(--shadow-md)' }}>
        <CardHeader>Difficulty distribution</CardHeader>
        <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            {data.difficultyHistogram.map(({ difficulty, count }) => (
              <div key={difficulty} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                <span style={{ width: '3rem', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)' }}>L{difficulty}</span>
                <div
                  style={{
                    flex: 1,
                    height: '1.5rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-border)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${(count / maxCount) * 100}%`,
                      height: '100%',
                      background: 'var(--color-primary)',
                      borderRadius: 'var(--radius-md)',
                      minWidth: count > 0 ? '4px' : '0',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', width: '2.5rem', textAlign: 'right' }}>{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card variant="elevated" padding="lg" style={{ marginBottom: 'var(--spacing-6)', boxShadow: 'var(--shadow-md)' }}>
        <CardHeader>Recent performance (last 10)</CardHeader>
        <CardContent>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
            {data.recentPerformance.length === 0 ? (
              <span style={{ color: 'var(--color-text-muted)' }}>No answers yet.</span>
            ) : (
              data.recentPerformance.map((p, i) => (
                <Badge key={i} variant={p.correct ? 'success' : 'error'}>
                  L{p.difficulty} {p.correct ? '✓' : '✗'}
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Link href="/quiz"><Button>Back to Quiz</Button></Link>
    </main>
  );
}

export default dynamic(() => Promise.resolve(MetricsContent), {
  loading: () => (
    <main style={{ padding: 'var(--spacing-6)', maxWidth: '40rem', margin: '0 auto' }}>
      <Card padding="lg"><CardContent>Loading metrics…</CardContent></Card>
    </main>
  ),
  ssr: false,
});
