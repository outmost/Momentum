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
  // 35 days covers our 5-week window with some buffer
  const trend = useCompletionTrend(35);

  if (!trend) return (
    <div className="h-40 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--border)' }} />
  );

  const rateMap = new Map(trend.map(d => [d.date, d.rate]));

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  // Monday-first day index (Mon=0, Sun=6)
  const todayDow = (getDay(today) + 6) % 7;
  const thisMonday = subDays(today, todayDow);
  const startDate = subDays(thisMonday, 28); // 5 weeks back

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

  // Summary line
  const pastCells = grid.flat().filter(c => !c.isFuture && c.rate !== null);
  const activeDays = pastCells.filter(c => (c.rate ?? 0) > 0).length;
  const perfectDays = pastCells.filter(c => c.rate === 100).length;

  return (
    <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
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

      {/* 5×7 cell grid */}
      {grid.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
          {week.map(({ date, rate, isToday, isFuture }) => (
            <div
              key={date}
              className="aspect-square rounded-sm"
              title={isFuture ? '' : `${date}: ${rate ?? 0}%`}
              style={{
                backgroundColor: cellColor(rate, isFuture),
                border: isToday
                  ? '1.5px solid var(--accent)'
                  : isFuture || rate === null
                  ? '1px solid var(--border)'
                  : 'none',
                opacity: isFuture ? 0.25 : 1,
              }}
            />
          ))}
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
