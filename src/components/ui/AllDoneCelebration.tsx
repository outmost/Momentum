'use client';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AllDoneCelebrationProps {
  active: boolean;
}

const TRAIL_COUNT = 7;
const trail = Array.from({ length: TRAIL_COUNT }, (_, i) => ({
  id: i,
  delay: i * 0.055,
  size: 9 - i * 0.8,
  opacity: 1 - i * 0.12,
}));

// Pure visual effect — no overlay, no modal.
// The "all done" banner lives inline in the Today page.
export function AllDoneCelebration({ active }: AllDoneCelebrationProps) {
  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 pointer-events-none z-[90] overflow-hidden">
          {trail.map(p => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                background: 'radial-gradient(circle, #a8edcc, #34d399)',
                boxShadow: `0 0 ${p.size * 2}px #34d39966`,
              }}
              initial={{ x: '-5vw', y: '85vh', opacity: 0 }}
              animate={{ x: '108vw', y: '-10vh', opacity: [0, p.opacity, 0] }}
              transition={{ duration: 1.3, delay: p.delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          ))}
          <motion.div
            className="absolute"
            style={{ fontSize: 28, filter: 'drop-shadow(0 0 10px #34d39988)' }}
            initial={{ x: '-5vw', y: '85vh', rotate: -35, scale: 0.6, opacity: 0 }}
            animate={{ x: '108vw', y: '-10vh', rotate: -35, scale: [0.6, 1.2, 1], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            ✦
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
