'use client';
import React from 'react';
import { Check } from 'lucide-react';

interface BinaryEntryProps {
  completed: boolean;
  onChange: (completed: boolean) => void;
  color?: string;
}

export function BinaryEntry({ completed, onChange, color = '#16A34A' }: BinaryEntryProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!completed)}
      className="w-10 h-10 flex items-center justify-center -m-2.5 shrink-0"
      aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
    >
      <span
        className="w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all duration-150"
        style={
          completed
            ? { backgroundColor: color, border: '1.5px solid transparent' }
            : { border: '1.5px solid var(--border-2)', backgroundColor: 'transparent' }
        }
      >
        {completed && <Check size={10} strokeWidth={3} color="white" />}
      </span>
    </button>
  );
}
