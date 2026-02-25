'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  glass?: boolean;
}

export function Modal({ open, onClose, title, children, className, size = 'md', glass = false }: ModalProps) {
  const scrollYRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragDelta = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
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
      window.scrollTo(0, scrollYRef.current);
    };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Swipe-to-dismiss handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true;
    dragStartY.current = e.touches[0].clientY;
    dragDelta.current = 0;
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    dragDelta.current = Math.max(0, delta); // Only allow dragging down
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${dragDelta.current}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (dragDelta.current > 80) {
      // Dismiss — animate out then close
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
        sheetRef.current.style.transform = 'translateY(100%)';
      }
      setTimeout(onClose, 250);
    } else {
      // Snap back
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        sheetRef.current.style.transform = '';
      }
    }
    dragDelta.current = 0;
  }, [onClose]);

  if (!open || !mounted) return null;

  const maxWidths = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' };

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:p-4"
      style={{ touchAction: 'none' }}
    >
      <div
        className="absolute inset-0 animate-in"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        className={cn(
          'relative w-full flex flex-col',
          'animate-in slide-in-from-bottom-4 sm:zoom-in-95',
          'rounded-t-[20px] sm:rounded-2xl',
          maxWidths[size],
          className,
        )}
        style={{
          backgroundColor: glass ? 'var(--frosted-light)' : 'var(--surface)',
          backdropFilter: glass ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: glass ? 'blur(20px)' : 'none',
          maxHeight: '92dvh',
          boxShadow: glass
            ? '0 -2px 20px rgba(0,0,0,0.08), 0 0 0 1px rgba(255, 255, 255, 0.5)'
            : '0 -2px 20px rgba(0,0,0,0.08), 0 0 0 1px var(--border)',
          border: glass ? 'none' : undefined,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle — swipe down to close on mobile */}
        <div
          className="sm:hidden shrink-0 flex justify-center cursor-grab active:cursor-grabbing"
          style={{ paddingTop: '10px', paddingBottom: '4px' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          role="button"
          aria-label="Drag down to close"
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

        <div
          className="flex-1 overflow-y-auto"
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
