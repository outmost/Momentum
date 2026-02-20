'use client';
import React, { useState } from 'react';
import { Search, Filter, Plus, FolderPlus } from 'lucide-react';
import { useAllGoals } from '@/hooks/useGoals';
import { useFolders } from '@/hooks/useFolders';
import { useAllGoalStats } from '@/hooks/useStats';
import { FolderSection } from '@/components/folders/FolderSection';
import { Modal } from '@/components/ui/Modal';
import { GoalForm } from '@/components/goals/GoalForm';
import { FolderForm } from '@/components/folders/FolderForm';
import type { Goal, GoalStatus } from '@/types';

const STATUS_FILTERS: { label: string; value: GoalStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed', value: 'completed' },
  { label: 'Archived', value: 'archived' },
];

export default function GoalsPage() {
  const goals = useAllGoals();
  const folders = useFolders();
  const allStats = useAllGoalStats();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<GoalStatus | 'all'>('all');
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [folderFormOpen, setFolderFormOpen] = useState(false);
  
  const statsMap = new Map(allStats?.map(s => [s.goal.id, s]) ?? []);
  
  // Filter goals
  const filteredGoals = (goals ?? []).filter(g => {
    if (statusFilter !== 'all' && g.status !== statusFilter) return false;
    if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  
  // Group by folder
  const grouped = new Map<string | null, Goal[]>();
  for (const goal of filteredGoals) {
    const key = goal.folderId || null;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(goal);
  }
  
  // Ordered folders
  const orderedFolders = folders ?? [];
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Goals</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFolderFormOpen(true)}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="New folder"
          >
            <FolderPlus size={20} />
          </button>
          <button
            onClick={() => setGoalFormOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} /> Goal
          </button>
        </div>
      </div>
      
      {/* Search + filter */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search goals..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex gap-1 overflow-x-auto pb-1">
          {STATUS_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Goal groups */}
      <div className="space-y-4">
        {orderedFolders.map(folder => {
          const folderGoals = (grouped.get(folder.id) ?? []).map(g => ({
            ...g,
            completionRate7: statsMap.get(g.id)?.completionRate7 ?? 0,
          }));
          if (statusFilter !== 'all' && folderGoals.length === 0) return null;
          return (
            <FolderSection
              key={folder.id}
              folder={folder}
              goals={folderGoals}
            />
          );
        })}
        
        {(grouped.get(null)?.length ?? 0) > 0 && (
          <FolderSection
            goals={(grouped.get(null) ?? []).map(g => ({
              ...g,
              completionRate7: statsMap.get(g.id)?.completionRate7 ?? 0,
            }))}
          />
        )}
        
        {filteredGoals.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {search ? 'No goals match your search.' : 'No goals yet. Create one to get started!'}
          </div>
        )}
      </div>
      
      <Modal open={goalFormOpen} onClose={() => setGoalFormOpen(false)} title="New Goal">
        <GoalForm onClose={() => setGoalFormOpen(false)} />
      </Modal>
      
      <Modal open={folderFormOpen} onClose={() => setFolderFormOpen(false)} title="New Folder">
        <FolderForm onClose={() => setFolderFormOpen(false)} />
      </Modal>
    </div>
  );
}
