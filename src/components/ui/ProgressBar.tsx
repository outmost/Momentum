import React from 'react';
import { cn } from '@/lib/cn';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function ProgressBar({ value, className, color = '#10B981', showLabel = false, size = 'md' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const heights = { sm: 'h-1.5', md: 'h-2' };
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden', heights[size])}>
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">{clamped}%</span>
      )}
    </div>
  );
}
