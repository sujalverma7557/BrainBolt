'use client';

import React from 'react';
import styles from './Badge.module.css';

type BadgeVariant = 'default' | 'streak' | 'score' | 'success' | 'error';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({
  variant = 'default',
  children,
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      className={`${styles.badge} ${styles[`variant--${variant}`]} ${className}`}
      role="status"
      {...props}
    >
      {children}
    </span>
  );
}
