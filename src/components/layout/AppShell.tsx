'use client';
import React, { useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useTheme } from '@/hooks/useTheme';
import { useUIStore } from '@/lib/store';
import { QuickAddModal } from '@/components/goals/QuickAddModal';
import { Undo2 } from 'lucide-react';

function Toast() {
  const { toast, setToast } = useUIStore();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const dismiss = useCallback(() => {
    setToast(null);
  }, [setToast]);

  useEffect(() => {
    if (!toast) return;
    timerRef.current = setTimeout(dismiss, 5000);
    return () => clearTimeout(timerRef.current);
  }, [toast, dismiss]);

  if (!toast) return null;

  return (
    <div
      className="fixed z-50 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-2xl animate-in slide-in-from-bottom-4"
      style={{
        bottom: 'calc(100px + env(safe-area-inset-bottom, 0px))',
        backgroundColor: 'var(--text)',
        color: 'var(--bg)',
        boxShadow: 'var(--shadow-lg)',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <p className="text-[13px] font-medium whitespace-nowrap">{toast.message}</p>
      {toast.undoAction && (
        <button
          onClick={() => {
            toast.undoAction?.();
            dismiss();
          }}
          className="flex items-center gap-1 text-[13px] font-semibold shrink-0 px-2 py-1 rounded-lg transition-colors"
          style={{ color: 'var(--accent)', backgroundColor: 'rgba(255,255,255,0.1)' }}
        >
          <Undo2 size={13} />
          Undo
        </button>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  useTheme();
  const { addGoalOpen, setAddGoalOpen } = useUIStore();

  return (
    <div className="flex overflow-hidden" style={{ backgroundColor: 'var(--bg)', height: '100dvh' }}>
      <Sidebar />
      <main
        className="shell-main flex-1 overflow-y-auto"
        style={{
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="max-w-[560px] mx-auto px-5 py-7 md:py-10">
          {children}
        </div>
      </main>
      <BottomNav />

      <QuickAddModal open={addGoalOpen} onClose={() => setAddGoalOpen(false)} />

      <Toast />
    </div>
  );
}
