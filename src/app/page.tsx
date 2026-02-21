'use client';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { format, parseISO, subDays } from 'date-fns';
import { Plus, X, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUIStore } from '@/lib/store';
import { useTodayViewGoals } from '@/hooks/useGoals';
import { useEntriesForDate } from '@/hooks/useEntries';
import { useRoutineBlocks } from '@/hooks/useRoutine';
import { useDateRangeProgress, useOverallStreak } from '@/hooks/useStats';
import { seedDefaultRoutineBlocks } from '@/hooks/useRoutine';
import { initializeSettings } from '@/lib/db';
import { isScheduledForDate } from '@/lib/utils';
import { GoalCard } from '@/components/goals/GoalCard';
import { WeekStrip } from '@/components/today/WeekStrip';
import { Confetti } from '@/components/ui/Confetti';
import { AllDoneCelebration } from '@/components/ui/AllDoneCelebration';
import type { Goal } from '@/types';

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5)  return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const BANNER_QUOTES = [
  { text: 'We are what we repeatedly do.', attr: 'Aristotle' },
  { text: 'Discipline is remembering what you want.', attr: 'David Campbell' },
  { text: 'Consistency is the compound interest of self-improvement.', attr: 'James Clear' },
  { text: 'Small improvements every day add up to something remarkable.', attr: null },
  { text: "You don't rise to your goals. You fall to your systems.", attr: 'James Clear' },
  { text: 'The secret of getting ahead is getting started.', attr: 'Mark Twain' },
  { text: 'Every action you take is a vote for the person you wish to become.', attr: 'James Clear' },
];

