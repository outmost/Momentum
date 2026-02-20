'use client';
import React from 'react';
import { cn } from '@/lib/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked, onChange, label, disabled, className }: ToggleProps) {
  return (
    <label className={cn('flex items-center gap-3 cursor-pointer select-none', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-150 focus:outline-none"
        style={{ backgroundColor: checked ? 'var(--accent)' : 'var(--border-2)' }}
      >
        <span
          className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-150"
          style={{ transform: checked ? 'translateX(18px)' : 'translateX(3px)' }}
        />
      </button>
      {label && <span className="text-sm" style={{ color: 'var(--text)' }}>{label}</span>}
    </label>
  );
}
