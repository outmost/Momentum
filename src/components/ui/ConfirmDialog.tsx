'use client';
import React from 'react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="px-5 py-5">
        <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>{message}</p>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} disabled={loading} className="btn btn-secondary btn-sm">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={variant === 'danger' ? 'btn btn-danger btn-sm' : 'btn btn-primary btn-sm'}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
