'use client';
import React, { useRef, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';

interface WeekStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  completionMap?: Map<string, { completed: number; total: number }>;
}

export function WeekStrip({ selectedDate, onSelectDate, completionMap }: WeekStripProps) {
  const scrollRef  = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const today    = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Show 42 days: 28 past + today + 13 future (future are dimmed)
  const startDate = subDays(today, 28);
  const days = Array.from({ length: 42 }, (_, i) => addDays(startDate, i));

  // Scroll selected date into view (horizontally centered)
  useEffect(() => {
    const el  = selectedRef.current;
    const box = scrollRef.current;
    if (!el || !box) return;
    const left = el.offsetLeft - box.offsetWidth / 2 + el.offsetWidth / 2;
    box.scrollTo({ left, behavior: 'smooth' });
  }, [selectedDate]);

  return (
    <div className="mb-2">
      {/* Scrollable day pills */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide"
        style={{ gap: '3px' }}
      >
        {days.map(day => {
          const dateStr   = format(day, 'yyyy-MM-dd');
          const isToday   = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const isFuture  = dateStr > todayStr;

          const progress  = completionMap?.get(dateStr);
          const hasDot    = !!progress && progress.total > 0 && !isFuture;
          const isPerfect = hasDot && progress!.completed >= progress!.total;
          const hasPartial = hasDot && progress!.completed > 0 && !isPerfect;

          return (
            <button
              key={dateStr}
              ref={isSelected ? selectedRef : undefined}
              onClick={() => !isFuture && onSelectDate(dateStr)}
              disabled={isFuture}
              className="shrink-0 flex flex-col items-center justify-between rounded-2xl transition-colors duration-150"
              style={{
                width: '40px',
                height: '58px',
                paddingTop: '8px',
                paddingBottom: '8px',
                backgroundColor: isSelected
                  ? 'var(--accent)'
                  : isToday
                  ? 'var(--accent-2)'
                  : 'transparent',
                opacity: isFuture ? 0.25 : 1,
              }}
            >
              {/* Day letter */}
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

              {/* Date number */}
              <span
                style={{
                  fontSize: '17px',
                  fontWeight: isSelected || isToday ? 700 : 400,
                  lineHeight: 1,
                  color: isSelected
                    ? 'white'
                    : isToday
                    ? 'var(--accent)'
                    : 'var(--text)',
                }}
              >
                {day.getDate()}
              </span>

              {/* Completion dot */}
              <span
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
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

      {/* Back to today chip */}
      {selectedDate !== todayStr && (
        <div className="flex justify-center mt-2">
          <button
            onClick={() => onSelectDate(todayStr)}
            className="px-3.5 py-1 rounded-full text-[11px] font-semibold transition-opacity hover:opacity-80 active:scale-95"
            style={{
              color: 'var(--accent)',
              backgroundColor: 'var(--accent-2)',
            }}
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
}
