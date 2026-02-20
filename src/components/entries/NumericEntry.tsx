'use client';
import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface NumericEntryProps {
  value: number;
  target: number;
  unit?: string;
  onChange: (value: number) => void;
  color?: string;
}

export function NumericEntry({ value, target, unit, onChange, color = '#10B981' }: NumericEntryProps) {
  const [inputMode, setInputMode] = useState(false);
  const [inputVal, setInputVal] = useState(value.toString());
  const progress = target > 0 ? Math.round((value / target) * 100) : 0;
  
  function handleConfirm() {
    const num = Number(inputVal);
    if (!isNaN(num) && num >= 0) {
      onChange(num);
    }
    setInputMode(false);
  }
  
  return (
    <div className="flex flex-col gap-1.5 min-w-[120px]">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Minus size={12} />
        </button>
        
        {inputMode ? (
          <input
            type="number"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onBlur={handleConfirm}
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            autoFocus
            className="w-16 text-center text-sm font-medium bg-transparent border-b border-blue-500 focus:outline-none text-gray-900 dark:text-gray-100"
          />
        ) : (
          <button
            onClick={() => { setInputVal(value.toString()); setInputMode(true); }}
            className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[60px] text-center hover:text-blue-500"
          >
            {value} / {target}
            {unit && <span className="text-xs text-gray-400 ml-1">{unit}</span>}
          </button>
        )}
        
        <button
          onClick={() => onChange(value + 1)}
          className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>
      <ProgressBar value={progress} size="sm" color={color} />
    </div>
  );
}
