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

// OKR-inspired: 80 % is the "great work" success point.
// Reaching it earns a dopamine hit; 100 % is the full target.
const SUCCESS_THRESHOLD = 0.8;

export function NumericEntry({ value, target, unit, onChange, color = '#16A34A' }: NumericEntryProps) {
  const [inputMode, setInputMode] = useState(false);
  const [inputVal, setInputVal] = useState(value.toString());

  const rawProgress = target > 0 ? (value / target) * 100 : 0;
  const progress = Math.min(100, Math.round(rawProgress));
  const isSuccess = target > 0 && value >= target * SUCCESS_THRESHOLD; // ≥ 80 %
  const isComplete = target > 0 ? value >= target : value > 0;         // 100 %
  const isStretch = target > 0 && value > target;                       // beyond target

  function handleConfirm() {
    const num = Number(inputVal);
    if (!isNaN(num) && num >= 0) onChange(num);
    setInputMode(false);
  }

  // The value text colour graduates: default → success-colour at 80 %
  const valueColor = isComplete ? color : isSuccess ? color : 'var(--text)';

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
              className="text-lg font-semibold tabular leading-none transition-colors duration-200"
              style={{ color: valueColor }}
            >
              {value}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
              / {target}{unit ? ` ${unit}` : ''}
            </span>
            {/* Over-target badge — shows how far past the goal the user went */}
            {isStretch && (
              <span
                className="ml-0.5 text-[10px] font-semibold"
                style={{ color: color, opacity: 0.8 }}
              >
                +{value - target}{unit ? ` ${unit}` : ''}
              </span>
            )}
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

      {/* Progress bar with OKR 80 % milestone tick */}
      {target > 0 && (
        <div className="flex items-center gap-1.5 max-w-[120px]">
          <ProgressBar
            value={progress}
            size="sm"
            color={isSuccess ? color : 'var(--text-3)'}
            milestone={80}
            className="flex-1"
          />
          {/* Subtle % label fades in once there's meaningful progress */}
          {value > 0 && (
            <span
              className="text-[9px] tabular leading-none transition-colors duration-200"
              style={{ color: isSuccess ? color : 'var(--text-3)', opacity: 0.7, minWidth: 20, textAlign: 'right' }}
            >
              {progress}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
