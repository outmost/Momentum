'use client';
import React from 'react';
import { motion } from 'motion/react';

interface ImageryScreenProps {
  cueAnchor: string;
  onSkip: () => void;
  onComplete: () => void;
}

export function ImageryScreen({ cueAnchor, onSkip, onComplete }: ImageryScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <motion.div
        className="w-full max-w-[480px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Optional label */}
        <motion.div
          className="flex items-center gap-2 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--text-3)' }}
          >
            Optional · 60 seconds
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          className="text-2xl font-semibold mb-4"
          style={{ color: 'var(--text)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          One last thing. The science says it works.
        </motion.h2>

        {/* Body copy */}
        <motion.p
          className="text-base leading-relaxed mb-8"
          style={{ color: 'var(--text-2)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Picture tomorrow. Your <strong>{cueAnchor}</strong> happens. What do you see around you? Now picture yourself just starting — not finishing. Just beginning.
        </motion.p>

        {/* Action buttons */}
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <button
            onClick={onComplete}
            className="btn btn-primary flex-1"
          >
            I did it
          </button>
          <button
            onClick={onSkip}
            className="btn btn-tertiary flex-1"
          >
            Skip for now
          </button>
        </motion.div>

        {/* Inspiration text */}
        <motion.p
          className="text-xs text-center mt-6"
          style={{ color: 'var(--text-3)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Research shows that visualization and mental contrasting significantly improve habit formation.
        </motion.p>
      </motion.div>
    </div>
  );
}
