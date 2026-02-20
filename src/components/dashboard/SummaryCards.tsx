'use client';
import React from 'react';
import { Target, Zap, Calendar, TrendingUp } from 'lucide-react';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useTodayProgress } from '@/hooks/useStats';
import { useAllGoalStats } from '@/hooks/useStats';
import { format } from 'date-fns';

export function SummaryCards() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayProgress = useTodayProgress(today);
  const allStats = useAllGoalStats();
  
  const todayPercent = todayProgress && todayProgress.total > 0
    ? Math.round((todayProgress.completed / todayProgress.total) * 100)
    : 0;
  
  const maxStreak = allStats?.reduce((max, s) => Math.max(max, s.currentStreak), 0) ?? 0;
  const weekRate = allStats && allStats.length > 0
    ? Math.round(allStats.reduce((sum, s) => sum + s.completionRate7, 0) / allStats.length)
    : 0;
  const monthRate = allStats && allStats.length > 0
    ? Math.round(allStats.reduce((sum, s) => sum + s.completionRate30, 0) / allStats.length)
    : 0;
  
  const cards = [
    {
      icon: <ProgressRing value={todayPercent} size={52} strokeWidth={5} color="#10B981">
        <span className="text-xs font-bold text-gray-900 dark:text-white">{todayPercent}%</span>
      </ProgressRing>,
      label: "Today's Progress",
      value: todayProgress ? `${todayProgress.completed} / ${todayProgress.total}` : '0 / 0',
      sub: 'goals done',
    },
    {
      icon: <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center"><Zap size={22} className="text-amber-500" /></div>,
      label: 'Best Streak',
      value: `${maxStreak}`,
      sub: 'days in a row',
    },
    {
      icon: <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center"><Calendar size={22} className="text-blue-500" /></div>,
      label: 'This Week',
      value: `${weekRate}%`,
      sub: 'avg completion',
    },
    {
      icon: <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center"><TrendingUp size={22} className="text-purple-500" /></div>,
      label: 'This Month',
      value: `${monthRate}%`,
      sub: 'avg completion',
    },
  ];
  
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map(({ icon, label, value, sub }) => (
        <div key={label} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="mb-3">{icon}</div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>
        </div>
      ))}
    </div>
  );
}
