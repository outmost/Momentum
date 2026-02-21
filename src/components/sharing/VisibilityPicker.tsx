'use client';
import React from 'react';
import { Lock, Users, Globe } from 'lucide-react';
import type { GoalVisibility } from '@/types';

interface VisibilityOption {
  value: GoalVisibility;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const OPTIONS: VisibilityOption[] = [
  {
    value: 'private',
    label: 'Private',
    description: 'Just you',
    icon: <Lock size={13} />,
  },
  {
    value: 'invite-only',
    label: 'Invite-only',
    description: 'Your circle',
    icon: <Users size={13} />,
  },
  {
    value: 'public',
    label: 'Public',
    description: 'Find your cohort',
    icon: <Globe size={13} />,
  },
];

interface VisibilityPickerProps {
  value: GoalVisibility;
  onChange: (v: GoalVisibility) => void;
}

export function VisibilityPicker({ value, onChange }: VisibilityPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {OPTIONS.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg transition-all duration-150 active:scale-95"
            style={{
              border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              backgroundColor: active
                ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
                : 'transparent',
              color: active ? 'var(--accent)' : 'var(--text-3)',
            }}
          >
            <span style={{ color: active ? 'var(--accent)' : 'var(--text-3)' }}>
              {opt.icon}
            </span>
            <span
              className="text-[11px] font-semibold"
              style={{ color: active ? 'var(--accent)' : 'var(--text)' }}
            >
              {opt.label}
            </span>
            <span
              className="text-[9px] leading-tight text-center"
              style={{ color: 'var(--text-3)' }}
            >
              {opt.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function VisibilityBadge({ visibility }: { visibility: GoalVisibility }) {
  const map: Record<GoalVisibility, { icon: React.ReactNode; label: string; color: string }> = {
    private:     { icon: <Lock size={9} />,  label: 'Private',     color: 'var(--text-3)' },
    'invite-only': { icon: <Users size={9} />, label: 'Invite-only', color: '#7C3AED' },
    public:      { icon: <Globe size={9} />, label: 'Public',      color: 'var(--accent)' },
  };
  const { icon, label, color } = map[visibility];
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      {icon}
      {label}
    </span>
  );
}
