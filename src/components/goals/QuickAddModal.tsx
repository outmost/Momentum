'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useFolders, createFolder } from '@/hooks/useFolders';
import { useGoals, createGoal } from '@/hooks/useGoals';
import { useRoutineBlocks } from '@/hooks/useRoutine';
import { HABIT_CATEGORIES, MAX_HABITS, MAX_GOALS_PER_HABIT } from '@/lib/utils';
import type { HabitCategory, GoalType, Frequency } from '@/types';

type Screen = 'choose' | 'habit' | 'goal';

const SCREEN_TITLES: Record<Screen, string> = {
  choose: 'Add new',
  habit:  'New habit',
  goal:   'New goal',
};

// ── Choose screen ──────────────────────────────────────────────────────────
function ChooseScreen({ onHabit, onGoal }: { onHabit: () => void; onGoal: () => void }) {
  return (
    <div className="p-6 space-y-3">
      <button
        onClick={onHabit}
        className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-colors hover:bg-[var(--surface-2)]"
        style={{ border: '1.5px solid var(--border)', backgroundColor: 'var(--surface)' }}
      >
        <span className="text-3xl">🏆</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>New habit</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
            A life area to focus on — e.g. Physical health, Sleep
          </p>
        </div>
      </button>

      <button
        onClick={onGoal}
        className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-colors hover:bg-[var(--surface-2)]"
        style={{ border: '1.5px solid var(--border)', backgroundColor: 'var(--surface)' }}
      >
        <span className="text-3xl">🎯</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>New goal</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
            A daily action to track within a habit
          </p>
        </div>
      </button>
    </div>
  );
}

