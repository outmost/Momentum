'use client';
import React from 'react';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { CompletionChart } from '@/components/dashboard/CompletionChart';
import { GoalBreakdown } from '@/components/dashboard/GoalBreakdown';

export default function DashboardPage() {
  return (
    <div>
      <h1 className="page-title mb-7 animate-in">Progress</h1>
      <div className="space-y-4">
        <SummaryCards />
        <CompletionChart />
        <GoalBreakdown />
      </div>
    </div>
  );
}
