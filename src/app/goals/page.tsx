'use client';
import React, { useState } from 'react';
import { Search, Plus, FolderPlus } from 'lucide-react';
import { useAllGoals } from '@/hooks/useGoals';
import { useFolders } from '@/hooks/useFolders';
import { useAllGoalStats } from '@/hooks/useStats';
import { FolderSection } from '@/components/folders/FolderSection';
import { Modal } from '@/components/ui/Modal';
import { GoalForm } from '@/components/goals/GoalForm';
import { FolderForm } from '@/components/folders/FolderForm';
import type { Goal, GoalStatus } from '@/types';

const STATUS_FILTERS: { label: string; value: GoalStatus | 'all' }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed', value: 'completed' },
  { label: 'Archived', value: 'archived' },
  { label: 'All', value: 'all' },
];

export default function GoalsPage() {
  const goals = useAllGoals();
  const folders = useFolders();
  const allStats = useAllGoalStats();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<GoalStatus | 'all'>('active');
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [folderFormOpen, setFolderFormOpen] = useState(false);

  const statsMap = new Map(allStats?.map(s => [s.goal.id, s]) ?? []);

  const filteredGoals = (goals ?? [])
    .filter(g => {
      if (statusFilter !== 'all' && g.status !== statusFilter) return false;
      if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    // Sort by sortOrder so drag reorder is reflected immediately
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const grouped = new Map<string | null, Goal[]>();
  for (const goal of filteredGoals) {
    const key = goal.folderId || null;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(goal);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Goals</h1>
        <div className="flex gap-1.5">
          <button
            onClick={() => setFolderFormOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded transition-colors"
            style={{ color: 'var(--text-3)', border: '1px solid var(--border)' }}
            title="New folder"
          >
            <FolderPlus size={15} />
          </button>
          <button
            onClick={() => setGoalFormOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            <Plus size={14} /> Goal
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search goals…"
          className="w-full pl-8 pr-3 py-2 rounded-lg text-sm focus:outline-none"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
      </div>

      {/* Status filter */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className="px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors"
            style={{
              backgroundColor: statusFilter === value ? 'var(--text)' : 'transparent',
              color: statusFilter === value ? 'var(--bg)' : 'var(--text-3)',
              border: statusFilter === value ? '1px solid transparent' : '1px solid var(--border)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Goal groups */}
      <div className="space-y-3">
        {(folders ?? []).map(folder => {
          const folderGoals = (grouped.get(folder.id) ?? []).map(g => ({
            ...g, completionRate7: statsMap.get(g.id)?.completionRate7 ?? 0,
          }));
          if (statusFilter !== 'all' && folderGoals.length === 0) return null;
          return <FolderSection key={folder.id} folder={folder} goals={folderGoals} />;
        })}

        {(grouped.get(null)?.length ?? 0) > 0 && (
          <FolderSection
            goals={(grouped.get(null) ?? []).map(g => ({
              ...g, completionRate7: statsMap.get(g.id)?.completionRate7 ?? 0,
            }))}
          />
        )}

        {filteredGoals.length === 0 && (
          <p className="text-sm text-center py-12" style={{ color: 'var(--text-3)' }}>
            {search ? 'No goals match your search.' : 'No goals here.'}
          </p>
        )}
      </div>

      <Modal open={goalFormOpen} onClose={() => setGoalFormOpen(false)} title="New goal">
        <GoalForm onClose={() => setGoalFormOpen(false)} />
      </Modal>
      <Modal open={folderFormOpen} onClose={() => setFolderFormOpen(false)} title="New folder">
        <FolderForm onClose={() => setFolderFormOpen(false)} />
      </Modal>
    </div>
  );
}
