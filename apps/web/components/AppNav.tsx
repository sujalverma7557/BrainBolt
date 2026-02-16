'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';

const navLinks = [
  { href: '/', label: 'BrainBolt', isBrand: true },
  { href: '/quiz', label: 'Quiz', isBrand: false },
  { href: '/leaderboard', label: 'Leaderboard', isBrand: false },
  { href: '/metrics', label: 'Metrics', isBrand: false },
];

export function AppNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--spacing-3) var(--spacing-6)',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        boxShadow: 'var(--shadow-sm)',
        flexWrap: 'wrap',
        gap: 'var(--spacing-3)',
      }}
    >
      <div style={{ display: 'flex', gap: 'var(--spacing-1)', alignItems: 'center' }}>
        {navLinks.map(({ href, label, isBrand }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                padding: 'var(--spacing-2) var(--spacing-3)',
                borderRadius: 'var(--radius-md)',
                fontSize: isBrand ? 'var(--text-lg)' : 'var(--text-sm)',
                fontWeight: isBrand ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
                color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                background: active && !isBrand ? 'color-mix(in srgb, var(--color-primary) 0.1, transparent)' : 'transparent',
                transition: 'color 0.15s, background 0.15s',
                textDecoration: 'none',
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          padding: 'var(--spacing-2) var(--spacing-3)',
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--color-text)',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>
    </nav>
  );
}
