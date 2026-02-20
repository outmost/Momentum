'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, TrendingUp } from 'lucide-react';
import { BinaryEntry } from '@/components/entries/BinaryEntry';
import { NumericEntry } from '@/components/entries/NumericEntry';
import { TimerEntry } from '@/components/entries/TimerEntry';
import { EntryNoteModal } from '@/components/entries/EntryNoteModal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { upsertEntry } from '@/hooks/useEntries';
import { useMilestones, toggleMilestone } from '@/hooks/useMilestones';
import { updateGoal } from '@/hooks/useGoals';
import { cn } from '@/lib/cn';
import type { Goal, Entry } from '@/types';

interface GoalCardProps {
  goal: Goal;
  entry?: Entry;
  date: string;
  isBackdated?: boolean;
  isFuture?: boolean;
  isLast?: boolean;
}

/** Round a number up to the nearest "nice" increment for clean stretch targets. */
function niceStretchTarget(original: number, exceeded: number): number {
  // 25 % above original target, rounded to a contextually clean number
  const raw = Math.max(original * 1.25, exceeded * 1.1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)) - 1);
  const step = magnitude >= 5 ? magnitude : magnitude * 5;
  return Math.ceil(raw / step) * step;
}

export function GoalCard({ goal, entry, date, isBackdated, isFuture, isLast }: GoalCardProps) {
  const router = useRouter();
  const milestones = useMilestones(goal.id);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [stretchDismissed, setStretchDismissed] = useState(false);

  const color = goal.color || '#16A34A';
  const completed = entry?.completed ?? false;
  const value = entry?.value ?? 0;

  async function handleBinaryChange(done: boolean) {
    if (isFuture) return;
    await upsertEntry(goal.id, date, { completed: done });
  }

  async function handleNumericChange(val: number) {
    if (isFuture) return;
    const isCompleted = goal.target ? val >= goal.target : val > 0;
    await upsertEntry(goal.id, date, { value: val, completed: isCompleted });
  }

  async function handleTimerChange(seconds: number) {
    if (isFuture) return;
    const isCompleted = goal.duration ? seconds >= goal.duration : seconds > 0;
    await upsertEntry(goal.id, date, { value: seconds, completed: isCompleted });
  }

  async function handleNoteSave(note: string) {
    await upsertEntry(goal.id, date, { note, completed: entry?.completed ?? false });
  }

  async function handleMilestoneToggle(milestoneId: string) {
    if (isFuture) return;
    await toggleMilestone(milestoneId);
    const all = milestones ?? [];
    const completedCount = all.filter(m => m.id === milestoneId ? !m.isCompleted : m.isCompleted).length;
    await upsertEntry(goal.id, date, { completed: completedCount === all.length, value: completedCount });
  }

  const completedMilestones = milestones?.filter(m => m.isCompleted).length ?? 0;
  const totalMilestones = milestones?.length ?? 0;
  const milestoneProgress = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const hasBinaryCheck = goal.type === 'binary' || goal.type === 'milestone';

  // Stretch-goal suggestion: surfaces automatically when a numeric goal exceeds its target.
  const showStretchBanner =
    !isFuture &&
    !stretchDismissed &&
    goal.type === 'numeric' &&
    goal.target !== undefined &&
    value > goal.target;
  const stretchTarget = goal.target !== undefined
    ? niceStretchTarget(goal.target, value)
    : 0;

  async function handleAcceptStretch() {
    await updateGoal(goal.id, { target: stretchTarget });
    setStretchDismissed(true);
  }

  // Left accent bar communicates progress state at a glance:
  //  · done        → goal color, full opacity
  //  · in progress → goal color, 45% opacity
  //  · not started → var(--border) (hairline, barely visible)
  const hasProgress = value > 0 || completed;
  const accentOpacity = completed ? 1 : hasProgress ? 0.45 : 0.2;

  return (
    <>
      <div
        className={cn('relative', isFuture && 'opacity-40 pointer-events-none')}
        style={{ borderBottom: isLast && !showStretchBanner ? 'none' : '1px solid var(--border)' }}
      >
        {/* Left color accent — state-aware */}
        <div
          className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r transition-all duration-300"
          style={{ backgroundColor: color, opacity: accentOpacity }}
        />

        <div className="flex items-start pl-5 pr-3 py-3.5 gap-2">
          {/* Checkbox for binary / milestone */}
          {hasBinaryCheck && (
            <BinaryEntry
              completed={completed}
              onChange={goal.type === 'binary' ? handleBinaryChange : () => {}}
              color={color}
            />
          )}

          {/* Content */}
          <div className={cn('flex-1 min-w-0', hasBinaryCheck ? 'mt-[1px]' : '')}>
            <div className="flex items-baseline gap-2 flex-wrap">
              <button
                onClick={() => router.push(`/goals/${goal.id}`)}
                className="text-sm font-medium text-left leading-snug transition-colors"
                style={{
                  color: completed ? 'var(--text-3)' : 'var(--text)',
                  textDecoration: completed ? 'line-through' : 'none',
                }}
              >
                {goal.title}
              </button>
              {isBackdated && (
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                  backdated
                </span>
              )}
            </div>

            {/* Type-specific controls */}
            {goal.type === 'numeric' && (
              <NumericEntry
                value={value}
                target={goal.target ?? 0}
                unit={goal.unit}
                onChange={handleNumericChange}
                color={color}
              />
            )}
            {goal.type === 'timer' && (
              <TimerEntry
                goalId={goal.id}
                value={value}
                target={goal.duration ?? 0}
                onChange={handleTimerChange}
                color={color}
              />
            )}
            {goal.type === 'milestone' && (
              <div className="mt-1.5">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs transition-colors"
                  style={{ color: 'var(--text-3)' }}
                >
                  {completedMilestones}/{totalMilestones} steps
                </button>
                <ProgressBar value={milestoneProgress} size="sm" color={color} className="mt-1 max-w-[120px]" />
                {expanded && (
                  <div className="mt-2.5 space-y-2">
                    {milestones?.map(m => (
                      <label key={m.id} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={m.isCompleted}
                          onChange={() => handleMilestoneToggle(m.id)}
                          disabled={isFuture}
                          className="w-3.5 h-3.5 rounded"
                          style={{ accentColor: color }}
                        />
                        <span
                          className="text-xs"
                          style={{
                            color: m.isCompleted ? 'var(--text-3)' : 'var(--text-2)',
                            textDecoration: m.isCompleted ? 'line-through' : 'none',
                          }}
                        >
                          {m.title}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Note button */}
          {!isFuture && (
            <button
              onClick={() => setNoteModalOpen(true)}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded transition-colors mt-0.5"
              style={{ color: entry?.note ? 'var(--accent)' : 'var(--text-3)' }}
              title="Note"
            >
              <MessageSquare size={13} />
            </button>
          )}
        </div>

        {/* ── Stretch-goal banner ──────────────────────────────────────────────
            Surfaces automatically when a numeric goal's value exceeds its target.
            Offers a one-tap raise to the next clean milestone (OKR "stretch").   */}
        {showStretchBanner && (
          <div
            className="flex items-center gap-2 px-5 py-2"
            style={{
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
            }}
          >
            <TrendingUp size={11} style={{ color, flexShrink: 0 }} />
            <span className="text-[11px] flex-1" style={{ color: 'var(--text-2)' }}>
              Target exceeded — push to{' '}
              <strong style={{ color: 'var(--text)' }}>
                {stretchTarget}{goal.unit ? ` ${goal.unit}` : ''}
              </strong>
              ?
            </span>
            <button
              onClick={handleAcceptStretch}
              className="text-[11px] font-semibold px-2 py-0.5 rounded transition-colors"
              style={{ color: 'white', backgroundColor: color }}
            >
              Stretch
            </button>
            <button
              onClick={() => setStretchDismissed(true)}
              className="text-[11px] px-1 transition-colors"
              style={{ color: 'var(--text-3)' }}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}
      </div>

      <EntryNoteModal
        open={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        onSave={handleNoteSave}
        initialNote={entry?.note}
        goalTitle={goal.title}
      />
    </>
  );
}
