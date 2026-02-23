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

const inputClass = "w-full px-3 py-2 rounded-md text-sm focus:outline-none transition-colors";
const inputStyle = { border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)' };
const labelStyle = { color: 'var(--text-2)', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '6px' } as const;

const TYPE_LABELS: Record<GoalType, string> = {
  binary: 'Done / not done',
  numeric: 'Track a number',
  timer: 'Time-based',
};

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
  const [why, setWhy] = useState(goal?.why ?? '');
  const [folderId, setFolderId] = useState(goal?.folderId ?? defaultFolderId ?? '');
  const [routineBlockId, setRoutineBlockId] = useState(goal?.routineBlockId ?? '');
  const [description, setDescription] = useState(goal?.description ?? '');
  const [type, setType] = useState<GoalType>(goal?.type ?? 'binary');
  const [target, setTarget] = useState(goal?.target?.toString() ?? '');
  const [unit, setUnit] = useState(goal?.unit ?? '');
  const [duration, setDuration] = useState(goal?.duration ? Math.floor(goal.duration / 60).toString() : '');
  const [frequency, setFrequency] = useState<Frequency>(goal?.frequency ?? 'daily');
  const [customDays, setCustomDays] = useState<number[]>(goal?.customDays ?? []);
  const [reminderEnabled, setReminderEnabled] = useState(goal?.reminderEnabled ?? false);
  const [reminderTime, setReminderTime] = useState(goal?.reminderTime ?? '08:00');
  const [color, setColor] = useState(goal?.color ?? '');
  const [visibility, setVisibility] = useState<GoalVisibility>(goal?.visibility ?? 'private');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [showAdvanced, setShowAdvanced] = useState(!!goal);

  // Auto-select first folder if only one exists
  useEffect(() => {
    if (!folderId && folders && folders.length === 1) {
      setFolderId(folders[0].id);
    }
  }, [folders, folderId]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Check goal count limit for the selected folder
  const folderGoals = useGoals(folderId || undefined, 'active');
  const goalCountInFolder = (folderGoals ?? []).filter(g => g.id !== goal?.id).length;
  const atGoalLimit = !!folderId && goalCountInFolder >= MAX_GOALS_PER_HABIT;

  function validate() {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!folderId) errs.folderId = 'Please select a habit for this goal';
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
        why: why.trim() || undefined,
        description: description.trim() || undefined,
        type,
        status: (goal?.status ?? 'active') as Goal['status'],
        folderId: folderId || undefined,
        routineBlockId: routineBlockId || undefined,
        target: type === 'numeric' ? Number(target) : undefined,
        unit: type === 'numeric' ? unit || undefined : undefined,
        duration: type === 'timer' ? Number(duration) * 60 : undefined,
        frequency,
        customDays: frequency === 'custom' ? customDays : undefined,
        reminderEnabled,
        reminderTime: reminderEnabled ? reminderTime : undefined,
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

  const pillBtn = (active: boolean) => ({
    padding: '5px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.1s',
    backgroundColor: active ? 'var(--text)' : 'transparent',
    color: active ? 'var(--bg)' : 'var(--text-3)',
    border: active ? '1px solid transparent' : '1px solid var(--border)',
  });

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">

      {/* ── Habit (required) — always visible at the top ── */}
      <div>
        <label style={labelStyle}>
          Habit <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
        {folders && folders.length > 0 ? (
          <>
            <div className="space-y-1">
              {folders.map(f => {
                const isSelected = folderId === f.id;
                const goalCount = isSelected ? goalCountInFolder : null;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFolderId(f.id)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-left transition-colors"
                    style={{
                      border: `1px solid ${isSelected ? f.color : 'var(--border)'}`,
                      backgroundColor: isSelected
                        ? `color-mix(in srgb, ${f.color} 10%, transparent)`
                        : 'transparent',
                    }}
                  >
                    <span className="text-base shrink-0">{f.icon}</span>
                    <span
                      className="text-sm font-medium flex-1 truncate"
                      style={{ color: isSelected ? f.color : 'var(--text)' }}
                    >
                      {f.name}
                    </span>
                    {isSelected && goalCount !== null && (
                      <span
                        className="text-xs shrink-0 tabular"
                        style={{ color: goalCount >= MAX_GOALS_PER_HABIT ? 'var(--danger)' : 'var(--text-3)' }}
                      >
                        {goalCount}/{MAX_GOALS_PER_HABIT} goals
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {folderId && <GoalCountHint folderId={folderId} currentGoalId={goal?.id} />}
          </>
        ) : (
          <p className="text-sm py-2" style={{ color: 'var(--text-3)' }}>
            Create a habit first, then add goals to it.
          </p>
        )}
        {errors.folderId && (
          <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.folderId}</p>
        )}
      </div>

      {/* ── Title ── */}
      <div>
        <label style={labelStyle}>
          Goal <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={100}
          placeholder="What do you want to achieve?"
          className={inputClass}
          style={{ ...inputStyle, fontSize: '15px', fontWeight: 500 }}
        />
        {errors.title && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.title}</p>}
      </div>

      {/* ── Why — emotional anchor ── */}
      <div>
        <input
          value={why}
          onChange={e => setWhy(e.target.value)}
          maxLength={120}
          placeholder="Why does this matter to you? (optional)"
          className={inputClass}
          style={{ ...inputStyle, fontStyle: why ? 'italic' : 'normal', color: why ? 'var(--text-2)' : undefined, fontSize: '13px' }}
        />
      </div>

      {/* ── Routine block ── */}
      {routineBlocks && routineBlocks.length > 0 && (
        <div>
          <label style={labelStyle}>When?</label>
          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setRoutineBlockId('')}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
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
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors"
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
          {routineBlockId && (
            <p className="text-[10px] mt-1.5 italic" style={{ color: 'var(--text-3)' }}>
              When it&apos;s {routineBlocks.find(b => b.id === routineBlockId)?.name.toLowerCase()}, I will {title.trim() || '...'}
            </p>
          )}
        </div>
      )}

      {/* ── Goal type ── */}
      <div>
        <label style={labelStyle}>Type</label>
        <div className="grid grid-cols-3 gap-1.5">
          {(['binary', 'numeric', 'timer'] as GoalType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className="px-3 py-2 rounded-md text-left transition-colors"
              style={{
                border: `1px solid ${type === t ? 'var(--accent)' : 'var(--border)'}`,
                backgroundColor: type === t ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'transparent',
              }}
            >
              <span
                className="block text-xs font-semibold capitalize"
                style={{ color: type === t ? 'var(--accent)' : 'var(--text)' }}
              >
                {t}
              </span>
              <span className="block text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                {TYPE_LABELS[t]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Type-specific fields ── */}
      {type === 'numeric' && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label style={labelStyle}>Target *</label>
            <input
              type="number"
              value={target}
              onChange={e => setTarget(e.target.value)}
              min="1"
              placeholder="e.g. 20"
              className={inputClass}
              style={inputStyle}
            />
            {errors.target && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.target}</p>}
          </div>
          <div className="flex-1">
            <label style={labelStyle}>Unit</label>
            <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="pages, miles…" className={inputClass} style={inputStyle} />
          </div>
        </div>
      )}

      {type === 'timer' && (
        <div>
          <label style={labelStyle}>Duration (minutes) *</label>
          <input
            type="number"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            min="1"
            placeholder="e.g. 30"
            className={inputClass}
            style={inputStyle}
          />
          {errors.duration && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.duration}</p>}
        </div>
      )}

      {/* ── More options ── */}
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

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Optional"
              className={`${inputClass} resize-none`}
              style={inputStyle}
            />
          </div>

          {/* Frequency */}
          <div>
            <label style={labelStyle}>Frequency</label>
            <div className="flex gap-1 p-1 rounded-md" style={{ backgroundColor: 'var(--border)' }}>
              {(['daily', 'weekly', 'custom'] as Frequency[]).map(f => (
                <button key={f} type="button" onClick={() => setFrequency(f)}
                  className="flex-1 py-1.5 rounded text-xs font-medium capitalize transition-colors"
                  style={{ backgroundColor: frequency === f ? 'var(--surface)' : 'transparent', color: frequency === f ? 'var(--text)' : 'var(--text-3)' }}>
                  {f}
                </button>
              ))}
            </div>
            {frequency === 'custom' && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {dayNames.map((day, i) => (
                  <button key={i} type="button"
                    onClick={() => setCustomDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i])}
                    style={pillBtn(customDays.includes(i))}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
            {errors.customDays && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.customDays}</p>}
          </div>

          {/* Color */}
          <div>
            <label style={labelStyle}>Color</label>
            <div className="flex gap-2 flex-wrap items-center">
              <button type="button" onClick={() => setColor('')}
                className="w-6 h-6 rounded-full border-2"
                style={{ backgroundColor: 'var(--border-2)', borderColor: color === '' ? 'var(--text)' : 'transparent' }}
                title="Default"
              />
              {GOAL_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full border-2 transition-transform"
                  style={{ backgroundColor: c, borderColor: color === c ? 'var(--text)' : 'transparent', transform: color === c ? 'scale(1.15)' : 'scale(1)' }}
                />
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label style={labelStyle}>Privacy</label>
            <VisibilityPicker value={visibility} onChange={setVisibility} />
            <p className="text-[10px] mt-1.5 italic" style={{ color: 'var(--text-3)' }}>
              {visibility === 'private' && 'Only you can see this challenge.'}
              {visibility === 'invite-only' && 'You decide who joins. Manage participants in the challenge detail.'}
              {visibility === 'public' && 'Share a QR code so anyone can join your challenge.'}
            </p>
          </div>

          {/* Reminder */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Daily reminder</p>
              {reminderEnabled && (
                <input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)}
                  className="mt-1 px-2 py-1 rounded text-xs focus:outline-none"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)' }}
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => setReminderEnabled(!reminderEnabled)}
              className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
              style={{ backgroundColor: reminderEnabled ? 'var(--accent)' : 'var(--border-2)' }}
            >
              <span
                className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                style={{ transform: reminderEnabled ? 'translateX(18px)' : 'translateX(3px)' }}
              />
            </button>
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex justify-end gap-2 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md" style={{ color: 'var(--text-2)', border: '1px solid var(--border)' }}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || atGoalLimit}
          className="px-4 py-2 text-sm font-medium rounded-md text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {saving ? 'Saving…' : goal ? 'Update goal' : 'Add goal'}
        </button>
      </div>
    </form>
  );
}
