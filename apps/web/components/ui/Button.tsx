'use client';

import React from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.bbButton} ${styles['variant--' + variant]} ${styles['size--' + size]} ${fullWidth ? styles.fullWidth : ''} ${className}`}
      disabled={disabled}
      aria-busy={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
