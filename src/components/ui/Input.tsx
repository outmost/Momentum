import React from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const fieldBase = 'w-full px-3 py-2 rounded-md text-sm focus:outline-none transition-colors placeholder:text-[var(--text-3)]';
const fieldStyle = {
  border: '1px solid var(--border)',
  backgroundColor: 'transparent',
  color: 'var(--text)',
};

export function Input({ label, error, hint, className, id, style, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(fieldBase, className)}
        style={{ ...fieldStyle, ...(error ? { borderColor: 'var(--danger)' } : {}), ...style }}
        {...props}
      />
      {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
      {hint && !error && <p className="text-xs" style={{ color: 'var(--text-3)' }}>{hint}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className, id, style, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(fieldBase, 'resize-none', className)}
        style={{ ...fieldStyle, ...(error ? { borderColor: 'var(--danger)' } : {}), ...style }}
        {...props}
      />
      {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
      {hint && !error && <p className="text-xs" style={{ color: 'var(--text-3)' }}>{hint}</p>}
    </div>
  );
}
