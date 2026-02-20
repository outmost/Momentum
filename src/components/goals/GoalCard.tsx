'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { BinaryEntry } from '@/components/entries/BinaryEntry';
import { NumericEntry } from '@/components/entries/NumericEntry';
import { TimerEntry } from '@/components/entries/TimerEntry';
import { EntryNoteModal } from '@/components/entries/EntryNoteModal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { upsertEntry } from '@/hooks/useEntries';
import { useMilestones, toggleMilestone } from '@/hooks/useMilestones';
import { cn } from '@/lib/cn';
import type { Goal, Entry } from '@/types';

interface GoalCardProps {
  goal: Goal;
  entry?: Entry;
  date: string;
  isBackdated?: boolean;
  isFuture?: boolean;
}

export function GoalCard({ goal, entry, date, isBackdated, isFuture }: GoalCardProps) {
  const router = useRouter();
  const milestones = useMilestones(goal.id);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const color = goal.color || '#10B981';
  const completed = entry?.completed ?? false;
  const value = entry?.value ?? 0;
  
  async function handleBinaryChange(done: boolean) {
    if (isFuture) return;
    await upsertEntry(goal.id, date, { completed: done });
  }
  
  async function handleNumericChange(val: number) {
    if (isFuture) return;
    const isCompleted = goal.target ? val >= goal.target : val > 0;
    await upsertEntry(goal.id, date, { value: val, completed: isCompleted });
  }
  
  async function handleTimerChange(seconds: number) {
    if (isFuture) return;
    const isCompleted = goal.duration ? seconds >= goal.duration : seconds > 0;
    await upsertEntry(goal.id, date, { value: seconds, completed: isCompleted });
  }
  
  async function handleNoteSave(note: string) {
    await upsertEntry(goal.id, date, { note, completed: entry?.completed ?? false });
  }
  
  async function handleMilestoneToggle(milestoneId: string) {
    if (isFuture) return;
    await toggleMilestone(milestoneId);
    // Update entry based on milestones completion
    const allMilestones = milestones ?? [];
    const completedCount = allMilestones.filter(m => m.id === milestoneId ? !m.isCompleted : m.isCompleted).length;
    const isCompleted = completedCount === allMilestones.length;
    await upsertEntry(goal.id, date, { completed: isCompleted, value: completedCount });
  }
  
  const completedMilestones = milestones?.filter(m => m.isCompleted).length ?? 0;
  const totalMilestones = milestones?.length ?? 0;
  const milestoneProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  
  return (
    <>
      <div className={cn(
        'bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700',
        'transition-all duration-150',
        completed && 'opacity-70',
        isFuture && 'opacity-50 cursor-not-allowed'
      )}>
        <div className="flex items-start gap-3">
          {/* Check-in control */}
          <div className="flex items-center mt-0.5">
            {goal.type === 'binary' && (
              <BinaryEntry completed={completed} onChange={handleBinaryChange} color={color} />
            )}
            {(goal.type === 'milestone') && (
              <BinaryEntry completed={completed} onChange={() => {}} color={color} />
            )}
          </div>
          
          {/* Goal info */}
          <div className="flex-1 min-w-0">
            <button
              onClick={() => router.push(`/goals/${goal.id}`)}
              className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-500 text-left line-clamp-2 transition-colors"
            >
              {goal.title}
              {completed && <span className="ml-2 text-green-500">✓</span>}
            </button>
            
            {isBackdated && (
              <span className="inline-block text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded mt-1">
                backdated
              </span>
            )}
            
            {/* Type-specific entry */}
            <div className="mt-2">
              {goal.type === 'numeric' && (
                <NumericEntry
                  value={value}
                  target={goal.target ?? 0}
                  unit={goal.unit}
                  onChange={handleNumericChange}
                  color={color}
                />
              )}
              {goal.type === 'timer' && (
                <TimerEntry
                  goalId={goal.id}
                  value={value}
                  target={goal.duration ?? 0}
                  onChange={handleTimerChange}
                  color={color}
                />
              )}
              {goal.type === 'milestone' && (
                <div>
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  >
                    <span>{completedMilestones} of {totalMilestones} milestones</span>
                    {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  <ProgressBar value={milestoneProgress} size="sm" color={color} className="mt-1" />
                  
                  {expanded && (
                    <div className="mt-2 space-y-1.5">
                      {milestones?.map(m => (
                        <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={m.isCompleted}
                            onChange={() => handleMilestoneToggle(m.id)}
                            disabled={isFuture}
                            className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 w-4 h-4"
                          />
                          <span className={cn('text-xs', m.isCompleted && 'line-through text-gray-400')}>
                            {m.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Note button */}
          {!isFuture && (
            <button
              onClick={() => setNoteModalOpen(true)}
              className={cn(
                'shrink-0 p-1.5 rounded-lg transition-colors',
                entry?.note
                  ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
              title="Add note"
            >
              <MessageSquare size={16} />
            </button>
          )}
        </div>
      </div>
      
      <EntryNoteModal
        open={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        onSave={handleNoteSave}
        initialNote={entry?.note}
        goalTitle={goal.title}
      />
    </>
  );
}
