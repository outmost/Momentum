'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface WelcomeScreenProps {
  onNext: () => void;
}

export function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <motion.div
        className="text-center max-w-[480px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Wordmark */}
        <motion.h1
          className="text-4xl font-bold mb-2"
          style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        >
          Groove
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="text-sm mb-12"
          style={{ color: 'var(--text-3)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
        >
          Habits that stick.
        </motion.p>

        {/* Headline */}
        <motion.p
          className="text-2xl font-semibold leading-snug mb-12"
          style={{ color: 'var(--text)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
        >
          Most habit apps track what you do.
          <br />
          Groove tracks who you're becoming.
        </motion.p>

        {/* CTA Button */}
        <motion.button
          onClick={onNext}
          className="btn btn-primary w-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4 }}
        >
          Get started
        </motion.button>
      </motion.div>
    </div>
  );
}
