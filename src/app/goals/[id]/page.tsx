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
    if (week.length === 7 || i === 89) { weeks.push(week); week = []; }
  }

  function getColor(dateStr: string): string {
    const entry = entryMap.get(dateStr);
    if (!entry) return 'var(--border)';
    if (!entry.completed && !entry.value) return 'var(--border)';
    let intensity = 0;
    if (goal.type === 'binary') intensity = entry.completed ? 1 : 0;
    else if (goal.target) intensity = Math.min(1, (entry.value ?? 0) / goal.target);
    else if (goal.duration) intensity = Math.min(1, (entry.value ?? 0) / goal.duration);
    else intensity = entry.completed ? 1 : 0;
    if (intensity <= 0) return 'var(--border)';
    if (intensity < 0.33) return '#BBF7D0';
    if (intensity < 0.66) return '#4ADE80';
    return '#16A34A';
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-0.5 min-w-max">
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {w.map(dateStr => (
              <div
                key={dateStr}
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: getColor(dateStr) }}
                title={dateStr}
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

  if (!goal) return <div className="text-center py-12 text-sm" style={{ color: 'var(--text-3)' }}>Goal not found.</div>;

  const recentEntries = (entries ?? []).slice(0, 30);

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm transition-colors"
        style={{ color: 'var(--text-3)' }}
      >
        <ChevronLeft size={15} /> Back
      </button>

      {/* Header card */}
      <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--border)', color: 'var(--text-3)' }}>
                {goal.type}
              </span>
              <span
                className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded capitalize"
                style={{
                  backgroundColor: goal.status === 'active' ? 'rgba(22,163,74,0.1)' : 'var(--border)',
                  color: goal.status === 'active' ? 'var(--success)' : 'var(--text-3)',
                }}
              >
                {goal.status}
              </span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>{goal.title}</h1>
            {goal.description && (
              <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{goal.description}</p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setEditOpen(true)} className="w-8 h-8 flex items-center justify-center rounded transition-colors" style={{ color: 'var(--text-3)' }}>
              <Edit2 size={14} />
            </button>
            <button onClick={() => setDeleteOpen(true)} className="w-8 h-8 flex items-center justify-center rounded transition-colors" style={{ color: 'var(--text-3)' }}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {goal.status === 'active' && (
            <button onClick={() => pauseGoal(goal.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors" style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}>
              <Pause size={12} /> Pause
            </button>
          )}
          {goal.status === 'paused' && (
            <button onClick={() => resumeGoal(goal.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors" style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}>
              <Play size={12} /> Resume
            </button>
          )}
          {goal.status === 'active' && (
            <button onClick={() => setCompleteOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors" style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}>
              <CheckCircle size={12} /> Complete
            </button>
          )}
          <button onClick={() => archiveGoal(goal.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors" style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}>
            <Archive size={12} /> Archive
          </button>
        </div>
      </div>

      {/* Stats — rate and volume, not streaks */}
      {stats && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '7-day', value: `${stats.completionRate7}%` },
            { label: '30-day', value: `${stats.completionRate30}%` },
            { label: 'Total', value: stats.totalEntries },
            { label: 'All-time', value: `${stats.bestStreak}d` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-xl font-semibold tabular" style={{ color: 'var(--text)' }}>{value}</p>
              <p className="text-[10px] font-medium uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-3)' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Heatmap */}
      <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>Last 90 days</p>
        <CalendarHeatmap goalId={goal.id} goal={goal} />
      </div>

      {/* Milestones */}
      {goal.type === 'milestone' && (
        <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>Milestones</p>
          <div className="space-y-2 mb-3">
            {milestones?.map(m => (
              <div key={m.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={m.isCompleted}
                  onChange={() => toggleMilestone(m.id)}
                  className="w-3.5 h-3.5 rounded"
                  style={{ accentColor: 'var(--success)' }}
                />
                <span className="text-sm flex-1" style={{
                  color: m.isCompleted ? 'var(--text-3)' : 'var(--text-2)',
                  textDecoration: m.isCompleted ? 'line-through' : 'none',
                }}>
                  {m.title}
                </span>
                <button onClick={() => deleteMilestone(m.id)} style={{ color: 'var(--text-3)' }}>
                  <Trash2 size={13} />
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
              placeholder="Add milestone…"
              className="flex-1 px-3 py-2 rounded-md text-sm focus:outline-none"
              style={{ border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)' }}
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
              className="px-3 py-2 rounded-md text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}

      {/* History */}
      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
          Recent history
        </p>
        {recentEntries.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-3)' }}>No entries yet.</p>
        ) : (
          <div>
            {recentEntries.map(entry => (
              <div key={entry.id} className="flex items-center px-5 py-2.5 gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="text-xs tabular w-20 shrink-0" style={{ color: 'var(--text-3)' }}>{entry.date}</span>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.completed ? 'var(--success)' : 'var(--border-2)' }} />
                <span className="text-sm flex-1" style={{ color: entry.completed ? 'var(--text-2)' : 'var(--text-3)' }}>
                  {entry.completed ? 'Done' : '—'}
                  {entry.value != null && goal.type !== 'binary' && (
                    <span className="ml-2 tabular" style={{ color: 'var(--text-3)' }}>
                      {goal.type === 'timer' ? formatDuration(entry.value) : `${entry.value}${goal.unit ? ` ${goal.unit}` : ''}`}
                    </span>
                  )}
                </span>
                {entry.note && (
                  <span className="text-xs italic truncate max-w-[100px]" style={{ color: 'var(--text-3)' }}>{entry.note}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit goal">
        <GoalForm goal={goal} onClose={() => setEditOpen(false)} />
      </Modal>
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => { await deleteGoal(goal.id); router.push('/goals'); }}
        title="Delete goal"
        message="This will permanently delete the goal and all its history. This cannot be undone."
        confirmLabel="Delete Goal"
        variant="danger"
      />
      <ConfirmDialog
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onConfirm={() => { completeGoal(goal.id); setCompleteOpen(false); }}
        title="Mark complete"
        message="Mark this goal as completed? It will be hidden from active views."
        confirmLabel="Mark Complete"
        variant="primary"
      />
    </div>
  );
}
