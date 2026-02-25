'use client';
import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FirstHabitScreenProps {
  onBack: () => void;
  onNext: (habit: string) => void;
}

const PLACEHOLDER_EXAMPLES = [
  'Run for 10 minutes',
  'Drink a glass of water',
  'Read one page',
  'Do five push-ups',
  'Write one sentence',
];

const NUDGE_KEYWORDS = ['every day', 'always', 'one hour', '30 minutes', 'all day'];

export function FirstHabitScreen({ onBack, onNext }: FirstHabitScreenProps) {
  const [input, setInput] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showNudge, setShowNudge] = useState(false);
  const rotationTimer = useRef<NodeJS.Timeout>();
  const nudgeTimer = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    rotationTimer.current = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 4000);

    setTimeout(() => inputRef.current?.focus(), 300);

    return () => {
      if (rotationTimer.current) clearInterval(rotationTimer.current);
      if (nudgeTimer.current) clearInterval(nudgeTimer.current);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    // Clear existing nudge timer
    if (nudgeTimer.current) clearInterval(nudgeTimer.current);

    // Check if nudge should be shown (after 1.5s of no typing)
    if (value.length > 60 || NUDGE_KEYWORDS.some((kw) => value.toLowerCase().includes(kw))) {
      nudgeTimer.current = setTimeout(() => {
        setShowNudge(true);
      }, 1500);
    } else {
      setShowNudge(false);
    }
  };

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
          style={{ backgroundColor: 'var(--accent)' }}
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
          What's one small thing that person does regularly?
        </h2>

        {/* Supporting text */}
        <p
          className="text-sm mb-8"
          style={{ color: 'var(--text-2)' }}
        >
          The smaller, the better. Tiny habits build grooves faster.
        </p>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
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

        {/* Nudge card */}
        <AnimatePresence>
          {showNudge && (
            <motion.div
              className="mt-4 p-4 rounded-xl"
              style={{
                backgroundColor: 'var(--accent-light)',
                border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <p
                className="text-sm"
                style={{ color: 'var(--accent)' }}
              >
                Want to start smaller? Tiny habits are stickier.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setInput('');
                    setTimeout(() => inputRef.current?.focus(), 100);
                    setShowNudge(false);
                  }}
                  className="btn btn-sm"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: '#fff',
                  }}
                >
                  Simplify it
                </button>
                <button
                  onClick={() => setShowNudge(false)}
                  className="btn btn-sm"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--text-3)',
                  }}
                >
                  Keep mine
                </button>
              </div>
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
        </motion.div>
      </motion.div>
    </div>
  );
}
