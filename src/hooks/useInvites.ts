import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import type { Invite, InviteStatus } from '@/types';

export function useInvites(goalId: string) {
  return useLiveQuery(
    () => db.invites.where('goalId').equals(goalId).sortBy('createdAt'),
    [goalId]
  );
}

export function useInvitesByStatus(goalId: string, status: InviteStatus) {
  return useLiveQuery(
    () => db.invites.where('[goalId+status]').equals([goalId, status]).toArray(),
    [goalId, status]
  );
}

export async function createInvite(
  goalId: string,
  name: string,
  note?: string
): Promise<Invite> {
  const now = Date.now();
  const invite: Invite = {
    id: nanoid(),
    goalId,
    name,
    status: 'pending',
    note,
    createdAt: now,
    updatedAt: now,
  };
  await db.invites.add(invite);
  return invite;
}

export async function updateInviteStatus(
  inviteId: string,
  status: InviteStatus
): Promise<void> {
  await db.invites.update(inviteId, { status, updatedAt: Date.now() });
}

export async function deleteInvite(inviteId: string): Promise<void> {
  await db.invites.delete(inviteId);
}

export async function deleteInvitesForGoal(goalId: string): Promise<void> {
  await db.invites.where('goalId').equals(goalId).delete();
}
