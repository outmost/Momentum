'use client';
import React, { useState } from 'react';
import { Search, FolderPlus, Flame } from 'lucide-react';
import { useAllGoals } from '@/hooks/useGoals';
import { useFolders } from '@/hooks/useFolders';
import { useAllGoalStats, useOverallStreak } from '@/hooks/useStats';
import { FolderSection } from '@/components/folders/FolderSection';
import { CompletionChart } from '@/components/dashboard/CompletionChart';
import { Modal } from '@/components/ui/Modal';
import { FolderForm } from '@/components/folders/FolderForm';
import type { Goal, GoalStatus } from '@/types';

const STATUS_FILTERS: { label: string; value: GoalStatus | 'all' }[] = [
  { label: 'Active',   value: 'active' },
  { label: 'Paused',   value: 'paused' },
  { label: 'Done',     value: 'completed' },
  { label: 'Archived', value: 'archived' },
  { label: 'All',      value: 'all' },
];

export default function GoalsPage() {
  const goals    = useAllGoals();
  const folders  = useFolders();
  const allStats = useAllGoalStats();
  const streak   = useOverallStreak();
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<GoalStatus | 'all'>('active');
  const [folderFormOpen, setFolderFormOpen] = useState(false);

  const statsMap = new Map(allStats?.map(s => [s.goal.id, s]) ?? []);

  const filteredGoals = (goals ?? [])
    .filter(g => {
      if (statusFilter !== 'all' && g.status !== statusFilter) return false;
      if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
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
      <div className="flex items-center justify-between mb-6 animate-in">
        <h1 className="page-title">Goals</h1>
        <div className="flex items-center gap-2">
          {streak && streak.current > 0 && (
            <div className="streak-badge">
              <Flame size={13} className={streak.current >= 3 ? 'animate-streak-flame' : ''} />
              <span className="tabular">{streak.current}</span>
            </div>
          )}
          <button
            onClick={() => setFolderFormOpen(true)}
            className="btn btn-secondary btn-icon"
            title="New folder"
          >
            <FolderPlus size={15} />
          </button>
        </div>
      </div>

      {/* Activity heatmap — replaces the separate Progress tab */}
      <div className="mb-5">
        <CompletionChart />
      </div>

      {/* Search */}
      <div className="relative mb-4 animate-in">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-3)' }}
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search goals…"
          className="field"
          style={{ paddingLeft: '32px' }}
        />
      </div>

      {/* Status filter chips */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto scrollbar-hide">
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={statusFilter === value ? 'chip chip-active' : 'chip'}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Goal groups by folder — each folder shows a mini heatmap */}
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
          <div className="text-center py-12 animate-in">
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              {search ? 'No goals match your search.' : 'No goals here.'}
            </p>
          </div>
        )}
      </div>

      <Modal open={folderFormOpen} onClose={() => setFolderFormOpen(false)} title="New folder">
        <FolderForm onClose={() => setFolderFormOpen(false)} />
      </Modal>
    </div>
  );
}
