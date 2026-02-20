'use client';
import React from 'react';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { CompletionChart } from '@/components/dashboard/CompletionChart';
import { GoalBreakdown } from '@/components/dashboard/GoalBreakdown';

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-7" style={{ color: 'var(--text)' }}>Progress</h1>
      <div className="space-y-5">
        <SummaryCards />
        <CompletionChart />
        <GoalBreakdown />
      </div>
    </div>
  );
}
