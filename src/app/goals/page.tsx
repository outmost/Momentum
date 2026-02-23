'use client';
import React, { useState } from 'react';
import { Search, Plus, Flame } from 'lucide-react';
import { useAllGoals } from '@/hooks/useGoals';
import { useFolders } from '@/hooks/useFolders';
import { useAllGoalStats, useOverallStreak } from '@/hooks/useStats';
import { FolderSection } from '@/components/folders/FolderSection';
import { Modal } from '@/components/ui/Modal';
import { FolderForm } from '@/components/folders/FolderForm';
import { MAX_HABITS } from '@/lib/utils';
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
  const [habitFormOpen, setHabitFormOpen] = useState(false);

  const statsMap = new Map(allStats?.map(s => [s.goal.id, s]) ?? []);
  const habitCount = folders?.length ?? 0;
  const atHabitLimit = habitCount >= MAX_HABITS;

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
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 animate-in">
        <div>
          <h1 className="page-title">Habits</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>
            {habitCount}/{MAX_HABITS} habits · key results track progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          {streak && streak.current > 0 && (
            <div className="streak-badge">
              <Flame size={13} className={streak.current >= 3 ? 'animate-streak-flame' : ''} />
              <span className="tabular">{streak.current}</span>
            </div>
          )}
          <button
            onClick={() => setHabitFormOpen(true)}
            disabled={atHabitLimit}
            className="btn btn-secondary btn-icon"
            title={atHabitLimit ? `Maximum of ${MAX_HABITS} habits reached` : 'New habit'}
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative mb-4 animate-in">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-3)' }}
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search key results…"
          className="field"
          style={{ paddingLeft: '32px' }}
        />
      </div>

      {/* ── Status filter chips ── */}
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

      {/* ── Habit sections (each shows 66-day ring + mini heatmap + key results) ── */}
      <div className="space-y-3">
        {(folders ?? []).map(folder => {
          const folderGoals = (grouped.get(folder.id) ?? []).map(g => ({
            ...g,
            completionRate7: statsMap.get(g.id)?.completionRate7 ?? 0,
            currentStreak: statsMap.get(g.id)?.currentStreak ?? 0,
          }));
          if (statusFilter !== 'all' && folderGoals.length === 0) return null;
          return <FolderSection key={folder.id} folder={folder} goals={folderGoals} />;
        })}

        {/* Uncategorized (goals without a habit) */}
        {(grouped.get(null)?.length ?? 0) > 0 && (
          <FolderSection
            goals={(grouped.get(null) ?? []).map(g => ({
              ...g,
              completionRate7: statsMap.get(g.id)?.completionRate7 ?? 0,
              currentStreak: statsMap.get(g.id)?.currentStreak ?? 0,
            }))}
          />
        )}

        {/* Empty state */}
        {filteredGoals.length === 0 && (
          <div className="text-center py-12 animate-in">
            {(folders ?? []).length === 0 ? (
              <>
                <p className="text-3xl mb-3">🌱</p>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
                  Start with a habit
                </p>
                <p className="text-sm mb-5" style={{ color: 'var(--text-3)', maxWidth: 240, margin: '0 auto 20px' }}>
                  Choose a life area, then add 3–5 key results to track for 66 days.
                </p>
                <button
                  onClick={() => setHabitFormOpen(true)}
                  className="btn btn-primary"
                >
                  <Plus size={14} />
                  Create your first habit
                </button>
              </>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                {search ? 'No key results match your search.' : 'No key results here.'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── New habit modal ── */}
      <Modal open={habitFormOpen} onClose={() => setHabitFormOpen(false)} title="New habit">
        <FolderForm onClose={() => setHabitFormOpen(false)} />
      </Modal>
    </div>
  );
}
