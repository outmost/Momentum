'use client';
import React, { useState, useEffect } from 'react';
import { createFolder, updateFolder, useFolders } from '@/hooks/useFolders';
import { HABIT_CATEGORIES, MAX_HABITS } from '@/lib/utils';
import type { Folder, HabitCategory } from '@/types';

interface FolderFormProps {
  folder?: Folder;
  onClose: () => void;
}

export function FolderForm({ folder, onClose }: FolderFormProps) {
  const folders = useFolders();
  const habitCount = folders?.length ?? 0;

  const [category, setCategory] = useState<HabitCategory>(folder?.category ?? 'physical-health');
  const [name, setName] = useState(folder?.name ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedCat = HABIT_CATEGORIES.find(c => c.id === category)!;

  // When category changes for a new habit, pre-fill name with the category label
  useEffect(() => {
    if (!folder) setName(selectedCat.label);
  }, [category, folder, selectedCat.label]);

  const atLimit = !folder && habitCount >= MAX_HABITS;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const trimmed = name.trim();
    if (!trimmed) { setError('Please enter a habit name.'); return; }
    if (atLimit) { setError(`You can have at most ${MAX_HABITS} habits.`); return; }
    // Duplicate check (ignore self when editing)
    if (folders?.some(f => f.name.toLowerCase() === trimmed.toLowerCase() && f.id !== folder?.id)) {
      setError(`A habit called "${trimmed}" already exists.`);
      return;
    }
    setSaving(true);
    try {
      if (folder) {
        await updateFolder(folder.id, {
          name: trimmed,
          color: selectedCat.color,
          icon: selectedCat.icon,
          category,
        });
      } else {
        await createFolder({
          name: trimmed,
          color: selectedCat.color,
          icon: selectedCat.icon,
          category,
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">

      {/* Habit count indicator (create only) */}
      {!folder && (
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Choose a life area</p>
          <span
            className="text-[11px] font-semibold tabular px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: habitCount >= MAX_HABITS ? 'var(--danger-soft)' : 'var(--surface-2)',
              color: habitCount >= MAX_HABITS ? 'var(--danger)' : 'var(--text-3)',
            }}
          >
            {habitCount}/{MAX_HABITS}
          </span>
        </div>
      )}

      {/* Category grid — compact, matching QuickAddModal */}
      <div className="grid grid-cols-2 gap-2">
        {HABIT_CATEGORIES.map(cat => {
          const isSelected = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-colors"
              style={{
                border: `1.5px solid ${isSelected ? cat.color : 'var(--border)'}`,
                backgroundColor: isSelected
                  ? `color-mix(in srgb, ${cat.color} 10%, var(--surface))`
                  : 'var(--surface)',
              }}
            >
              <span className="text-xl leading-none shrink-0">{cat.icon}</span>
              <p
                className="text-sm font-medium leading-tight"
                style={{ color: isSelected ? cat.color : 'var(--text-2)' }}
              >
                {cat.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Name field */}
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Habit name"
        maxLength={50}
        className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
        style={{
          border: `1.5px solid ${selectedCat.color}`,
          backgroundColor: 'transparent',
          color: 'var(--text)',
        }}
      />

      {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="btn btn-ghost flex-none">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || atLimit}
          className="btn btn-primary flex-1"
        >
          {saving ? 'Saving…' : folder ? 'Update habit' : 'Create habit'}
        </button>
      </div>

      {atLimit && !folder && (
        <p className="text-xs text-center" style={{ color: 'var(--danger)' }}>
          You&apos;ve reached the maximum of {MAX_HABITS} habits.
        </p>
      )}
    </form>
  );
}
