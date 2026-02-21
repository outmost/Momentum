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

const MOMENTUM_MESSAGES = {
  zero:     ['Ready when you are.', 'Every legend starts somewhere.', "Today's the day. Go."],
  starting: ["You're moving. Keep going.", 'First one down — momentum is building.', 'The hardest step is the first.'],
  building: ["You're in it now.", 'Consistency compounds.', 'Each one matters.'],
  halfway:  ['Over halfway. Finish strong.', 'More done than left.', 'The momentum is real.'],
  almost:   ["Almost. Don't stop.", 'So close. One more.', 'Push through.'],
  done:     ['You showed up. That\'s everything.', 'Perfect day. No excuses needed.', 'All done — you earned this.', '100%. Pure momentum.'],
};

function getMomentumMessage(completed: number, total: number, allDone: boolean): string {
  if (total === 0) return '';
  if (allDone) {
    const msgs = MOMENTUM_MESSAGES.done;
    return msgs[Math.floor(Date.now() / 10000) % msgs.length];
  }
  const pct = completed / total;
  const pick = (arr: string[]) => arr[Math.floor(Date.now() / 10000) % arr.length];
  if (pct === 0)    return pick(MOMENTUM_MESSAGES.zero);
  if (pct < 0.25)  return pick(MOMENTUM_MESSAGES.starting);
  if (pct < 0.5)   return pick(MOMENTUM_MESSAGES.building);
  if (pct < 0.75)  return pick(MOMENTUM_MESSAGES.halfway);
  return pick(MOMENTUM_MESSAGES.almost);
}

