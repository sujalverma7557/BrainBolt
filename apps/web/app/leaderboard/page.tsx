import React from 'react';
import { LeaderboardClient } from './LeaderboardClient';

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
      <LeaderboardClient />
    </main>
  );
}
