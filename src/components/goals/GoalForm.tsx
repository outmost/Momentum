'use client';
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { createGoal, updateGoal, useGoals } from '@/hooks/useGoals';
import { useFolders } from '@/hooks/useFolders';
import { useRoutineBlocks } from '@/hooks/useRoutine';
import { GOAL_COLORS, MAX_GOALS_PER_HABIT, MIN_GOALS_PER_HABIT } from '@/lib/utils';
import { VisibilityPicker } from '@/components/sharing/VisibilityPicker';
import type { Goal, GoalType, Frequency, GoalVisibility } from '@/types';

interface GoalFormProps {
  goal?: Goal;
  onClose: () => void;
  defaultFolderId?: string;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function GoalCountHint({ folderId, currentGoalId }: { folderId: string; currentGoalId?: string }) {
  const goals = useGoals(folderId, 'active');
  if (!goals) return null;
  const count = goals.filter(g => g.id !== currentGoalId).length;
  if (count < MIN_GOALS_PER_HABIT) {
    return (
      <p className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>
        {count} of {MIN_GOALS_PER_HABIT}–{MAX_GOALS_PER_HABIT} goals — add {MIN_GOALS_PER_HABIT - count} more to complete this habit.
      </p>
    );
  }
  if (count < MAX_GOALS_PER_HABIT) {
    return (
      <p className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>
        {count} goals — {MAX_GOALS_PER_HABIT - count} slot{MAX_GOALS_PER_HABIT - count !== 1 ? 's' : ''} remaining.
      </p>
    );
  }
  return null;
}

export function GoalForm({ goal, onClose, defaultFolderId }: GoalFormProps) {
  const folders = useFolders();
  const routineBlocks = useRoutineBlocks();

  const [title, setTitle] = useState(goal?.title ?? '');
  const [folderId, setFolderId] = useState(goal?.folderId ?? defaultFolderId ?? '');
  const [routineBlockId, setRoutineBlockId] = useState(goal?.routineBlockId ?? '');
  const [type, setType] = useState<GoalType>(goal?.type ?? 'binary');
  const [target, setTarget] = useState(goal?.target?.toString() ?? '');
  const [unit, setUnit] = useState(goal?.unit ?? '');
  const [duration, setDuration] = useState(
    goal?.duration ? Math.floor(goal.duration / 60).toString() : ''
  );
  const [frequency, setFrequency] = useState<Frequency>(goal?.frequency ?? 'daily');
  const [customDays, setCustomDays] = useState<number[]>(goal?.customDays ?? []);
  const [color, setColor] = useState(goal?.color ?? '');
  const [visibility, setVisibility] = useState<GoalVisibility>(goal?.visibility ?? 'private');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto-select first folder if only one exists
  useEffect(() => {
    if (!folderId && folders && folders.length === 1) {
      setFolderId(folders[0].id);
    }
  }, [folders, folderId]);

  const folderGoals = useGoals(folderId || undefined, 'active');
  const goalCountInFolder = (folderGoals ?? []).filter(g => g.id !== goal?.id).length;
  const atGoalLimit = !!folderId && goalCountInFolder >= MAX_GOALS_PER_HABIT;

  function validate() {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!folderId) errs.folderId = 'Please select a habit';
    if (atGoalLimit) errs.folderId = `This habit already has the maximum of ${MAX_GOALS_PER_HABIT} goals`;
    if (type === 'numeric' && (!target || Number(target) <= 0)) errs.target = 'Target must be greater than 0';
    if (type === 'timer' && (!duration || Number(duration) <= 0)) errs.duration = 'Duration must be greater than 0';
    if (frequency === 'custom' && customDays.length === 0) errs.customDays = 'Select at least one day';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        type,
        status: (goal?.status ?? 'active') as Goal['status'],
        folderId: folderId || undefined,
        routineBlockId: routineBlockId || undefined,
        target: type === 'numeric' ? Number(target) : undefined,
        unit: type === 'numeric' ? unit || undefined : undefined,
        duration: type === 'timer' ? Number(duration) * 60 : undefined,
        frequency,
        customDays: frequency === 'custom' ? customDays : undefined,
        reminderEnabled: goal?.reminderEnabled ?? false,
        reminderTime: goal?.reminderTime,
        color: color || undefined,
        visibility,
      };
      if (goal) {
        await updateGoal(goal.id, data);
      } else {
        await createGoal(data);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    border: '1px solid var(--border)',
    backgroundColor: 'transparent',
    color: 'var(--text)',
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">

      {/* ── Habit chips ── */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-3)' }}>
          Habit <span style={{ color: 'var(--danger)' }}>*</span>
        </p>
        {folders && folders.length > 0 ? (
          <>
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
            </div>
            {folderId && <GoalCountHint folderId={folderId} currentGoalId={goal?.id} />}
          </>
        ) : (
          <p className="text-sm py-1" style={{ color: 'var(--text-3)' }}>
            Create a habit first, then add goals to it.
          </p>
        )}
        {errors.folderId && (
          <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.folderId}</p>
        )}
      </div>

