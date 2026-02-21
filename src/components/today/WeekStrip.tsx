'use client';
import React from 'react';
import { format, subDays } from 'date-fns';
import { motion } from 'motion/react';

interface WeekStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  completionMap?: Map<string, { completed: number; total: number }>;
}

/** Tiny SVG ring to show per-day completion progress */
function MiniRing({ ratio, perfect, selected }: { ratio: number; perfect: boolean; selected: boolean }) {
  const r = 3;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - ratio);

  if (ratio === 0) {
    return (
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          backgroundColor: selected ? 'rgba(255,255,255,0.35)' : 'var(--border)',
          flexShrink: 0,
          display: 'block',
        }}
      />
    );
  }

  return (
    <svg width={10} height={10} viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
      <circle
        cx="5" cy="5" r={r}
        fill="none"
        stroke={selected ? 'rgba(255,255,255,0.2)' : 'var(--border)'}
        strokeWidth="1.5"
      />
      <circle
        cx="5" cy="5" r={r}
        fill="none"
        stroke={selected ? 'rgba(255,255,255,0.8)' : perfect ? 'var(--success)' : 'var(--accent)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 5 5)"
        style={{ transition: 'stroke-dashoffset 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
      {perfect && !selected && (
        <circle cx="5" cy="5" r="1" fill="var(--success)" />
      )}
    </svg>
  );
}

export function WeekStrip({ selectedDate, onSelectDate, completionMap }: WeekStripProps) {
  const today    = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));

  return (
    <div className="mb-2">
      <div className="flex justify-between gap-1">
        {days.map((day) => {
          const dateStr    = format(day, 'yyyy-MM-dd');
          const isToday    = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          const progress   = completionMap?.get(dateStr);
          const hasDot     = !!progress && progress.total > 0;
          const isPerfect  = hasDot && progress!.completed >= progress!.total;
          const ratio      = hasDot ? progress!.completed / progress!.total : 0;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className="flex-1 flex flex-col items-center justify-between"
              style={{
                paddingTop: '8px',
                paddingBottom: '8px',
                minWidth: 0,
                height: '58px',
                borderRadius: '14px',
                backgroundColor: isSelected
                  ? 'var(--accent)'
                  : isToday
                  ? 'var(--accent-2)'
                  : 'transparent',
                transition: 'background-color 0.2s ease',
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
                className="tabular"
                style={{
                  fontSize: '17px',
                  fontWeight: isSelected || isToday ? 700 : 400,
                  lineHeight: 1,
                  color: isSelected ? 'white' : isToday ? 'var(--accent)' : 'var(--text)',
                }}
              >
                {day.getDate()}
              </span>

              <MiniRing ratio={ratio} perfect={isPerfect} selected={isSelected} />
            </button>
          );
        })}
      </div>

      {selectedDate !== todayStr && (
        <motion.div
          className="flex justify-center mt-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <button
            onClick={() => onSelectDate(todayStr)}
            className="px-3.5 py-1 rounded-full text-[11px] font-semibold active:scale-95 transition-transform"
            style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-2)' }}
          >
            Today
          </button>
        </motion.div>
      )}
    </div>
  );
}
