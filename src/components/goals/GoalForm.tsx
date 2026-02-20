'use client';
import React, { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { createGoal, updateGoal } from '@/hooks/useGoals';
import { useFolders, createFolder } from '@/hooks/useFolders';
import { createMilestone, deleteMilestone } from '@/hooks/useMilestones';
import { db } from '@/lib/db';
import { FOLDER_COLORS, GOAL_COLORS } from '@/lib/utils';
import type { Goal, GoalType, Frequency, Milestone } from '@/types';

interface GoalFormProps {
  goal?: Goal;
  onClose: () => void;
  defaultFolderId?: string;
}

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
  
  useEffect(() => {
    if (goal && goal.type === 'milestone') {
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
        // Handle milestones for edited goal
        if (type === 'milestone') {
          const existing = await db.milestones.where('goalId').equals(goal.id).toArray();
          const existingIds = new Set(existing.map(m => m.id));
          const newIds = new Set(milestones.filter(m => !m.isNew).map(m => m.id));
          
          // Delete removed milestones
          for (const id of existingIds) {
            if (!newIds.has(id)) await deleteMilestone(id);
          }
          
          // Add new milestones
          for (const m of milestones.filter(m => m.isNew)) {
            await createMilestone(goal.id, m.title);
          }
        }
      } else {
        const newGoal = await createGoal(data);
        if (type === 'milestone') {
          for (const m of milestones) {
            await createMilestone(newGoal.id, m.title);
          }
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
  
  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={100}
          placeholder="What do you want to achieve?"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
      </div>
      
      {/* Type selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
        <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
          {(['binary', 'numeric', 'milestone', 'timer'] as GoalType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`py-1.5 px-2 rounded-md text-xs font-medium transition-colors capitalize ${
                type === t
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      
      {/* Folder */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Folder</label>
        {showNewFolder ? (
          <div className="flex gap-2">
            <input
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreateFolder())}
            />
            <button type="button" onClick={handleCreateFolder} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">Add</button>
            <button type="button" onClick={() => setShowNewFolder(false)} className="px-3 py-2 text-gray-500 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <select
              value={folderId}
              onChange={e => setFolderId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No folder</option>
              {folders?.map(f => (
                <option key={f.id} value={f.id}>{f.icon} {f.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewFolder(true)}
              className="px-3 py-2 text-sm text-blue-500 border border-blue-200 rounded-lg hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20 whitespace-nowrap"
            >
              + New
            </button>
          </div>
        )}
      </div>
      
      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Optional description..."
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
      
      {/* Numeric fields */}
      {type === 'numeric' && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={target}
              onChange={e => setTarget(e.target.value)}
              min="1"
              placeholder="e.g. 20"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.target && <p className="text-xs text-red-500 mt-1">{errors.target}</p>}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit</label>
            <input
              value={unit}
              onChange={e => setUnit(e.target.value)}
              placeholder="pages, miles..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
      
      {/* Timer field */}
      {type === 'timer' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (minutes) <span className="text-red-500">*</span></label>
          <input
            type="number"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            min="1"
            placeholder="e.g. 30"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}
        </div>
      )}
      
      {/* Milestone list */}
      {type === 'milestone' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Milestones <span className="text-red-500">*</span></label>
          <div className="space-y-2">
            {milestones.map((m, i) => (
              <div key={m.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm flex-1 text-gray-700 dark:text-gray-300">{m.title}</span>
                <button
                  type="button"
                  onClick={() => setMilestones(prev => prev.filter((_, idx) => idx !== i))}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              value={newMilestoneTitle}
              onChange={e => setNewMilestoneTitle(e.target.value)}
              placeholder="Add milestone..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={e => {
                if (e.key === 'Enter' && newMilestoneTitle.trim()) {
                  e.preventDefault();
                  setMilestones(prev => [...prev, { id: nanoid(), title: newMilestoneTitle.trim(), isNew: true }]);
                  setNewMilestoneTitle('');
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (newMilestoneTitle.trim()) {
                  setMilestones(prev => [...prev, { id: nanoid(), title: newMilestoneTitle.trim(), isNew: true }]);
                  setNewMilestoneTitle('');
                }
              }}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
            >
              <Plus size={16} />
            </button>
          </div>
          {errors.milestones && <p className="text-xs text-red-500 mt-1">{errors.milestones}</p>}
        </div>
      )}
      
      {/* Frequency */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Frequency</label>
        <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
          {(['daily', 'weekly', 'custom'] as Frequency[]).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFrequency(f)}
              className={`py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                frequency === f
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        
        {frequency === 'custom' && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {dayNames.map((day, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCustomDays(prev =>
                  prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]
                )}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  customDays.includes(i)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        )}
        {errors.customDays && <p className="text-xs text-red-500 mt-1">{errors.customDays}</p>}
      </div>
      
      {/* Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setColor('')}
            className={`w-7 h-7 rounded-full border-2 bg-gray-200 dark:bg-gray-600 ${color === '' ? 'border-blue-500' : 'border-transparent'}`}
            title="Default"
          />
          {GOAL_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 ${color === c ? 'border-gray-900 dark:border-white' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      
      {/* Reminder */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Reminder</p>
          {reminderEnabled && (
            <input
              type="time"
              value={reminderTime}
              onChange={e => setReminderTime(e.target.value)}
              className="mt-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
        <button
          type="button"
          onClick={() => setReminderEnabled(!reminderEnabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${reminderEnabled ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${reminderEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
      
      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {saving ? 'Saving...' : goal ? 'Update Goal' : 'Create Goal'}
        </button>
      </div>
    </form>
  );
}
