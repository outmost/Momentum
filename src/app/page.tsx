'use client';
import React, { useEffect, useState } from 'react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useUIStore } from '@/lib/store';
import { useActiveGoals } from '@/hooks/useGoals';
import { useFolders } from '@/hooks/useFolders';
import { useEntriesForDate } from '@/hooks/useEntries';
import { useSettings } from '@/hooks/useSettings';
import { initializeSettings } from '@/lib/db';
import { seedDemoData } from '@/lib/seed';
import { isScheduledForDate } from '@/lib/utils';
import { GoalCard } from '@/components/goals/GoalCard';
import { Modal } from '@/components/ui/Modal';
import { GoalForm } from '@/components/goals/GoalForm';
import type { Goal } from '@/types';

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default function TodayPage() {
  const { selectedDate, setSelectedDate } = useUIStore();
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const goals = useActiveGoals();
  const folders = useFolders();
  const entries = useEntriesForDate(selectedDate);
  useSettings();

  useEffect(() => { initializeSettings(); seedDemoData(); }, []);

  function navigate(dir: -1 | 1) {
    const d = dir === -1
      ? subDays(parseISO(selectedDate), 1)
      : addDays(parseISO(selectedDate), 1);
    setSelectedDate(format(d, 'yyyy-MM-dd'));
  }

  const today = localToday();
  const isSelectedToday = selectedDate === today;
  const isSelectedFuture = selectedDate > today;

  const scheduledGoals = (goals ?? [])
    .filter(g => isScheduledForDate(selectedDate, g.frequency, g.customDays))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const entryMap = new Map((entries ?? []).map(e => [e.goalId, e]));

  const grouped = new Map<string | null, Goal[]>();
  for (const goal of scheduledGoals) {
    const key = goal.folderId || null;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(goal);
  }

  const completedCount = scheduledGoals.filter(g => entryMap.get(g.id)?.completed).length;
  const allDone = scheduledGoals.length > 0 && completedCount === scheduledGoals.length;

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            {isSelectedToday ? (
              <>
                <h1 className="text-3xl font-semibold tracking-tight leading-none" style={{ color: 'var(--text)' }}>
                  Today
                </h1>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-3)' }}>
                  {format(new Date(), 'EEEE, MMMM d')}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-semibold tracking-tight leading-none" style={{ color: 'var(--text-2)' }}>
                  {format(parseISO(selectedDate), 'EEE, MMM d')}
                </h1>
                {!isSelectedFuture && (
                  <button
                    onClick={() => setSelectedDate(today)}
                    className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors"
                    style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                  >
                    ← Today
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-0 mt-1">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded transition-colors"
              style={{ color: 'var(--text-3)' }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => navigate(1)}
              disabled={isSelectedToday}
              className="w-8 h-8 flex items-center justify-center rounded transition-colors"
              style={{ color: isSelectedToday ? 'var(--border-2)' : 'var(--text-3)' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Progress counter */}
        {scheduledGoals.length > 0 && (
          <div className="flex items-center gap-2 mt-4">
            <span
              className="text-4xl font-semibold tabular leading-none"
              style={{ color: allDone ? 'var(--success)' : 'var(--text)' }}
            >
              {completedCount}
            </span>
            <div>
              <p className="text-xs leading-none" style={{ color: 'var(--text-3)' }}>of {scheduledGoals.length}</p>
              <p className="text-xs leading-none mt-0.5" style={{ color: allDone ? 'var(--success)' : 'var(--text-3)' }}>
                {allDone ? 'all done ✓' : 'done'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Goal list ── */}
      {scheduledGoals.length === 0 ? (
        <div className="text-center py-16">
          {goals?.length === 0 ? (
            <>
              <p className="text-3xl mb-4" style={{ color: 'var(--border-2)' }}>—</p>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>No goals yet</p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>Add your first goal to start building momentum.</p>
              <button
                onClick={() => setGoalFormOpen(true)}
                className="px-4 py-2 text-sm font-medium rounded-md text-white"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                Add goal
              </button>
            </>
          ) : (
            <>
              <p className="text-3xl mb-4" style={{ color: 'var(--border-2)' }}>—</p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
                {isSelectedFuture ? 'Future date' : 'Nothing scheduled'}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
                {isSelectedFuture
                  ? 'Check-ins are only available for today and past dates.'
                  : 'No goals scheduled for this day.'}
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([folderId, fGoals]) => {
            const folder = folderId ? folders?.find(f => f.id === folderId) : null;
            const showLabel = folder || grouped.size > 1;

            return (
              <div key={folderId ?? 'none'}>
                {showLabel && (
                  <div className="flex items-center gap-2 mb-2">
                    {folder && (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: folder.color }} />
                    )}
                    <h2
                      className="text-[10px] font-bold uppercase tracking-[0.12em]"
                      style={{ color: 'var(--text-3)' }}
                    >
                      {folder ? `${folder.icon} ${folder.name}` : 'Other'}
                    </h2>
                  </div>
                )}

                <div
                  className="rounded-lg overflow-hidden"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  {fGoals.map((goal, i) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      entry={entryMap.get(goal.id)}
                      date={selectedDate}
                      isBackdated={!isSelectedToday && !isSelectedFuture}
                      isFuture={isSelectedFuture}
                      isLast={i === fGoals.length - 1}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB */}
      {!isSelectedFuture && (
        <button
          onClick={() => setGoalFormOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-11 h-11 rounded-full flex items-center justify-center z-30 shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        >
          <Plus size={18} />
        </button>
      )}

      <Modal open={goalFormOpen} onClose={() => setGoalFormOpen(false)} title="New goal" size="md">
        <GoalForm onClose={() => setGoalFormOpen(false)} />
      </Modal>
    </div>
  );
}
