'use client';
import React from 'react';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useTodayProgress, useAllGoalStats } from '@/hooks/useStats';
import { format } from 'date-fns';

export function SummaryCards() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayProgress = useTodayProgress(today);
  const allStats = useAllGoalStats();

  const todayPercent = todayProgress && todayProgress.total > 0
    ? Math.round((todayProgress.completed / todayProgress.total) * 100) : 0;

  const maxStreak = allStats?.reduce((max, s) => Math.max(max, s.currentStreak), 0) ?? 0;
  const weekRate = allStats?.length
    ? Math.round(allStats.reduce((s, x) => s + x.completionRate7, 0) / allStats.length) : 0;
  const monthRate = allStats?.length
    ? Math.round(allStats.reduce((s, x) => s + x.completionRate30, 0) / allStats.length) : 0;

  const stats = [
    {
      value: todayProgress ? `${todayProgress.completed}/${todayProgress.total}` : '0/0',
      label: "Today",
      sub: `${todayPercent}% done`,
      visual: (
        <ProgressRing value={todayPercent} size={40} strokeWidth={3} color="#16A34A">
          <span className="text-[9px] font-bold tabular" style={{ color: 'var(--text)' }}>{todayPercent}%</span>
        </ProgressRing>
      ),
    },
    { value: `${maxStreak}d`, label: "Best streak", sub: "days in a row" },
    { value: `${weekRate}%`, label: "This week", sub: "avg completion" },
    { value: `${monthRate}%`, label: "This month", sub: "avg completion" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map(({ value, label, sub, visual }) => (
        <div
          key={label}
          className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {visual ? (
            <div className="flex items-center gap-3 mb-2">
              {visual}
              <div>
                <p className="text-xl font-semibold tabular tracking-tight" style={{ color: 'var(--text)' }}>{value}</p>
                <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-3)' }}>{label}</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-2xl font-semibold tabular tracking-tight mb-1" style={{ color: 'var(--text)' }}>{value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>{label}</p>
            </>
          )}
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{sub}</p>
        </div>
      ))}
    </div>
  );
}
