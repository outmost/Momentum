'use client';
import React, { useRef, useEffect } from 'react';
import { format, addDays, subDays, parseISO, startOfWeek, isSameDay } from 'date-fns';

interface WeekStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  weekStartsOn?: 0 | 1;
}

const DAY_LABELS_SUN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_LABELS_MON = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function WeekStrip({ selectedDate, onSelectDate, weekStartsOn = 0 }: WeekStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLButtonElement>(null);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const selected = parseISO(selectedDate);

  // Show 3 weeks: previous, current, next — enough for easy navigation
  const currentWeekStart = startOfWeek(selected, { weekStartsOn });
  const rangeStart = subDays(currentWeekStart, 7);
  const days: Date[] = [];
  for (let i = 0; i < 21; i++) {
    days.push(addDays(rangeStart, i));
  }

  const dayLabels = weekStartsOn === 1 ? DAY_LABELS_MON : DAY_LABELS_SUN;

  // Scroll to center the selected date on mount / change
  useEffect(() => {
    if (todayRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = todayRef.current;
      const scrollLeft = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [selectedDate]);

  return (
    <div className="mb-6">
      {/* Day-of-week labels */}
      <div className="flex justify-between px-1 mb-1.5">
        {dayLabels.map((label, i) => (
          <span
            key={i}
            className="w-10 text-center text-[10px] font-medium"
            style={{ color: 'var(--text-3)' }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Scrollable date strip */}
      <div
        ref={scrollRef}
        className="flex gap-0 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {/* Each "page" is one week (7 days) */}
        {[0, 1, 2].map(weekIdx => (
          <div
            key={weekIdx}
            className="flex shrink-0 w-full justify-between px-1 snap-center"
          >
            {days.slice(weekIdx * 7, weekIdx * 7 + 7).map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isToday = isSameDay(day, today);
              const isSelected = dateStr === selectedDate;
              const isFuture = dateStr > todayStr;
              const dayNum = day.getDate();

              return (
                <button
                  key={dateStr}
                  ref={isSelected ? todayRef : undefined}
                  onClick={() => !isFuture && onSelectDate(dateStr)}
                  disabled={isFuture}
                  className="flex flex-col items-center justify-center w-10 h-10 rounded-full transition-all"
                  style={{
                    backgroundColor: isSelected
                      ? 'var(--accent)'
                      : isToday
                      ? 'var(--accent-2)'
                      : 'transparent',
                    color: isSelected
                      ? 'white'
                      : isFuture
                      ? 'var(--border-2)'
                      : isToday
                      ? 'var(--accent)'
                      : 'var(--text)',
                    fontWeight: isSelected || isToday ? 600 : 400,
                    opacity: isFuture ? 0.4 : 1,
                  }}
                >
                  <span className="text-sm leading-none tabular">{dayNum}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Quick "Today" pill when not viewing today */}
      {selectedDate !== todayStr && (
        <div className="flex justify-center mt-2">
          <button
            onClick={() => onSelectDate(todayStr)}
            className="px-3 py-1 rounded-full text-[11px] font-semibold transition-colors"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
}
