'use client';
import React, { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { createGoal, updateGoal } from '@/hooks/useGoals';
import { useFolders, createFolder } from '@/hooks/useFolders';
import { createMilestone, deleteMilestone } from '@/hooks/useMilestones';
import { db } from '@/lib/db';
import { FOLDER_COLORS, GOAL_COLORS } from '@/lib/utils';
import type { Goal, GoalType, Frequency } from '@/types';

interface GoalFormProps {
  goal?: Goal;
  onClose: () => void;
  defaultFolderId?: string;
}

const inputClass = "w-full px-3 py-2 rounded-md text-sm focus:outline-none transition-colors";
const inputStyle = { border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)' };
const labelStyle = { color: 'var(--text-2)', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '6px' } as const;

// Human-readable type labels — keeps the segmented control concise.
const TYPE_LABELS: Record<GoalType, string> = {
  binary: 'Done / not done',
  numeric: 'Track a number',
  milestone: 'Step-by-step',
  timer: 'Time-based',
};

export function GoalForm({ goal, onClose, defaultFolderId }: GoalFormProps) {
  const folders = useFolders();

  const [title, setTitle] = useState(goal?.title ?? '');
  const [description, setDescription] = useState(goal?.description ?? '');
  const [type, setType] = useState<GoalType>(goal?.type ?? 'binary');
  const [folderId, setFolderId] = useState(goal?.folderId ?? defaultFolderId ?? '');
  const [target, setTarget] = useState(goal?.target?.toString() ?? '');
  const [unit, setUnit] = useState(goal?.unit ?? '');
  const [duration, setDuration] = useState(goal?.duration ? Math.floor(goal.duration / 60).toString() : '');
  const [frequency, setFrequency] = useState<Frequency>(goal?.frequency ?? 'daily');
  const [customDays, setCustomDays] = useState<number[]>(goal?.customDays ?? []);
  const [reminderEnabled, setReminderEnabled] = useState(goal?.reminderEnabled ?? false);
  const [reminderTime, setReminderTime] = useState(goal?.reminderTime ?? '08:00');
  const [color, setColor] = useState(goal?.color ?? '');
  const [milestones, setMilestones] = useState<{ id: string; title: string; isNew?: boolean }[]>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);

  // Progressive disclosure: show advanced options only when explicitly requested,
  // or always-open when editing an existing goal so nothing looks hidden.
  const [showAdvanced, setShowAdvanced] = useState(!!goal);

  useEffect(() => {
    if (goal?.type === 'milestone') {
      db.milestones.where('goalId').equals(goal.id).sortBy('sortOrder').then(ms => {
        setMilestones(ms.map(m => ({ id: m.id, title: m.title })));
      });
    }
  }, [goal]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function validate() {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (type === 'numeric' && (!target || Number(target) <= 0)) errs.target = 'Target must be greater than 0';
    if (type === 'timer' && (!duration || Number(duration) <= 0)) errs.duration = 'Duration must be greater than 0';
    if (type === 'milestone' && milestones.length === 0) errs.milestones = 'Add at least one milestone';
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
        description: description.trim() || undefined,
        type,
        status: (goal?.status ?? 'active') as Goal['status'],
        folderId: folderId || undefined,
        target: type === 'numeric' ? Number(target) : undefined,
        unit: type === 'numeric' ? unit || undefined : undefined,
        duration: type === 'timer' ? Number(duration) * 60 : undefined,
        frequency,
        customDays: frequency === 'custom' ? customDays : undefined,
        reminderEnabled,
        reminderTime: reminderEnabled ? reminderTime : undefined,
        color: color || undefined,
      };
      if (goal) {
        await updateGoal(goal.id, data);
        if (type === 'milestone') {
          const existing = await db.milestones.where('goalId').equals(goal.id).toArray();
          const existingIds = new Set(existing.map(m => m.id));
          const newIds = new Set(milestones.filter(m => !m.isNew).map(m => m.id));
          for (const id of existingIds) { if (!newIds.has(id)) await deleteMilestone(id); }
          for (const m of milestones.filter(m => m.isNew)) await createMilestone(goal.id, m.title);
        }
      } else {
        const newGoal = await createGoal(data);
        if (type === 'milestone') {
          for (const m of milestones) await createMilestone(newGoal.id, m.title);
        }
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    const folder = await createFolder({
      name: newFolderName.trim(),
      color: FOLDER_COLORS[Math.floor(Math.random() * FOLDER_COLORS.length)],
      icon: '📁',
    });
    setFolderId(folder.id);
    setNewFolderName('');
    setShowNewFolder(false);
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

      {/* ── Title — always first, auto-focused ── */}
      <div>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={100}
          placeholder="What do you want to achieve?"
          className={inputClass}
          style={{ ...inputStyle, fontSize: '15px', fontWeight: 500 }}
          autoFocus
        />
        {errors.title && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.title}</p>}
      </div>

      {/* ── Goal type — four compact tiles ── */}
      <div>
        <label style={labelStyle}>Type</label>
        <div className="grid grid-cols-2 gap-1.5">
          {(['binary', 'numeric', 'milestone', 'timer'] as GoalType[]).map(t => (
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

      {/* ── Type-specific required fields (always visible) ── */}

      {/* Numeric */}
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
              autoFocus
            />
            {errors.target && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.target}</p>}
          </div>
          <div className="flex-1">
            <label style={labelStyle}>Unit</label>
            <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="pages, miles…" className={inputClass} style={inputStyle} />
          </div>
        </div>
      )}

      {/* Timer */}
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
            autoFocus
          />
          {errors.duration && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.duration}</p>}
        </div>
      )}

      {/* Milestones */}
      {type === 'milestone' && (
        <div>
          <label style={labelStyle}>Steps *</label>
          <div className="space-y-1.5 mb-2">
            {milestones.map((m, i) => (
              <div key={m.id} className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ backgroundColor: 'var(--border)' }}>
                <span className="text-sm flex-1" style={{ color: 'var(--text-2)' }}>{m.title}</span>
                <button type="button" onClick={() => setMilestones(prev => prev.filter((_, idx) => idx !== i))} style={{ color: 'var(--text-3)' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newMilestoneTitle}
              onChange={e => setNewMilestoneTitle(e.target.value)}
              placeholder="Add step…"
              className={`${inputClass} flex-1`}
              style={inputStyle}
              onKeyDown={e => {
                if (e.key === 'Enter' && newMilestoneTitle.trim()) {
                  e.preventDefault();
                  setMilestones(prev => [...prev, { id: nanoid(), title: newMilestoneTitle.trim(), isNew: true }]);
                  setNewMilestoneTitle('');
                }
              }}
            />
            <button type="button" onClick={() => {
              if (newMilestoneTitle.trim()) {
                setMilestones(prev => [...prev, { id: nanoid(), title: newMilestoneTitle.trim(), isNew: true }]);
                setNewMilestoneTitle('');
              }
            }} className="px-3 py-2 rounded-md text-white" style={{ backgroundColor: 'var(--accent)' }}>
              <Plus size={14} />
            </button>
          </div>
          {errors.milestones && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.milestones}</p>}
        </div>
      )}

      {/* ── More options — collapsed by default for new goals ──────────────── */}
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

          {/* Folder */}
          <div>
            <label style={labelStyle}>Folder</label>
            {showNewFolder ? (
              <div className="flex gap-2">
                <input
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  className={inputClass}
                  style={inputStyle}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreateFolder())}
                />
                <button type="button" onClick={handleCreateFolder} className="px-3 py-2 rounded-md text-sm font-medium text-white" style={{ backgroundColor: 'var(--accent)' }}>Add</button>
                <button type="button" onClick={() => setShowNewFolder(false)} className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--text-2)', border: '1px solid var(--border)' }}>Cancel</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select value={folderId} onChange={e => setFolderId(e.target.value)} className={`${inputClass} flex-1`} style={inputStyle}>
                  <option value="">No folder</option>
                  {folders?.map(f => <option key={f.id} value={f.id}>{f.icon} {f.name}</option>)}
                </select>
                <button type="button" onClick={() => setShowNewFolder(true)} className="px-3 py-2 rounded-md text-sm whitespace-nowrap" style={{ color: 'var(--accent)', border: '1px solid var(--border)' }}>+ New</button>
              </div>
            )}
          </div>

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
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium rounded-md text-white disabled:opacity-50" style={{ backgroundColor: 'var(--accent)' }}>
          {saving ? 'Saving…' : goal ? 'Update' : 'Add goal'}
        </button>
      </div>
    </form>
  );
}
