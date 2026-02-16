'use client';

import React from 'react';
import styles from './RadioGroup.module.css';

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  'aria-label': string;
}

export function RadioGroup({
  name,
  options,
  value,
  onChange,
  disabled,
  'aria-label': ariaLabel,
}: RadioGroupProps) {
  return (
    <div
      className={styles.radioGroup}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`${styles.option} ${value === opt.value ? styles.optionSelected : ''}`}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            disabled={disabled}
            className={styles.input}
            aria-checked={value === opt.value}
          />
          <span className={styles.label}>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
