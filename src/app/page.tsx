'use client';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { format, parseISO, subDays, addDays, startOfWeek } from 'date-fns';
import { Plus } from 'lucide-react';
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

// Momentum messages that build positive psychology
const MOMENTUM_MESSAGES = {
  zero: [
    'Every journey starts with one step',
    'Today is full of possibility',
    'Your future self will thank you',
  ],
  starting: [
    "You're getting started",
    'First one down — keep it rolling',
    'The hardest part is starting. Done.',
  ],
  building: [
    'Building momentum',
    "You're in the zone",
    'Consistency is your superpower',
  ],
  halfway: [
    'Over halfway there',
    'More done than left — finish strong',
    'The momentum is real',
  ],
  almost: [
    'Almost there, keep going',
    'So close you can taste it',
    'One more push',
  ],
  done: [
    'You crushed it today',
    'Perfect day. Legendary.',
    'All done — you earned this',
    'Nothing left but pride',
    '100%. Pure momentum.',
  ],
};

function getMomentumMessage(completed: number, total: number, allDone: boolean): string {
  if (total === 0) return '';
  if (allDone) {
    const msgs = MOMENTUM_MESSAGES.done;
    return msgs[Math.floor(Math.random() * msgs.length)];
  }
  const pct = completed / total;
  if (pct === 0) {
    const msgs = MOMENTUM_MESSAGES.zero;
    return msgs[Math.floor(Math.random() * msgs.length)];
  }
  if (pct < 0.25) {
    const msgs = MOMENTUM_MESSAGES.starting;
    return msgs[Math.floor(Math.random() * msgs.length)];
  }
  if (pct < 0.5) {
    const msgs = MOMENTUM_MESSAGES.building;
    return msgs[Math.floor(Math.random() * msgs.length)];
  }
  if (pct < 0.75) {
    const msgs = MOMENTUM_MESSAGES.halfway;
    return msgs[Math.floor(Math.random() * msgs.length)];
  }
  const msgs = MOMENTUM_MESSAGES.almost;
  return msgs[Math.floor(Math.random() * msgs.length)];
}

