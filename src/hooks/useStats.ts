import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { format, subDays, addDays, parseISO } from 'date-fns';
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

// Full stats for individual goal detail page (keeps streak for personal insight)
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

// Completion data for a range of dates — used by WeekStrip for at-a-glance dots.
export function useDateRangeProgress(startDate: string, endDate: string) {
  return useLiveQuery(async () => {
    const goals = await db.goals.where('status').equals('active').toArray();
    if (goals.length === 0) return new Map<string, { completed: number; total: number }>();

    const entries = await db.entries
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();

    const entryByKey = new Map(entries.map(e => [`${e.goalId}:${e.date}`, e]));
    const result = new Map<string, { completed: number; total: number }>();

    let d = parseISO(startDate);
    const end = parseISO(endDate);

    while (d <= end) {
      const dateStr = format(d, 'yyyy-MM-dd');
      const scheduled = goals.filter(g =>
        isScheduledForDate(dateStr, g.frequency, g.customDays)
      );
      const completed = scheduled.filter(g =>
        entryByKey.get(`${g.id}:${dateStr}`)?.completed
      ).length;

      if (scheduled.length > 0) {
        result.set(dateStr, { completed, total: scheduled.length });
      }
      d = addDays(d, 1);
    }

    return result;
  }, [startDate, endDate]);
}

// Lightweight stats for Goals list page and Progress dashboard.
// No per-goal streak computation — O(goals × 7) instead of O(goals × 365).
export function useAllGoalStats() {
  return useLiveQuery(async () => {
    const goals = await db.goals.where('status').equals('active').toArray();
    const entries = await db.entries.toArray();
    const today = new Date();
    const last7Dates = Array.from({ length: 7 }, (_, i) =>
      format(subDays(today, 6 - i), 'yyyy-MM-dd')
    );

    return goals.map(goal => {
      const goalEntries = entries.filter(e => e.goalId === goal.id);
      const entryMap = new Map(goalEntries.map(e => [e.date, e]));
      const last7 = last7Dates.map(date => ({
        scheduled: isScheduledForDate(date, goal.frequency, goal.customDays),
        completed: !!entryMap.get(date)?.completed,
      }));
      const completionRate7 = computeCompletionRate(goalEntries, goal, 7);
      return {
        goal,
        completionRate7,
        last7,
      };
    }).sort((a, b) => b.completionRate7 - a.completionRate7); // highest momentum first
  });
}

/**
 * Computes the user's overall daily streak — consecutive days where
 * every scheduled habit was completed. This is the "momentum" metric.
 */
export function useOverallStreak() {
  return useLiveQuery(async () => {
    const activeGoals = await db.goals.where('status').equals('active').toArray();
    if (activeGoals.length === 0) return { current: 0, best: 0 };

    const entries = await db.entries.toArray();
    const entryMap = new Map(entries.map(e => [`${e.goalId}:${e.date}`, e]));

    let current = 0;
    let best = 0;
    let counting = true;

    // Walk backwards from today up to 365 days
    for (let i = 0; i < 365; i++) {
      const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const scheduled = activeGoals.filter(g =>
        isScheduledForDate(dateStr, g.frequency, g.customDays)
      );

      if (scheduled.length === 0) continue; // skip unscheduled days

      const allDone = scheduled.every(g => {
        const entry = entryMap.get(`${g.id}:${dateStr}`);
        return entry?.completed;
      });

      if (allDone && counting) {
        current++;
      } else {
        counting = false;
      }
    }

    // Compute best streak (scan all days from first entry)
    if (entries.length > 0) {
      const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
      const firstDate = sorted[0].date;
      let streak = 0;
      let d = parseISO(firstDate);
      const end = new Date();

      while (d <= end) {
        const dateStr = format(d, 'yyyy-MM-dd');
        const scheduled = activeGoals.filter(g =>
          isScheduledForDate(dateStr, g.frequency, g.customDays)
        );

        if (scheduled.length === 0) {
          d = addDays(d, 1);
          continue;
        }

        const allDone = scheduled.every(g => {
          const entry = entryMap.get(`${g.id}:${dateStr}`);
          return entry?.completed;
        });

        if (allDone) {
          streak++;
          best = Math.max(best, streak);
        } else {
          streak = 0;
        }
        d = addDays(d, 1);
      }
    }

    return { current, best };
  });
}

/**
 * Per-folder heatmap data — returns daily completion rates for goals within a folder.
 * Used by FolderSection to show an inline mini heatmap.
 */
export function useFolderHeatmap(goalIds: string[], days: number = 28) {
  const key = goalIds.join(',');
  return useLiveQuery(async () => {
    if (goalIds.length === 0) return [];

    const today = new Date();
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      dates.push(format(subDays(today, i), 'yyyy-MM-dd'));
    }

    const goals = await db.goals.where('id').anyOf(goalIds).toArray();
    const entries = await db.entries
      .where('goalId').anyOf(goalIds)
      .toArray();
    const entryMap = new Map(entries.map(e => [`${e.goalId}:${e.date}`, e]));

    return dates.map(date => {
      const scheduled = goals.filter(g =>
        isScheduledForDate(date, g.frequency, g.customDays)
      );
      if (scheduled.length === 0) return { date, rate: null as number | null };

      const completed = scheduled.filter(g => {
        const entry = entryMap.get(`${g.id}:${date}`);
        return entry && entry.completed;
      }).length;

      return { date, rate: Math.round((completed / scheduled.length) * 100) };
    });
  }, [key, days]);
}

export function useTotalStats() {
  return useLiveQuery(async () => {
    const today = new Date();
    const last30Dates = Array.from({ length: 30 }, (_, i) =>
      format(subDays(today, i), 'yyyy-MM-dd')
    );
    const last7Dates = last30Dates.slice(0, 7);

    const activeGoals = await db.goals.where('status').equals('active').toArray();
    const entries = await db.entries.toArray();

    const totalThisMonth = entries.filter(e => e.completed && last30Dates.includes(e.date)).length;
    const daysActiveThisWeek = new Set(
      entries.filter(e => e.completed && last7Dates.includes(e.date)).map(e => e.date)
    ).size;

    // Overall 30-day consistency: scheduled slots completed / total scheduled slots
    let scheduledSlots = 0;
    let completedSlots = 0;
    const entryMap = new Map(entries.map(e => [`${e.goalId}:${e.date}`, e]));
    for (const date of last30Dates) {
      for (const goal of activeGoals) {
        if (isScheduledForDate(date, goal.frequency, goal.customDays)) {
          scheduledSlots++;
          const entry = entryMap.get(`${goal.id}:${date}`);
          if (entry?.completed) completedSlots++;
        }
      }
    }
    const consistency30 = scheduledSlots > 0
      ? Math.round((completedSlots / scheduledSlots) * 100)
      : 0;

    return { totalThisMonth, daysActiveThisWeek, consistency30 };
  });
}
