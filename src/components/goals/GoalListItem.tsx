'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Pause, Play, Archive, Trash2, CheckCircle, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { deleteGoal, pauseGoal, resumeGoal, archiveGoal, completeGoal } from '@/hooks/useGoals';
import { cn } from '@/lib/cn';
import type { Goal } from '@/types';

const TYPE_ICONS: Record<string, string> = {
  binary: '✓',
  numeric: '#',
  milestone: '◎',
  timer: '⏱',
};

interface GoalListItemProps {
  goal: Goal;
  completionRate7?: number;
  draggable?: boolean;
}

export function GoalListItem({ goal, completionRate7 = 0, draggable = false }: GoalListItemProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id, disabled: !draggable });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  const color = goal.color || '#10B981';
  
  const statusBadge = goal.status !== 'active' ? (
    <span className={cn(
      'text-xs px-1.5 py-0.5 rounded font-medium',
      goal.status === 'paused' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      goal.status === 'completed' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      goal.status === 'archived' && 'bg-gray-100 text-gray-500 dark:bg-gray-700',
    )}>
      {goal.status}
    </span>
  ) : null;
  
  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-750"
      >
        {/* Drag handle */}
        {draggable && (
          <button
            {...attributes}
            {...listeners}
            className="text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical size={16} />
          </button>
        )}
        
        {/* Color dot */}
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        
        {/* Type icon */}
        <span className="text-xs text-gray-400 font-mono w-4 shrink-0">
          {TYPE_ICONS[goal.type]}
        </span>
        
        {/* Title */}
        <button
          onClick={() => router.push(`/goals/${goal.id}`)}
          className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-500 line-clamp-1 transition-colors"
        >
          {goal.title}
        </button>
        
        {statusBadge}
        
        {/* 7-day mini bar */}
        <div className="w-16 shrink-0">
          <ProgressBar value={completionRate7} size="sm" color={color} />
          <p className="text-xs text-gray-400 text-right mt-0.5">{completionRate7}%</p>
        </div>
        
        {/* Menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <MoreVertical size={16} />
          </button>
          
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1">
                {goal.status === 'active' && (
                  <button
                    onClick={() => { pauseGoal(goal.id); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Pause size={14} /> Pause
                  </button>
                )}
                {goal.status === 'paused' && (
                  <button
                    onClick={() => { resumeGoal(goal.id); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Play size={14} /> Resume
                  </button>
                )}
                {goal.status === 'active' && (
                  <button
                    onClick={() => { setCompleteOpen(true); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <CheckCircle size={14} /> Complete
                  </button>
                )}
                <button
                  onClick={() => { archiveGoal(goal.id); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Archive size={14} /> Archive
                </button>
                <button
                  onClick={() => { setDeleteOpen(true); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => { deleteGoal(goal.id); setDeleteOpen(false); }}
        title="Delete Goal"
        message={`Delete "${goal.title}"? This will permanently delete all entries and history. This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
      
      <ConfirmDialog
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onConfirm={() => { completeGoal(goal.id); setCompleteOpen(false); }}
        title="Mark as Complete"
        message={`Mark "${goal.title}" as completed? It will be hidden from active views.`}
        confirmLabel="Mark Complete"
        variant="primary"
      />
    </>
  );
}
