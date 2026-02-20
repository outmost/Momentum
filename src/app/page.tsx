'use client';
import React, { useEffect, useState } from 'react';
import { format, addDays, subDays, parseISO, isToday, isFuture } from 'date-fns';
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
import type { Goal, Entry } from '@/types';

export default function TodayPage() {
  const { selectedDate, setSelectedDate, welcomeBackDismissed, setWelcomeBackDismissed } = useUIStore();
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const goals = useActiveGoals();
  const folders = useFolders();
  const entries = useEntriesForDate(selectedDate);
  const settings = useSettings();
  
  useEffect(() => {
    initializeSettings();
  }, []);
  
  // Check if welcome back banner should show
  const lastVisit = typeof window !== 'undefined' ? localStorage.getItem('lastVisit') : null;
  const showWelcomeBack = !welcomeBackDismissed && lastVisit &&
    (Date.now() - Number(lastVisit)) > 3 * 24 * 60 * 60 * 1000;
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastVisit', Date.now().toString());
    }
  }, []);
  
  function navigate(dir: -1 | 1) {
    const current = parseISO(selectedDate);
    const next = dir === -1 ? subDays(current, 1) : addDays(current, 1);
    setSelectedDate(format(next, 'yyyy-MM-dd'));
  }
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const isSelectedToday = selectedDate === today;
  const isSelectedFuture = selectedDate > today;
  
  // Filter goals for selected date
  const scheduledGoals = goals?.filter(g =>
    isScheduledForDate(selectedDate, g.frequency, g.customDays)
  ) ?? [];
  
  // Build entry map
  const entryMap = new Map((entries ?? []).map(e => [e.goalId, e]));
  
  // Group by folder
  const grouped = new Map<string | null, Goal[]>();
  for (const goal of scheduledGoals) {
    const key = goal.folderId || null;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(goal);
  }
  
  // Display date text
  let dateLabel: string;
  if (isSelectedToday) dateLabel = 'Today';
  else dateLabel = format(parseISO(selectedDate), 'EEE, MMM d');
  
  const completedCount = scheduledGoals.filter(g => entryMap.get(g.id)?.completed).length;
  
  return (
    <div>
      {/* Welcome back banner */}
      {showWelcomeBack && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-between">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Welcome back — pick up where you left off.
          </p>
          <button
            onClick={() => setWelcomeBackDismissed(true)}
            className="text-blue-400 hover:text-blue-600 text-xs ml-2"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Date navigation */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{dateLabel}</h1>
          {scheduledGoals.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {completedCount} of {scheduledGoals.length} done
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          {!isSelectedToday && (
            <button
              onClick={() => setSelectedDate(today)}
              className="px-2 py-1 text-xs text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
            >
              Today
            </button>
          )}
          <button
            onClick={() => navigate(1)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      {/* Goals list */}
      {scheduledGoals.length === 0 ? (
        goals?.length === 0 ? (
          <EmptyState
            icon={<span className="text-5xl">🎯</span>}
            title="Track your first goal"
            description="Add goals to start building momentum. Under 3 minutes to get started."
            action={{ label: 'Add your first goal', onClick: () => setGoalFormOpen(true) }}
          />
        ) : (
          <EmptyState
            icon={<span className="text-4xl">✨</span>}
            title={isSelectedFuture ? 'No goals scheduled' : 'Nothing scheduled for this day'}
            description={isSelectedFuture ? 'You cannot check in for future days.' : 'Enjoy the free time or navigate back to today.'}
          />
        )
      ) : (
        <div className="space-y-6">
          {/* Render folder groups */}
          {Array.from(grouped.entries()).map(([folderId, goals]) => {
            const folder = folderId ? folders?.find(f => f.id === folderId) : null;
            
            return (
              <div key={folderId ?? 'uncategorized'}>
                {folder && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: folder.color }} />
                    <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {folder.icon} {folder.name}
                    </h2>
                  </div>
                )}
                {!folder && grouped.size > 1 && (
                  <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    Other
                  </h2>
                )}
                <div className="space-y-2">
                  {goals.map(goal => (
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
          className="fixed bottom-20 right-4 md:bottom-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 active:scale-95 transition-all z-30"
        >
          <Plus size={24} />
        </button>
      )}
      
      {/* Goal form modal */}
      <Modal
        open={goalFormOpen}
        onClose={() => setGoalFormOpen(false)}
        title="New Goal"
        size="md"
      >
        <GoalForm onClose={() => setGoalFormOpen(false)} />
      </Modal>
    </div>
  );
}
