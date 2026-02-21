'use client';
import React from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useTheme } from '@/hooks/useTheme';
import { useUIStore } from '@/lib/store';
import { Modal } from '@/components/ui/Modal';
import { GoalForm } from '@/components/goals/GoalForm';

export function AppShell({ children }: { children: React.ReactNode }) {
  useTheme();
  const { addGoalOpen, setAddGoalOpen } = useUIStore();

  return (
    <div className="flex overflow-hidden" style={{ backgroundColor: 'var(--bg)', height: '100dvh' }}>
      <Sidebar />
      <main
        className="shell-main flex-1 overflow-y-auto"
        style={{
          /* Smooth inertial scroll on iOS */
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="max-w-[560px] mx-auto px-5 py-7 md:py-10">
          {children}
        </div>
      </main>
      <BottomNav />

      {/* Global add goal modal — triggered from bottom nav (+) or sidebar button */}
      <Modal open={addGoalOpen} onClose={() => setAddGoalOpen(false)} title="New goal" size="md">
        <GoalForm onClose={() => setAddGoalOpen(false)} />
      </Modal>
    </div>
  );
}
