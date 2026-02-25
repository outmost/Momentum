'use client';
import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface CueScreenProps {
  onBack: () => void;
  onNext: (cue: string) => void;
}

const CUE_OPTIONS = [
  'After morning coffee',
  'Before I check my phone',
  'After I brush my teeth',
  'When I sit down at my desk',
  'After I get home',
];

export function CueScreen({ onBack, onNext }: CueScreenProps) {
  const [selectedCue, setSelectedCue] = useState<string | null>(null);
  const [customCue, setCustomCue] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const canContinue = selectedCue || (customCue.length > 0 && showCustom);

  const handleSelectCue = (cue: string) => {
    setSelectedCue(cue);
    setCustomCue('');
    setShowCustom(false);
  };

  const handleCustomChange = (value: string) => {
    setCustomCue(value);
    if (selectedCue) setSelectedCue(null);
  };

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
          style={{ backgroundColor: 'var(--accent)' }}
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
          Habits need a trigger. What do you already do every day?
        </h2>

        {/* Supporting text */}
        <p
          className="text-sm mb-8"
          style={{ color: 'var(--text-2)' }}
        >
          Attach your habit to something that already happens automatically.
        </p>

        {/* Chip grid */}
        <motion.div
          className="flex flex-wrap gap-2 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {CUE_OPTIONS.map((cue) => (
            <button
              key={cue}
              onClick={() => handleSelectCue(cue)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: selectedCue === cue ? 'var(--accent)' : 'var(--surface)',
                border: `2px solid ${selectedCue === cue ? 'var(--accent)' : 'var(--border)'}`,
                color: selectedCue === cue ? '#fff' : 'var(--text-2)',
                cursor: 'pointer',
              }}
            >
              {cue}
            </button>
          ))}
        </motion.div>

        {/* Separator */}
        <div
          className="flex items-center gap-3 my-6"
          style={{ opacity: 0.5 }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
        </div>

        {/* Custom input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <input
            type="text"
            value={customCue}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="Or describe your own trigger"
            className="field w-full"
            style={{
              fontSize: '15px',
              fontWeight: 400,
              paddingTop: '12px',
              paddingBottom: '12px',
            }}
          />
          <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
            Describe a trigger that already happens daily
          </p>
        </motion.div>

        {/* Continue button */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={() => onNext(selectedCue || customCue)}
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
