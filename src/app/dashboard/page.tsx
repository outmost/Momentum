'use client';
import React from 'react';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { CompletionChart } from '@/components/dashboard/CompletionChart';
import { GoalBreakdown } from '@/components/dashboard/GoalBreakdown';

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Dashboard</h1>
      <div className="space-y-6">
        <SummaryCards />
        <CompletionChart />
        <GoalBreakdown />
      </div>
    </div>
  );
}