export default function TodayPage() {
  const { selectedDate, setSelectedDate, setAddGoalOpen } = useUIStore();
  const goals         = useTodayViewGoals();
  const entries       = useEntriesForDate(selectedDate);
  const routineBlocks = useRoutineBlocks();
  const streak        = useOverallStreak();

  const [showConfetti,    setShowConfetti]    = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const wasAllDone        = useRef(false);
  const hasSeenIncomplete = useRef(false);
  const bannerQuote = useRef(BANNER_QUOTES[Math.floor(Math.random() * BANNER_QUOTES.length)]);

  const rangeStart = useMemo(() => format(subDays(new Date(), 6), 'yyyy-MM-dd'), []);
  const rangeEnd   = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const completionMap = useDateRangeProgress(rangeStart, rangeEnd);

  useEffect(() => {
    initializeSettings();
    seedDefaultRoutineBlocks();
  }, []);

  const today            = localToday();
  const isSelectedToday  = selectedDate === today;
  const isSelectedFuture = selectedDate > today;

  const scheduledGoals = (goals ?? [])
    .filter(g => isScheduledForDate(selectedDate, g.frequency, g.customDays))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const entryMap = new Map((entries ?? []).map(e => [e.goalId, e]));
  const blocks = useMemo(() => routineBlocks ?? [], [routineBlocks]);

  // Group goals by routine block
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

  // Time-aware block ordering
  const activeBlockIdx = useMemo(() => {
    if (!isSelectedToday || blocks.length === 0) return -1;
    const n    = new Date();
    const hhmm = `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
    let idx = -1;
    for (let i = blocks.length - 1; i >= 0; i--) {
      if (blocks[i].startTime <= hhmm) { idx = i; break; }
    }
    return idx;
  }, [isSelectedToday, blocks]);

  const orderedBlocks = useMemo(() => {
    if (!isSelectedToday || activeBlockIdx <= 0) return blocks;
    return [
      ...blocks.slice(activeBlockIdx),
      ...blocks.slice(0, activeBlockIdx),
    ];
  }, [isSelectedToday, blocks, activeBlockIdx]);

  const firstPastDisplayIdx = orderedBlocks.findIndex(b => {
    const origIdx = blocks.indexOf(b);
    return isSelectedToday && origIdx >= 0 && origIdx < activeBlockIdx;
  });

  // Progress
  const completedCount = scheduledGoals.filter(g => entryMap.get(g.id)?.completed).length;
  const allDone = scheduledGoals.length > 0 && completedCount === scheduledGoals.length;
  const pct     = scheduledGoals.length > 0 ? completedCount / scheduledGoals.length : 0;

  useEffect(() => { setBannerDismissed(false); }, [selectedDate]);

  useEffect(() => {
    if (!allDone) {
      hasSeenIncomplete.current = true;
      setBannerDismissed(false);
    }
    if (allDone && hasSeenIncomplete.current && !wasAllDone.current && scheduledGoals.length > 0) {
      setShowConfetti(true);
      setShowCelebration(true);
      setTimeout(() => setShowConfetti(false), 3500);
      setTimeout(() => setShowCelebration(false), 5500);
    }
    wasAllDone.current = allDone;
  }, [allDone, scheduledGoals.length]);

  const dateObj = isSelectedToday ? new Date() : parseISO(selectedDate);

  return (
    <div>
      <Confetti active={showConfetti} count={60} />
      <AllDoneCelebration active={showCelebration} />

      {/* ── Header ── */}
      <motion.div
        className="mb-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between mb-1">
          <p
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-3)',
              letterSpacing: '-0.01em',
            }}
          >
            {isSelectedToday ? getGreeting() : format(dateObj, 'EEEE')}
          </p>
          {streak && streak.current > 0 && isSelectedToday && (
            <motion.div
              className="streak-badge"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.2 }}
            >
              <Flame size={13} className={streak.current >= 3 ? 'animate-streak-flame' : ''} />
              <span className="tabular">{streak.current}</span>
            </motion.div>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <h1 className="page-title">{format(dateObj, 'MMMM d')}</h1>
          {scheduledGoals.length > 0 && (
            <AnimatePresence mode="wait">
              <motion.span
                key={`${completedCount}-${scheduledGoals.length}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="tabular"
                style={{
                  fontSize: '14px',
                  fontWeight: allDone ? 600 : 500,
                  color: allDone ? 'var(--success)' : 'var(--text-3)',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.01em',
                }}
              >
                {allDone ? 'All done' : `${completedCount} of ${scheduledGoals.length}`}
              </motion.span>
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* ── Week strip ── */}
      <WeekStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        completionMap={completionMap}
      />

      {/* ── Progress bar ── */}
      {scheduledGoals.length > 0 && (
        <div
          className="mb-7 rounded-full overflow-hidden"
          style={{ height: '3px', backgroundColor: 'var(--border)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: allDone ? 'var(--success)' : 'var(--accent)' }}
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      )}

      {/* ── All-done banner ── */}
      <AnimatePresence>
        {allDone && !bannerDismissed && scheduledGoals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="mb-5 rounded-2xl overflow-hidden"
            style={{
              border: '1px solid color-mix(in srgb, var(--success) 25%, var(--border))',
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--success) 5%, var(--surface)), color-mix(in srgb, var(--success) 2%, var(--surface)))',
            }}
          >
            <div className="flex items-start gap-3.5 px-4 py-4">
              <motion.div
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5"
                style={{ backgroundColor: 'color-mix(in srgb, var(--success) 14%, transparent)' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.1 }}
              >
                <motion.span
                  style={{ fontSize: '15px', color: 'var(--success)', fontWeight: 700 }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 25, delay: 0.2 }}
                >
                  &#10003;
                </motion.span>
              </motion.div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--success)' }}>
                  All done for today
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-2)', fontStyle: 'italic' }}>
                  &ldquo;{bannerQuote.current.text}&rdquo;
                  {bannerQuote.current.attr && (
                    <span style={{ fontStyle: 'normal', color: 'var(--text-3)' }}>
                      {' '}&mdash; {bannerQuote.current.attr}
                    </span>
                  )}
                </p>
              </div>

              <button
                onClick={() => setBannerDismissed(true)}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: 'var(--text-3)' }}
                aria-label="Dismiss"
              >
                <X size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Goal list ── */}
      {scheduledGoals.length === 0 ? (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          {goals?.length === 0 ? (
            <>
              <motion.p
                className="text-4xl mb-4"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.15 }}
              >
                &#127793;
              </motion.p>
              <p className="text-md font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
                Start your first habit
              </p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-3)', maxWidth: 240, margin: '0 auto 24px' }}>
                Small, repeated actions build momentum over time.
              </p>
              <button
                onClick={() => setAddGoalOpen(true)}
                className="btn btn-primary btn-lg"
              >
                <Plus size={16} strokeWidth={2.5} />
                Add your first goal
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
          {ungrouped.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {blocks.length > 0 && (
                <div className="flex items-center gap-2 mb-2.5 px-1">
                  <h2 className="section-label">Today</h2>
                </div>
              )}
              <div className="card-overflow">
                {ungrouped.map((goal, i) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    entry={entryMap.get(goal.id)}
                    date={selectedDate}
                    isBackdated={!isSelectedToday && !isSelectedFuture}
                    isFuture={isSelectedFuture}
                    isLast={i === ungrouped.length - 1}
                    animationDelay={i * 40}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {orderedBlocks.map((block, displayIdx) => {
            const blockGoals = grouped.get(block.id);
            if (!blockGoals || blockGoals.length === 0) return null;

            const origIdx    = blocks.indexOf(block);
            const isPastBlock = isSelectedToday && origIdx >= 0 && origIdx < activeBlockIdx;
            const showDivider = displayIdx === firstPastDisplayIdx && firstPastDisplayIdx > 0;

            const blockCompleted = blockGoals.filter(g => entryMap.get(g.id)?.completed).length;
            const blockDone      = blockCompleted === blockGoals.length;
            const baseDelay      = (ungrouped.length + displayIdx) * 40;

            return (
              <React.Fragment key={block.id}>
                {showDivider && (
                  <div className="flex items-center gap-3 pt-1">
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
                    <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)' }}>
                      Earlier today
                    </span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: isPastBlock ? 0.5 : 1, y: 0 }}
                  transition={{ delay: baseDelay / 1000, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-center gap-2 mb-2.5 px-1">
                    <span className="text-sm">{block.emoji}</span>
                    <h2 className="section-label transition-colors duration-300" style={{ color: blockDone ? 'var(--success)' : undefined }}>
                      {block.name}
                    </h2>
                    <span className="tabular" style={{ fontSize: '10px', color: 'var(--text-3)', marginLeft: 'auto' }}>
                      {block.startTime}
                    </span>
                    {blockDone && (
                      <motion.span
                        style={{ fontSize: '10px', fontWeight: 600, color: 'var(--success)' }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      >
                        &#10003;
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
                        animationDelay={baseDelay + i * 40}
                      />
                    ))}
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })}
        </div>
      )}

    </div>
  );
}
