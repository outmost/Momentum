'use client';
import React, { useRef, useEffect } from 'react';
import { format, addDays, subDays, parseISO, startOfWeek, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface WeekStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  weekStartsOn?: 0 | 1;
  completionMap?: Map<string, { completed: number; total: number }>;
}

const DAY_LABELS_SUN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_LABELS_MON = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function WeekStrip({ selectedDate, onSelectDate, weekStartsOn = 0, completionMap }: WeekStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const selected = parseISO(selectedDate);

  const currentWeekStart = startOfWeek(selected, { weekStartsOn });
  const rangeStart = subDays(currentWeekStart, 7);
  const days: Date[] = [];
  for (let i = 0; i < 21; i++) {
    days.push(addDays(rangeStart, i));
  }

  const dayLabels = weekStartsOn === 1 ? DAY_LABELS_MON : DAY_LABELS_SUN;

  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = selectedRef.current;
      const scrollLeft = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [selectedDate]);

  return (
    <div className="mb-6">
      {/* Day-of-week labels */}
      <div className="flex justify-between px-1 mb-1">
        {dayLabels.map((label, i) => (
          <span
            key={i}
            className="w-10 text-center"
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-3)',
            }}
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

              const progress = completionMap?.get(dateStr);
              const hasDot = progress && progress.total > 0 && !isFuture;
              const dotPct = progress ? progress.completed / progress.total : 0;
              const isPerfectDay = dotPct >= 1 && hasDot;

              return (
                <button
                  key={dateStr}
                  ref={isSelected ? selectedRef : undefined}
                  onClick={() => !isFuture && onSelectDate(dateStr)}
                  disabled={isFuture}
                  className="relative flex flex-col items-center justify-center w-10 h-12 rounded-full transition-opacity duration-150"
                  style={{ opacity: isFuture ? 0.28 : 1 }}
                >
                  {/* Today ring (not selected) */}
                  {isToday && !isSelected && (
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{
                        border: '1.5px solid var(--accent)',
                        opacity: 0.4,
                      }}
                    />
                  )}

                  {/* Selected background */}
                  {isSelected && (
                    <motion.span
                      layoutId="week-selected"
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: 'var(--accent)' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}

                  <span
                    className="relative z-10 leading-none tabular"
                    style={{
                      fontSize: '13px',
                      fontWeight: isSelected || isToday ? 700 : 400,
                      color: isSelected
                        ? 'white'
                        : isToday
                        ? 'var(--accent)'
                        : 'var(--text)',
                    }}
                  >
                    {dayNum}
                  </span>

                  {/* Completion dot */}
                  <span className="relative z-10 flex items-center justify-center w-[6px] h-[6px] mt-[3px]">
                    {hasDot ? (
                      <motion.span
                        className="w-[4px] h-[4px] rounded-full"
                        style={{
                          backgroundColor: isSelected
                            ? 'rgba(255,255,255,0.7)'
                            : isPerfectDay
                            ? 'var(--success)'
                            : 'color-mix(in srgb, var(--success) 55%, transparent)',
                          boxShadow: isPerfectDay && !isSelected
                            ? '0 0 4px var(--success-glow)'
                            : 'none',
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Back to today */}
      <AnimatePresence>
        {selectedDate !== todayStr && (
          <motion.div
            className="flex justify-center mt-2.5"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <button
              onClick={() => onSelectDate(todayStr)}
              className="px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95 hover:opacity-90"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'white',
                boxShadow: '0 2px 10px var(--glow)',
              }}
            >
              Back to today
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
