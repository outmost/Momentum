'use client';
import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';

interface MissedDayModalProps {
  open: boolean;
  onClose: () => void;
  onBackToIt: () => void;
}

export function MissedDayModal({ open, onClose, onBackToIt }: MissedDayModalProps) {
  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Centered card */}
      <motion.div
        className="relative w-full max-w-sm card p-8"
        style={{
          boxShadow: 'var(--shadow-lg)',
          backgroundColor: 'var(--surface)',
        }}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 400, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Headline — no icon, no red */}
        <h2
          className="text-xl font-semibold mb-3 text-center"
          style={{ color: 'var(--text)' }}
        >
          Yesterday slipped.
        </h2>

        {/* Body copy — compassionate */}
        <p
          className="text-base text-center mb-8 leading-relaxed"
          style={{ color: 'var(--text-2)' }}
        >
          That's part of it. One miss doesn't undo what you've built. Grooves take time.
        </p>

        {/* CTA Button */}
        <button
          onClick={onBackToIt}
          className="btn btn-primary w-full mb-3"
        >
          Back to it
        </button>

        {/* Dismiss link */}
        <button
          onClick={onClose}
          className="w-full py-2 text-sm text-center transition-colors"
          style={{
            color: 'var(--text-3)',
          }}
        >
          Dismiss
        </button>
      </motion.div>
    </div>
  );

  return createPortal(content, document.body);
}