export default function TodayPage() {
  const { selectedDate, setSelectedDate } = useUIStore();
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const goals = useActiveGoals();
  const entries = useEntriesForDate(selectedDate);
  const settings = useSettings();
  const routineBlocks = useRoutineBlocks();

  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const wasAllDone = useRef(false);
  const hasSeenIncomplete = useRef(false);
  const [momentumMsg, setMomentumMsg] = useState('');

  const weekStartsOn = settings?.weekStartsOn ?? 0;
  const { rangeStart, rangeEnd } = useMemo(() => {
    const sel = parseISO(selectedDate);
    const ws = startOfWeek(sel, { weekStartsOn });
    return {
      rangeStart: format(subDays(ws, 7), 'yyyy-MM-dd'),
      rangeEnd:   format(addDays(ws, 13), 'yyyy-MM-dd'),
    };
  }, [selectedDate, weekStartsOn]);
  const completionMap = useDateRangeProgress(rangeStart, rangeEnd);

  useEffect(() => {
    initializeSettings();
    seedDefaultRoutineBlocks();
  }, []);

  const today = localToday();
  const isSelectedToday  = selectedDate === today;
  const isSelectedFuture = selectedDate > today;

  const scheduledGoals = (goals ?? [])
    .filter(g => isScheduledForDate(selectedDate, g.frequency, g.customDays))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const entryMap = new Map((entries ?? []).map(e => [e.goalId, e]));

  const blocks    = routineBlocks ?? [];
  const grouped   = new Map<string, Goal[]>();
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
  const pct     = scheduledGoals.length > 0 ? completedCount / scheduledGoals.length : 0;
  const circumference = 2 * Math.PI * 16;

  useEffect(() => {
    setMomentumMsg(getMomentumMessage(completedCount, scheduledGoals.length, allDone));
  }, [completedCount, scheduledGoals.length, allDone]);

  useEffect(() => {
    if (!allDone) hasSeenIncomplete.current = true;
    if (allDone && hasSeenIncomplete.current && !wasAllDone.current && scheduledGoals.length > 0) {
      setShowConfetti(true);
      setShowCelebration(true);
      setTimeout(() => setShowConfetti(false), 3500);
      setTimeout(() => setShowCelebration(false), 5500);
    }
    wasAllDone.current = allDone;
  }, [allDone, scheduledGoals.length]);

  let staggerIndex = 0;

  return (
    <div>
      <Confetti active={showConfetti} count={60} />
      <AllDoneCelebration active={showCelebration} message={momentumMsg} />

      {/* ── Header ── */}
      <motion.div
        className="mb-4"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="page-title">
          {isSelectedToday
            ? format(new Date(), 'EEEE')
            : format(parseISO(selectedDate), 'EEEE')}
        </h1>
        <p
          className="mt-1 text-xs font-medium"
          style={{ color: 'var(--text-3)' }}
        >
          {isSelectedToday
            ? format(new Date(), 'MMMM d') + ' · Today'
            : format(parseISO(selectedDate), 'MMMM d')}
        </p>
      </motion.div>

      {/* ── Week strip ── */}
      <WeekStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        weekStartsOn={weekStartsOn}
        completionMap={completionMap}
      />

      {/* ── Progress row ── */}
      {scheduledGoals.length > 0 && (
        <motion.div
          className="flex items-center gap-4 mb-7 px-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          {/* Progress ring */}
          <div className="relative w-[52px] h-[52px] shrink-0">
            <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
              <circle
                cx="20" cy="20" r="16"
                fill="none"
                strokeWidth="3"
                style={{ stroke: 'var(--border)' }}
              />
              <motion.circle
                cx="20" cy="20" r="16"
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset: circumference * (1 - pct) }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  strokeDashoffset: circumference,
                  stroke: completedCount > 0 ? 'var(--success)' : 'var(--border-2)',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                key={completedCount}
                className="tabular"
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: allDone ? 'var(--success)' : 'var(--text)',
                }}
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
                className="text-[15px] font-semibold leading-snug"
                style={{ color: allDone ? 'var(--success)' : 'var(--text)' }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22 }}
              >
                {momentumMsg}
              </motion.p>
            </AnimatePresence>

            {completedCount > 0 && !allDone && (
              <span
                className="animate-streak-flame inline-block text-sm mt-0.5"
                style={{ transformOrigin: 'bottom center' }}
              >
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

      {/* ── Goal list ── */}
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
              <p
                className="text-[15px] font-semibold mb-1.5"
                style={{ color: 'var(--text)' }}
              >
                Start your first habit
              </p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>
                Small, repeated actions build momentum.
              </p>
              <button
                onClick={() => setGoalFormOpen(true)}
                className="btn btn-primary btn-lg"
                style={{ boxShadow: '0 4px 14px var(--glow)' }}
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
            const blockDone      = blockCompleted === blockGoals.length;
            const blockStartIdx  = staggerIndex;
            staggerIndex += blockGoals.length;

            return (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: blockStartIdx * 0.04, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Block label */}
                <div className="flex items-center gap-2 mb-2.5 px-1">
                  <span className="text-sm">{block.emoji}</span>
                  <h2
                    className="section-label transition-colors duration-300"
                    style={{ color: blockDone ? 'var(--success)' : undefined }}
                  >
                    {block.name}
                  </h2>
                  {blockDone && (
                    <motion.span
                      style={{ fontSize: '10px', fontWeight: 600, color: 'var(--success)' }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      ✓
                    </motion.span>
                  )}
                </div>

                <div
                  className="card-overflow transition-shadow duration-500"
                  style={{
                    boxShadow: blockDone
                      ? '0 0 0 1px color-mix(in srgb, var(--success) 20%, transparent), var(--shadow-sm)'
                      : undefined,
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
                      animationDelay={(blockStartIdx + i) * 40}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}

          {/* Ungrouped / Anytime */}
          {ungrouped.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: staggerIndex * 0.04, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              {blocks.length > 0 && grouped.size > 0 && (
                <div className="flex items-center gap-2 mb-2.5 px-1">
                  <h2 className="section-label">Anytime</h2>
                </div>
              )}

              <div className="card-overflow">
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

      {/* ── FAB ── */}
      {!isSelectedFuture && (
        <motion.button
          onClick={() => setGoalFormOpen(true)}
          className="fab fixed right-4 md:right-6 w-[52px] h-[52px] rounded-full flex items-center justify-center z-30 text-white"
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
