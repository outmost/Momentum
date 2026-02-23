import { format, parseISO, isToday, eachDayOfInterval, subDays } from 'date-fns';
import type { Frequency, HabitCategory } from '@/types';

export interface HabitCategoryDef {
  id: HabitCategory;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const HABIT_CATEGORIES: HabitCategoryDef[] = [
  {
    id: 'physical-health',
    label: 'Physical Health',
    icon: '💪',
    color: '#10B981',
    description: 'Exercise, nutrition, hydration, dental care',
  },
  {
    id: 'sleep-rest',
    label: 'Sleep & Rest',
    icon: '😴',
    color: '#8B5CF6',
    description: 'Consistent sleep schedule, recovery routines',
  },
  {
    id: 'productivity',
    label: 'Productivity',
    icon: '🎯',
    color: '#3B82F6',
    description: 'Time management, goal setting, organization',
  },
  {
    id: 'mental-wellbeing',
    label: 'Mental Well-being',
    icon: '🧘',
    color: '#F97316',
    description: 'Mindfulness, stress management, learning',
  },
  {
    id: 'financial',
    label: 'Financial',
    icon: '💰',
    color: '#EAB308',
    description: 'Saving, budgeting, spending wisely',
  },
  {
    id: 'social',
    label: 'Social & Relationships',
    icon: '❤️',
    color: '#EC4899',
    description: 'Gratitude, active listening, connections',
  },
  {
    id: 'mindful-consumption',
    label: 'Mindful Consumption',
    icon: '🌱',
    color: '#14B8A6',
    description: 'Limiting social media, healthy choices',
  },
  {
    id: 'custom',
    label: 'Custom',
    icon: '⭐',
    color: '#6366F1',
    description: 'Your own habit category',
  },
];

export function getHabitCategory(id: HabitCategory): HabitCategoryDef {
  return HABIT_CATEGORIES.find(c => c.id === id) ?? HABIT_CATEGORIES[HABIT_CATEGORIES.length - 1];
}

/** Max habits a user can create */
export const MAX_HABITS = 7;
/** Recommended goals per habit */
export const MIN_GOALS_PER_HABIT = 3;
export const MAX_GOALS_PER_HABIT = 5;
/** Days to form a habit */
export const HABIT_FORMATION_DAYS = 66;

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
}

export function formatDisplayDate(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return 'Today';
  return format(d, 'EEEE, MMMM d');
}

export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function isDateScheduled(dateStr: string, frequency: Frequency, customDays?: number[]): boolean {
  if (frequency === 'daily') return true;
  
  const date = parseISO(dateStr);
  const dayOfWeek = date.getDay();
  
  if (frequency === 'weekly') return true; // Any day counts for weekly, handled by week-level logic
  
  if (frequency === 'custom' && customDays) {
    return customDays.includes(dayOfWeek);
  }
  
  return false;
}

export function isScheduledForDate(dateStr: string, frequency: Frequency, customDays?: number[]): boolean {
  if (frequency === 'daily') return true;
  if (frequency === 'custom' && customDays) {
    const date = parseISO(dateStr);
    return customDays.includes(date.getDay());
  }
  if (frequency === 'weekly') return true;
  return false;
}

export function getDaysInRange(startDate: string, endDate: string): string[] {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
}

export function getLastNDays(n: number): string[] {
  const today = new Date();
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    dates.push(format(subDays(today, i), 'yyyy-MM-dd'));
  }
  return dates;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function parseDurationToSeconds(str: string): number {
  const parts = str.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(str) * 60;
}

export function generateSortOrder(before?: number, after?: number): number {
  if (before === undefined && after === undefined) return 1000;
  if (before === undefined) return (after! - 1000);
  if (after === undefined) return before + 1000;
  return (before + after) / 2;
}

export const FOLDER_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#EC4899', // Pink
  '#EAB308', // Yellow
  '#14B8A6', // Teal
  '#EF4444', // Red
];

export const GOAL_COLORS = [
  '#3B82F6',
  '#10B981',
  '#8B5CF6',
  '#F97316',
  '#EC4899',
  '#EAB308',
  '#14B8A6',
  '#EF4444',
];
