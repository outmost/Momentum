'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
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

  const [category, setCategory] = useState<HabitCategory>(folder?.category ?? 'custom');
  const [customName, setCustomName] = useState(
    folder?.name ?? ''
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedCat = HABIT_CATEGORIES.find(c => c.id === category)!;

  // For editing, use the stored name; for new, derive from category unless custom
  function getEffectiveName(): string {
    if (category === 'custom') return customName.trim();
    // If editing and name was customised, keep it — otherwise use category label
    if (folder && folder.category === category) return folder.name;
    return selectedCat.label;
  }

  const atLimit = !folder && habitCount >= MAX_HABITS;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const name = getEffectiveName();
    if (!name) {
      setError('Please enter a name for your custom habit.');
      return;
    }
    if (atLimit) {
      setError(`You can have at most ${MAX_HABITS} habits.`);
      return;
    }
    setSaving(true);
    try {
      if (folder) {
        await updateFolder(folder.id, {
          name,
          color: selectedCat.color,
          icon: selectedCat.icon,
          category,
        });
      } else {
        await createFolder({
          name,
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
    <form onSubmit={handleSubmit} className="p-6 space-y-5">

      {/* Habit count indicator */}
      {!folder && (
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            Choose a life area to build habits in
          </p>
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

      {/* Category grid */}
      <div className="grid grid-cols-2 gap-2">
        {HABIT_CATEGORIES.map(cat => {
          const isSelected = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className="flex items-start gap-3 p-3.5 rounded-xl text-left transition-colors"
              style={{
                border: `1.5px solid ${isSelected ? cat.color : 'var(--border)'}`,
                backgroundColor: isSelected
                  ? `color-mix(in srgb, ${cat.color} 10%, var(--surface))`
                  : 'var(--surface)',
              }}
            >
              <span className="text-2xl leading-none shrink-0 mt-0.5">{cat.icon}</span>
              <div className="min-w-0">
                <p
                  className="text-sm font-semibold leading-tight"
                  style={{ color: isSelected ? cat.color : 'var(--text)' }}
                >
                  {cat.label}
                </p>
                <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-3)' }}>
                  {cat.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom name field — only shown for custom category or when editing */}
      {(category === 'custom' || folder) && (
        <div>
          <label
            className="block text-xs font-medium mb-1.5"
            style={{ color: 'var(--text-2)' }}
          >
            {category === 'custom' ? 'Habit name *' : 'Name (optional override)'}
          </label>
          <input
            value={category === 'custom' ? customName : (folder?.name ?? selectedCat.label)}
            onChange={e => {
              if (category === 'custom') setCustomName(e.target.value);
              else updateFolder(folder!.id, { name: e.target.value });
            }}
            placeholder={category === 'custom' ? 'e.g. Morning Pages' : selectedCat.label}
            maxLength={50}
            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
            style={{
              border: '1px solid var(--border)',
              backgroundColor: 'transparent',
              color: 'var(--text)',
            }}
            autoFocus={category === 'custom'}
          />
        </div>
      )}

      {error && (
        <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={saving} disabled={atLimit && !folder}>
          {folder ? 'Update habit' : 'Create habit'}
        </Button>
      </div>

      {atLimit && !folder && (
        <p className="text-xs text-center" style={{ color: 'var(--danger)' }}>
          You&apos;ve reached the maximum of {MAX_HABITS} habits. Remove one to add another.
        </p>
      )}
    </form>
  );
}
