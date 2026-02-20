'use client';
import React from 'react';
import { useAllGoalStats, useTodayProgress } from '@/hooks/useStats';
import { format } from 'date-fns';

interface StatBlockProps {
  value: string | number;
  label: string;
  accent?: boolean;
}

function StatBlock({ value, label, accent }: StatBlockProps) {
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
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] mt-3" style={{ color: 'var(--text-3)' }}>
        {label}
      </p>
    </div>
  );
}

export function SummaryCards() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayProgress = useTodayProgress(today);
  const allStats = useAllGoalStats();

  const completedToday = todayProgress?.completed ?? 0;
  const totalToday = todayProgress?.total ?? 0;
  const allDone = totalToday > 0 && completedToday === totalToday;

  const maxStreak = allStats?.reduce((m, s) => Math.max(m, s.currentStreak), 0) ?? 0;
  const weekRate = allStats?.length
    ? Math.round(allStats.reduce((s, x) => s + x.completionRate7, 0) / allStats.length) : 0;
  const monthRate = allStats?.length
    ? Math.round(allStats.reduce((s, x) => s + x.completionRate30, 0) / allStats.length) : 0;

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <StatBlock
        value={totalToday > 0 ? `${completedToday}/${totalToday}` : '—'}
        label="Today"
        accent={allDone}
      />
      <StatBlock value={weekRate > 0 ? `${weekRate}%` : '—'} label="7-day avg" />
      <StatBlock value={monthRate > 0 ? `${monthRate}%` : '—'} label="30-day avg" />
      <StatBlock value={maxStreak > 0 ? `${maxStreak}d` : '—'} label="Best streak" />
    </div>
  );
}
