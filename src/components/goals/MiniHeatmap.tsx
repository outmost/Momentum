'use client';
import React from 'react';
import { format, subDays, addDays, getDay } from 'date-fns';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

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
  const weeks = 8;
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

  const pastCells  = grid.flat().filter(c => !c.isFuture && c.rate !== null);
  const activeDays = pastCells.filter(c => (c.rate ?? 0) > 0).length;
  const perfectDays = pastCells.filter(c => c.rate === 100).length;

  return (
    <div>
      {/* Day labels */}
      <div className="flex gap-[3px] mb-[3px]">
        {DAY_LABELS.map((d, i) => (
          <div
            key={i}
            className="text-center"
            style={{ width: 10, fontSize: '7px', fontWeight: 500, color: 'var(--text-3)' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex flex-col gap-[3px]">
        {grid.map((week, wi) => (
          <div key={wi} className="flex gap-[3px]">
            {week.map(({ date, rate, isFuture, isToday }) => {
              const isPerfect = rate === 100 && !isFuture;
              return (
                <div
                  key={date}
                  className="rounded-[3px] transition-all duration-300"
                  title={isFuture ? '' : `${date}: ${rate ?? 0}%`}
                  style={{
                    width: 10,
                    height: 10,
                    backgroundColor: cellColor(rate, isFuture),
                    border: isToday
                      ? '1.5px solid var(--accent)'
                      : isFuture || rate === null
                      ? '0.5px solid var(--border)'
                      : 'none',
                    opacity: isFuture ? 0.15 : 1,
                    boxShadow: isPerfect ? '0 0 4px var(--success-glow)' : 'none',
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-1.5">
        <span style={{ fontSize: '9px', color: 'var(--text-3)' }}>
          {activeDays} active &middot; {perfectDays} perfect
        </span>
      </div>
    </div>
  );
}
