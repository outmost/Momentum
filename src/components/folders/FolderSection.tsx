'use client';
import React, { useState, useEffect, useMemo } from 'react';
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
import { MiniHeatmap } from '@/components/goals/MiniHeatmap';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { deleteFolder, updateFolder } from '@/hooks/useFolders';
import { reorderGoals } from '@/hooks/useGoals';
import { useFolderHeatmap, useHabitFormationProgress } from '@/hooks/useStats';
import { HABIT_FORMATION_DAYS, MIN_GOALS_PER_HABIT, MAX_GOALS_PER_HABIT } from '@/lib/utils';
import type { Folder, Goal } from '@/types';

interface GoalWithStats extends Goal { completionRate7?: number; currentStreak?: number; }
interface FolderSectionProps {
  folder?: Folder;
  goals: GoalWithStats[];
  defaultExpanded?: boolean;
}

/** Circular progress ring for 66-day habit formation */
function FormationRing({
  practicedDays,
  target,
  color,
  size = 36,
}: {
  practicedDays: number;
  target: number;
  color: string;
  size?: number;
}) {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(practicedDays / target, 1);
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={3}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {/* Day count */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ fontSize: '9px', fontWeight: 700, color }}
      >
        {practicedDays}
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

  const goalIds = useMemo(() => localGoals.map(g => g.id), [localGoals]);
  const heatmapData = useFolderHeatmap(goalIds);

  // 66-day formation progress (only when folder/habit is provided)
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
        className="flex items-center px-4 py-3 gap-2"
        style={{ borderBottom: expanded && localGoals.length > 0 ? '1px solid var(--border)' : 'none' }}
      >
        {/* 66-day formation ring (habits only) */}
        {folder && formation && (
          <FormationRing
            practicedDays={formation.practicedDays}
            target={formation.target}
            color={habitColor}
          />
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 flex-1 min-w-0"
        >
          {expanded
            ? <ChevronDown  size={12} style={{ color: 'var(--text-3)' }} className="shrink-0" />
            : <ChevronRight size={12} style={{ color: 'var(--text-3)' }} className="shrink-0" />
          }
          {folder ? (
            <div className="flex flex-col min-w-0">
              {!editName && (
                <span
                  className="text-[12px] font-semibold uppercase tracking-widest truncate"
                  style={{ color: 'var(--text-2)' }}
                >
                  {folder.icon} {folder.name}
                </span>
              )}
              {/* Formation progress label */}
              {formation && (
                <span className="text-[9px] tabular" style={{ color: 'var(--text-3)' }}>
                  {formation.practicedDays}/{HABIT_FORMATION_DAYS} days formed
                </span>
              )}
            </div>
          ) : (
            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
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
            className="flex-1 text-xs px-2 py-1 rounded-lg focus:outline-none bg-transparent"
            style={{ border: '1px solid var(--accent)', color: 'var(--text)' }}
          />
        )}

        {/* Goal count with colour hint */}
        <span
          className="text-[11px] tabular shrink-0"
          style={{ color: goalCountOk ? 'var(--text-3)' : 'var(--danger)', fontWeight: goalCountOk ? 400 : 600 }}
          title={`${localGoals.length} key result${localGoals.length !== 1 ? 's' : ''} (aim for ${MIN_GOALS_PER_HABIT}–${MAX_GOALS_PER_HABIT})`}
        >
          {localGoals.length}/{MAX_GOALS_PER_HABIT}
        </span>

        {folder && (
          <div className="relative ml-0.5 shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--border)]"
              style={{ color: 'var(--text-3)' }}
            >
              <MoreVertical size={13} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div
                  className="absolute right-0 top-7 z-20 w-36 card-sm py-1"
                  style={{ boxShadow: 'var(--shadow-md)' }}
                >
                  <button
                    onClick={() => { setEditName(true); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-left transition-colors hover:bg-[var(--surface-2)]"
                    style={{ color: 'var(--text-2)' }}
                  >
                    <Pencil size={12} /> Rename habit
                  </button>
                  <button
                    onClick={() => { setDeleteOpen(true); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-left transition-colors hover:bg-[var(--danger-soft)]"
                    style={{ color: 'var(--danger)' }}
                  >
                    <Trash2 size={12} /> Delete habit
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Mini heatmap ── */}
      {expanded && localGoals.length > 0 && heatmapData && heatmapData.length > 0 && (
        <div
          className="px-4 py-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <MiniHeatmap data={heatmapData} />
        </div>
      )}

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

      {/* ── Empty habit prompt ── */}
      {expanded && localGoals.length === 0 && (
        <p className="px-4 py-6 text-xs text-center" style={{ color: 'var(--text-3)' }}>
          No key results yet — add {MIN_GOALS_PER_HABIT}–{MAX_GOALS_PER_HABIT} to complete this habit.
        </p>
      )}

      {/* ── Goal count guidance ── */}
      {expanded && localGoals.length > 0 && localGoals.length < MIN_GOALS_PER_HABIT && (
        <p className="px-4 py-2 text-[11px] text-center" style={{ color: 'var(--text-3)' }}>
          Add {MIN_GOALS_PER_HABIT - localGoals.length} more key result{MIN_GOALS_PER_HABIT - localGoals.length !== 1 ? 's' : ''} to complete this habit
        </p>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => { if (folder) deleteFolder(folder.id); setDeleteOpen(false); }}
        title="Delete habit"
        message={`Delete "${folder?.name}"? Key results will be moved to uncategorized.`}
        confirmLabel="Delete Habit"
        variant="danger"
      />
    </div>
  );
}
