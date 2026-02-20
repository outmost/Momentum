'use client';
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { GoalListItem } from '@/components/goals/GoalListItem';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { deleteFolder, updateFolder } from '@/hooks/useFolders';
import { reorderGoals } from '@/hooks/useGoals';
import { cn } from '@/lib/cn';
import type { Folder, Goal } from '@/types';

interface GoalWithStats extends Goal {
  completionRate7?: number;
}

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
  
  async function handleRename() {
    if (folder && newName.trim()) {
      await updateFolder(folder.id, { name: newName.trim() });
    }
    setEditName(false);
  }
  
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const oldIndex = goals.findIndex(g => g.id === active.id);
    const newIndex = goals.findIndex(g => g.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const reordered = [...goals];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    
    // Generate new sort orders
    const ids = reordered.map(g => g.id);
    const orders = reordered.map((_, i) => (i + 1) * 1000);
    await reorderGoals(ids, orders);
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Folder header */}
      <div className="flex items-center px-4 py-3 border-b border-gray-50 dark:border-gray-700">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          {expanded ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />}
          {folder ? (
            <>
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: folder.color }} />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
                {folder.icon} {editName ? '' : folder.name}
              </span>
            </>
          ) : (
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Other</span>
          )}
        </button>
        
        {editName && folder && (
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => e.key === 'Enter' && handleRename()}
            autoFocus
            className="flex-1 text-sm px-2 py-1 border border-blue-500 rounded focus:outline-none bg-transparent text-gray-900 dark:text-gray-100"
          />
        )}
        
        <span className="text-xs text-gray-400 ml-2 shrink-0">{goals.length}</span>
        
        {folder && (
          <div className="relative ml-2 shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <MoreVertical size={14} />
            </button>
            
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1">
                  <button
                    onClick={() => { setEditName(true); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Pencil size={14} /> Rename
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
        )}
      </div>
      
      {/* Goals */}
      {expanded && (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={goals.map(g => g.id)} strategy={verticalListSortingStrategy}>
            {goals.map(goal => (
              <GoalListItem key={goal.id} goal={goal} completionRate7={goal.completionRate7} draggable />
            ))}
          </SortableContext>
        </DndContext>
      )}
      
      {expanded && goals.length === 0 && (
        <div className="px-4 py-6 text-sm text-gray-400 text-center">No goals in this folder</div>
      )}
      
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => { if (folder) deleteFolder(folder.id); setDeleteOpen(false); }}
        title="Delete Folder"
        message={`Delete "${folder?.name}"? Goals in this folder will be moved to uncategorized.`}
        confirmLabel="Delete Folder"
        variant="danger"
      />
    </div>
  );
}
