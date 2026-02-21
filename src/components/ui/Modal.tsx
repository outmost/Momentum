'use client';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const scrollYRef = useRef(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;

    // iOS Safari ignores overflow:hidden on body — use position:fixed instead
    scrollYRef.current = window.scrollY;
    const body = document.body;
    body.style.position = 'fixed';
    body.style.top      = `-${scrollYRef.current}px`;
    body.style.left     = '0';
    body.style.right    = '0';

    return () => {
      body.style.position = '';
      body.style.top      = '';
      body.style.left     = '';
      body.style.right    = '';
      // Restore scroll position
      window.scrollTo(0, scrollYRef.current);
    };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const maxWidths = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' };

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:p-4"
      // Prevent pointer events from falling through to content beneath
      style={{ touchAction: 'none' }}
    >
      {/* Backdrop — no blur, just a dark overlay. Blur is expensive on mobile. */}
      <div
        className="absolute inset-0 animate-in"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />

      {/* Sheet on mobile / dialog on desktop */}
      <div
        className={cn(
          // Layout
          'relative w-full flex flex-col',
          // Entrance animation
          'animate-in slide-in-from-bottom-4 sm:zoom-in-95',
          // Rounded: top-only on mobile, all on desktop
          'rounded-t-[20px] sm:rounded-2xl',
          // Desktop max-width
          maxWidths[size],
          className,
        )}
        style={{
          backgroundColor: 'var(--surface)',
          // dvh = dynamic viewport height — shrinks when iOS keyboard appears
          maxHeight: '92dvh',
          boxShadow: '0 -2px 20px rgba(0,0,0,0.08), 0 0 0 1px var(--border)',
        }}
        // Prevent taps on the sheet from closing via backdrop handler
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle — visible only on mobile to signal swipe-down to close */}
        <div
          className="sm:hidden shrink-0 flex justify-center"
          style={{ paddingTop: '10px', paddingBottom: '4px' }}
          onClick={onClose}
          role="button"
          aria-label="Close"
        >
          <div
            className="w-9 h-[5px] rounded-full"
            style={{ backgroundColor: 'var(--border-2)' }}
          />
        </div>

        {/* Header */}
        {title && (
          <div
            className="flex items-center justify-between shrink-0 px-5 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <h2
              className="text-[13px] font-semibold"
              style={{ color: 'var(--text)' }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--border)] active:scale-90"
              style={{ color: 'var(--text-3)' }}
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Scrollable content — overscroll-contain stops the page behind from scrolling */}
        <div
          className="flex-1 overflow-y-auto"
          style={{
            overscrollBehavior: 'contain',
            // Smooth momentum scroll on iOS
            WebkitOverflowScrolling: 'touch',
            // Pad bottom for iOS home indicator
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  // Render via portal to escape any stacking context issues (e.g. iOS overflow scrolling)
  return createPortal(content, document.body);
}
