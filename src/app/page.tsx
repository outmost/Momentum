'use client';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { format, parseISO, subDays, addDays, startOfWeek } from 'date-fns';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/lib/store';
import { useActiveGoals } from '@/hooks/useGoals';
import { useEntriesForDate } from '@/hooks/useEntries';
import { useSettings } from '@/hooks/useSettings';
import { useRoutineBlocks } from '@/hooks/useRoutine';
import { useDateRangeProgress } from '@/hooks/useStats';
import { seedDefaultRoutineBlocks } from '@/hooks/useRoutine';
import { initializeSettings } from '@/lib/db';
import { isScheduledForDate } from '@/lib/utils';
import { GoalCard } from '@/components/goals/GoalCard';
import { WeekStrip } from '@/components/today/WeekStrip';
import { Modal } from '@/components/ui/Modal';
import { GoalForm } from '@/components/goals/GoalForm';
import { Confetti } from '@/components/ui/Confetti';
import type { Goal } from '@/types';

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const MOMENTUM_MESSAGES = {
  zero:     ['Ready when you are.', 'Today is full of possibility.', 'Your future self is watching.'],
  starting: ['You\'re moving. Keep going.', 'First one down — keep it rolling.', 'The hardest step is the first.'],
  building: ['You\'re in it now.', 'Consistency compounds.', 'Each one makes the next easier.'],
  halfway:  ['Over halfway. Finish strong.', 'More done than left.', 'The momentum is real.'],
  almost:   ['Almost. Don\'t stop.', 'So close. One more push.', 'You\'ve come too far to stop now.'],
  done:     ['You showed up. That\'s everything.', 'Perfect day.', 'All done — you earned this.', 'Nothing left but pride.'],
};

// Seeded from date string so the message is stable for the day, not random on re-render
function seededIndex(seed: string, length: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % length;
}

function getMomentumMessage(completed: number, total: number, allDone: boolean, date: string): string {
  if (total === 0) return '';
  const bucket = allDone ? 'done'
    : completed === 0 ? 'zero'
    : completed / total < 0.25 ? 'starting'
    : completed / total < 0.5 ? 'building'
    : completed / total < 0.75 ? 'halfway'
    : 'almost';
  const msgs = MOMENTUM_MESSAGES[bucket];
  return msgs[seededIndex(`${date}-${completed}-${total}`, msgs.length)];
}

