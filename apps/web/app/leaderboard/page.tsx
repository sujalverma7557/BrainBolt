import React, { Suspense } from 'react';
import dynamicImport from 'next/dynamic';

const LeaderboardClient = dynamicImport(() => import('./LeaderboardClient').then((m) => ({ default: m.LeaderboardClient })), {
  loading: () => (
    <div style={{ padding: 'var(--spacing-6)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
      Loading leaderboards…
    </div>
  ),
  ssr: false,
});

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: 'var(--spacing-6)',
        maxWidth: '42rem',
        margin: '0 auto',
      }}
    >
      <h1
        style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--font-weight-bold)',
          marginBottom: 'var(--spacing-6)',
          letterSpacing: '-0.02em',
          background: 'var(--gradient-hero)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Leaderboards
      </h1>
      <Suspense fallback={<div style={{ padding: 'var(--spacing-6)', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading…</div>}>
        <LeaderboardClient />
      </Suspense>
    </main>
  );
}