// ── Habit screen ───────────────────────────────────────────────────────────
function HabitScreen({
  onBack,
  onCreated,
}: {
  onBack: () => void;
  onCreated: (folderId: string) => void;
}) {
  const folders = useFolders();
  const habitCount = folders?.length ?? 0;
  const [category, setCategory] = useState<HabitCategory>('physical-health');
  const [customName, setCustomName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedCat = HABIT_CATEGORIES.find(c => c.id === category)!;
  const atLimit = habitCount >= MAX_HABITS;
  const usedCategories = new Set((folders ?? []).map(f => f.category));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const name = category === 'custom' ? customName.trim() : selectedCat.label;
    if (!name) { setError('Please enter a habit name.'); return; }
    if (atLimit) { setError(`Maximum of ${MAX_HABITS} habits reached.`); return; }

    // Duplicate check
    if (folders?.some(f => f.name.toLowerCase() === name.toLowerCase())) {
      setError(`A habit called "${name}" already exists.`);
      return;
    }

    setSaving(true);
    try {
      const folder = await createFolder({ name, color: selectedCat.color, icon: selectedCat.icon, category });
      onCreated(folder.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      {/* Category grid */}
      <div className="grid grid-cols-2 gap-2">
        {HABIT_CATEGORIES.map(cat => {
          const isSelected = category === cat.id;
          const isUsed = cat.id !== 'custom' && usedCategories.has(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => !isUsed && setCategory(cat.id)}
              disabled={isUsed}
              className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-colors"
              style={{
                border: `1.5px solid ${isSelected ? cat.color : 'var(--border)'}`,
                backgroundColor: isSelected
                  ? `color-mix(in srgb, ${cat.color} 10%, var(--surface))`
                  : 'var(--surface)',
                opacity: isUsed ? 0.38 : 1,
                cursor: isUsed ? 'not-allowed' : 'pointer',
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

      {/* Custom name input */}
      {category === 'custom' && (
        <input
          value={customName}
          onChange={e => setCustomName(e.target.value)}
          placeholder="e.g. Morning Pages"
          maxLength={50}
          autoFocus
          className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
          style={{ border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)' }}
        />
      )}

      {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onBack} className="btn btn-ghost flex-none">
          Back
        </button>
        <button type="submit" disabled={saving || atLimit} className="btn btn-primary flex-1">
          {saving ? 'Creating…' : 'Create habit & add goal →'}
        </button>
      </div>
    </form>
  );
}

// ── Goal screen ────────────────────────────────────────────────────────────
function GoalScreen({
  onClose,
  onBack,
  preselectedFolderId,
  onNewHabit,
}: {
  onClose: () => void;
  onBack: () => void;
  preselectedFolderId?: string;
  onNewHabit: () => void;
}) {
  const folders = useFolders();
  const routineBlocks = useRoutineBlocks();
  const [folderId, setFolderId] = useState(preselectedFolderId ?? '');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<GoalType>('binary');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [duration, setDuration] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [routineBlockId, setRoutineBlockId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // When preselectedFolderId arrives (after habit creation), apply it
  useEffect(() => {
    if (preselectedFolderId) setFolderId(preselectedFolderId);
  }, [preselectedFolderId]);

  // Auto-select the only habit if there's exactly one
  useEffect(() => {
    if (folders?.length === 1 && !folderId) setFolderId(folders[0].id);
  }, [folders, folderId]);

  const habitGoals = useGoals(folderId || undefined, 'active');
  const goalCount = folderId ? (habitGoals?.length ?? 0) : 0;
  const atGoalLimit = folderId !== '' && goalCount >= MAX_GOALS_PER_HABIT;

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError('');
    if (!folderId) { setError('Please select a habit.'); return; }
    if (!title.trim()) { setError('Please enter a title.'); titleRef.current?.focus(); return; }
    if (atGoalLimit) { setError(`This habit already has ${MAX_GOALS_PER_HABIT} goals (maximum).`); return; }
    if (frequency === 'custom' && customDays.length === 0) { setError('Select at least one day.'); return; }
    setSaving(true);
    try {
      await createGoal({
        title: title.trim(),
        type,
        status: 'active',
        folderId,
        routineBlockId: routineBlockId || undefined,
        frequency,
        customDays: frequency === 'custom' ? customDays : undefined,
        reminderEnabled: false,
        visibility: 'private',
        target: type === 'numeric' && target ? parseFloat(target) : undefined,
        unit:   type === 'numeric' && unit   ? unit.trim()         : undefined,
        duration: type === 'timer' && duration ? parseFloat(duration) * 60 : undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  if (!folders) return null;

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">

      {/* Habit chips + "New habit" chip */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-3)' }}>Habit</p>
        <div className="flex flex-wrap gap-2">
          {folders.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFolderId(f.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={{
                border: `1.5px solid ${folderId === f.id ? f.color : 'var(--border)'}`,
                backgroundColor: folderId === f.id
                  ? `color-mix(in srgb, ${f.color} 12%, var(--surface))`
                  : 'var(--surface)',
                color: folderId === f.id ? f.color : 'var(--text-2)',
              }}
            >
              <span style={{ fontSize: '13px' }}>{f.icon}</span>
              {f.name}
            </button>
          ))}
          {/* New habit chip */}
          {(folders.length < MAX_HABITS) && (
            <button
              type="button"
              onClick={onNewHabit}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={{
                border: '1.5px dashed var(--border)',
                backgroundColor: 'transparent',
                color: 'var(--text-3)',
              }}
            >
              + New habit
            </button>
          )}
        </div>
        {atGoalLimit && (
          <p className="text-xs mt-1.5" style={{ color: 'var(--danger)' }}>
            This habit already has {MAX_GOALS_PER_HABIT} goals (maximum).
          </p>
        )}
      </div>

      {/* Title — Enter submits for binary/checkbox type */}
      <input
        ref={titleRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && type === 'binary') {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="Goal title"
        maxLength={80}
        autoFocus
        className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
        style={{ border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)' }}
      />

      {/* Type selector */}
      <div className="flex gap-2">
        {(['binary', 'numeric', 'timer'] as GoalType[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={{
              border: `1.5px solid ${type === t ? 'var(--accent)' : 'var(--border)'}`,
              backgroundColor: type === t
                ? 'color-mix(in srgb, var(--accent) 10%, var(--surface))'
                : 'var(--surface)',
              color: type === t ? 'var(--accent)' : 'var(--text-3)',
            }}
          >
            {t === 'binary' ? '☐ Checkbox' : t === 'numeric' ? '# Number' : '⏱ Timer'}
          </button>
        ))}
      </div>

      {/* When */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-3)' }}>When</p>

        {/* Frequency: daily / custom */}
        <div className="flex gap-1 p-1 rounded-lg mb-2" style={{ backgroundColor: 'var(--border)' }}>
          {(['daily', 'custom'] as Frequency[]).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFrequency(f)}
              className="flex-1 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{
                backgroundColor: frequency === f ? 'var(--surface)' : 'transparent',
                color: frequency === f ? 'var(--text)' : 'var(--text-3)',
              }}
            >
              {f === 'daily' ? 'Every day' : 'Specific days'}
            </button>
          ))}
        </div>

        {frequency === 'custom' && (
          <div className="flex gap-1.5 mb-2 flex-wrap">
            {DAY_NAMES.map((day, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCustomDays(prev =>
                  prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]
                )}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                style={{
                  backgroundColor: customDays.includes(i) ? 'var(--text)' : 'transparent',
                  color: customDays.includes(i) ? 'var(--bg)' : 'var(--text-3)',
                  border: customDays.includes(i) ? '1px solid transparent' : '1px solid var(--border)',
                }}
              >
                {day}
              </button>
            ))}
          </div>
        )}

        {/* Routine block (time of day) */}
        {routineBlocks && routineBlocks.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setRoutineBlockId('')}
              className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
              style={{
                backgroundColor: routineBlockId === '' ? 'var(--text)' : 'transparent',
                color: routineBlockId === '' ? 'var(--bg)' : 'var(--text-3)',
                border: routineBlockId === '' ? '1px solid transparent' : '1px solid var(--border)',
              }}
            >
              Anytime
            </button>
            {routineBlocks.map(block => (
              <button
                key={block.id}
                type="button"
                onClick={() => setRoutineBlockId(block.id)}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                style={{
                  backgroundColor: routineBlockId === block.id ? 'var(--text)' : 'transparent',
                  color: routineBlockId === block.id ? 'var(--bg)' : 'var(--text-3)',
                  border: routineBlockId === block.id ? '1px solid transparent' : '1px solid var(--border)',
                }}
              >
                {block.emoji} {block.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Numeric fields */}
      {type === 'numeric' && (
        <div className="flex gap-2">
          <input
            value={target}
            onChange={e => setTarget(e.target.value)}
            placeholder="Target (e.g. 8)"
            type="number"
            min="0"
            step="any"
            className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
            style={{ border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)' }}
          />
          <input
            value={unit}
            onChange={e => setUnit(e.target.value)}
            placeholder="Unit (e.g. glasses)"
            className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
            style={{ border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)' }}
          />
        </div>
      )}

      {/* Timer field */}
      {type === 'timer' && (
        <input
          value={duration}
          onChange={e => setDuration(e.target.value)}
          placeholder="Duration in minutes (e.g. 20)"
          type="number"
          min="1"
          step="1"
          className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
          style={{ border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)' }}
        />
      )}

      {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onBack} className="btn btn-ghost flex-none">
          Back
        </button>
        <button type="submit" disabled={saving || atGoalLimit} className="btn btn-primary flex-1">
          {saving ? 'Adding…' : 'Add goal'}
        </button>
      </div>
    </form>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export function QuickAddModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [screen, setScreen] = useState<Screen>('choose');
  const [preselectedFolderId, setPreselectedFolderId] = useState<string | undefined>();

  // Reset after the modal finishes closing
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setScreen('choose');
        setPreselectedFolderId(undefined);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  function handleHabitCreated(folderId: string) {
    setPreselectedFolderId(folderId);
    setScreen('goal');
  }

  return (
    <Modal open={open} onClose={onClose} title={SCREEN_TITLES[screen]} size="md">
      {screen === 'choose' && (
        <ChooseScreen
          onHabit={() => setScreen('habit')}
          onGoal={() => setScreen('goal')}
        />
      )}
      {screen === 'habit' && (
        <HabitScreen
          onBack={() => setScreen('choose')}
          onCreated={handleHabitCreated}
        />
      )}
      {screen === 'goal' && (
        <GoalScreen
          onClose={onClose}
          onBack={() => setScreen('choose')}
          preselectedFolderId={preselectedFolderId}
          onNewHabit={() => setScreen('habit')}
        />
      )}
    </Modal>
  );
}
