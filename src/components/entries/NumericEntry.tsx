'use client';
import React, { useState } from 'react';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface NumericEntryProps {
  value: number;
  target: number;
  unit?: string;
  onChange: (value: number) => void;
  color?: string;
}

export function NumericEntry({ value, target, unit, onChange, color = '#16A34A' }: NumericEntryProps) {
  const [inputMode, setInputMode] = useState(false);
  const [inputVal, setInputVal] = useState(value.toString());
  const progress = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const isComplete = target > 0 ? value >= target : value > 0;

  function handleConfirm() {
    const num = Number(inputVal);
    if (!isNaN(num) && num >= 0) onChange(num);
    setInputMode(false);
  }

  return (
    <div className="space-y-1.5 mt-1.5">
      <div className="flex items-center gap-2">
        {/* Decrement */}
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-6 h-6 rounded flex items-center justify-center text-base leading-none transition-colors select-none"
          style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}
        >
          −
        </button>

        {/* Value display / edit */}
        {inputMode ? (
          <input
            type="number"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onBlur={handleConfirm}
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            autoFocus
            className="w-16 text-center text-sm font-semibold bg-transparent focus:outline-none tabular"
            style={{ borderBottom: '1px solid var(--accent)', color: 'var(--text)' }}
          />
        ) : (
          <button
            onClick={() => { setInputVal(value.toString()); setInputMode(true); }}
            className="flex items-baseline gap-1 transition-colors"
          >
            <span
              className="text-lg font-semibold tabular leading-none"
              style={{ color: isComplete ? color : 'var(--text)' }}
            >
              {value}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
              / {target}{unit ? ` ${unit}` : ''}
            </span>
          </button>
        )}

        {/* Increment */}
        <button
          onClick={() => onChange(value + 1)}
          className="w-6 h-6 rounded flex items-center justify-center text-base leading-none transition-colors select-none"
          style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}
        >
          +
        </button>
      </div>

      {/* Progress bar only when there's something to show */}
      {target > 0 && (
        <ProgressBar value={progress} size="sm" color={color} className="max-w-[120px]" />
      )}
    </div>
  );
}
