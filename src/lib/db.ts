import Dexie, { type Table } from 'dexie';
import type { Folder, Goal, Milestone, Entry, AppSettings, RoutineBlock } from '@/types';

class MomentumDB extends Dexie {
  folders!: Table<Folder>;
  goals!: Table<Goal>;
  milestones!: Table<Milestone>;
  entries!: Table<Entry>;
  settings!: Table<AppSettings>;
  routineBlocks!: Table<RoutineBlock>;

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
