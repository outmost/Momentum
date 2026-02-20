'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAllGoalStats } from '@/hooks/useStats';
import { ProgressBar } from '@/components/ui/ProgressBar';

const TYPE_ICONS: Record<string, string> = {
  binary: '✓', numeric: '#', milestone: '◎', timer: '⏱',
};

export function GoalBreakdown() {
  const router = useRouter();
  const allStats = useAllGoalStats();

  if (!allStats || allStats.length === 0) {
    return (
      <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>Goals</p>
        <p className="text-sm text-center py-4" style={{ color: 'var(--text-3)' }}>No active goals yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
        Goal performance · 30-day
      </p>
      <div>
        {allStats.slice(0, 8).map(({ goal, completionRate30, currentStreak }, i) => (
          <button
            key={goal.id}
            onClick={() => router.push(`/goals/${goal.id}`)}
            className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors"
            style={{ borderBottom: i < Math.min(allStats.length, 8) - 1 ? '1px solid var(--border)' : 'none' }}
          >
            <span className="text-[11px] font-mono w-3 shrink-0" style={{ color: 'var(--text-3)' }}>
              {TYPE_ICONS[goal.type]}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate mb-1.5" style={{ color: 'var(--text)' }}>{goal.title}</p>
              <div className="flex items-center gap-2">
                <ProgressBar value={completionRate30} size="sm" color={goal.color || '#16A34A'} className="w-24" />
                <span className="text-xs tabular" style={{ color: 'var(--text-3)' }}>{completionRate30}%</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold tabular" style={{ color: 'var(--text-2)' }}>{currentStreak}d</p>
              <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>streak</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
