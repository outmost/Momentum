import React from 'react';
import { cn } from '@/lib/cn';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  className?: string;
}

export function Select({ label, value, onChange, options, placeholder, error, className }: SelectProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full px-3 py-2 pr-8 rounded-lg border border-gray-200 dark:border-gray-600',
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
            'text-sm appearance-none',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            error && 'border-red-500'
          )}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
