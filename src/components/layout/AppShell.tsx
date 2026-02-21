'use client';
import React from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useTheme } from '@/hooks/useTheme';

export function AppShell({ children }: { children: React.ReactNode }) {
  useTheme();
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      <Sidebar />
      {/* pb-[88px] clears the floating bottom nav (60px pill + 20px offset + 8px extra) on mobile */}
      <main className="flex-1 overflow-y-auto pb-[88px] md:pb-0">
        <div className="max-w-[560px] mx-auto px-5 py-7 md:py-10">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