      {/* ── Title ── */}
      <div>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={100}
          placeholder="Goal title"
          autoFocus={!goal}
          className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
          style={{ ...inputStyle, fontSize: '15px', fontWeight: 500 }}
        />
        {errors.title && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.title}</p>}
      </div>

      {/* ── Type ── */}
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

      {/* ── Type-specific fields ── */}
      {type === 'numeric' && (
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="number"
              value={target}
              onChange={e => setTarget(e.target.value)}
              min="1"
              placeholder="Target (e.g. 20)"
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
              style={inputStyle}
            />
            {errors.target && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.target}</p>}
          </div>
          <div className="flex-1">
            <input
              value={unit}
              onChange={e => setUnit(e.target.value)}
              placeholder="Unit (e.g. pages)"
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
              style={inputStyle}
            />
          </div>
        </div>
      )}

      {type === 'timer' && (
        <div>
          <input
            type="number"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            min="1"
            placeholder="Duration in minutes (e.g. 30)"
            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
            style={inputStyle}
          />
          {errors.duration && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.duration}</p>}
        </div>
      )}

      {/* ── When (frequency) ── */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-3)' }}>When</p>
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--border)' }}>
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
          <div className="flex gap-1.5 mt-2 flex-wrap">
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
        {errors.customDays && (
          <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.customDays}</p>
        )}
      </div>

      {/* ── Routine block (time of day) ── */}
      {routineBlocks && routineBlocks.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-3)' }}>Time of day</p>
          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setRoutineBlockId('')}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
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
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
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
        </div>
      )}

      {/* ── Advanced (color + visibility) ── */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="flex items-center gap-1 text-xs transition-colors"
          style={{ color: 'var(--text-3)' }}
        >
          {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {showAdvanced ? 'Fewer options' : 'More options'}
        </button>
      </div>

      {showAdvanced && (
        <div className="space-y-4 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
          {/* Color */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-3)' }}>Color</p>
            <div className="flex gap-2 flex-wrap items-center">
              <button
                type="button"
                onClick={() => setColor('')}
                className="w-6 h-6 rounded-full border-2"
                style={{
                  backgroundColor: 'var(--border-2)',
                  borderColor: color === '' ? 'var(--text)' : 'transparent',
                }}
                title="Default"
              />
              {GOAL_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full border-2 transition-transform"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? 'var(--text)' : 'transparent',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-3)' }}>Privacy</p>
            <VisibilityPicker value={visibility} onChange={setVisibility} />
            <p className="text-[10px] mt-1.5 italic" style={{ color: 'var(--text-3)' }}>
              {visibility === 'private' && 'Only you can see this.'}
              {visibility === 'invite-only' && 'You decide who joins.'}
              {visibility === 'public' && 'Share a QR code so anyone can join.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex gap-3 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-ghost flex-none"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || atGoalLimit}
          className="btn btn-primary flex-1"
        >
          {saving ? 'Saving…' : goal ? 'Update goal' : 'Add goal'}
        </button>
      </div>
    </form>
  );
}
