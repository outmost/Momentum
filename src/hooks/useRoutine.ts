import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import type { RoutineBlock } from '@/types';

// ── Queries ──

export function useRoutineBlocks() {
  return useLiveQuery(() =>
    db.routineBlocks.toArray().then(blocks =>
      blocks.sort((a, b) => a.startTime.localeCompare(b.startTime))
    )
  );
}

// ── Mutations ──

export async function createRoutineBlock(data: {
  name: string;
  emoji: string;
  startTime: string;
}) {
  const maxOrder = await db.routineBlocks.toArray()
    .then(blocks => blocks.reduce((max, b) => Math.max(max, b.sortOrder), 0));

  const block: RoutineBlock = {
    id: nanoid(),
    name: data.name,
    emoji: data.emoji,
    startTime: data.startTime,
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
    const linked = await db.goals.where('routineBlockId').equals(id).toArray();
    for (const goal of linked) {
      await db.goals.update(goal.id, { routineBlockId: undefined });
    }
  });
}

export async function seedDefaultRoutineBlocks() {
  const existing = await db.routineBlocks.count();
  if (existing > 0) return false;

  const defaults: Omit<RoutineBlock, 'id' | 'createdAt'>[] = [
    { name: 'Morning', emoji: '🌅', startTime: '07:00', sortOrder: 1000 },
    { name: 'Midday', emoji: '☀️', startTime: '12:00', sortOrder: 2000 },
    { name: 'Evening', emoji: '🌙', startTime: '18:00', sortOrder: 3000 },
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
