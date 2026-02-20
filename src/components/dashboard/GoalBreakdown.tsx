'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAllGoalStats } from '@/hooks/useStats';
import { ProgressBar } from '@/components/ui/ProgressBar';

const TYPE_ICONS: Record<string, string> = {
  binary: '✓',
  numeric: '#',
  milestone: '◎',
  timer: '⏱',
};

export function GoalBreakdown() {
  const router = useRouter();
  const allStats = useAllGoalStats();
  
  if (!allStats || allStats.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Goal Breakdown</h2>
        <p className="text-sm text-gray-400 text-center py-4">No active goals yet.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
      <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Goals Needing Attention</h2>
        <p className="text-xs text-gray-400 mt-0.5">Sorted by 30-day completion rate</p>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-700">
        {allStats.slice(0, 8).map(({ goal, completionRate30, currentStreak }) => (
          <button
            key={goal.id}
            onClick={() => router.push(`/goals/${goal.id}`)}
            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
          >
            <span className="text-xs text-gray-400 font-mono w-4 shrink-0">{TYPE_ICONS[goal.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{goal.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <ProgressBar
                  value={completionRate30}
                  size="sm"
                  color={goal.color || '#10B981'}
                  className="w-24"
                />
                <span className="text-xs text-gray-400">{completionRate30}%</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{currentStreak}d</p>
              <p className="text-xs text-gray-400">streak</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
