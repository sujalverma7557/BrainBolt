/**
 * //Designed system tokens.
 */

export const colors = {
  light: {
    background: 'var(--color-bg)',
    surface: 'var(--color-surface)',
    surfaceElevated: 'var(--color-surface-elevated)',
    text: 'var(--color-text)',
    textMuted: 'var(--color-text-muted)',
    primary: 'var(--color-primary)',
    primaryHover: 'var(--color-primary-hover)',
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    border: 'var(--color-border)',
    streak: 'var(--color-streak)',
  },
  dark: {
    background: 'var(--color-bg)',
    surface: 'var(--color-surface)',
    surfaceElevated: 'var(--color-surface-elevated)',
    text: 'var(--color-text)',
    textMuted: 'var(--color-text-muted)',
    primary: 'var(--color-primary)',
    primaryHover: 'var(--color-primary-hover)',
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    border: 'var(--color-border)',
    streak: 'var(--color-streak)',
  },
} as const;

export const spacing = {
  0: '0',
  1: 'var(--spacing-1)',   // 4px
  2: 'var(--spacing-2)',   // 8px
  3: 'var(--spacing-3)',  // 12px
  4: 'var(--spacing-4)',  // 16px
  5: 'var(--spacing-5)',  // 20px
  6: 'var(--spacing-6)',  // 24px
  8: 'var(--spacing-8)',  // 32px
  10: 'var(--spacing-10)', // 40px
  12: 'var(--spacing-12)', // 48px
  16: 'var(--spacing-16)', // 64px
} as const;

export const typography = {
  fontFamily: 'var(--font-sans)',
  fontMono: 'var(--font-mono)',
  size: {
    xs: 'var(--text-xs)',
    sm: 'var(--text-sm)',
    base: 'var(--text-base)',
    lg: 'var(--text-lg)',
    xl: 'var(--text-xl)',
    '2xl': 'var(--text-2xl)',
    '3xl': 'var(--text-3xl)',
  },
  weight: {
    normal: 'var(--font-weight-normal)',
    medium: 'var(--font-weight-medium)',
    semibold: 'var(--font-weight-semibold)',
    bold: 'var(--font-weight-bold)',
  },
} as const;

export const radius = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  full: 'var(--radius-full)',
} as const;

export const shadows = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
} as const;

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;
