'use client';
import React, { useState, useRef, useCallback } from 'react';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ParticleBurst } from '@/components/ui/Confetti';

interface BinaryEntryProps {
  completed: boolean;
  onChange: (completed: boolean) => void;
  color?: string;
}

export function BinaryEntry({ completed, onChange, color = 'var(--success)' }: BinaryEntryProps) {
  const [showBurst, setShowBurst] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(() => {
    const next = !completed;
    onChange(next);

    if (next) {
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 700);
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
      {/* Expanding ring on completion */}
      <AnimatePresence>
        {completed && (
          <motion.span
            className="absolute rounded-full"
            style={{
              width: 22,
              height: 22,
              border: `2px solid ${color}`,
            }}
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
      </AnimatePresence>

      {/* The checkbox circle */}
      <motion.span
        className="w-[22px] h-[22px] rounded-full flex items-center justify-center relative"
        animate={{
          backgroundColor: completed ? color : 'transparent',
          scale: completed ? 1 : 1,
          boxShadow: completed ? `0 0 0 3px color-mix(in srgb, ${color} 20%, transparent)` : '0 0 0 0 transparent',
        }}
        whileTap={{ scale: 0.85 }}
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
              transition={{ type: 'spring', stiffness: 600, damping: 30 }}
            >
              <Check size={11} strokeWidth={3} color="white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.span>

      {/* Particle burst */}
      <ParticleBurst
        active={showBurst}
        color={color}
        x={20}
        y={20}
        count={10}
      />
    </button>
  );
}
