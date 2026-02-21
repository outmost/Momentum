'use client';
import React, { useState, useRef, useCallback } from 'react';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ParticleBurst } from '@/components/ui/Confetti';

interface BinaryEntryProps {
  completed: boolean;
  onChange: (completed: boolean) => void;
  color?: string;
}

export function BinaryEntry({ completed, onChange, color = 'var(--success)' }: BinaryEntryProps) {
  const [showBurst, setShowBurst] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(() => {
    const next = !completed;
    onChange(next);

    if (next) {
      setShowBurst(true);
      setJustCompleted(true);
      setTimeout(() => setShowBurst(false), 700);
      setTimeout(() => setJustCompleted(false), 600);
    }
  }, [completed, onChange]);

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={handleClick}
      className="w-10 h-10 flex items-center justify-center -m-2.5 shrink-0 relative"
      aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
    >
      {/* Ring burst — fires ONLY on the transition, not on every render */}
      {justCompleted && (
        <span
          className="absolute w-[22px] h-[22px] rounded-full animate-check-ring"
          style={{ border: `2px solid ${color}`, opacity: 0 }}
        />
      )}

      {/* Checkbox circle */}
      <motion.span
        className="w-[22px] h-[22px] rounded-full flex items-center justify-center"
        animate={{
          backgroundColor: completed ? color : 'transparent',
          boxShadow: justCompleted ? `0 0 0 4px color-mix(in srgb, ${color} 18%, transparent)` : '0 0 0 0 transparent',
        }}
        whileTap={{ scale: 0.82 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          border: completed ? 'none' : '1.5px solid var(--border-2)',
        }}
      >
        <AnimatePresence>
          {completed && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 600, damping: 28 }}
            >
              <Check size={11} strokeWidth={3} color="white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.span>

      <ParticleBurst active={showBurst} color={color} x={20} y={20} count={8} />
    </button>
  );
}
