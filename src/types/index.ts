// ---- Enums / Union Types ----

export type GoalType = 'binary' | 'numeric' | 'timer';
export type Frequency = 'daily' | 'weekly' | 'custom';
export type GoalStatus = 'active' | 'paused' | 'completed' | 'archived';
export type GoalVisibility = 'private' | 'invite-only' | 'public';
export type InviteStatus = 'pending' | 'approved' | 'denied';

export type HabitCategory =
  | 'physical-health'
  | 'sleep-rest'
  | 'productivity'
  | 'mental-wellbeing'
  | 'financial'
  | 'social'
  | 'mindful-consumption'
  | 'custom';

// ---- Tables ----

/**
 * A Habit is an area of life you are working on (like an OKR Objective).
 * It groups 3–5 Goals (Key Results) and tracks 66-day formation progress.
 * The DB table is still called "folders" for backward compatibility.
 */
export interface Folder {
  id: string;
  name: string;
  color: string;
  icon: string;
  category: HabitCategory;
  /** Unix ms timestamp of when the user began tracking this habit (for 66-day progress). */
  startedAt: number;
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
  folderId?: string;    // Required in practice — the habit this goal belongs to
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
