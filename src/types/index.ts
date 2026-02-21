// ---- Enums / Union Types ----

export type GoalType = 'binary' | 'numeric' | 'timer';
export type Frequency = 'daily' | 'weekly' | 'custom';
export type GoalStatus = 'active' | 'paused' | 'completed' | 'archived';
export type GoalVisibility = 'private' | 'invite-only' | 'public';
export type InviteStatus = 'pending' | 'approved' | 'denied';

// ---- Tables ----

export interface Folder {
  id: string;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
  createdAt: number;
}

export interface Goal {
  id: string;
  title: string;
  why?: string;         // The emotional anchor — "why does this habit matter to you?"
  description?: string;
  type: GoalType;
  status: GoalStatus;
  folderId?: string;
  routineBlockId?: string;
  sortOrder: number;
  target?: number;
  unit?: string;
  duration?: number;
  frequency: Frequency;
  customDays?: number[];
  reminderEnabled: boolean;
  reminderTime?: string;
  color?: string;
  visibility: GoalVisibility;
  shareCode?: string;      // auto-generated for invite-only and public goals
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface Invite {
  id: string;
  goalId: string;
  name: string;
  status: InviteStatus;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  isCompleted: boolean;
  completedAt?: number;
  sortOrder: number;
  createdAt: number;
}

export interface Entry {
  id: string;
  goalId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  value?: number;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface RoutineBlock {
  id: string;
  name: string;
  emoji: string;
  startTime: string; // HH:mm
  sortOrder: number;
  createdAt: number;
}

export interface AppSettings {
  id: 'settings';
  theme: 'light' | 'dark' | 'system';
  weekStartsOn: 0 | 1;
  defaultView: 'today' | 'dashboard';
  notificationsEnabled: boolean;
  seeded?: boolean;
  createdAt: number;
  updatedAt: number;
}
