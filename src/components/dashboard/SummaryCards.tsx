'use client';
import React from 'react';
import { useTodayProgress, useTotalStats } from '@/hooks/useStats';
import { format } from 'date-fns';

interface StatBlockProps {
  value: string | number;
  label: string;
  sub?: string;
  accent?: boolean;
  delay?: number;
}

function StatBlock({ value, label, sub, accent, delay = 0 }: StatBlockProps) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col justify-between animate-stagger-in transition-all duration-300"
      style={{
        backgroundColor: 'var(--surface)',
        border: accent ? '1px solid color-mix(in srgb, var(--success) 30%, var(--border))' : '1px solid var(--border)',
        animationDelay: `${delay}ms`,
        boxShadow: accent ? '0 0 0 1px color-mix(in srgb, var(--success) 10%, transparent)' : 'none',
      }}
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
  const totals = useTotalStats();

  const completedToday = todayProgress?.completed ?? 0;
  const totalToday = todayProgress?.total ?? 0;
  const allDone = totalToday > 0 && completedToday === totalToday;

  const totalThisMonth = totals?.totalThisMonth ?? 0;
  const daysActiveThisWeek = totals?.daysActiveThisWeek ?? 0;
  const consistency30 = totals?.consistency30 ?? 0;

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <StatBlock
        value={totalToday > 0 ? `${completedToday}/${totalToday}` : '—'}
        label="Today"
        accent={allDone}
        sub={allDone && totalToday > 0 ? 'All done ✓' : undefined}
        delay={0}
      />
      <StatBlock
        value={consistency30 > 0 ? `${consistency30}%` : '—'}
        label="Consistency"
        sub="last 30 days"
        accent={consistency30 >= 80}
        delay={50}
      />
      <StatBlock
        value={totalThisMonth > 0 ? String(totalThisMonth) : '—'}
        label="This month"
        sub="completions"
        delay={100}
      />
      <StatBlock
        value={daysActiveThisWeek > 0 ? `${daysActiveThisWeek}/7` : '—'}
        label="This week"
        sub="active days"
        delay={150}
      />
    </div>
  );
}
