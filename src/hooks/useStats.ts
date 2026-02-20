import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { format, subDays, parseISO } from 'date-fns';
import type { Goal, Entry } from '@/types';
import { isScheduledForDate } from '@/lib/utils';

function getScheduledDays(goal: Goal, days: string[]): string[] {
  return days.filter(day => isScheduledForDate(day, goal.frequency, goal.customDays));
}

function computeCurrentStreak(entries: Entry[], goal: Goal): number {
  const today = format(new Date(), 'yyyy-MM-dd');
  let streak = 0;
  let current = new Date();
  
  const entryMap = new Map(entries.map(e => [e.date, e]));
  
  for (let i = 0; i < 365; i++) {
    const dateStr = format(current, 'yyyy-MM-dd');
    if (dateStr > today) {
      current = subDays(current, 1);
      continue;
    }
    
    if (!isScheduledForDate(dateStr, goal.frequency, goal.customDays)) {
      current = subDays(current, 1);
      continue;
    }
    
    const entry = entryMap.get(dateStr);
    if (entry && entry.completed) {
      streak++;
      current = subDays(current, 1);
    } else {
      break;
    }
  }
  
  return streak;
}

function computeBestStreak(entries: Entry[], goal: Goal): number {
  if (entries.length === 0) return 0;
  
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const entryMap = new Map(sorted.map(e => [e.date, e]));
  
  const firstDate = sorted[0].date;
  const today = format(new Date(), 'yyyy-MM-dd');
  
  let best = 0;
  let current = 0;
  let d = parseISO(firstDate);
  
  while (format(d, 'yyyy-MM-dd') <= today) {
    const dateStr = format(d, 'yyyy-MM-dd');
    
    if (!isScheduledForDate(dateStr, goal.frequency, goal.customDays)) {
      d = new Date(d.getTime() + 86400000);
      continue;
    }
    
    const entry = entryMap.get(dateStr);
    if (entry && entry.completed) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
    
    d = new Date(d.getTime() + 86400000);
  }
  
  return best;
}

function computeCompletionRate(entries: Entry[], goal: Goal, days: number): number {
  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    dates.push(format(subDays(today, i), 'yyyy-MM-dd'));
  }
  
  const scheduled = getScheduledDays(goal, dates);
  if (scheduled.length === 0) return 0;
  
  const entryMap = new Map(entries.map(e => [e.date, e]));
  const completed = scheduled.filter(d => {
    const entry = entryMap.get(d);
    return entry && entry.completed;
  }).length;
  
  return Math.round((completed / scheduled.length) * 100);
}

export function useGoalStats(goalId: string, goal: Goal | undefined) {
  return useLiveQuery(async () => {
    if (!goal) return null;
    
    const entries = await db.entries.where('goalId').equals(goalId).toArray();
    
    return {
      currentStreak: computeCurrentStreak(entries, goal),
      bestStreak: computeBestStreak(entries, goal),
      completionRate30: computeCompletionRate(entries, goal, 30),
      completionRate7: computeCompletionRate(entries, goal, 7),
      totalEntries: entries.filter(e => e.completed).length,
    };
  }, [goalId, goal?.frequency, goal?.customDays]);
}

export function useTodayProgress(date: string) {
  return useLiveQuery(async () => {
    const activeGoals = await db.goals.where('status').equals('active').toArray();
    const todayGoals = activeGoals.filter(g => isScheduledForDate(date, g.frequency, g.customDays));
    
    if (todayGoals.length === 0) return { completed: 0, total: 0 };
    
    const entries = await db.entries.where('date').equals(date).toArray();
    const entryMap = new Map(entries.map(e => [e.goalId, e]));
    
    const completed = todayGoals.filter(g => {
      const entry = entryMap.get(g.id);
      return entry && entry.completed;
    }).length;
    
    return { completed, total: todayGoals.length };
  }, [date]);
}

export function useCompletionTrend(days: number = 30) {
  return useLiveQuery(async () => {
    const today = new Date();
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      dates.push(format(subDays(today, i), 'yyyy-MM-dd'));
    }
    
    const activeGoals = await db.goals.where('status').anyOf(['active', 'completed']).toArray();
    const entries = await db.entries.toArray();
    const entryMap = new Map(entries.map(e => [`${e.goalId}:${e.date}`, e]));
    
    return dates.map(date => {
      const scheduled = activeGoals.filter(g => isScheduledForDate(date, g.frequency, g.customDays));
      if (scheduled.length === 0) return { date, rate: 0 };
      
      const completed = scheduled.filter(g => {
        const entry = entryMap.get(`${g.id}:${date}`);
        return entry && entry.completed;
      }).length;
      
      return { date, rate: Math.round((completed / scheduled.length) * 100) };
    });
  }, [days]);
}

export function useAllGoalStats() {
  return useLiveQuery(async () => {
    const goals = await db.goals.where('status').equals('active').toArray();
    const entries = await db.entries.toArray();
    
    return goals.map(goal => {
      const goalEntries = entries.filter(e => e.goalId === goal.id);
      return {
        goal,
        completionRate7: computeCompletionRate(goalEntries, goal, 7),
        completionRate30: computeCompletionRate(goalEntries, goal, 30),
        currentStreak: computeCurrentStreak(goalEntries, goal),
      };
    }).sort((a, b) => a.completionRate30 - b.completionRate30);
  });
}
