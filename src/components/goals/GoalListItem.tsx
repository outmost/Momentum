'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Pause, Play, Archive, Trash2, CheckCircle, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { deleteGoal, pauseGoal, resumeGoal, archiveGoal, completeGoal } from '@/hooks/useGoals';
import type { Goal } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  binary: '✓', numeric: '#', milestone: '◎', timer: '⏱',
};

interface GoalListItemProps {
  goal: Goal;
  completionRate7?: number;
  draggable?: boolean;
  isLast?: boolean;
}

export function GoalListItem({ goal, completionRate7 = 0, draggable = false, isLast = false }: GoalListItemProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen]     = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: goal.id,
    disabled: !draggable,
  });

  const color = goal.color || '#16A34A';

  const style: React.CSSProperties = {
    transform:  CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    opacity:    isDragging ? 0.4 : 1,
    zIndex:     isDragging ? 1 : undefined,
    position:   isDragging ? 'relative' : undefined,
    borderBottom: isLast ? 'none' : '1px solid var(--border)',
  };

  return (
    <>
      <div ref={setNodeRef} style={style} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--surface-2)]">
        {draggable && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none shrink-0 p-0.5"
            style={{ color: 'var(--text-3)' }}
          >
            <GripVertical size={14} />
          </button>
        )}

        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />

        <span className="text-[11px] font-mono w-3 shrink-0 select-none" style={{ color: 'var(--text-3)' }}>
          {TYPE_LABELS[goal.type]}
        </span>

        <button
          onClick={() => router.push(`/goals/${goal.id}`)}
          className="flex-1 text-left text-[13px] font-medium line-clamp-1 transition-colors"
          style={{ color: 'var(--text)' }}
        >
          {goal.title}
        </button>

        {goal.status !== 'active' && (
          <span
            className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0"
            style={{ color: 'var(--text-3)', backgroundColor: 'var(--border)' }}
          >
            {goal.status}
          </span>
        )}

        <div className="w-12 shrink-0 space-y-0.5">
          <ProgressBar value={completionRate7} size="sm" color={color} />
          <p className="text-[10px] tabular text-right" style={{ color: 'var(--text-3)' }}>{completionRate7}%</p>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--border)]"
            style={{ color: 'var(--text-3)' }}
          >
            <MoreVertical size={14} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div
                className="absolute right-0 top-8 z-20 w-36 card-sm py-1"
                style={{ boxShadow: 'var(--shadow-md)' }}
              >
                {goal.status === 'active' && (
                  <button
                    onClick={() => { pauseGoal(goal.id); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-left transition-colors hover:bg-[var(--surface-2)]"
                    style={{ color: 'var(--text-2)' }}
                  >
                    <Pause size={13} /> Pause
                  </button>
                )}
                {goal.status === 'paused' && (
                  <button
                    onClick={() => { resumeGoal(goal.id); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-left transition-colors hover:bg-[var(--surface-2)]"
                    style={{ color: 'var(--text-2)' }}
                  >
                    <Play size={13} /> Resume
                  </button>
                )}
                {goal.status === 'active' && (
                  <button
                    onClick={() => { setCompleteOpen(true); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-left transition-colors hover:bg-[var(--surface-2)]"
                    style={{ color: 'var(--text-2)' }}
                  >
                    <CheckCircle size={13} /> Complete
                  </button>
                )}
                <button
                  onClick={() => { archiveGoal(goal.id); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-left transition-colors hover:bg-[var(--surface-2)]"
                  style={{ color: 'var(--text-2)' }}
                >
                  <Archive size={13} /> Archive
                </button>
                <div className="my-0.5" style={{ borderTop: '1px solid var(--border)' }} />
                <button
                  onClick={() => { setDeleteOpen(true); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-left transition-colors hover:bg-[var(--danger-soft)]"
                  style={{ color: 'var(--danger)' }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => { await deleteGoal(goal.id); setDeleteOpen(false); }}
        title="Delete goal"
        message={`Delete "${goal.title}"? All entries and history will be permanently removed.`}
        confirmLabel="Delete"
        variant="danger"
      />
      <ConfirmDialog
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onConfirm={() => { completeGoal(goal.id); setCompleteOpen(false); }}
        title="Mark complete"
        message={`Mark "${goal.title}" as completed? It will be hidden from active views.`}
        confirmLabel="Mark Complete"
        variant="primary"
      />
    </>
  );
}
