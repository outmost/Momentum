'use client';
import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface EntryNoteModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
  initialNote?: string;
  goalTitle: string;
}

export function EntryNoteModal({ open, onClose, onSave, initialNote = '', goalTitle }: EntryNoteModalProps) {
  const [note, setNote] = useState(initialNote);
  
  function handleSave() {
    onSave(note);
    onClose();
  }
  
  return (
    <Modal open={open} onClose={onClose} title={`Note for "${goalTitle}"`}>
      <div className="p-6 space-y-4">
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a reflection or note for today..."
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Note</Button>
        </div>
      </div>
    </Modal>
  );
}
