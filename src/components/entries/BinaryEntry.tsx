'use client';
import React, { useState, useRef, useCallback } from 'react';
import { Check } from 'lucide-react';
import { ParticleBurst } from '@/components/ui/Confetti';

interface BinaryEntryProps {
  completed: boolean;
  onChange: (completed: boolean) => void;
  color?: string;
}

export function BinaryEntry({ completed, onChange, color = '#16A34A' }: BinaryEntryProps) {
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
      setTimeout(() => setJustCompleted(false), 500);
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
      {justCompleted && (
        <span
          className="absolute w-[18px] h-[18px] rounded-full animate-check-ring"
          style={{ border: `2px solid ${color}`, opacity: 0 }}
        />
      )}

      {/* The checkbox circle */}
      <span
        className={`w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all duration-200 ${
          justCompleted ? 'animate-check-pop' : ''
        }`}
        style={
          completed
            ? {
                backgroundColor: color,
                border: '1.5px solid transparent',
                boxShadow: justCompleted ? `0 0 12px ${color}40` : 'none',
              }
            : {
                border: '1.5px solid var(--border-2)',
                backgroundColor: 'transparent',
              }
        }
      >
        {completed && (
          <Check
            size={10}
            strokeWidth={3}
            color="white"
            className={justCompleted ? 'animate-check-pop' : ''}
          />
        )}
      </span>

      {/* Particle burst */}
      <ParticleBurst
        active={showBurst}
        color={color}
        x={20}
        y={20}
        count={8}
      />
    </button>
  );
}
