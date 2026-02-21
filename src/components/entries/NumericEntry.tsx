'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface NumericEntryProps {
  value: number;
  target: number;
  unit?: string;
  onChange: (value: number) => void;
  color?: string;
}

const SUCCESS_THRESHOLD = 0.8;

export function NumericEntry({ value, target, unit, onChange, color = '#16A34A' }: NumericEntryProps) {
  const [inputMode, setInputMode] = useState(false);
  const [inputVal, setInputVal] = useState(value.toString());
  const [bumping, setBumping] = useState<'up' | 'down' | null>(null);
  const [justHitTarget, setJustHitTarget] = useState(false);
  const prevValue = useRef(value);

  const rawProgress = target > 0 ? (value / target) * 100 : 0;
  const progress = Math.min(100, Math.round(rawProgress));
  const isSuccess = target > 0 && value >= target * SUCCESS_THRESHOLD;
  const isComplete = target > 0 ? value >= target : value > 0;
  const isStretch = target > 0 && value > target;

  // Detect when user just hit the target
  useEffect(() => {
    if (target > 0 && prevValue.current < target && value >= target) {
      setJustHitTarget(true);
      setTimeout(() => setJustHitTarget(false), 600);
    }
    prevValue.current = value;
  }, [value, target]);

  function handleConfirm() {
    const num = Number(inputVal);
    if (!isNaN(num) && num >= 0) onChange(num);
    setInputMode(false);
  }

  function handleIncrement() {
    setBumping('up');
    onChange(value + 1);
    setTimeout(() => setBumping(null), 300);
  }

  function handleDecrement() {
    if (value <= 0) return;
    setBumping('down');
    onChange(Math.max(0, value - 1));
    setTimeout(() => setBumping(null), 200);
  }

  const valueColor = isComplete ? color : isSuccess ? color : 'var(--text)';

  return (
    <div className="space-y-1.5 mt-1.5">
      <div className="flex items-center gap-2">
        {/* Decrement */}
        <button
          onClick={handleDecrement}
          className="w-6 h-6 rounded flex items-center justify-center text-base leading-none transition-all duration-150 select-none active:scale-90"
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
              className={`text-lg font-semibold tabular leading-none transition-all duration-200 ${
                bumping === 'up' ? 'animate-number-bump' : bumping === 'down' ? 'animate-number-down' : ''
              } ${justHitTarget ? 'animate-bounce-subtle' : ''}`}
              style={{
                color: valueColor,
                textShadow: justHitTarget ? `0 0 12px ${color}40` : 'none',
              }}
            >
              {value}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
              / {target}{unit ? ` ${unit}` : ''}
            </span>
            {isStretch && (
              <span
                className="ml-0.5 text-[10px] font-semibold animate-float-up"
                style={{ color: color, opacity: 0.8 }}
              >
                +{value - target}{unit ? ` ${unit}` : ''}
              </span>
            )}
          </button>
        )}

        {/* Increment */}
        <button
          onClick={handleIncrement}
          className="w-6 h-6 rounded flex items-center justify-center text-base leading-none transition-all duration-150 select-none active:scale-90"
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
            color={value > 0 ? color : 'var(--border-2)'}
            milestone={80}
            className="flex-1"
          />
          {value > 0 && (
            <span
              className={`text-[9px] tabular leading-none transition-all duration-200 ${justHitTarget ? 'animate-counter-up' : ''}`}
              style={{ color: value > 0 ? color : 'var(--text-3)', opacity: 0.75, minWidth: 20, textAlign: 'right' }}
            >
              {progress}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
