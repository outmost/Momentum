'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { MoreVertical, Pause, Play, Archive, Trash2, CheckCircle, GripVertical, Share2, Plus } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ShareModal } from '@/components/sharing/ShareModal';
import { VisibilityBadge } from '@/components/sharing/VisibilityPicker';
import { deleteGoal, pauseGoal, resumeGoal, archiveGoal, completeGoal, resumeGoal as undoComplete } from '@/hooks/useGoals';
import { useUIStore } from '@/lib/store';
import type { Goal } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  binary: '\u2713', numeric: '#', timer: '\u23F1',
};

interface GoalListItemProps {
  goal: Goal;
  currentStreak?: number;
  draggable?: boolean;
  isLast?: boolean;
}

export function GoalListItem({ goal, currentStreak = 0, draggable = false, isLast = false }: GoalListItemProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen]       = useState(false);
  const [deleteOpen, setDeleteOpen]   = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [shareOpen, setShareOpen]     = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const setToast = useUIStore(s => s.setToast);

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

  // Position the dropdown based on the button's location
  const openMenu = useCallback(() => {
    if (menuBtnRef.current) {
      const rect = menuBtnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 4,
        left: rect.right - 144, // w-36 = 144px, right-aligned
      });
    }
    setMenuOpen(true);
  }, []);

  // Close menu on scroll (since portal position would be stale)
  useEffect(() => {
    if (!menuOpen) return;
    const handleScroll = () => setMenuOpen(false);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [menuOpen]);

  async function handleComplete() {
    const goalId = goal.id;
    const goalTitle = goal.title;
    await completeGoal(goalId);
    setCompleteOpen(false);
    setToast({
      message: `"${goalTitle}" completed`,
      undoAction: () => undoComplete(goalId),
    });
  }

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

        <span className="text-xs font-mono w-3 shrink-0 select-none" style={{ color: 'var(--text-3)' }}>
          {TYPE_LABELS[goal.type]}
        </span>

        <button
          onClick={() => router.push(`/goals/${goal.id}`)}
          className="flex-1 text-left text-sm font-medium line-clamp-1 transition-colors"
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

        {goal.visibility && goal.visibility !== 'private' && (
          <span className="shrink-0">
            <VisibilityBadge visibility={goal.visibility} />
          </span>
        )}

        {goal.visibility && goal.visibility !== 'private' && (
          <button
            onClick={e => { e.stopPropagation(); setShareOpen(true); }}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded transition-all duration-200 hover:scale-110 active:scale-90"
            style={{ color: 'var(--accent)' }}
            title="Share"
          >
            <Share2 size={12} />
          </button>
        )}

        {/* Streak badge */}
        {currentStreak > 0 && (
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: 'var(--streak-soft)', border: '1px solid color-mix(in srgb, var(--streak) 20%, transparent)' }}
          >
            <span style={{ fontSize: '11px' }}>🔥</span>
            <span className="text-xs font-semibold tabular" style={{ color: 'var(--streak)' }}>{currentStreak}</span>
          </div>
        )}

        <button
          onClick={() => router.push(`/goals/${goal.id}`)}
          className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors hover:bg-[var(--surface-3)]"
          style={{ color: 'var(--text-3)', border: '1px solid var(--border)' }}
          title="Track today"
        >
          <Plus size={10} />
          Track
        </button>

        <div className="shrink-0">
          <button
            ref={menuBtnRef}
            onClick={openMenu}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--border)]"
            style={{ color: 'var(--text-3)' }}
          >
            <MoreVertical size={14} />
          </button>
        </div>
      </div>

      {/* Dropdown menu — rendered via portal to avoid overflow clipping */}
      {menuOpen && menuPos && createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setMenuOpen(false)} />
          <div
            className="fixed z-[61] w-36 card-sm py-1"
            style={{
              top: menuPos.top,
              left: Math.max(8, menuPos.left),
              boxShadow: 'var(--shadow-md)',
            }}
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
        </>,
        document.body
      )}

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
        onConfirm={handleComplete}
        title="Mark complete"
        message={`Mark "${goal.title}" as completed? You can undo this afterwards.`}
        confirmLabel="Mark Complete"
        variant="primary"
      />

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        goal={goal}
      />
    </>
  );
}
