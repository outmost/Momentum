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
import { isScheduledForDate } from '@/lib/utils';
import { GoalCard } from '@/components/goals/GoalCard';
import { Modal } from '@/components/ui/Modal';
import { GoalForm } from '@/components/goals/GoalForm';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Goal } from '@/types';

export default function TodayPage() {
  const { selectedDate, setSelectedDate, welcomeBackDismissed, setWelcomeBackDismissed } = useUIStore();
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const goals = useActiveGoals();
  const folders = useFolders();
  const entries = useEntriesForDate(selectedDate);
  useSettings();

  useEffect(() => { initializeSettings(); }, []);

  const lastVisit = typeof window !== 'undefined' ? localStorage.getItem('lastVisit') : null;
  const showWelcomeBack = !welcomeBackDismissed && lastVisit &&
    (Date.now() - Number(lastVisit)) > 3 * 24 * 60 * 60 * 1000;

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('lastVisit', Date.now().toString());
  }, []);

  function navigate(dir: -1 | 1) {
    const d = dir === -1 ? subDays(parseISO(selectedDate), 1) : addDays(parseISO(selectedDate), 1);
    setSelectedDate(format(d, 'yyyy-MM-dd'));
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const isSelectedToday = selectedDate === today;
  const isSelectedFuture = selectedDate > today;

  const scheduledGoals = goals?.filter(g =>
    isScheduledForDate(selectedDate, g.frequency, g.customDays)
  ) ?? [];

  const entryMap = new Map((entries ?? []).map(e => [e.goalId, e]));

  const grouped = new Map<string | null, Goal[]>();
  for (const goal of scheduledGoals) {
    const key = goal.folderId || null;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(goal);
  }

  const dateLabel = isSelectedToday ? 'Today' : format(parseISO(selectedDate), 'EEE, MMM d');
  const completedCount = scheduledGoals.filter(g => entryMap.get(g.id)?.completed).length;

  return (
    <div>
      {/* Welcome back */}
      {showWelcomeBack && (
        <div
          className="mb-6 px-4 py-3 rounded-lg flex items-center justify-between"
          style={{ backgroundColor: 'var(--accent-2)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--accent)' }}>Welcome back — pick up where you left off.</p>
          <button
            onClick={() => setWelcomeBackDismissed(true)}
            className="text-xs ml-3"
            style={{ color: 'var(--text-3)' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
            {dateLabel}
          </h1>
          {scheduledGoals.length > 0 && (
            <p className="text-sm mt-0.5 tabular" style={{ color: 'var(--text-3)' }}>
              {completedCount} of {scheduledGoals.length} done
            </p>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded transition-colors"
            style={{ color: 'var(--text-3)' }}
          >
            <ChevronLeft size={18} />
          </button>
          {!isSelectedToday && (
            <button
              onClick={() => setSelectedDate(today)}
              className="px-2 py-1 text-xs rounded transition-colors font-medium"
              style={{ color: 'var(--accent)' }}
            >
              Today
            </button>
          )}
          <button
            onClick={() => navigate(1)}
            className="w-8 h-8 flex items-center justify-center rounded transition-colors"
            style={{ color: 'var(--text-3)' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Goals */}
      {scheduledGoals.length === 0 ? (
        goals?.length === 0 ? (
          <EmptyState
            icon={<span className="text-4xl">⬜</span>}
            title="No goals yet"
            description="Add your first goal to start building momentum."
            action={{ label: 'Add goal', onClick: () => setGoalFormOpen(true) }}
          />
        ) : (
          <EmptyState
            icon={<span className="text-3xl">—</span>}
            title={isSelectedFuture ? 'Future date' : 'Nothing scheduled'}
            description={isSelectedFuture ? 'Check-ins are only available for today and past dates.' : 'No goals scheduled for this day.'}
          />
        )
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([folderId, fGoals]) => {
            const folder = folderId ? folders?.find(f => f.id === folderId) : null;
            return (
              <div key={folderId ?? 'none'}>
                {folder && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: folder.color }} />
                    <h2 className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                      {folder.icon} {folder.name}
                    </h2>
                  </div>
                )}
                {!folder && grouped.size > 1 && (
                  <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>
                    Other
                  </h2>
                )}
                <div className="space-y-2">
                  {fGoals.map(goal => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      entry={entryMap.get(goal.id)}
                      date={selectedDate}
                      isBackdated={!isSelectedToday && !isSelectedFuture}
                      isFuture={isSelectedFuture}
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
          className="fixed bottom-20 right-4 md:bottom-6 w-12 h-12 rounded-full flex items-center justify-center z-30 transition-opacity hover:opacity-90 shadow-sm"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        >
          <Plus size={20} />
        </button>
      )}

      <Modal open={goalFormOpen} onClose={() => setGoalFormOpen(false)} title="New goal" size="md">
        <GoalForm onClose={() => setGoalFormOpen(false)} />
      </Modal>
    </div>
  );
}
