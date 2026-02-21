'use client';
import React from 'react';
import { format, subDays, addDays, getDay } from 'date-fns';

function cellColor(rate: number | null, isFuture: boolean): string {
  if (isFuture || rate === null) return 'transparent';
  if (rate === 0)   return 'var(--border)';
  if (rate < 40)    return 'color-mix(in srgb, var(--accent) 18%, transparent)';
  if (rate < 70)    return 'color-mix(in srgb, var(--accent) 40%, transparent)';
  if (rate < 100)   return 'color-mix(in srgb, var(--accent) 65%, transparent)';
  return 'var(--success)';
}

interface MiniHeatmapProps {
  data: { date: string; rate: number | null }[] | undefined;
}

export function MiniHeatmap({ data }: MiniHeatmapProps) {
  if (!data || data.length === 0) return null;

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const todayDow = (getDay(today) + 6) % 7; // Monday = 0
  const thisMonday = subDays(today, todayDow);
  const weeks = 5;
  const startDate = subDays(thisMonday, (weeks - 1) * 7);

  const rateMap = new Map(data.map(d => [d.date, d.rate]));

  const grid = Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const d = addDays(startDate, week * 7 + day);
      const dateStr = format(d, 'yyyy-MM-dd');
      return {
        date: dateStr,
        rate: rateMap.has(dateStr) ? rateMap.get(dateStr)! : null,
        isFuture: dateStr > todayStr,
        isToday: dateStr === todayStr,
      };
    })
  );

  // Headline: consistency % over the period
  const pastCells = grid.flat().filter(c => !c.isFuture && c.rate !== null);
  const consistency = pastCells.length > 0
    ? Math.round(pastCells.filter(c => (c.rate ?? 0) > 0).length / pastCells.length * 100)
    : 0;

  return (
    <div className="flex items-center gap-4">
      {/* Headline number */}
      <div className="shrink-0" style={{ minWidth: 52 }}>
        <p
          className="tabular leading-none font-bold"
          style={{
            fontSize: 28,
            letterSpacing: '-0.03em',
            color: consistency >= 80 ? 'var(--success)' : consistency > 0 ? 'var(--text)' : 'var(--text-3)',
          }}
        >
          {consistency}%
        </p>
        <p style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 3 }}>
          consistency
        </p>
      </div>

      {/* Heatmap grid — fills remaining width */}
      <div className="flex-1 grid grid-cols-7 gap-[3px]">
        {grid.flat().map(({ date, rate, isFuture, isToday }) => {
          const isPerfect = rate === 100 && !isFuture;
          return (
            <div
              key={date}
              className="rounded-[3px]"
              style={{
                aspectRatio: '1',
                backgroundColor: cellColor(rate, isFuture),
                border: isToday
                  ? '1.5px solid var(--accent)'
                  : isFuture || rate === null
                  ? '1px solid var(--border)'
                  : 'none',
                opacity: isFuture ? 0.15 : 1,
                boxShadow: isPerfect ? '0 0 4px var(--success-glow)' : 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
