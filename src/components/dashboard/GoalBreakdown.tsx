'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAllGoalStats } from '@/hooks/useStats';

export function GoalBreakdown() {
  const router = useRouter();
  const allStats = useAllGoalStats();

  if (!allStats || allStats.length === 0) {
    return (
      <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>Habits</p>
        <p className="text-sm text-center py-4" style={{ color: 'var(--text-3)' }}>No active goals yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
        Habits · last 7 days
      </p>
      <div>
        {allStats.map(({ goal, completionRate7, last7 }, i) => (
          <button
            key={goal.id}
            onClick={() => router.push(`/goals/${goal.id}`)}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors"
            style={{ borderBottom: i < allStats.length - 1 ? '1px solid var(--border)' : 'none' }}
          >
            {/* Color dot */}
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: goal.color || 'var(--accent)' }}
            />

            {/* Name */}
            <p className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
              {goal.title}
            </p>

            {/* Last 7 days dots */}
            <div className="flex items-center gap-[3px] shrink-0">
              {last7.map((day, j) => (
                <span
                  key={j}
                  className="w-[7px] h-[7px] rounded-full"
                  style={{
                    backgroundColor: !day.scheduled
                      ? 'transparent'
                      : day.completed
                      ? (goal.color || 'var(--accent)')
                      : 'var(--border)',
                    border: !day.scheduled
                      ? 'none'
                      : day.completed
                      ? 'none'
                      : '1px solid var(--border-2)',
                  }}
                />
              ))}
            </div>

            {/* 7-day completion rate */}
            <div className="text-right shrink-0 w-10">
              {completionRate7 > 0 ? (
                <p
                  className="text-sm font-semibold tabular leading-none"
                  style={{ color: completionRate7 >= 80 ? (goal.color || 'var(--accent)') : 'var(--text-2)' }}
                >
                  {completionRate7}%
                </p>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>—</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
