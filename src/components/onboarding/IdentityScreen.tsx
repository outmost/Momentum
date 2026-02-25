'use client';
import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IdentityScreenProps {
  onBack: () => void;
  onNext: (identity: string) => void;
}

const PLACEHOLDER_EXAMPLES = [
  'Someone who moves their body every morning',
  'Someone who reads before they sleep',
  'Someone who doesn\'t skip meals',
  'Someone who breathes before they react',
  'Someone who writes daily',
];

export function IdentityScreen({ onBack, onNext }: IdentityScreenProps) {
  const [input, setInput] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const rotationTimer = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Rotate placeholder every 4 seconds
    rotationTimer.current = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 4000);

    // Auto-focus input
    setTimeout(() => inputRef.current?.focus(), 300);

    return () => {
      if (rotationTimer.current) clearInterval(rotationTimer.current);
    };
  }, []);

  const canContinue = input.length >= 3;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      {/* Back button */}
      <motion.button
        onClick={onBack}
        className="absolute top-6 left-6 p-2 rounded-lg transition-colors hover:bg-[var(--surface-2)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        aria-label="Go back"
      >
        <ChevronLeft size={20} style={{ color: 'var(--text-2)' }} />
      </motion.button>

      {/* Step indicator */}
      <motion.div
        className="absolute top-6 right-6 flex gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: 'var(--accent)' }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: 'var(--border)' }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: 'var(--border)' }}
        />
      </motion.div>

      <motion.div
        className="w-full max-w-[480px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Headline */}
        <h2
          className="text-2xl font-semibold mb-2"
          style={{ color: 'var(--text)' }}
        >
          What kind of person do you want to be?
        </h2>

        {/* Supporting text */}
        <p
          className="text-sm mb-8"
          style={{ color: 'var(--text-2)' }}
        >
          Not a goal. Not a task. A type of person.
        </p>

        {/* Borderless input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="field"
            style={{
              fontSize: '20px',
              fontWeight: 500,
              paddingTop: '16px',
              paddingBottom: '16px',
            }}
            placeholder={PLACEHOLDER_EXAMPLES[placeholderIndex]}
          />
        </motion.div>

        {/* Character hint (optional) */}
        <AnimatePresence mode="wait">
          {input.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-3"
            >
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                {input.length} character{input.length === 1 ? '' : 's'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Continue button */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={() => onNext(input)}
            disabled={!canContinue}
            className="btn btn-primary w-full"
          >
            Continue
          </button>
          {!canContinue && (
            <p className="text-xs text-center mt-2" style={{ color: 'var(--text-3)' }}>
              Tell us a little about this person
            </p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
