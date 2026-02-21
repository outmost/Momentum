'use client';
import React from 'react';
import { format, subDays, addDays, getDay } from 'date-fns';

function cellColor(rate: number | null, isFuture: boolean): string {
  if (isFuture || rate === null) return 'transparent';
  if (rate === 0)   return 'var(--border)';
  if (rate < 40)    return 'color-mix(in srgb, var(--accent) 15%, transparent)';
  if (rate < 70)    return 'color-mix(in srgb, var(--accent) 35%, transparent)';
  if (rate < 100)   return 'color-mix(in srgb, var(--accent) 60%, transparent)';
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
  const startDate = subDays(thisMonday, 21); // 4 weeks back

  const rateMap = new Map(data.map(d => [d.date, d.rate]));

  const grid = Array.from({ length: 4 }, (_, week) =>
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

  return (
    <div className="inline-flex flex-col gap-[2px]">
      {grid.map((week, wi) => (
        <div key={wi} className="flex gap-[2px]">
          {week.map(({ date, rate, isFuture, isToday }) => (
            <div
              key={date}
              className="rounded-[2px]"
              style={{
                width: 6,
                height: 6,
                backgroundColor: cellColor(rate, isFuture),
                border: isToday
                  ? '1px solid var(--accent)'
                  : isFuture || rate === null
                  ? '0.5px solid var(--border)'
                  : 'none',
                opacity: isFuture ? 0.15 : 1,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
