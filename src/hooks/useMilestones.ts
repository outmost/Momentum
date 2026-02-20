import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import type { Milestone } from '@/types';

export function useMilestones(goalId: string) {
  return useLiveQuery(
    () => db.milestones.where('[goalId+sortOrder]').between([goalId, -Infinity], [goalId, Infinity]).sortBy('sortOrder'),
    [goalId]
  );
}

export async function createMilestone(goalId: string, title: string) {
  const existing = await db.milestones.where('goalId').equals(goalId).toArray();
  const maxOrder = existing.reduce((max, m) => Math.max(max, m.sortOrder), 0);
  
  const milestone: Milestone = {
    id: nanoid(),
    goalId,
    title,
    isCompleted: false,
    sortOrder: maxOrder + 1000,
    createdAt: Date.now(),
  };
  
  await db.milestones.add(milestone);
  return milestone;
}

export async function updateMilestone(id: string, data: Partial<Milestone>) {
  await db.milestones.update(id, data);
}

export async function toggleMilestone(id: string) {
  const milestone = await db.milestones.get(id);
  if (!milestone) return;
  
  await db.milestones.update(id, {
    isCompleted: !milestone.isCompleted,
    completedAt: !milestone.isCompleted ? Date.now() : undefined,
  });
}

export async function deleteMilestone(id: string) {
  await db.milestones.delete(id);
}

export async function reorderMilestones(milestoneIds: string[], sortOrders: number[]) {
  await db.transaction('rw', db.milestones, async () => {
    for (let i = 0; i < milestoneIds.length; i++) {
      await db.milestones.update(milestoneIds[i], { sortOrder: sortOrders[i] });
    }
  });
}
