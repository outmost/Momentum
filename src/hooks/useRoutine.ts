import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import { parseISO } from 'date-fns';
import type { RoutineBlock, DayType, DayTypeMap } from '@/types';

// ── Queries ──

export function useRoutineBlocks() {
  return useLiveQuery(() => db.routineBlocks.orderBy('sortOrder').toArray());
}

export function useRoutineBlocksForDate(dateStr: string) {
  return useLiveQuery(async () => {
    const settings = await db.settings.get('settings');
    const dayTypeMap = settings?.dayTypeMap;
    if (!dayTypeMap) return [];

    const dayOfWeek = parseISO(dateStr).getDay();
    const dayType = dayTypeMap[dayOfWeek] ?? 'workday';

    const blocks = await db.routineBlocks.orderBy('sortOrder').toArray();
    return blocks.filter(b => b.dayTypes.includes(dayType));
  }, [dateStr]);
}

export function useDayType(dateStr: string): DayType | undefined {
  return useLiveQuery(async () => {
    const settings = await db.settings.get('settings');
    if (!settings?.dayTypeMap) return 'workday';
    const dayOfWeek = parseISO(dateStr).getDay();
    return settings.dayTypeMap[dayOfWeek] ?? 'workday';
  }, [dateStr]);
}

// ── Mutations ──

export async function createRoutineBlock(data: {
  name: string;
  emoji: string;
  startTime: string;
  dayTypes: DayType[];
}) {
  const maxOrder = await db.routineBlocks.toArray()
    .then(blocks => blocks.reduce((max, b) => Math.max(max, b.sortOrder), 0));

  const block: RoutineBlock = {
    id: nanoid(),
    name: data.name,
    emoji: data.emoji,
    startTime: data.startTime,
    dayTypes: data.dayTypes,
    sortOrder: maxOrder + 1000,
    createdAt: Date.now(),
  };
  await db.routineBlocks.add(block);
  return block;
}

export async function updateRoutineBlock(id: string, data: Partial<RoutineBlock>) {
  await db.routineBlocks.update(id, data);
}

export async function deleteRoutineBlock(id: string) {
  await db.transaction('rw', [db.routineBlocks, db.goals], async () => {
    await db.routineBlocks.delete(id);
    // Unlink goals from deleted block
    const linked = await db.goals.where('routineBlockId').equals(id).toArray();
    for (const goal of linked) {
      await db.goals.update(goal.id, { routineBlockId: undefined });
    }
  });
}

export async function updateDayTypeMap(dayTypeMap: DayTypeMap) {
  await db.settings.update('settings', { dayTypeMap, updatedAt: Date.now() });
}

export async function seedDefaultRoutineBlocks() {
  const existing = await db.routineBlocks.count();
  if (existing > 0) return false;

  const defaults: Omit<RoutineBlock, 'id' | 'createdAt'>[] = [
    { name: 'Morning', emoji: '🌅', startTime: '06:00', dayTypes: ['workday', 'restday'], sortOrder: 1000 },
    { name: 'Midday', emoji: '☀️', startTime: '12:00', dayTypes: ['workday', 'restday'], sortOrder: 2000 },
    { name: 'Evening', emoji: '🌙', startTime: '18:00', dayTypes: ['workday', 'restday'], sortOrder: 3000 },
  ];

  await db.transaction('rw', db.routineBlocks, async () => {
    for (const block of defaults) {
      await db.routineBlocks.add({
        ...block,
        id: nanoid(),
        createdAt: Date.now(),
      });
    }
  });

  return true;
}
