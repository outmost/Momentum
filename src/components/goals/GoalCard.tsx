'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { BinaryEntry } from '@/components/entries/BinaryEntry';
import { NumericEntry } from '@/components/entries/NumericEntry';
import { TimerEntry } from '@/components/entries/TimerEntry';
import { EntryNoteModal } from '@/components/entries/EntryNoteModal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { upsertEntry } from '@/hooks/useEntries';
import { useMilestones, toggleMilestone } from '@/hooks/useMilestones';
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

export function GoalCard({ goal, entry, date, isBackdated, isFuture, isLast }: GoalCardProps) {
  const router = useRouter();
  const milestones = useMilestones(goal.id);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

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

  return (
    <>
      {/* Flat row — no card border, just a left color accent + bottom divider */}
      <div
        className={cn('relative', isFuture && 'opacity-40 pointer-events-none')}
        style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}
      >
        {/* Left color accent line */}
        <div
          className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r"
          style={{ backgroundColor: completed ? 'var(--border)' : color }}
        />

        <div className="flex items-start pl-5 pr-3 py-3.5 gap-2">
          {/* Checkbox for binary/milestone — large tap target */}
          {hasBinaryCheck && (
            <BinaryEntry
              completed={completed}
              onChange={goal.type === 'binary' ? handleBinaryChange : () => {}}
              color={color}
            />
          )}

          {/* Content */}
          <div className={cn('flex-1 min-w-0', hasBinaryCheck ? 'mt-[1px]' : 'mt-0.5')}>
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

            {/* Controls below title */}
            {goal.type === 'numeric' && (
              <div className="mt-2">
                <NumericEntry value={value} target={goal.target ?? 0} unit={goal.unit} onChange={handleNumericChange} color={color} />
              </div>
            )}
            {goal.type === 'timer' && (
              <div className="mt-2">
                <TimerEntry goalId={goal.id} value={value} target={goal.duration ?? 0} onChange={handleTimerChange} color={color} />
              </div>
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

          {/* Note button — far right, barely visible until hovered */}
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
