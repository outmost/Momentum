'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, subDays } from 'date-fns';
import { Edit2, Pause, Play, Archive, Trash2, CheckCircle, ChevronLeft, Plus } from 'lucide-react';
import { useGoal, deleteGoal, pauseGoal, resumeGoal, archiveGoal, completeGoal } from '@/hooks/useGoals';
import { useEntries } from '@/hooks/useEntries';
import { useMilestones, toggleMilestone, createMilestone, deleteMilestone } from '@/hooks/useMilestones';
import { useGoalStats } from '@/hooks/useStats';
import { Modal } from '@/components/ui/Modal';
import { GoalForm } from '@/components/goals/GoalForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatDuration } from '@/lib/utils';

function CalendarHeatmap({ goalId, goal }: { goalId: string; goal: { type: string; target?: number; duration?: number } }) {
  const today = new Date();
  const entries = useEntries(goalId);
  
  const entryMap = new Map((entries ?? []).map(e => [e.date, e]));
  
  const weeks: string[][] = [];
  let week: string[] = [];
  const start = subDays(today, 89);
  
  for (let i = 0; i < 90; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const dateStr = format(d, 'yyyy-MM-dd');
    week.push(dateStr);
    if (week.length === 7 || i === 89) {
      weeks.push(week);
      week = [];
    }
  }
  
  function getColor(dateStr: string): string {
    const entry = entryMap.get(dateStr);
    if (!entry) return '#F3F4F6';
    if (!entry.completed && !entry.value) return '#E5E7EB';
    
    let intensity = 0;
    if (goal.type === 'binary') intensity = entry.completed ? 1 : 0;
    else if (goal.target) intensity = Math.min(1, (entry.value ?? 0) / goal.target);
    else if (goal.duration) intensity = Math.min(1, (entry.value ?? 0) / goal.duration);
    else intensity = entry.completed ? 1 : 0;
    
    if (intensity <= 0) return '#E5E7EB';
    if (intensity < 0.33) return '#A7F3D0';
    if (intensity < 0.66) return '#34D399';
    return '#10B981';
  }
  
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {w.map(dateStr => (
              <div
                key={dateStr}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: getColor(dateStr) }}
                title={`${dateStr}: ${entryMap.get(dateStr)?.completed ? 'completed' : 'not completed'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GoalDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const goal = useGoal(params.id);
  const entries = useEntries(params.id);
  const milestones = useMilestones(params.id);
  const stats = useGoalStats(params.id, goal);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState('');
  
  if (!goal) return (
    <div className="text-center py-12 text-gray-500">Goal not found.</div>
  );
  
  const recentEntries = (entries ?? []).slice(0, 30);
  
  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <ChevronLeft size={16} /> Back
      </button>
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full capitalize">
                {goal.type}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                goal.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                goal.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {goal.status}
              </span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{goal.title}</h1>
            {goal.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{goal.description}</p>
            )}
          </div>
          
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => setEditOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        {/* Quick actions */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {goal.status === 'active' && (
            <button onClick={() => pauseGoal(goal.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100">
              <Pause size={14} /> Pause
            </button>
          )}
          {goal.status === 'paused' && (
            <button onClick={() => resumeGoal(goal.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100">
              <Play size={14} /> Resume
            </button>
          )}
          {goal.status === 'active' && (
            <button onClick={() => setCompleteOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100">
              <CheckCircle size={14} /> Complete
            </button>
          )}
          <button onClick={() => archiveGoal(goal.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100">
            <Archive size={14} /> Archive
          </button>
        </div>
      </div>
      
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Current Streak', value: `${stats.currentStreak}d` },
            { label: '30-day Rate', value: `${stats.completionRate30}%` },
            { label: 'Total Done', value: stats.totalEntries.toString() },
            { label: 'Best Streak', value: `${stats.bestStreak}d` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}
      
      {/* Heatmap */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Activity (last 90 days)</h2>
        <CalendarHeatmap goalId={goal.id} goal={goal} />
      </div>
      
      {/* Milestones */}
      {goal.type === 'milestone' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Milestones</h2>
          <div className="space-y-2 mb-3">
            {milestones?.map(m => (
              <div key={m.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={m.isCompleted}
                  onChange={() => toggleMilestone(m.id)}
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 w-4 h-4"
                />
                <span className={`text-sm flex-1 ${m.isCompleted ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {m.title}
                </span>
                <button onClick={() => deleteMilestone(m.id)} className="text-gray-300 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <ProgressBar
            value={milestones?.length ? Math.round((milestones.filter(m => m.isCompleted).length / milestones.length) * 100) : 0}
            className="mb-3"
          />
          <div className="flex gap-2">
            <input
              value={newMilestone}
              onChange={e => setNewMilestone(e.target.value)}
              placeholder="Add milestone..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={async e => {
                if (e.key === 'Enter' && newMilestone.trim()) {
                  await createMilestone(goal.id, newMilestone.trim());
                  setNewMilestone('');
                }
              }}
            />
            <button
              onClick={async () => {
                if (newMilestone.trim()) {
                  await createMilestone(goal.id, newMilestone.trim());
                  setNewMilestone('');
                }
              }}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}
      
      {/* Entry history */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
        <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent History</h2>
        </div>
        {recentEntries.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No entries yet.</p>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {recentEntries.map(entry => (
              <div key={entry.id} className="flex items-center px-5 py-3 gap-3">
                <span className="text-xs text-gray-400 w-20 shrink-0">{entry.date}</span>
                <div className={`w-2 h-2 rounded-full shrink-0 ${entry.completed ? 'bg-green-400' : 'bg-gray-200'}`} />
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                  {entry.completed ? 'Completed' : 'Incomplete'}
                  {entry.value != null && goal.type !== 'binary' && (
                    <span className="text-gray-400 ml-2">
                      {goal.type === 'timer' ? formatDuration(entry.value) : `${entry.value}${goal.unit ? ` ${goal.unit}` : ''}`}
                    </span>
                  )}
                </span>
                {entry.note && (
                  <span className="text-xs text-gray-400 italic truncate max-w-[100px]">{entry.note}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Goal">
        <GoalForm goal={goal} onClose={() => setEditOpen(false)} />
      </Modal>
      
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => { await deleteGoal(goal.id); router.push('/goals'); }}
        title="Delete Goal"
        message="This will permanently delete the goal and all its history. This cannot be undone."
        confirmLabel="Delete Goal"
        variant="danger"
      />
      
      <ConfirmDialog
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onConfirm={() => { completeGoal(goal.id); setCompleteOpen(false); }}
        title="Mark as Complete"
        message="Mark this goal as completed? It will be hidden from active views."
        confirmLabel="Mark Complete"
        variant="primary"
      />
    </div>
  );
}
