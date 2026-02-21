'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAllGoalStats } from '@/hooks/useStats';

export function GoalBreakdown() {
  const router   = useRouter();
  const allStats = useAllGoalStats();

  if (!allStats || allStats.length === 0) {
    return (
      <div className="card p-5 animate-stagger-in" style={{ animationDelay: '300ms' }}>
        <p className="section-label mb-4">Habits</p>
        <p className="text-sm text-center py-4" style={{ color: 'var(--text-3)' }}>No active goals yet.</p>
      </div>
    );
  }

  return (
    <div className="card-overflow animate-stagger-in" style={{ animationDelay: '300ms' }}>
      <div
        className="px-5 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <p className="section-label">Habits &middot; last 7 days</p>
      </div>

      <div>
        {allStats.map(({ goal, completionRate7, last7 }, i) => {
          const isPerfect = completionRate7 === 100;
          const accentColor = goal.color || 'var(--accent)';
          return (
            <button
              key={goal.id}
              onClick={() => router.push(`/goals/${goal.id}`)}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[var(--surface-2)] animate-stagger-in"
              style={{
                borderBottom:   i < allStats.length - 1 ? '1px solid var(--border)' : 'none',
                animationDelay: `${350 + i * 50}ms`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0 transition-all duration-300"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: isPerfect ? `0 0 6px color-mix(in srgb, ${accentColor} 40%, transparent)` : 'none',
                }}
              />

              <p className="flex-1 text-[13px] font-medium truncate" style={{ color: 'var(--text)' }}>
                {goal.title}
              </p>

              <div className="flex items-center gap-[3px] shrink-0">
                {last7.map((day, j) => (
                  <span
                    key={j}
                    className="w-[7px] h-[7px] rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: !day.scheduled
                        ? 'transparent'
                        : day.completed
                        ? accentColor
                        : 'var(--border)',
                      border: !day.scheduled
                        ? 'none'
                        : day.completed
                        ? 'none'
                        : '1px solid var(--border-2)',
                      transform: day.completed ? 'scale(1)' : 'scale(0.85)',
                    }}
                  />
                ))}
              </div>

              <div className="text-right shrink-0 w-10">
                {completionRate7 > 0 ? (
                  <p
                    className="text-[13px] font-semibold tabular leading-none transition-colors duration-300"
                    style={{ color: completionRate7 >= 80 ? accentColor : 'var(--text-2)' }}
                  >
                    {completionRate7}%
                  </p>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>&mdash;</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
