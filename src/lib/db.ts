import Dexie, { type Table } from 'dexie';
import type { Folder, Goal, Milestone, Entry, AppSettings, RoutineBlock } from '@/types';

const DEFAULT_DAY_TYPE_MAP = {
  0: 'restday' as const,  // Sun
  1: 'workday' as const,  // Mon
  2: 'workday' as const,  // Tue
  3: 'workday' as const,  // Wed
  4: 'workday' as const,  // Thu
  5: 'workday' as const,  // Fri
  6: 'restday' as const,  // Sat
};

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
      dayTypeMap: DEFAULT_DAY_TYPE_MAP,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  } else if (!existing.dayTypeMap) {
    await db.settings.update('settings', {
      dayTypeMap: DEFAULT_DAY_TYPE_MAP,
      updatedAt: Date.now(),
    });
  }
}