export default function TodayPage() {
  const { selectedDate, setSelectedDate } = useUIStore();
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const goals = useActiveGoals();
  const entries = useEntriesForDate(selectedDate);
  const settings = useSettings();
  const routineBlocks = useRoutineBlocks();

  const [showConfetti, setShowConfetti] = useState(false);
  // Track which dates already triggered the celebration so revisiting doesn't replay it
  const celebratedDates = useRef<Set<string>>(new Set());

  const weekStartsOn = settings?.weekStartsOn ?? 0;
  const { rangeStart, rangeEnd } = useMemo(() => {
    const sel = parseISO(selectedDate);
    const ws = startOfWeek(sel, { weekStartsOn });
    return {
      rangeStart: format(subDays(ws, 7), 'yyyy-MM-dd'),
      rangeEnd: format(addDays(ws, 13), 'yyyy-MM-dd'),
    };
  }, [selectedDate, weekStartsOn]);
  const completionMap = useDateRangeProgress(rangeStart, rangeEnd);

  useEffect(() => {
    initializeSettings();
    seedDefaultRoutineBlocks();
  }, []);

  const today = localToday();
  const isSelectedToday = selectedDate === today;
  const isSelectedFuture = selectedDate > today;

  const scheduledGoals = (goals ?? [])
    .filter(g => isScheduledForDate(selectedDate, g.frequency, g.customDays))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const entryMap = new Map((entries ?? []).map(e => [e.goalId, e]));

  const blocks = routineBlocks ?? [];
  const grouped = new Map<string, Goal[]>();
  const ungrouped: Goal[] = [];

  for (const goal of scheduledGoals) {
    if (goal.routineBlockId && blocks.some(b => b.id === goal.routineBlockId)) {
      if (!grouped.has(goal.routineBlockId)) grouped.set(goal.routineBlockId, []);
      grouped.get(goal.routineBlockId)!.push(goal);
    } else {
      ungrouped.push(goal);
    }
  }

  const completedCount = scheduledGoals.filter(g => entryMap.get(g.id)?.completed).length;
  const allDone = scheduledGoals.length > 0 && completedCount === scheduledGoals.length;
  const pct = scheduledGoals.length > 0 ? completedCount / scheduledGoals.length : 0;
  const circumference = 2 * Math.PI * 16;

  const momentumMsg = useMemo(
    () => getMomentumMessage(completedCount, scheduledGoals.length, allDone, selectedDate),
    [completedCount, scheduledGoals.length, allDone, selectedDate],
  );

  // Celebration — fires once per date, not on revisit
  useEffect(() => {
    if (allDone && scheduledGoals.length > 0 && !celebratedDates.current.has(selectedDate)) {
      celebratedDates.current.add(selectedDate);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [allDone, scheduledGoals.length, selectedDate]);

  let staggerIndex = 0;

  return (
    <div>
      <Confetti active={showConfetti} count={55} />

      {/* Header */}
      <motion.div
        className="mb-3"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1
          className="text-3xl font-bold tracking-tight leading-none"
          style={{ color: 'var(--text)' }}
        >
          {isSelectedToday
            ? format(new Date(), 'EEEE')
            : format(parseISO(selectedDate), 'EEEE')}
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--text-3)' }}>
          {isSelectedToday
            ? format(new Date(), 'MMMM d')
            : format(parseISO(selectedDate), 'MMMM d')}
        </p>
      </motion.div>

      {/* Week strip */}
      <WeekStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        weekStartsOn={weekStartsOn}
        completionMap={completionMap}
      />

      {/* Progress — ring + message */}
      {scheduledGoals.length > 0 && (
        <div className="flex items-center gap-4 mb-7 px-1">
          {/* Ring */}
          <div className="relative w-14 h-14 shrink-0">
            <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
              <circle cx="20" cy="20" r="16" fill="none" stroke="var(--border)" strokeWidth="3" />
              <motion.circle
                cx="20" cy="20" r="16"
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{
                  stroke: pct > 0 ? 'var(--success)' : 'var(--border-2)',
                  strokeDashoffset: circumference * (1 - pct),
                  filter: allDone ? 'drop-shadow(0 0 5px var(--success-glow))' : 'none',
                }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{ strokeDashoffset: circumference }}
              />
            </svg>

            {/* Counter */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                key={completedCount}
                className="text-[11px] font-bold tabular"
                style={{ color: allDone ? 'var(--success)' : 'var(--text)' }}
                initial={{ scale: 0.75, opacity: 0 }}
                animate={{ scale: allDone ? 1.1 : 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              >
                {completedCount}/{scheduledGoals.length}
              </motion.span>
            </div>
          </div>

          {/* Message */}
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.p
                key={momentumMsg}
                className="text-base font-semibold leading-snug"
                style={{ color: allDone ? 'var(--success)' : 'var(--text)' }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.22 }}
              >
                {momentumMsg}
              </motion.p>
            </AnimatePresence>
            {completedCount > 0 && !allDone && (
              <span className="animate-streak-flame inline-block text-base mt-0.5" style={{ transformOrigin: 'bottom center' }}>
                🔥
              </span>
            )}
          </div>
        </div>
      )}

      {/* Goal list */}
      {scheduledGoals.length === 0 ? (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
        >
          {goals?.length === 0 ? (
            <>
              <p className="text-4xl mb-4">🌱</p>
              <p className="text-base font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
                Start your first habit
              </p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>
                Small, repeated actions build momentum.
              </p>
              <button
                onClick={() => setGoalFormOpen(true)}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-all active:scale-95 hover:opacity-90"
                style={{ backgroundColor: 'var(--accent)', boxShadow: '0 4px 14px var(--glow)' }}
              >
                Add habit
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
                {isSelectedFuture ? 'Future date' : 'Nothing scheduled'}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
                {isSelectedFuture
                  ? 'Check-ins are only available for today and past dates.'
                  : 'No habits scheduled for this day. Enjoy the rest.'}
              </p>
            </>
          )}
        </motion.div>
      ) : (
        <div className="space-y-5">
          {blocks.map(block => {
            const blockGoals = grouped.get(block.id);
            if (!blockGoals || blockGoals.length === 0) return null;

            const blockCompleted = blockGoals.filter(g => entryMap.get(g.id)?.completed).length;
            const blockDone = blockCompleted === blockGoals.length;
            const blockStartIndex = staggerIndex;
            staggerIndex += blockGoals.length;

            return (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: blockStartIndex * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-sm">{block.emoji}</span>
                  <h2
                    className="text-[11px] font-bold uppercase tracking-widest transition-colors duration-300"
                    style={{ color: blockDone ? 'var(--success)' : 'var(--text-3)' }}
                  >
                    {block.name}
                  </h2>
                  {blockDone && (
                    <motion.span
                      className="text-[10px] font-semibold"
                      style={{ color: 'var(--success)' }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      ✓
                    </motion.span>
                  )}
                </div>

                <div
                  className="rounded-card overflow-hidden"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    boxShadow: blockDone
                      ? '0 0 0 1px color-mix(in srgb, var(--success) 20%, transparent), var(--shadow-sm)'
                      : 'var(--shadow-xs)',
                  }}
                >
                  {blockGoals.map((goal, i) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      entry={entryMap.get(goal.id)}
                      date={selectedDate}
                      isBackdated={!isSelectedToday && !isSelectedFuture}
                      isFuture={isSelectedFuture}
                      isLast={i === blockGoals.length - 1}
                      animationDelay={(blockStartIndex + i) * 40}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}

          {ungrouped.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: staggerIndex * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {blocks.length > 0 && grouped.size > 0 && (
                <div className="flex items-center gap-2 mb-2 px-1">
                  <h2
                    className="text-[11px] font-bold uppercase tracking-widest"
                    style={{ color: 'var(--text-3)' }}
                  >
                    Anytime
                  </h2>
                </div>
              )}

              <div
                className="rounded-card overflow-hidden"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                {ungrouped.map((goal, i) => {
                  const delay = staggerIndex * 40;
                  staggerIndex++;
                  return (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      entry={entryMap.get(goal.id)}
                      date={selectedDate}
                      isBackdated={!isSelectedToday && !isSelectedFuture}
                      isFuture={isSelectedFuture}
                      isLast={i === ungrouped.length - 1}
                      animationDelay={delay}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* FAB */}
      {!isSelectedFuture && (
        <motion.button
          onClick={() => setGoalFormOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-[52px] h-[52px] rounded-full flex items-center justify-center z-30 text-white"
          style={{
            backgroundColor: 'var(--accent)',
            boxShadow: '0 4px 20px var(--glow)',
          }}
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <Plus size={22} strokeWidth={2.5} />
        </motion.button>
      )}

      <Modal open={goalFormOpen} onClose={() => setGoalFormOpen(false)} title="New habit" size="md">
        <GoalForm onClose={() => setGoalFormOpen(false)} />
      </Modal>
    </div>
  );
}
