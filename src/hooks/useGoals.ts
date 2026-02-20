import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import type { Goal, GoalStatus } from '@/types';

export function useGoals(folderId?: string, status?: GoalStatus) {
  return useLiveQuery(async () => {
    let query = db.goals.orderBy('[folderId+sortOrder]');
    const goals = await query.toArray();
    
    let filtered = goals;
    if (folderId !== undefined) {
      filtered = filtered.filter(g => g.folderId === folderId);
    }
    if (status) {
      filtered = filtered.filter(g => g.status === status);
    }
    return filtered.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [folderId, status]);
}

export function useAllGoals() {
  return useLiveQuery(() => db.goals.toArray());
}

export function useActiveGoals() {
  return useLiveQuery(() =>
    db.goals.where('status').equals('active').sortBy('sortOrder')
  );
}

export function useGoal(id: string) {
  return useLiveQuery(() => db.goals.get(id), [id]);
}

export async function createGoal(data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>) {
  const maxOrder = await db.goals
    .where('folderId')
    .equals(data.folderId ?? '')
    .toArray()
    .then(goals => goals.reduce((max, g) => Math.max(max, g.sortOrder), 0));

  const goal: Goal = {
    ...data,
    id: nanoid(),
    sortOrder: maxOrder + 1000,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  await db.goals.add(goal);
  return goal;
}

export async function updateGoal(id: string, data: Partial<Goal>) {
  await db.goals.update(id, { ...data, updatedAt: Date.now() });
}

export async function deleteGoal(id: string) {
  await db.transaction('rw', [db.goals, db.entries, db.milestones], async () => {
    await db.goals.delete(id);
    await db.entries.where('goalId').equals(id).delete();
    await db.milestones.where('goalId').equals(id).delete();
  });
}

export async function archiveGoal(id: string) {
  await db.goals.update(id, { status: 'archived', updatedAt: Date.now() });
}

export async function pauseGoal(id: string) {
  await db.goals.update(id, { status: 'paused', updatedAt: Date.now() });
}

export async function resumeGoal(id: string) {
  await db.goals.update(id, { status: 'active', updatedAt: Date.now() });
}

export async function completeGoal(id: string) {
  await db.goals.update(id, { status: 'completed', completedAt: Date.now(), updatedAt: Date.now() });
}

export async function reorderGoals(goalIds: string[], sortOrders: number[]) {
  await db.transaction('rw', db.goals, async () => {
    for (let i = 0; i < goalIds.length; i++) {
      await db.goals.update(goalIds[i], { sortOrder: sortOrders[i], updatedAt: Date.now() });
    }
  });
}
