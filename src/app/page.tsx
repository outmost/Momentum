'use client';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { format, parseISO, subDays } from 'date-fns';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/lib/store';
import { useActiveGoals } from '@/hooks/useGoals';
import { useEntriesForDate } from '@/hooks/useEntries';
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

const BANNER_QUOTES = [
  { text: 'We are what we repeatedly do.', attr: 'Aristotle' },
  { text: 'Discipline is remembering what you want.', attr: 'David Campbell' },
  { text: 'Consistency is the compound interest of self-improvement.', attr: 'James Clear' },
  { text: 'Small improvements every day add up to something remarkable.', attr: null },
  { text: "You don't rise to your goals. You fall to your systems.", attr: 'James Clear' },
];

export default function TodayPage() {
  const { selectedDate, setSelectedDate } = useUIStore();
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const goals         = useActiveGoals();
  const entries       = useEntriesForDate(selectedDate);
  const routineBlocks = useRoutineBlocks();

  const [showConfetti,    setShowConfetti]    = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const wasAllDone        = useRef(false);
  const hasSeenIncomplete = useRef(false);
  // Pick a quote once per session (stable ref)
  const bannerQuote = useRef(BANNER_QUOTES[Math.floor(Math.random() * BANNER_QUOTES.length)]);

  // Completion data for the week strip (last 7 days)
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

  // ── Time-aware block ordering ────────────────────────────────
  // Find the index of the currently active block (last one whose startTime has passed)
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

  // Reorder: current + future first, past blocks at the bottom
  const orderedBlocks = useMemo(() => {
    if (!isSelectedToday || activeBlockIdx <= 0) return blocks;
    return [
      ...blocks.slice(activeBlockIdx),    // current block + everything after
      ...blocks.slice(0, activeBlockIdx), // blocks before current (past)
    ];
  }, [isSelectedToday, blocks, activeBlockIdx]);

  // Track where past blocks start in the ordered list (for "Earlier" divider)
  const firstPastDisplayIdx = orderedBlocks.findIndex(b => {
    const origIdx = blocks.indexOf(b);
    return isSelectedToday && origIdx >= 0 && origIdx < activeBlockIdx;
  });

  // ── Progress ─────────────────────────────────────────────────
  const completedCount = scheduledGoals.filter(g => entryMap.get(g.id)?.completed).length;
  const allDone = scheduledGoals.length > 0 && completedCount === scheduledGoals.length;
  const pct     = scheduledGoals.length > 0 ? completedCount / scheduledGoals.length : 0;

  // Reset banner when switching days
  useEffect(() => { setBannerDismissed(false); }, [selectedDate]);

  useEffect(() => {
    if (!allDone) {
      hasSeenIncomplete.current = true;
      setBannerDismissed(false); // un-dismiss if user un-completes a goal
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
      <div className="mb-4">
        <p
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-3)',
            marginBottom: '2px',
          }}
        >
          {format(dateObj, 'EEEE')}
        </p>
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
                style={{
                  fontSize: '13px',
                  fontWeight: allDone ? 600 : 400,
                  color: allDone ? 'var(--success)' : 'var(--text-3)',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {allDone ? 'All done ✓' : `${completedCount} / ${scheduledGoals.length}`}
              </motion.span>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ── Week strip ── */}
      <WeekStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        completionMap={completionMap}
      />

      {/* ── Thin progress bar ── */}
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
              border: '1px solid color-mix(in srgb, var(--success) 28%, var(--border))',
              backgroundColor: 'color-mix(in srgb, var(--success) 6%, var(--surface))',
            }}
          >
            <div className="flex items-start gap-3.5 px-4 py-3.5">
              {/* Checkmark */}
              <div
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
                style={{ backgroundColor: 'color-mix(in srgb, var(--success) 14%, transparent)' }}
              >
                <span style={{ fontSize: '14px' }}>✓</span>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold leading-snug"
                  style={{ color: 'var(--success)' }}
                >
                  All done for today
                </p>
                <p
                  className="text-xs mt-0.5 leading-relaxed"
                  style={{ color: 'var(--text-2)', fontStyle: 'italic' }}
                >
                  &ldquo;{bannerQuote.current.text}&rdquo;
                  {bannerQuote.current.attr && (
                    <span style={{ fontStyle: 'normal', color: 'var(--text-3)' }}>
                      {' '}— {bannerQuote.current.attr}
                    </span>
                  )}
                </p>
              </div>

              {/* Dismiss */}
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
              <p className="text-4xl mb-4">🌱</p>
              <p className="text-[15px] font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
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

          {/* ── Anytime / ungrouped goals (always at top) ── */}
          {ungrouped.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
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

          {/* ── Routine-block groups (time-aware order) ── */}
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
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--text-3)',
                      }}
                    >
                      Earlier today
                    </span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: isPastBlock ? 0.5 : 1, y: 0 }}
                  transition={{
                    delay: baseDelay / 1000,
                    duration: 0.32,
                    ease: [0.16, 1, 0.3, 1],
                  }}
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
                    <span
                      style={{
                        fontSize: '10px',
                        color: 'var(--text-3)',
                        marginLeft: 'auto',
                      }}
                    >
                      {block.startTime}
                    </span>
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
