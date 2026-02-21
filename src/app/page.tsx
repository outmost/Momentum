'use client';
import React, { useEffect, useState, useMemo } from 'react';
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
import { seedDemoData } from '@/lib/seed';
import { isScheduledForDate } from '@/lib/utils';
import { GoalCard } from '@/components/goals/GoalCard';
import { WeekStrip } from '@/components/today/WeekStrip';
import { Modal } from '@/components/ui/Modal';
import { GoalForm } from '@/components/goals/GoalForm';
import type { Goal } from '@/types';

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getMomentumMessage(completed: number, total: number, allDone: boolean): string {
  if (total === 0) return '';
  if (allDone) return 'You crushed it today';
  const pct = completed / total;
  if (pct === 0) return 'Every journey starts with one step';
  if (pct < 0.25) return 'You\'re getting started';
  if (pct < 0.5) return 'Building momentum';
  if (pct < 0.75) return 'Over halfway there';
  return 'Almost there, keep going';
}

export default function TodayPage() {
  const { selectedDate, setSelectedDate } = useUIStore();
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const goals = useActiveGoals();
  const entries = useEntriesForDate(selectedDate);
  const settings = useSettings();
  const routineBlocks = useRoutineBlocks();

  // Compute date range for WeekStrip completion dots
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
    seedDemoData();
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
  const momentumMsg = getMomentumMessage(completedCount, scheduledGoals.length, allDone);

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-2">
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

      {/* ── Week strip ── */}
      <WeekStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        weekStartsOn={weekStartsOn}
        completionMap={completionMap}
      />

      {/* ── Progress + momentum message ── */}
      {scheduledGoals.length > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <div className="relative w-11 h-11 shrink-0">
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
                className="transition-all duration-500"
              />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular"
              style={{ color: allDone ? 'var(--success)' : 'var(--text)' }}
            >
              {completedCount}/{scheduledGoals.length}
            </span>
          </div>
          <p
            className="text-sm font-medium"
            style={{ color: allDone ? 'var(--success)' : 'var(--text-2)' }}
          >
            {momentumMsg}
          </p>
        </div>
      )}

      {/* ── Goal list ── */}
      {scheduledGoals.length === 0 ? (
        <div className="text-center py-16">
          {goals?.length === 0 ? (
            <>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Start your first habit</p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>Small steps build big momentum.</p>
              <button
                onClick={() => setGoalFormOpen(true)}
                className="px-4 py-2 text-sm font-medium rounded-lg text-white"
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

            return (
              <div key={block.id}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-sm">{block.emoji}</span>
                  <h2
                    className="text-[11px] font-semibold uppercase tracking-widest"
                    style={{ color: blockDone ? 'var(--success)' : 'var(--text-3)' }}
                  >
                    {block.name}
                  </h2>
                  {blockDone && (
                    <span className="text-[10px] font-medium" style={{ color: 'var(--success)' }}>
                      done
                    </span>
                  )}
                </div>

                <div
                  className="rounded-xl overflow-hidden"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
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
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Ungrouped goals (anytime) */}
          {ungrouped.length > 0 && (
            <div>
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
                {ungrouped.map((goal, i) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    entry={entryMap.get(goal.id)}
                    date={selectedDate}
                    isBackdated={!isSelectedToday && !isSelectedFuture}
                    isFuture={isSelectedFuture}
                    isLast={i === ungrouped.length - 1}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      {!isSelectedFuture && (
        <button
          onClick={() => setGoalFormOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-12 h-12 rounded-full flex items-center justify-center z-30 shadow-lg transition-transform active:scale-95"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
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
