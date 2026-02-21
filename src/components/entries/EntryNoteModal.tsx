'use client';
import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';

interface EntryNoteModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
  initialNote?: string;
  goalTitle: string;
}

export function EntryNoteModal({ open, onClose, onSave, initialNote = '', goalTitle }: EntryNoteModalProps) {
  const [note, setNote] = useState(initialNote);

  // Sync when opened
  useEffect(() => { if (open) setNote(initialNote); }, [open, initialNote]);

  function handleSave() {
    onSave(note);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={goalTitle} size="sm">
      <div className="p-5 space-y-4">
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a note for today…"
          rows={4}
          className="w-full px-3 py-2 rounded-md text-sm focus:outline-none resize-none"
          style={{
            border: '1px solid var(--border)',
            backgroundColor: 'transparent',
            color: 'var(--text)',
          }}
          onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSave(); }}
        />
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>⌘↵ to save</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-md"
            style={{ color: 'var(--text-2)', border: '1px solid var(--border)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-sm font-medium rounded-md text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
