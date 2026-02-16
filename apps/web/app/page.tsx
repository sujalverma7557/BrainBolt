import Link from 'next/link';
import { Button, Card, CardContent, CardHeader } from '@/components/ui';

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: 'calc(100vh - 4rem)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-8) var(--spacing-6)',
        gap: 'var(--spacing-10)',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '32rem' }}>
        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 'var(--font-weight-bold)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            marginBottom: 'var(--spacing-3)',
            background: 'var(--gradient-hero)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          BrainBolt
        </h1>
        <p
          style={{
            fontSize: 'var(--text-lg)',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
            marginBottom: 'var(--spacing-2)',
          }}
        >
          Adaptive infinite quiz. One question at a time.
        </p>
        <p
          style={{
            fontSize: 'var(--text-base)',
            color: 'var(--color-text-muted)',
            opacity: 0.9,
          }}
        >
          Difficulty rises when you succeed and eases when you slip.
        </p>
      </div>
      <Card
        variant="elevated"
        padding="lg"
        style={{
          width: '100%',
          maxWidth: '22rem',
          boxShadow: 'var(--shadow-glow)',
        }}
      >
        <CardHeader style={{ marginBottom: 'var(--spacing-5)', textAlign: 'center' }}>
          Get started
        </CardHeader>
        <CardContent
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-4)',
          }}
        >
          <Link href="/quiz" style={{ display: 'block' }}>
            <Button size="lg" fullWidth>
              Start quiz
            </Button>
          </Link>
          <Link href="/leaderboard" style={{ display: 'block' }}>
            <Button variant="secondary" size="lg" fullWidth>
              View leaderboards
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
