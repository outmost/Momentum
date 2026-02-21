'use client';
import React from 'react';
import { Flame, RefreshCw } from 'lucide-react';
import { useOverallStreak } from '@/hooks/useStats';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { CompletionChart } from '@/components/dashboard/CompletionChart';
import { GoalBreakdown } from '@/components/dashboard/GoalBreakdown';
import { HabitFormationCard } from '@/components/dashboard/HabitFormationCard';

// No-guilt streak messaging shown when the user has broken their overall streak
const COMEBACK_MESSAGES = [
  "Missed a day? No guilt — just pick up and keep building.",
  "Streaks break. Habits don't have to. Today's a fresh start.",
  "Progress isn't lost. It's waiting for you to continue.",
  "The best time to restart was yesterday. The second best time is now.",
];

export default function DashboardPage() {
  const streak = useOverallStreak();

  // Show a "no guilt" message when the user was active before but has a 0 current streak
  const showComeback = streak && streak.current === 0 && streak.best > 0;
  const comebackMsg = showComeback
    ? COMEBACK_MESSAGES[streak.best % COMEBACK_MESSAGES.length]
    : null;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-5 animate-in">
        <h1 className="page-title">Progress</h1>
        {streak && streak.current > 0 ? (
          <div className="streak-badge">
            <Flame size={13} className={streak.current >= 3 ? 'animate-streak-flame' : ''} />
            <span className="tabular">{streak.current} day streak</span>
          </div>
        ) : streak && streak.best > 0 ? (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{
              color: 'var(--text-3)',
              border: '1px solid var(--border)',
            }}
          >
            <RefreshCw size={11} />
            <span>Best: {streak.best}d</span>
          </div>
        ) : null}
      </div>

      {/* No-guilt comeback banner */}
      {comebackMsg && (
        <div
          className="rounded-xl px-4 py-3 mb-5 text-sm italic animate-in"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent) 6%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)',
            color: 'var(--accent)',
          }}
        >
          {comebackMsg}
        </div>
      )}

      <div className="space-y-4">
        <SummaryCards />
        <CompletionChart />
        <HabitFormationCard />
        <GoalBreakdown />
      </div>
    </div>
  );
}
