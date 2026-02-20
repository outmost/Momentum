'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { createFolder, updateFolder } from '@/hooks/useFolders';
import { FOLDER_COLORS } from '@/lib/utils';
import type { Folder } from '@/types';

const ICONS = ['📁', '💪', '📚', '💰', '❤️', '🏃', '🧘', '🎯', '🌱', '⭐', '🏠', '🎨'];

interface FolderFormProps {
  folder?: Folder;
  onClose: () => void;
}

export function FolderForm({ folder, onClose }: FolderFormProps) {
  const [name, setName] = useState(folder?.name ?? '');
  const [color, setColor] = useState(folder?.color ?? FOLDER_COLORS[0]);
  const [icon, setIcon] = useState(folder?.icon ?? '📁');
  const [saving, setSaving] = useState(false);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    
    setSaving(true);
    try {
      if (folder) {
        await updateFolder(folder.id, { name: name.trim(), color, icon });
      } else {
        await createFolder({ name: name.trim(), color, icon });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Health, Learning, Finance"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
        <div className="flex gap-2 flex-wrap">
          {FOLDER_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
        <div className="flex gap-2 flex-wrap">
          {ICONS.map(ic => (
            <button
              key={ic}
              type="button"
              onClick={() => setIcon(ic)}
              className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border-2 transition-colors ${icon === ic ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              {ic}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={saving}>{folder ? 'Update' : 'Create'} Folder</Button>
      </div>
    </form>
  );
}