// Pick a random celebration emoji
function getCelebrationEmoji(): string {
  const emojis = ['🎉', '🔥', '⚡', '🚀', '💪', '✨', '🏆', '👑', '🎯', '💫'];
  return emojis[Math.floor(Math.random() * emojis.length)];
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
  const [celebrationEmoji, setCelebrationEmoji] = useState('');
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

  // Update momentum message
  useEffect(() => {
    setMomentumMsg(getMomentumMessage(completedCount, scheduledGoals.length, allDone));
  }, [completedCount, scheduledGoals.length, allDone]);

  // Trigger celebration when all goals are completed
  useEffect(() => {
    if (allDone && !wasAllDone.current && scheduledGoals.length > 0) {
      setCelebrationEmoji(getCelebrationEmoji());
      setShowConfetti(true);
      setShowCelebration(true);
      setTimeout(() => setShowConfetti(false), 3000);
      setTimeout(() => setShowCelebration(false), 4000);
    }
    wasAllDone.current = allDone;
  }, [allDone, scheduledGoals.length]);

  // Track stagger index across all goal cards
  let staggerIndex = 0;

  return (
    <div>
      <Confetti active={showConfetti} count={50} />

      {/* Header */}
      <div className="mb-2 animate-in">
        <h1
          className="text-2xl font-semibold tracking-tight leading-none"
          style={{ color: 'var(--text)' }}
        >
          {isSelectedToday
            ? format(new Date(), 'EEEE')
            : format(parseISO(selectedDate), 'EEEE')}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-3)' }}>
          {isSelectedToday
            ? format(new Date(), 'MMMM d')
            : format(parseISO(selectedDate), 'MMMM d')}
        </p>
      </div>

      {/* Week strip */}
      <WeekStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        weekStartsOn={weekStartsOn}
        completionMap={completionMap}
      />

      {/* Progress ring + momentum message */}
      {scheduledGoals.length > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <div className={`relative w-11 h-11 shrink-0 ${allDone ? 'animate-all-done-ring' : ''}`}>
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle
                cx="18" cy="18" r="15.5"
                fill="none"
                stroke="var(--border)"
                strokeWidth="3"
              />
              <circle
                cx="18" cy="18" r="15.5"
                fill="none"
                stroke={allDone ? 'var(--success)' : 'var(--accent)'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(completedCount / scheduledGoals.length) * 97.4} 97.4`}
                className="transition-all duration-700 ease-out"
                style={{
                  filter: allDone ? `drop-shadow(0 0 4px var(--success))` : 'none',
                }}
              />
            </svg>
            <span
              className={`absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular transition-all duration-300 ${
                allDone ? 'scale-110' : ''
              }`}
              style={{ color: allDone ? 'var(--success)' : 'var(--text)' }}
            >
              {completedCount}/{scheduledGoals.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <p
              className="text-sm font-medium transition-all duration-300"
              style={{ color: allDone ? 'var(--success)' : 'var(--text-2)' }}
            >
              {momentumMsg}
            </p>

            {/* Streak flame — shown when making progress */}
            {completedCount > 0 && completedCount < scheduledGoals.length && (
              <span className="animate-streak-flame inline-block text-sm" style={{ transformOrigin: 'bottom center' }}>
                🔥
              </span>
            )}
          </div>
        </div>
      )}

      {/* All-done celebration overlay */}
      {showCelebration && allDone && (
        <div className="flex items-center justify-center mb-6 animate-celebration-burst">
          <div
            className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--success) 8%, var(--surface))',
              border: '1px solid color-mix(in srgb, var(--success) 20%, var(--border))',
            }}
          >
            <span className="text-3xl animate-float-up">{celebrationEmoji}</span>
            <p className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
              All habits complete!
            </p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              Consistency is the compound interest of self-improvement
            </p>
          </div>
        </div>
      )}

      {/* Goal list */}
      {scheduledGoals.length === 0 ? (
        <div className="text-center py-16 animate-in">
          {goals?.length === 0 ? (
            <>
              <p className="text-4xl mb-4">🌱</p>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Start your first habit</p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>Small steps build big momentum.</p>
              <button
                onClick={() => setGoalFormOpen(true)}
                className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-all active:scale-95"
                style={{ backgroundColor: 'var(--accent)' }}
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
                  : 'No habits scheduled for this day. Enjoy the downtime.'}
              </p>
            </>
          )}
        </div>
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
              <div key={block.id} className="animate-in">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-sm">{block.emoji}</span>
                  <h2
                    className="text-[11px] font-semibold uppercase tracking-widest transition-colors duration-300"
                    style={{ color: blockDone ? 'var(--success)' : 'var(--text-3)' }}
                  >
                    {block.name}
                  </h2>
                  {blockDone && (
                    <span
                      className="text-[10px] font-medium animate-check-pop"
                      style={{ color: 'var(--success)' }}
                    >
                      done ✓
                    </span>
                  )}
                </div>

                <div
                  className="rounded-xl overflow-hidden transition-shadow duration-500"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    boxShadow: blockDone ? '0 0 0 1px color-mix(in srgb, var(--success) 20%, transparent)' : 'none',
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
                      animationDelay={(blockStartIndex + i) * 50}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Ungrouped goals (anytime) */}
          {ungrouped.length > 0 && (
            <div className="animate-in">
              {blocks.length > 0 && grouped.size > 0 && (
                <div className="flex items-center gap-2 mb-2 px-1">
                  <h2
                    className="text-[11px] font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--text-3)' }}
                  >
                    Anytime
                  </h2>
                </div>
              )}

              <div
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                {ungrouped.map((goal, i) => {
                  const delay = staggerIndex * 50;
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
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      {!isSelectedFuture && (
        <button
          onClick={() => setGoalFormOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-12 h-12 rounded-full flex items-center justify-center z-30 shadow-lg animate-fab-pop transition-all active:scale-90 hover:shadow-xl"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'white',
            boxShadow: '0 4px 14px var(--glow)',
          }}
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      )}

      <Modal open={goalFormOpen} onClose={() => setGoalFormOpen(false)} title="New habit" size="md">
        <GoalForm onClose={() => setGoalFormOpen(false)} />
      </Modal>
    </div>
  );
}
