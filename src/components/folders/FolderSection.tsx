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
import type { Folder, Goal } from '@/types';

interface GoalWithStats extends Goal { completionRate7?: number; }
interface FolderSectionProps {
  folder?: Folder;
  goals: GoalWithStats[];
  defaultExpanded?: boolean;
}

export function FolderSection({ folder, goals, defaultExpanded = true }: FolderSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editName, setEditName] = useState(false);
  const [newName, setNewName] = useState(folder?.name ?? '');
  // Local copy for optimistic drag reorder
  const [localGoals, setLocalGoals] = useState<GoalWithStats[]>(goals);

  // Sync when parent data changes (after DB write)
  useEffect(() => { setLocalGoals(goals); }, [goals]);

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
    setLocalGoals(reordered); // Optimistic — instant visual feedback
    await reorderGoals(
      reordered.map(g => g.id),
      reordered.map((_, i) => (i + 1) * 1000),
    );
  }

  return (
    // No overflow-hidden — it clips the drag ghost
    <div className="rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <div
        className="flex items-center px-4 py-2.5"
        style={{ borderBottom: expanded && localGoals.length > 0 ? '1px solid var(--border)' : 'none' }}
      >
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 flex-1 min-w-0">
          {expanded
            ? <ChevronDown size={12} style={{ color: 'var(--text-3)' }} className="shrink-0" />
            : <ChevronRight size={12} style={{ color: 'var(--text-3)' }} className="shrink-0" />
          }
          {folder ? (
            <span className="text-[11px] font-semibold uppercase tracking-widest truncate" style={{ color: 'var(--text-2)' }}>
              {!editName && `${folder.icon} ${folder.name}`}
            </span>
          ) : (
            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Other</span>
          )}
        </button>

        {editName && folder && (
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => e.key === 'Enter' && handleRename()}
            autoFocus
            className="flex-1 text-xs px-2 py-1 rounded focus:outline-none bg-transparent"
            style={{ border: '1px solid var(--accent)', color: 'var(--text)' }}
          />
        )}

        <span className="text-[11px] ml-2 tabular shrink-0" style={{ color: 'var(--text-3)' }}>{localGoals.length}</span>

        {folder && (
          <div className="relative ml-1 shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-6 h-6 flex items-center justify-center rounded"
              style={{ color: 'var(--text-3)' }}
            >
              <MoreVertical size={13} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div
                  className="absolute right-0 top-7 z-20 w-32 rounded-lg py-1"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}
                >
                  <button onClick={() => { setEditName(true); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm" style={{ color: 'var(--text-2)' }}>
                    <Pencil size={12} /> Rename
                  </button>
                  <button onClick={() => { setDeleteOpen(true); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm" style={{ color: 'var(--danger)' }}>
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {expanded && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={localGoals.map(g => g.id)} strategy={verticalListSortingStrategy}>
            {localGoals.map((goal, i) => (
              <GoalListItem
                key={goal.id}
                goal={goal}
                completionRate7={goal.completionRate7}
                draggable
                isLast={i === localGoals.length - 1}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
      {expanded && localGoals.length === 0 && (
        <p className="px-4 py-6 text-xs text-center" style={{ color: 'var(--text-3)' }}>No goals here</p>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => { if (folder) deleteFolder(folder.id); setDeleteOpen(false); }}
        title="Delete folder"
        message={`Delete "${folder?.name}"? Goals will be moved to uncategorized.`}
        confirmLabel="Delete Folder"
        variant="danger"
      />
    </div>
  );
}
