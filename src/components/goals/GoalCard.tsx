'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  animationDelay?: number;
}

function niceStretchTarget(original: number, exceeded: number): number {
  const raw  = Math.max(original * 1.25, exceeded * 1.1);
  const mag  = Math.pow(10, Math.floor(Math.log10(raw)) - 1);
  const step = mag >= 5 ? mag : mag * 5;
  return Math.ceil(raw / step) * step;
}

export function GoalCard({ goal, entry, date, isBackdated, isFuture, isLast, animationDelay = 0 }: GoalCardProps) {
  const router = useRouter();
  const milestones = useMilestones(goal.id);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [stretchDismissed, setStretchDismissed] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const prevCompletedRef = useRef<boolean | null>(null);

  const completed = entry?.completed ?? false;
  const value     = entry?.value ?? 0;

  useEffect(() => {
    if (prevCompletedRef.current === false && completed === true) {
      setJustCompleted(true);
      const t = setTimeout(() => setJustCompleted(false), 900);
      return () => clearTimeout(t);
    }
    prevCompletedRef.current = completed;
  }, [completed]);

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
    const all   = milestones ?? [];
    const count = all.filter(m => m.id === milestoneId ? !m.isCompleted : m.isCompleted).length;
    await upsertEntry(goal.id, date, { completed: count === all.length, value: count });
  }

  const completedMilestones = milestones?.filter(m => m.isCompleted).length ?? 0;
  const totalMilestones     = milestones?.length ?? 0;
  const milestoneProgress   = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const hasBinaryCheck = goal.type === 'binary' || goal.type === 'milestone';

  const showStretchBanner =
    !isFuture && !stretchDismissed &&
    goal.type === 'numeric' && goal.target !== undefined && value > goal.target;
  const stretchTarget = goal.target !== undefined ? niceStretchTarget(goal.target, value) : 0;

  async function handleAcceptStretch() {
    await updateGoal(goal.id, { target: stretchTarget });
    setStretchDismissed(true);
  }

  const hasProgress = value > 0 || completed;

  return (
    <>
      <motion.div
        className={cn('relative', isFuture && 'opacity-40 pointer-events-none')}
        style={{
          borderBottom: isLast && !showStretchBanner ? 'none' : '1px solid var(--border)',
          animationDelay: `${animationDelay}ms`,
        }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: isFuture ? 0.4 : 1, y: 0 }}
        transition={{ delay: animationDelay / 1000, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Left colour accent bar */}
        <motion.div
          className="absolute left-0 top-4 bottom-4 rounded-r-sm"
          animate={{
            width:   completed ? 3 : hasProgress ? 2.5 : 2,
            opacity: completed ? 1 : hasProgress ? 0.65 : 0.2,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          style={{ backgroundColor: goal.color || 'var(--success)' }}
        />

        {/* Completion glow overlay */}
        <AnimatePresence>
          {justCompleted && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 0% 50%, color-mix(in srgb, var(--success) 10%, transparent), transparent 65%)`,
                zIndex: 0,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </AnimatePresence>

        <div className="flex items-start pl-5 pr-3 py-4 gap-3 relative z-[1]">
          {/* Checkbox */}
          {hasBinaryCheck && (
            <BinaryEntry
              completed={completed}
              onChange={goal.type === 'binary' ? handleBinaryChange : () => {}}
              color={goal.color || 'var(--success)'}
            />
          )}

          {/* Content */}
          <div className={cn('flex-1 min-w-0', hasBinaryCheck ? 'mt-[1px]' : '')}>
            <div className="flex items-baseline gap-2 flex-wrap">
              <button
                onClick={() => router.push(`/goals/${goal.id}`)}
                className="text-[13px] font-medium text-left leading-snug transition-colors duration-300"
                style={{ color: completed ? 'var(--text-3)' : 'var(--text)' }}
              >
                {goal.title}
              </button>
              {isBackdated && (
                <span
                  className="text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--text-3)' }}
                >
                  backdated
                </span>
              )}
            </div>

            {/* The "why" */}
            <AnimatePresence>
              {goal.why && (
                <motion.p
                  className="text-xs mt-0.5 italic"
                  style={{ color: completed ? 'var(--success)' : 'var(--text-3)' }}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {goal.why}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Type-specific controls */}
            {goal.type === 'numeric' && (
              <NumericEntry
                value={value}
                target={goal.target ?? 0}
                unit={goal.unit}
                onChange={handleNumericChange}
                color={goal.color || 'var(--success)'}
              />
            )}
            {goal.type === 'timer' && (
              <TimerEntry
                goalId={goal.id}
                value={value}
                target={goal.duration ?? 0}
                onChange={handleTimerChange}
                color={goal.color || 'var(--success)'}
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
                <ProgressBar
                  value={milestoneProgress}
                  size="sm"
                  color={goal.color || 'var(--success)'}
                  className="mt-1 max-w-[120px]"
                />
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      className="mt-2.5 space-y-2"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {milestones?.map(m => (
                        <label key={m.id} className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={m.isCompleted}
                            onChange={() => handleMilestoneToggle(m.id)}
                            disabled={isFuture}
                            className="w-3.5 h-3.5 rounded"
                            style={{ accentColor: goal.color || 'var(--success)' }}
                          />
                          <span
                            className="text-xs transition-all duration-200"
                            style={{ color: m.isCompleted ? 'var(--text-3)' : 'var(--text-2)' }}
                          >
                            {m.title}
                          </span>
                        </label>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Note button */}
          {!isFuture && (
            <button
              onClick={() => setNoteModalOpen(true)}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200 mt-0.5 hover:scale-110 active:scale-95"
              style={{ color: entry?.note ? 'var(--accent)' : 'var(--text-3)' }}
              title="Note"
            >
              <MessageSquare size={13} />
            </button>
          )}
        </div>

        {/* Stretch goal banner */}
        <AnimatePresence>
          {showStretchBanner && (
            <motion.div
              className="flex items-center gap-2.5 px-5 py-2.5"
              style={{
                borderTop: '1px solid var(--border)',
                backgroundColor: 'var(--surface-2)',
              }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <TrendingUp size={11} style={{ color: goal.color || 'var(--success)', flexShrink: 0 }} />
              <span className="text-[11px] flex-1" style={{ color: 'var(--text-2)' }}>
                Target exceeded — push to{' '}
                <strong style={{ color: 'var(--text)' }}>
                  {stretchTarget}{goal.unit ? ` ${goal.unit}` : ''}
                </strong>?
              </span>
              <button
                onClick={handleAcceptStretch}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all active:scale-95"
                style={{ color: 'white', backgroundColor: goal.color || 'var(--success)' }}
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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

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
