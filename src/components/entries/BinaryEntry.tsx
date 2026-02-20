'use client';
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

interface BinaryEntryProps {
  completed: boolean;
  onChange: (completed: boolean) => void;
  color?: string;
}

export function BinaryEntry({ completed, onChange, color = '#10B981' }: BinaryEntryProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!completed)}
      className={cn(
        'w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-150 shrink-0',
        completed
          ? 'border-transparent text-white'
          : 'border-gray-300 dark:border-gray-600 text-transparent hover:border-gray-400'
      )}
      style={completed ? { backgroundColor: color, borderColor: color } : {}}
    >
      <Check size={16} strokeWidth={3} />
    </button>
  );
}
