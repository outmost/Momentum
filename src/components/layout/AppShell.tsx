'use client';
import React from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useTheme } from '@/hooks/useTheme';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  useTheme();
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
