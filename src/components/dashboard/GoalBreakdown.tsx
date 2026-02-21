'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAllGoalStats } from '@/hooks/useStats';

export function GoalBreakdown() {
  const router = useRouter();
  const allStats = useAllGoalStats();

  if (!allStats || allStats.length === 0) {
    return (
      <div
        className="rounded-xl p-5 animate-stagger-in"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '300ms' }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>Habits</p>
        <p className="text-sm text-center py-4" style={{ color: 'var(--text-3)' }}>No active goals yet.</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden animate-stagger-in"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '300ms' }}
    >
      <p className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
        Habits · last 7 days
      </p>
      <div>
        {allStats.map(({ goal, completionRate7, last7 }, i) => {
          const isPerfect = completionRate7 === 100;
          return (
            <button
              key={goal.id}
              onClick={() => router.push(`/goals/${goal.id}`)}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all duration-200 active:scale-[0.99] animate-stagger-in"
              style={{
                borderBottom: i < allStats.length - 1 ? '1px solid var(--border)' : 'none',
                animationDelay: `${350 + i * 50}ms`,
              }}
            >
              {/* Color dot — with glow for perfect habits */}
              <span
                className="w-2 h-2 rounded-full shrink-0 transition-all duration-300"
                style={{
                  backgroundColor: goal.color || 'var(--accent)',
                  boxShadow: isPerfect ? `0 0 6px ${goal.color || 'var(--accent)'}40` : 'none',
                }}
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
                    className="w-[7px] h-[7px] rounded-full transition-all duration-300"
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
                      transform: day.completed ? 'scale(1)' : 'scale(0.85)',
                    }}
                  />
                ))}
              </div>

              {/* 7-day completion rate */}
              <div className="text-right shrink-0 w-10">
                {completionRate7 > 0 ? (
                  <p
                    className="text-sm font-semibold tabular leading-none transition-colors duration-300"
                    style={{ color: completionRate7 >= 80 ? (goal.color || 'var(--accent)') : 'var(--text-2)' }}
                  >
                    {completionRate7}%
                  </p>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>—</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
