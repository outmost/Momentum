'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAllGoalStats } from '@/hooks/useStats';

const GOAL_DAYS = 66;
const MILESTONES = [21, 44, 66] as const;

interface MiniRingProps {
  progress: number;     // 0–66
  color: string;
  size?: number;
}

function MiniRing({ progress, color, size = 36 }: MiniRingProps) {
  const pct = Math.min(progress, GOAL_DAYS) / GOAL_DAYS;
  const r = (size / 2) - 4;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * pct;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--border)" strokeWidth="3" />
      <circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
    </svg>
  );
}

export function HabitFormationCard() {
  const router   = useRouter();
  const allStats = useAllGoalStats();

  if (!allStats || allStats.length === 0) return null;

  // Sort by 66-day progress descending so closest to the goal are first
  const sorted = [...allStats].sort((a, b) => b.totalCompletions - a.totalCompletions);

  return (
    <div className="card-overflow animate-stagger-in" style={{ animationDelay: '350ms' }}>
      <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="section-label">66-day journey</p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
          It takes 66 days to form a habit. Here&apos;s how each is going.
        </p>
      </div>

      {sorted.map(({ goal, totalCompletions }, i) => {
        const capped      = Math.min(totalCompletions, GOAL_DAYS);
        const pct         = Math.round((capped / GOAL_DAYS) * 100);
        const accentColor = goal.color || 'var(--accent)';
        const formed      = totalCompletions >= GOAL_DAYS;
        const nextMilestone = MILESTONES.find(m => totalCompletions < m) ?? GOAL_DAYS;

        return (
          <button
            key={goal.id}
            onClick={() => router.push(`/goals/${goal.id}`)}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[var(--surface-2)] animate-stagger-in"
            style={{
              borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none',
              animationDelay: `${400 + i * 50}ms`,
            }}
          >
            {/* Mini ring */}
            <div className="relative shrink-0 flex items-center justify-center" style={{ width: 36, height: 36 }}>
              <MiniRing progress={capped} color={accentColor} size={36} />
              <span
                className="absolute text-[9px] font-bold tabular"
                style={{
                  color: formed ? accentColor : 'var(--text-3)',
                  // counter the -90deg rotation of the SVG parent so text stays upright
                }}
              >
                {formed ? '✓' : pct + '%'}
              </span>
            </div>

            {/* Title + sub */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate" style={{ color: 'var(--text)' }}>
                {goal.title}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                {formed
                  ? 'Habit formed 🎉'
                  : `${GOAL_DAYS - capped} days to go · next milestone: day ${nextMilestone}`}
              </p>
            </div>

            {/* Inline milestone pips */}
            <div className="flex items-center gap-1 shrink-0">
              {MILESTONES.map(m => {
                const reached = totalCompletions >= m;
                return (
                  <span
                    key={m}
                    className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: reached ? accentColor : 'var(--border)',
                      boxShadow: reached ? `0 0 4px ${accentColor}40` : 'none',
                    }}
                    title={`Day ${m}`}
                  />
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}
