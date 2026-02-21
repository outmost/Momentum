'use client';
import React from 'react';
import { format, subDays } from 'date-fns';

interface WeekStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  completionMap?: Map<string, { completed: number; total: number }>;
}

export function WeekStrip({ selectedDate, onSelectDate, completionMap }: WeekStripProps) {
  const today    = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Last 7 days, oldest → newest (today on the right)
  const days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));

  return (
    <div className="mb-2">
      <div className="flex justify-between gap-1">
        {days.map(day => {
          const dateStr    = format(day, 'yyyy-MM-dd');
          const isToday    = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          const progress   = completionMap?.get(dateStr);
          const hasDot     = !!progress && progress.total > 0;
          const isPerfect  = hasDot && progress!.completed >= progress!.total;
          const hasPartial = hasDot && progress!.completed > 0 && !isPerfect;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className="flex-1 flex flex-col items-center justify-between rounded-2xl transition-colors duration-150"
              style={{
                paddingTop: '8px',
                paddingBottom: '8px',
                minWidth: 0,
                height: '58px',
                backgroundColor: isSelected
                  ? 'var(--accent)'
                  : isToday
                  ? 'var(--accent-2)'
                  : 'transparent',
              }}
            >
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 500,
                  letterSpacing: '0.03em',
                  lineHeight: 1,
                  color: isSelected ? 'rgba(255,255,255,0.65)' : 'var(--text-3)',
                }}
              >
                {format(day, 'EEEEE')}
              </span>

              <span
                style={{
                  fontSize: '17px',
                  fontWeight: isSelected || isToday ? 700 : 400,
                  lineHeight: 1,
                  color: isSelected ? 'white' : isToday ? 'var(--accent)' : 'var(--text)',
                }}
              >
                {day.getDate()}
              </span>

              <span
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  backgroundColor: isSelected
                    ? 'rgba(255,255,255,0.5)'
                    : isPerfect
                    ? 'var(--success)'
                    : hasPartial
                    ? 'var(--border-2)'
                    : 'transparent',
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Chip only when a date older than 7 days is selected */}
      {selectedDate !== todayStr && (
        <div className="flex justify-center mt-2">
          <button
            onClick={() => onSelectDate(todayStr)}
            className="px-3.5 py-1 rounded-full text-[11px] font-semibold active:scale-95"
            style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-2)' }}
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
}
