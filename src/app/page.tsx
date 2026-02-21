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
import { AllDoneCelebration } from '@/components/ui/AllDoneCelebration';
import type { Goal } from '@/types';

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Momentum messages — positive, never discouraging
const MOMENTUM_MESSAGES = {
  zero: [
    'Ready when you are.',
    'Every legend starts somewhere.',
    'Today\'s the day. Go.',
  ],
  starting: [
    'You\'re moving. Keep going.',
    'First one down — momentum is building.',
    'The hardest step is the first.',
  ],
  building: [
    'You\'re in it now.',
    'Consistency compounds.',
    'Each one matters.',
  ],
  halfway: [
    'Over halfway. Finish strong.',
    'More done than left.',
    'The momentum is real.',
  ],
  almost: [
    'Almost. Don\'t stop.',
    'So close. One more.',
    'Push through.',
  ],
  done: [
    'You showed up. That\'s everything.',
    'Perfect day. No excuses needed.',
    'All done — you earned this.',
    'Legendary. Nothing left but pride.',
    '100%. Pure momentum.',
  ],
};

function getMomentumMessage(completed: number, total: number, allDone: boolean): string {
  if (total === 0) return '';
  if (allDone) {
    const msgs = MOMENTUM_MESSAGES.done;
    return msgs[Math.floor(Date.now() / 10000) % msgs.length];
  }
  const pct = completed / total;
  if (pct === 0) return MOMENTUM_MESSAGES.zero[Math.floor(Date.now() / 10000) % MOMENTUM_MESSAGES.zero.length];
  if (pct < 0.25) return MOMENTUM_MESSAGES.starting[Math.floor(Date.now() / 10000) % MOMENTUM_MESSAGES.starting.length];
  if (pct < 0.5) return MOMENTUM_MESSAGES.building[Math.floor(Date.now() / 10000) % MOMENTUM_MESSAGES.building.length];
  if (pct < 0.75) return MOMENTUM_MESSAGES.halfway[Math.floor(Date.now() / 10000) % MOMENTUM_MESSAGES.halfway.length];
  return MOMENTUM_MESSAGES.almost[Math.floor(Date.now() / 10000) % MOMENTUM_MESSAGES.almost.length];
}

export default function TodayPage() {
  const { selectedDate, setSelectedDate } = useUIStore();
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const goals = useActiveGoals();
  const entries = useEntriesForDate(selectedDate);
  const settings = useSettings();
  const routineBlocks = useRoutineBlocks();

  // Celebration state
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const wasAllDone = useRef(false);
  const [momentumMsg, setMomentumMsg] = useState('');

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

  // Group goals by routine block
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

  // Update momentum message when state changes
  useEffect(() => {
    setMomentumMsg(getMomentumMessage(completedCount, scheduledGoals.length, allDone));
  }, [completedCount, scheduledGoals.length, allDone]);

  // Trigger celebration when all goals complete
  useEffect(() => {
    if (allDone && !wasAllDone.current && scheduledGoals.length > 0) {
      setShowConfetti(true);
      setShowCelebration(true);
      setTimeout(() => setShowConfetti(false), 3500);
      setTimeout(() => setShowCelebration(false), 5500);
    }
    wasAllDone.current = allDone;
  }, [allDone, scheduledGoals.length]);

  // Track stagger index across all goal cards
  let staggerIndex = 0;

  const circumference = 2 * Math.PI * 16;

  return (
    <div>
      <Confetti active={showConfetti} count={60} />
      <AllDoneCelebration
        active={showCelebration}
        message={momentumMsg}
      />

      {/* Header — date with impact */}
      <motion.div
        className="mb-3"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1
          className="text-3xl font-bold tracking-tight leading-none"
          style={{ color: 'var(--text)' }}
        >
          {isSelectedToday
            ? format(new Date(), 'EEEE')
            : format(parseISO(selectedDate), 'EEEE')}
        </h1>
        <p className="mt-1 text-sm font-medium" style={{ color: 'var(--text-3)' }}>
          {isSelectedToday
            ? format(new Date(), 'MMMM d')
            : format(parseISO(selectedDate), 'MMMM d')}
          {isSelectedToday && (
            <span> · Today</span>
          )}
        </p>
      </motion.div>

      {/* Week strip */}
      <WeekStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        weekStartsOn={weekStartsOn}
        completionMap={completionMap}
      />

      {/* Progress section — ring + message */}
      {scheduledGoals.length > 0 && (
        <motion.div
          className="flex items-center gap-4 mb-7 px-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          {/* Ring */}
          <div className="relative w-14 h-14 shrink-0">
            <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
              {/* Track */}
              <circle
                cx="20" cy="20" r="16"
                fill="none"
                stroke="var(--border)"
                strokeWidth="3.5"
              />
              {/* Progress arc — always green, no orange */}
              <motion.circle
                cx="20" cy="20" r="16"
                fill="none"
                stroke={allDone ? 'var(--success)' : completedCount > 0 ? 'var(--success)' : 'var(--border-2)'}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{
                  strokeDashoffset: circumference * (1 - pct),
                  filter: allDone ? 'drop-shadow(0 0 6px var(--success-glow))' : 'none',
                }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                style={{ strokeDashoffset: circumference }}
              />
            </svg>
            {/* Count inside ring */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                key={completedCount}
                className="text-xs font-bold tabular"
                style={{ color: allDone ? 'var(--success)' : 'var(--text)' }}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                {completedCount}/{scheduledGoals.length}
              </motion.span>
            </div>
          </div>

          {/* Message */}
          <div>
            <AnimatePresence mode="wait">
              <motion.p
                key={momentumMsg}
                className="text-base font-semibold leading-snug"
                style={{ color: allDone ? 'var(--success)' : 'var(--text)' }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
              >
                {momentumMsg}
              </motion.p>
            </AnimatePresence>

            {/* Flame — only when making progress (not done) */}
            {completedCount > 0 && !allDone && (
              <span className="animate-streak-flame inline-block text-sm mt-0.5" style={{ transformOrigin: 'bottom center' }}>
                🔥
              </span>
            )}
            {allDone && (
              <motion.span
                className="inline-block text-sm mt-0.5"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                ✅
              </motion.span>
            )}
          </div>
        </motion.div>
      )}

      {/* Goal list */}
      {scheduledGoals.length === 0 ? (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
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
                style={{
                  backgroundColor: 'var(--accent)',
                  boxShadow: '0 4px 14px var(--glow)',
                }}
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
                  : 'Nothing on the schedule. Enjoy the rest.'}
              </p>
            </>
          )}
        </motion.div>
      ) : (
        <div className="space-y-5">
          {/* Routine-block groups */}
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
                transition={{ delay: blockStartIndex * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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
                  className="rounded-card overflow-hidden transition-shadow duration-500"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    boxShadow: blockDone
                      ? '0 0 0 1px color-mix(in srgb, var(--success) 25%, transparent), var(--shadow-sm)'
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

          {/* Ungrouped goals (anytime) */}
          {ungrouped.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: staggerIndex * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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

      {/* FAB — add habit */}
      {!isSelectedFuture && (
        <motion.button
          onClick={() => setGoalFormOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-13 h-13 w-[52px] h-[52px] rounded-full flex items-center justify-center z-30 text-white"
          style={{
            backgroundColor: 'var(--accent)',
            boxShadow: '0 4px 20px var(--glow)',
          }}
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
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
