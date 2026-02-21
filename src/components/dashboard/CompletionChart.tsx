'use client';
import React from 'react';
import { useCompletionTrend } from '@/hooks/useStats';
import { format, subDays, addDays, getDay } from 'date-fns';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function cellColor(rate: number | null, isFuture: boolean): string {
  if (isFuture || rate === null) return 'transparent';
  if (rate === 0) return 'var(--border)';
  if (rate < 50) return 'rgba(0,87,255,0.18)';
  if (rate < 100) return 'rgba(0,87,255,0.45)';
  return 'var(--success)';
}

export function CompletionChart() {
  const trend = useCompletionTrend(35);

  if (!trend) return (
    <div
      className="h-40 rounded-xl animate-pulse"
      style={{ backgroundColor: 'var(--border)' }}
    />
  );

  const rateMap = new Map(trend.map(d => [d.date, d.rate]));

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const todayDow = (getDay(today) + 6) % 7;
  const thisMonday = subDays(today, todayDow);
  const startDate = subDays(thisMonday, 28);

  const grid = Array.from({ length: 5 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const d = addDays(startDate, week * 7 + day);
      const dateStr = format(d, 'yyyy-MM-dd');
      return {
        date: dateStr,
        rate: rateMap.has(dateStr) ? rateMap.get(dateStr)! : null,
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
      };
    })
  );

  const pastCells = grid.flat().filter(c => !c.isFuture && c.rate !== null);
  const activeDays = pastCells.filter(c => (c.rate ?? 0) > 0).length;
  const perfectDays = pastCells.filter(c => c.rate === 100).length;

  // Flatten for stagger animation
  let cellIndex = 0;

  return (
    <div
      className="rounded-xl p-5 animate-stagger-in"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '200ms' }}
    >
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
          Activity
        </p>
        <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
          {activeDays} active · {perfectDays} perfect
        </p>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="text-center text-[9px] font-medium" style={{ color: 'var(--text-3)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* 5x7 cell grid */}
      {grid.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
          {week.map(({ date, rate, isToday, isFuture }) => {
            const idx = cellIndex++;
            const isPerfect = rate === 100 && !isFuture;
            return (
              <div
                key={date}
                className="aspect-square rounded-sm transition-all duration-300"
                title={isFuture ? '' : `${date}: ${rate ?? 0}%`}
                style={{
                  backgroundColor: cellColor(rate, isFuture),
                  border: isToday
                    ? '1.5px solid var(--accent)'
                    : isFuture || rate === null
                    ? '1px solid var(--border)'
                    : 'none',
                  opacity: isFuture ? 0.25 : 1,
                  boxShadow: isPerfect ? '0 0 4px var(--success-glow)' : 'none',
                  animationDelay: `${idx * 15}ms`,
                }}
              />
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[9px]" style={{ color: 'var(--text-3)' }}>None</span>
        {[
          'var(--border)',
          'rgba(0,87,255,0.18)',
          'rgba(0,87,255,0.45)',
          'var(--success)',
        ].map((bg, i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: bg }}
          />
        ))}
        <span className="text-[9px]" style={{ color: 'var(--text-3)' }}>All</span>
      </div>
    </div>
  );
}
