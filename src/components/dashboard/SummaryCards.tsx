'use client';
import React from 'react';
import { useAllGoalStats, useTodayProgress, useTotalStats } from '@/hooks/useStats';
import { format } from 'date-fns';

interface StatBlockProps {
  value: string | number;
  label: string;
  sub?: string;
  accent?: boolean;
}

function StatBlock({ value, label, sub, accent }: StatBlockProps) {
  return (
    <div
      className="rounded-lg p-5 flex flex-col justify-between"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <p
        className="text-4xl font-semibold tabular tracking-tight leading-none"
        style={{ color: accent ? 'var(--success)' : 'var(--text)' }}
      >
        {value}
      </p>
      <div className="mt-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--text-3)' }}>
          {label}
        </p>
        {sub && (
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>{sub}</p>
        )}
      </div>
    </div>
  );
}

export function SummaryCards() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayProgress = useTodayProgress(today);
  const allStats = useAllGoalStats();
  const totals = useTotalStats();

  const completedToday = todayProgress?.completed ?? 0;
  const totalToday = todayProgress?.total ?? 0;
  const allDone = totalToday > 0 && completedToday === totalToday;

  // Best current streak across all goals
  const bestStreak = allStats?.reduce((m, s) => Math.max(m, s.currentStreak), 0) ?? 0;
  // Longest streak holder name
  const streakGoal = allStats?.find(s => s.currentStreak === bestStreak);

  const totalThisMonth = totals?.totalThisMonth ?? 0;
  const daysActiveThisWeek = totals?.daysActiveThisWeek ?? 0;

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <StatBlock
        value={totalToday > 0 ? `${completedToday}/${totalToday}` : '—'}
        label="Today"
        accent={allDone}
        sub={allDone && totalToday > 0 ? 'All done ✓' : undefined}
      />
      <StatBlock
        value={bestStreak > 0 ? `${bestStreak}d` : '—'}
        label="Best streak"
        sub={bestStreak >= 7 ? streakGoal?.goal.title : undefined}
        accent={bestStreak >= 7}
      />
      <StatBlock
        value={totalThisMonth > 0 ? String(totalThisMonth) : '—'}
        label="This month"
        sub="completions"
      />
      <StatBlock
        value={daysActiveThisWeek > 0 ? `${daysActiveThisWeek}/7` : '—'}
        label="This week"
        sub="active days"
      />
    </div>
  );
}
