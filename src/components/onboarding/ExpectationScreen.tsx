'use client';
import React from 'react';
import { motion } from 'motion/react';

interface ExpectationScreenProps {
  onNext: () => void;
}

export function ExpectationScreen({ onNext }: ExpectationScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <motion.div
        className="w-full max-w-[360px] text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* First line of copy */}
        <motion.p
          className="text-xl leading-relaxed font-medium mb-6"
          style={{ color: 'var(--text)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Habits take 2–10 months to become truly automatic — not 21 days.
        </motion.p>

        {/* Second line of copy */}
        <motion.p
          className="text-lg leading-relaxed font-normal"
          style={{ color: 'var(--text-2)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Groove won't punish you for missing a day. It'll show you how far you've actually come.
        </motion.p>

        {/* CTA Button */}
        <motion.button
          onClick={onNext}
          className="btn btn-primary w-full mt-12"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          I'm in
        </motion.button>
      </motion.div>
    </div>
  );
}
