import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import type { Entry } from '@/types';

export function useEntries(goalId: string) {
  return useLiveQuery(
    () => db.entries.where('goalId').equals(goalId).reverse().sortBy('date'),
    [goalId]
  );
}

export function useEntryForDate(goalId: string, date: string) {
  return useLiveQuery(
    () => db.entries.where('[goalId+date]').equals([goalId, date]).first(),
    [goalId, date]
  );
}

export function useEntriesForDate(date: string) {
  return useLiveQuery(
    () => db.entries.where('date').equals(date).toArray(),
    [date]
  );
}

export function useEntriesForGoalInRange(goalId: string, startDate: string, endDate: string) {
  return useLiveQuery(
    async () => {
      const entries = await db.entries.where('goalId').equals(goalId).toArray();
      return entries.filter(e => e.date >= startDate && e.date <= endDate);
    },
    [goalId, startDate, endDate]
  );
}

export async function upsertEntry(goalId: string, date: string, data: Partial<Entry>) {
  const existing = await db.entries.where('[goalId+date]').equals([goalId, date]).first();
  
  if (existing) {
    await db.entries.update(existing.id, { ...data, updatedAt: Date.now() });
    return existing.id;
  } else {
    const entry: Entry = {
      id: nanoid(),
      goalId,
      date,
      completed: false,
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.entries.add(entry);
    return entry.id;
  }
}

export async function deleteEntry(id: string) {
  await db.entries.delete(id);
}

export async function getEntriesForGoal(goalId: string): Promise<Entry[]> {
  return db.entries.where('goalId').equals(goalId).toArray();
}
