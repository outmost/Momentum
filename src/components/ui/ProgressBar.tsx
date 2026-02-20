import React from 'react';
import { cn } from '@/lib/cn';

interface ProgressBarProps {
  value: number;
  className?: string;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  /** Render a subtle divider tick at this percentage (e.g. 80 for OKR success point) */
  milestone?: number;
}

export function ProgressBar({ value, className, color = '#16A34A', showLabel = false, size = 'md', milestone }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const height = size === 'sm' ? 'h-px' : 'h-0.5';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 rounded-full relative', height)} style={{ backgroundColor: 'var(--border)', overflow: 'hidden' }}>
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
        {/* OKR milestone divider — a thin contrasting line marks the success threshold */}
        {milestone !== undefined && milestone > 0 && milestone < 100 && (
          <div
            className="absolute inset-y-0 w-px"
            style={{
              left: `${milestone}%`,
              backgroundColor: 'var(--bg)',
              opacity: 0.7,
              transform: 'translateX(-50%)',
            }}
          />
        )}
      </div>
      {showLabel && (
        <span className="text-xs tabular w-7 text-right" style={{ color: 'var(--text-3)' }}>{clamped}%</span>
      )}
    </div>
  );
}
