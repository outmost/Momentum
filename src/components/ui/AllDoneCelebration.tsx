'use client';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AllDoneCelebrationProps {
  active: boolean;
  message?: string;
}

const CELEBRATION_QUOTES = [
  { text: 'Consistency is the compound interest of self-improvement.', attr: 'James Clear' },
  { text: 'Discipline is remembering what you want.', attr: 'David Campbell' },
  { text: 'We are what we repeatedly do.', attr: 'Aristotle' },
  { text: 'Small daily improvements are the key to staggering long-term results.', attr: 'Anonymous' },
  { text: 'You don\'t rise to the level of your goals, you fall to the level of your systems.', attr: 'James Clear' },
];

const STAR_TRAIL_COUNT = 8;

function generateTrail() {
  return Array.from({ length: STAR_TRAIL_COUNT }, (_, i) => ({
    id: i,
    delay: i * 0.06,
    size: 8 - i * 0.6,
    opacity: 1 - i * 0.1,
  }));
}

export function AllDoneCelebration({ active, message }: AllDoneCelebrationProps) {
  const [quote] = useState(() =>
    CELEBRATION_QUOTES[Math.floor(Math.random() * CELEBRATION_QUOTES.length)]
  );
  const [starDone, setStarDone] = useState(false);
  const trail = generateTrail();

  useEffect(() => {
    if (active) {
      setStarDone(false);
      const t = setTimeout(() => setStarDone(true), 1500);
      return () => clearTimeout(t);
    } else {
      setStarDone(false);
    }
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Shooting star + trail */}
          <div className="fixed inset-0 pointer-events-none z-[90] overflow-hidden">
            {/* Trail particles */}
            {trail.map(p => (
              <motion.div
                key={p.id}
                className="absolute rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  background: 'radial-gradient(circle, #FFD700, #FFA500)',
                  boxShadow: `0 0 ${p.size * 2}px #FFD700`,
                }}
                initial={{ x: '-10vw', y: '80vh', opacity: 0 }}
                animate={{ x: '110vw', y: '-15vh', opacity: [0, p.opacity, 0] }}
                transition={{
                  duration: 1.4,
                  delay: p.delay,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              />
            ))}

            {/* The comet head */}
            <motion.div
              className="absolute"
              style={{ fontSize: 32, filter: 'drop-shadow(0 0 12px #FFD700)' }}
              initial={{ x: '-10vw', y: '80vh', rotate: -40, scale: 0.5, opacity: 0 }}
              animate={{
                x: '110vw',
                y: '-15vh',
                rotate: -40,
                scale: [0.5, 1.3, 1],
                opacity: [0, 1, 1, 0],
              }}
              transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              ✨
            </motion.div>
          </div>

          {/* Banner — fades in after the star has passed */}
          <AnimatePresence>
            {starDone && (
              <motion.div
                className="fixed inset-0 flex items-center justify-center z-[80] pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <motion.div
                  className="mx-6 px-8 py-7 rounded-2xl text-center max-w-sm w-full"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid color-mix(in srgb, var(--success) 25%, var(--border))',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px color-mix(in srgb, var(--success) 15%, transparent)',
                  }}
                  initial={{ scale: 0.8, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.9, y: -10, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                >
                  {/* Celebration icon */}
                  <motion.div
                    className="text-5xl mb-4"
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.1 }}
                  >
                    🏆
                  </motion.div>

                  <motion.p
                    className="text-lg font-bold mb-1"
                    style={{ color: 'var(--success)' }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {message || 'All done today.'}
                  </motion.p>

                  <motion.p
                    className="text-sm leading-relaxed mb-1"
                    style={{ color: 'var(--text-2)', fontStyle: 'italic' }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    &ldquo;{quote.text}&rdquo;
                  </motion.p>

                  <motion.p
                    className="text-xs"
                    style={{ color: 'var(--text-3)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    — {quote.attr}
                  </motion.p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
