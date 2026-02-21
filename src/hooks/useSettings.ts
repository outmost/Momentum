import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { AppSettings } from '@/types';

export function useSettings() {
  return useLiveQuery(() => db.settings.get('settings'));
}

export async function updateSettings(data: Partial<Omit<AppSettings, 'id'>>) {
  const existing = await db.settings.get('settings');
  if (existing) {
    await db.settings.update('settings', { ...data, updatedAt: Date.now() });
  } else {
    await db.settings.put({
      id: 'settings',
      theme: 'system',
      weekStartsOn: 0,
      defaultView: 'today',
      notificationsEnabled: false,
      dayTypeMap: {
        0: 'restday', 1: 'workday', 2: 'workday', 3: 'workday',
        4: 'workday', 5: 'workday', 6: 'restday',
      },
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
}
