'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { createGoal } from '@/hooks/useGoals';
import { updateSettings } from '@/hooks/useSettings';
import { createFolder } from '@/hooks/useFolders';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'welcome' | 'identity' | 'habit';

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [identity, setIdentity] = useState('');
  const [habit, setHabit] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = () => {
    if (step === 'welcome') {
      setStep('identity');
    } else if (step === 'identity' && identity.trim()) {
      setStep('habit');
    }
  };

  const handleComplete = async () => {
    if (!habit.trim()) return;

    setIsLoading(true);
    try {
      // Create a default folder for the habit
      const folderId = await createFolder({
        name: 'Personal Growth',
        color: 'indigo',
        icon: '🌱',
        category: 'mindful-consumption',
      });

      // Create the first goal
      await createGoal({
        folderId,
        title: habit.trim(),
        type: 'binary',
        frequency: 'daily',
        sortOrder: 1000,
        visibility: 'private',
      });

      // Update settings
      await updateSettings({
        onboardingCompleted: true,
        userIdentity: identity.trim() || 'Me',
      });

      // Close modal and reset
      onClose();
      setStep('welcome');
      setIdentity('');
      setHabit('');
    } catch (err) {
      console.error('Onboarding error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-[var(--surface)] rounded-2xl max-w-[480px] w-full p-8 relative"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          {/* Welcome Screen */}
          {step === 'welcome' && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h1
                className="text-3xl font-bold mb-2"
                style={{ color: 'var(--text)' }}
              >
                Welcome to Groove
              </h1>
              <p
                className="text-sm mb-8"
                style={{ color: 'var(--text-2)' }}
              >
                Build habits that shape who you're becoming.
              </p>
              <button
                onClick={handleNext}
                className="btn btn-primary w-full"
              >
                Get started
              </button>
            </motion.div>
          )}

          {/* Identity Screen */}
          {step === 'identity' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h2
                className="text-2xl font-semibold mb-2"
                style={{ color: 'var(--text)' }}
              >
                Who do you want to become?
              </h2>
              <p
                className="text-sm mb-6"
                style={{ color: 'var(--text-2)' }}
              >
                Your identity anchors your habits.
              </p>
              <input
                type="text"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                placeholder="e.g., A healthy person, A disciplined learner"
                className="field w-full mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('welcome')}
                  className="btn btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!identity.trim()}
                  className="btn btn-primary flex-1"
                >
                  Next
                </button>
              </div>
            </motion.div>
          )}

          {/* Habit Screen */}
          {step === 'habit' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h2
                className="text-2xl font-semibold mb-2"
                style={{ color: 'var(--text)' }}
              >
                Your first habit
              </h2>
              <p
                className="text-sm mb-6"
                style={{ color: 'var(--text-2)' }}
              >
                Start with something small. Smaller habits stick faster.
              </p>
              <input
                type="text"
                value={habit}
                onChange={(e) => setHabit(e.target.value)}
                placeholder="e.g., 10-minute walk, Drink a glass of water"
                className="field w-full mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('identity')}
                  className="btn btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!habit.trim() || isLoading}
                  className="btn btn-primary flex-1"
                >
                  {isLoading ? 'Creating...' : 'Start'}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
