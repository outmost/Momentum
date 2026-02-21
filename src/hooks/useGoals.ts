import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import type { Goal, GoalStatus, GoalVisibility } from '@/types';

export function useGoals(folderId?: string, status?: GoalStatus) {
  return useLiveQuery(async () => {
    const query = db.goals.orderBy('[folderId+sortOrder]');
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

/** Goals for the Today/day view — includes completed goals so they still show on past dates. */
export function useTodayViewGoals() {
  return useLiveQuery(() =>
    db.goals.where('status').anyOf(['active', 'completed']).sortBy('sortOrder')
  );
}

export function useGoal(id: string) {
  return useLiveQuery(async () => {
    const goal = await db.goals.get(id);
    return goal ?? null;
  }, [id]);
}

function generateShareCode(): string {
  // 8-char alphanumeric code, easy to type/share
  return nanoid(8).toUpperCase().replace(/[^A-Z0-9]/g, '0').slice(0, 8);
}

export async function createGoal(data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>) {
  const maxOrder = await db.goals
    .where('folderId')
    .equals(data.folderId ?? '')
    .toArray()
    .then(goals => goals.reduce((max, g) => Math.max(max, g.sortOrder), 0));

  const visibility: GoalVisibility = data.visibility ?? 'private';
  const goal: Goal = {
    ...data,
    visibility,
    shareCode: visibility !== 'private' ? generateShareCode() : undefined,
    id: nanoid(),
    sortOrder: maxOrder + 1000,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await db.goals.add(goal);
  return goal;
}

export async function updateGoal(id: string, data: Partial<Goal>) {
  // Auto-generate shareCode when changing from private to a shareable visibility
  const updates: Partial<Goal> = { ...data, updatedAt: Date.now() };
  if (data.visibility && data.visibility !== 'private') {
    const existing = await db.goals.get(id);
    if (!existing?.shareCode) {
      updates.shareCode = generateShareCode();
    }
  }
  await db.goals.update(id, updates);
}

export async function deleteGoal(id: string) {
  await db.transaction('rw', [db.goals, db.entries, db.milestones, db.invites], async () => {
    await db.goals.delete(id);
    await db.entries.where('goalId').equals(id).delete();
    await db.milestones.where('goalId').equals(id).delete();
    await db.invites.where('goalId').equals(id).delete();
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
