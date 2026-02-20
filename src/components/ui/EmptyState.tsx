import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <div className="mb-4" style={{ color: 'var(--border-2)' }}>{icon}</div>}
      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>{title}</h3>
      {description && (
        <p className="text-sm max-w-xs mb-6" style={{ color: 'var(--text-3)' }}>{description}</p>
      )}
      {action && <Button onClick={action.onClick} size="sm">{action.label}</Button>}
    </div>
  );
}
