import Dexie, { type Table } from 'dexie';
import type { Folder, Goal, Milestone, Entry, AppSettings, RoutineBlock, Invite } from '@/types';

class MomentumDB extends Dexie {
  folders!: Table<Folder>;
  goals!: Table<Goal>;
  milestones!: Table<Milestone>;
  entries!: Table<Entry>;
  settings!: Table<AppSettings>;
  routineBlocks!: Table<RoutineBlock>;
  invites!: Table<Invite>;

  constructor() {
    super('momentum-db');
    this.version(1).stores({
      folders: 'id, sortOrder',
      goals: 'id, folderId, status, sortOrder, [folderId+sortOrder]',
      milestones: 'id, goalId, sortOrder, [goalId+sortOrder]',
      entries: 'id, goalId, date, [goalId+date]',
      settings: 'id',
    });
    this.version(2).stores({
      folders: 'id, sortOrder',
      goals: 'id, folderId, routineBlockId, status, sortOrder, [folderId+sortOrder]',
      milestones: 'id, goalId, sortOrder, [goalId+sortOrder]',
      entries: 'id, goalId, date, [goalId+date]',
      settings: 'id',
      routineBlocks: 'id, sortOrder',
    });
    this.version(3).stores({
      folders: 'id, sortOrder',
      goals: 'id, folderId, routineBlockId, status, visibility, sortOrder, [folderId+sortOrder]',
      milestones: 'id, goalId, sortOrder, [goalId+sortOrder]',
      entries: 'id, goalId, date, [goalId+date]',
      settings: 'id',
      routineBlocks: 'id, sortOrder',
      invites: 'id, goalId, status, [goalId+status]',
    });
    // v4: habits now have category + startedAt for 66-day formation tracking
    this.version(4).stores({
      folders: 'id, sortOrder, category',
      goals: 'id, folderId, routineBlockId, status, visibility, sortOrder, [folderId+sortOrder]',
      milestones: 'id, goalId, sortOrder, [goalId+sortOrder]',
      entries: 'id, goalId, date, [goalId+date]',
      settings: 'id',
      routineBlocks: 'id, sortOrder',
      invites: 'id, goalId, status, [goalId+status]',
    }).upgrade(tx => {
      // Backfill existing folders with category and startedAt
      return tx.table('folders').toCollection().modify((folder: Folder) => {
        if (!folder.category) folder.category = 'custom';
        if (!folder.startedAt) folder.startedAt = folder.createdAt;
      });
    });
  }
}

export const db = new MomentumDB();

// Initialize default settings if not exist
export async function initializeSettings() {
  const existing = await db.settings.get('settings');
  if (!existing) {
    await db.settings.add({
      id: 'settings',
      theme: 'system',
      weekStartsOn: 0,
      defaultView: 'today',
      notificationsEnabled: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
}
