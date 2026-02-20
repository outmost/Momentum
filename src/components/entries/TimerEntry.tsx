'use client';
import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useUIStore } from '@/lib/store';
import { formatDuration } from '@/lib/utils';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface TimerEntryProps {
  goalId: string;
  value: number; // seconds elapsed
  target: number; // seconds target
  onChange: (value: number) => void;
  color?: string;
}

export function TimerEntry({ goalId, value, target, onChange, color = '#10B981' }: TimerEntryProps) {
  const { activeTimer, setActiveTimer } = useUIStore();
  const isRunning = activeTimer?.goalId === goalId;
  const [display, setDisplay] = useState(value);
  
  useEffect(() => {
    if (!isRunning) {
      setDisplay(value);
      return;
    }
    
    const interval = setInterval(() => {
      const elapsed = activeTimer!.elapsed + (Date.now() - activeTimer!.startedAt) / 1000;
      setDisplay(Math.floor(elapsed));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRunning, activeTimer, value]);
  
  const progress = target > 0 ? Math.min(100, Math.round((display / target) * 100)) : 0;
  
  function handleToggle() {
    if (isRunning) {
      // Stop timer - save elapsed
      const elapsed = activeTimer!.elapsed + (Date.now() - activeTimer!.startedAt) / 1000;
      const total = Math.floor(elapsed);
      onChange(total);
      setActiveTimer(null);
    } else {
      // Start timer
      setActiveTimer({ goalId, startedAt: Date.now(), elapsed: value });
    }
  }
  
  function handleReset() {
    setActiveTimer(null);
    onChange(0);
    setDisplay(0);
  }
  
  return (
    <div className="flex flex-col gap-1.5 min-w-[120px]">
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggle}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors"
          style={{ backgroundColor: color }}
        >
          {isRunning ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-mono">
          {formatDuration(display)} / {formatDuration(target)}
        </span>
        <button onClick={handleReset} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <RotateCcw size={14} />
        </button>
      </div>
      <ProgressBar value={progress} size="sm" color={color} />
    </div>
  );
}
