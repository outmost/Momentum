'use client';
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, className, size = 'md' }: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop with fade-in */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-in"
        onClick={onClose}
      />
      {/* Modal panel */}
      <div
        className={cn(
          'relative w-full rounded-xl overflow-hidden',
          'animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95',
          sizes[size],
          className
        )}
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
        }}
      >
        {title && (
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{title}</h2>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded transition-all duration-200 hover:scale-110 active:scale-90"
              style={{ color: 'var(--text-3)' }}
            >
              <X size={15} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto max-h-[85vh]">{children}</div>
      </div>
    </div>
  );
}
