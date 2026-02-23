'use client';
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DndContext, closestCenter, DragEndEvent,
  useSensor, useSensors, PointerSensor, KeyboardSensor,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  arrayMove, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { GoalListItem } from '@/components/goals/GoalListItem';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { deleteFolder, updateFolder } from '@/hooks/useFolders';
import { reorderGoals } from '@/hooks/useGoals';
import { useHabitFormationProgress } from '@/hooks/useStats';
import { MIN_GOALS_PER_HABIT, MAX_GOALS_PER_HABIT } from '@/lib/utils';
import type { Folder, Goal } from '@/types';

interface GoalWithStats extends Goal { completionRate7?: number; currentStreak?: number; }
interface FolderSectionProps {
  folder?: Folder;
  goals: GoalWithStats[];
  defaultExpanded?: boolean;
}

/** Horizontal 66-day habit formation progress bar with milestone ticks */
function FormationBar({
  practicedDays,
  target,
  color,
}: {
  practicedDays: number;
  target: number;
  color: string;
}) {
  const pct = Math.min(practicedDays / target, 1) * 100;
  const milestones = [21, 44, 66];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>
          Habit formation
        </span>
        <span className="text-xs font-semibold tabular" style={{ color }}>
          {practicedDays} / {target} days
        </span>
      </div>

      {/* Bar track */}
      <div
        className="relative w-full rounded-full overflow-hidden"
        style={{ height: 8, backgroundColor: 'var(--border)' }}
      >
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            boxShadow: pct > 0 ? `0 0 6px color-mix(in srgb, ${color} 50%, transparent)` : 'none',
          }}
        />
        {/* Milestone ticks */}
        {milestones.map(m => {
          const reached = practicedDays >= m;
          const pos = (m / target) * 100;
          return (
            <div
              key={m}
              className="absolute top-0 bottom-0 w-px"
              style={{
                left: `${pos}%`,
                backgroundColor: reached
                  ? 'color-mix(in srgb, var(--bg) 60%, transparent)'
                  : 'color-mix(in srgb, var(--text-3) 30%, transparent)',
              }}
            />
          );
        })}
      </div>

      {/* Milestone labels */}
      <div className="relative" style={{ height: 14 }}>
        {milestones.map(m => {
          const reached = practicedDays >= m;
          const pos = (m / target) * 100;
          return (
            <span
              key={m}
              className="absolute text-[10px] tabular -translate-x-1/2"
              style={{
                left: `${pos}%`,
                color: reached ? color : 'var(--text-3)',
                fontWeight: reached ? 600 : 400,
              }}
            >
              {m}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function FolderSection({ folder, goals, defaultExpanded = true }: FolderSectionProps) {
  const [expanded, setExpanded]     = useState(defaultExpanded);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editName, setEditName]     = useState(false);
  const [newName, setNewName]       = useState(folder?.name ?? '');
  const [localGoals, setLocalGoals] = useState<GoalWithStats[]>(goals);

  useEffect(() => { setLocalGoals(goals); }, [goals]);

  // 66-day formation progress (only when folder/habit exists)
  const formation = useHabitFormationProgress(
    folder?.id ?? '',
    folder?.startedAt ?? Date.now()
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleRename() {
    if (folder && newName.trim()) await updateFolder(folder.id, { name: newName.trim() });
    setEditName(false);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localGoals.findIndex(g => g.id === active.id);
    const newIndex = localGoals.findIndex(g => g.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(localGoals, oldIndex, newIndex);
    setLocalGoals(reordered);
    await reorderGoals(reordered.map(g => g.id), reordered.map((_, i) => (i + 1) * 1000));
  }

  const habitColor = folder?.color ?? 'var(--accent)';
  const goalCountOk = localGoals.length >= MIN_GOALS_PER_HABIT && localGoals.length <= MAX_GOALS_PER_HABIT;

  return (
    <div className="card-overflow">
      {/* ── Header ── */}
      <div
        className="px-4 pt-4 pb-3"
        style={{ borderBottom: expanded && localGoals.length > 0 ? '1px solid var(--border)' : 'none' }}
      >
        {/* Row 1: toggle + name + count + menu */}
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 flex-1 min-w-0">
            {expanded
              ? <ChevronDown  size={14} style={{ color: 'var(--text-3)' }} className="shrink-0" />
              : <ChevronRight size={14} style={{ color: 'var(--text-3)' }} className="shrink-0" />
            }
            {folder ? (
              !editName && (
                <span
                  className="text-sm font-semibold truncate"
                  style={{ color: 'var(--text-2)' }}
                >
                  {folder.icon} {folder.name}
                </span>
              )
            ) : (
              <span className="text-sm font-semibold" style={{ color: 'var(--text-3)' }}>
                Other
              </span>
            )}
          </button>

          {editName && folder && (
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={e => e.key === 'Enter' && handleRename()}
              autoFocus
              className="flex-1 text-sm px-2 py-1 rounded-lg focus:outline-none bg-transparent"
              style={{ border: '1px solid var(--accent)', color: 'var(--text)' }}
            />
          )}

          {/* Goal count */}
          <span
            className="text-xs font-semibold tabular shrink-0"
            style={{ color: goalCountOk ? 'var(--text-3)' : 'var(--danger)' }}
            title={`${localGoals.length} goal${localGoals.length !== 1 ? 's' : ''} (aim for ${MIN_GOALS_PER_HABIT}–${MAX_GOALS_PER_HABIT})`}
          >
            {localGoals.length}/{MAX_GOALS_PER_HABIT}
          </span>

          {folder && (
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
                    className="absolute right-0 top-8 z-20 w-40 card-sm py-1"
                    style={{ boxShadow: 'var(--shadow-md)' }}
                  >
                    <button
                      onClick={() => { setEditName(true); setMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors hover:bg-[var(--surface-2)]"
                      style={{ color: 'var(--text-2)' }}
                    >
                      <Pencil size={13} /> Rename habit
                    </button>
                    <button
                      onClick={() => { setDeleteOpen(true); setMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors hover:bg-[var(--danger-soft)]"
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 size={13} /> Delete habit
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Row 2: 66-day formation progress bar (habits only) */}
        {folder && formation && (
          <FormationBar
            practicedDays={formation.practicedDays}
            target={formation.target}
            color={habitColor}
          />
        )}
      </div>

      {/* ── Goal list ── */}
      {expanded && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={localGoals.map(g => g.id)} strategy={verticalListSortingStrategy}>
            {localGoals.map((goal, i) => (
              <GoalListItem
                key={goal.id}
                goal={goal}
                completionRate7={goal.completionRate7}
                currentStreak={goal.currentStreak}
                draggable
                isLast={i === localGoals.length - 1}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {/* ── Empty state ── */}
      {expanded && localGoals.length === 0 && (
        <p className="px-4 py-6 text-sm text-center" style={{ color: 'var(--text-3)' }}>
          No goals yet — add {MIN_GOALS_PER_HABIT}–{MAX_GOALS_PER_HABIT} to complete this habit.
        </p>
      )}

      {/* ── Goal count guidance ── */}
      {expanded && localGoals.length > 0 && localGoals.length < MIN_GOALS_PER_HABIT && (
        <p className="px-4 py-2 text-xs text-center" style={{ color: 'var(--text-3)' }}>
          Add {MIN_GOALS_PER_HABIT - localGoals.length} more goal{MIN_GOALS_PER_HABIT - localGoals.length !== 1 ? 's' : ''} to complete this habit
        </p>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => { if (folder) deleteFolder(folder.id); setDeleteOpen(false); }}
        title="Delete habit"
        message={`Delete "${folder?.name}"? Goals will be moved to uncategorized.`}
        confirmLabel="Delete Habit"
        variant="danger"
      />
    </div>
  );
}
