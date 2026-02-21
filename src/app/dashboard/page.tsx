'use client';
import React from 'react';
import { Flame } from 'lucide-react';
import { useOverallStreak } from '@/hooks/useStats';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { CompletionChart } from '@/components/dashboard/CompletionChart';
import { GoalBreakdown } from '@/components/dashboard/GoalBreakdown';

export default function DashboardPage() {
  const streak = useOverallStreak();

  return (
    <div>
      <div className="flex items-baseline justify-between mb-7 animate-in">
        <h1 className="page-title">Progress</h1>
        {streak && streak.current > 0 && (
          <div className="streak-badge">
            <Flame size={13} className={streak.current >= 3 ? 'animate-streak-flame' : ''} />
            <span className="tabular">{streak.current} day streak</span>
          </div>
        )}
      </div>
      <div className="space-y-4">
        <SummaryCards />
        <CompletionChart />
        <GoalBreakdown />
      </div>
    </div>
  );
}
