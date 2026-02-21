'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useUIStore } from '@/lib/store';
import { formatDuration } from '@/lib/utils';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface TimerEntryProps {
  goalId: string;
  value: number;
  target: number;
  onChange: (value: number) => void;
  color?: string;
}

const SUCCESS_THRESHOLD = 0.8;

export function TimerEntry({ goalId, value, target, onChange, color = '#16A34A' }: TimerEntryProps) {
  const { activeTimer, setActiveTimer } = useUIStore();
  const isRunning = activeTimer?.goalId === goalId;
  const [display, setDisplay] = useState(value);
  const [justHitTarget, setJustHitTarget] = useState(false);
  const prevDisplay = useRef(value);

  useEffect(() => {
    if (!isRunning) { setDisplay(value); return; }
    const interval = setInterval(() => {
      const elapsed = activeTimer!.elapsed + (Date.now() - activeTimer!.startedAt) / 1000;
      setDisplay(Math.floor(elapsed));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, activeTimer, value]);

  // Detect target hit
  useEffect(() => {
    if (target > 0 && prevDisplay.current < target && display >= target) {
      setJustHitTarget(true);
      setTimeout(() => setJustHitTarget(false), 600);
    }
    prevDisplay.current = display;
  }, [display, target]);

  const progress = target > 0 ? Math.min(100, Math.round((display / target) * 100)) : 0;
  const isSuccess = target > 0 && display >= target * SUCCESS_THRESHOLD;
  const isComplete = target > 0 ? display >= target : display > 0;

  function handleToggle() {
    if (isRunning) {
      const elapsed = activeTimer!.elapsed + (Date.now() - activeTimer!.startedAt) / 1000;
      onChange(Math.floor(elapsed));
      setActiveTimer(null);
    } else {
      setActiveTimer({ goalId, startedAt: Date.now(), elapsed: value });
    }
  }

  return (
    <div className="space-y-1.5 mt-1.5">
      <div className="flex items-center gap-2.5">
        {/* Play/pause — with pulse animation while running */}
        <button
          onClick={handleToggle}
          className={`w-6 h-6 rounded flex items-center justify-center transition-all duration-200 active:scale-90 ${
            isRunning ? 'animate-ring-pulse' : ''
          }`}
          style={{
            backgroundColor: isRunning ? color : 'transparent',
            border: `1px solid ${isRunning ? color : 'var(--border)'}`,
            color: isRunning ? 'white' : 'var(--text-2)',
            boxShadow: isRunning ? `0 0 8px ${color}30` : 'none',
          }}
        >
          {isRunning ? <Pause size={10} /> : <Play size={10} />}
        </button>

        {/* Time display */}
        <div className="flex items-baseline gap-1">
          <span
            className={`text-lg font-semibold tabular leading-none transition-all duration-200 ${
              justHitTarget ? 'animate-bounce-subtle' : ''
            }`}
            style={{
              color: isComplete ? color : isSuccess ? color : 'var(--text)',
              fontVariantNumeric: 'tabular-nums',
              textShadow: justHitTarget ? `0 0 12px ${color}40` : 'none',
            }}
          >
            {formatDuration(display)}
          </span>
          {target > 0 && (
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
              / {formatDuration(target)}
            </span>
          )}
        </div>

        {/* Reset */}
        <button
          onClick={() => { setActiveTimer(null); onChange(0); setDisplay(0); }}
          className="transition-all duration-200 hover:scale-110 active:scale-90"
          style={{ color: 'var(--text-3)' }}
          title="Reset"
        >
          <RotateCcw size={11} />
        </button>
      </div>

      {/* Progress bar with OKR 80 % milestone tick */}
      {target > 0 && (
        <ProgressBar
          value={progress}
          size="sm"
          color={isSuccess ? color : 'var(--text-3)'}
          milestone={80}
          className="max-w-[120px]"
        />
      )}
    </div>
  );
}
