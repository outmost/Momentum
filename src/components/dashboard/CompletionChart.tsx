'use client';
import React from 'react';
import { useCompletionTrend } from '@/hooks/useStats';
import { format, subDays, addDays, getDay } from 'date-fns';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function cellColor(rate: number | null, isFuture: boolean): string {
  if (isFuture || rate === null) return 'transparent';
  if (rate === 0)   return 'var(--border)';
  if (rate < 50)    return 'rgba(0,87,255,0.16)';
  if (rate < 100)   return 'rgba(0,87,255,0.42)';
  return 'var(--success)';
}

export function CompletionChart() {
  const trend = useCompletionTrend(35);

  if (!trend) return (
    <div className="card h-40 animate-pulse" style={{ backgroundColor: 'var(--border)' }} />
  );

  const rateMap = new Map(trend.map(d => [d.date, d.rate]));

  const today      = new Date();
  const todayStr   = format(today, 'yyyy-MM-dd');
  const todayDow   = (getDay(today) + 6) % 7;
  const thisMonday = subDays(today, todayDow);
  const startDate  = subDays(thisMonday, 28);

  const grid = Array.from({ length: 5 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const d       = addDays(startDate, week * 7 + day);
      const dateStr = format(d, 'yyyy-MM-dd');
      return {
        date:     dateStr,
        rate:     rateMap.has(dateStr) ? rateMap.get(dateStr)! : null,
        isToday:  dateStr === todayStr,
        isFuture: dateStr > todayStr,
      };
    })
  );

  const pastCells  = grid.flat().filter(c => !c.isFuture && c.rate !== null);
  const activeDays = pastCells.filter(c => (c.rate ?? 0) > 0).length;
  const perfectDays = pastCells.filter(c => c.rate === 100).length;

  return (
    <div className="card p-5 animate-stagger-in" style={{ animationDelay: '200ms' }}>
      <div className="flex items-baseline justify-between mb-4">
        <p className="section-label">Activity</p>
        <p style={{ fontSize: '11px', color: 'var(--text-3)' }}>
          {activeDays} active · {perfectDays} perfect
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="text-center" style={{ fontSize: '9px', fontWeight: 500, color: 'var(--text-3)' }}>
            {d}
          </div>
        ))}
      </div>

      {grid.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
          {week.map(({ date, rate, isToday, isFuture }) => {
            const isPerfect = rate === 100 && !isFuture;
            return (
              <div
                key={date}
                className="aspect-square rounded transition-all duration-300"
                title={isFuture ? '' : `${date}: ${rate ?? 0}%`}
                style={{
                  backgroundColor: cellColor(rate, isFuture),
                  border: isToday
                    ? '1.5px solid var(--accent)'
                    : isFuture || rate === null
                    ? '1px solid var(--border)'
                    : 'none',
                  opacity:    isFuture ? 0.2 : 1,
                  boxShadow:  isPerfect ? '0 0 4px var(--success-glow)' : 'none',
                  borderRadius: '4px',
                }}
              />
            );
          })}
        </div>
      ))}

      <div className="flex items-center gap-2 mt-3">
        <span style={{ fontSize: '9px', color: 'var(--text-3)' }}>None</span>
        {['var(--border)', 'rgba(0,87,255,0.16)', 'rgba(0,87,255,0.42)', 'var(--success)'].map((bg, i) => (
          <div
            key={i}
            style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: bg }}
          />
        ))}
        <span style={{ fontSize: '9px', color: 'var(--text-3)' }}>All</span>
      </div>
    </div>
  );
}
