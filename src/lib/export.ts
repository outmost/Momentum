import { db } from './db';

export async function exportAllData(): Promise<string> {
  const [folders, goals, milestones, entries, settings] = await Promise.all([
    db.folders.toArray(),
    db.goals.toArray(),
    db.milestones.toArray(),
    db.entries.toArray(),
    db.settings.toArray(),
  ]);
  
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { folders, goals, milestones, entries, settings },
  };
  
  return JSON.stringify(data, null, 2);
}

export function downloadJSON(data: string, filename: string) {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importData(jsonStr: string, mode: 'merge' | 'replace'): Promise<void> {
  const parsed = JSON.parse(jsonStr);
  
  if (!parsed.version || !parsed.data) {
    throw new Error('Invalid export file format');
  }
  
  const { folders, goals, milestones, entries, settings } = parsed.data;
  
  if (mode === 'replace') {
    await db.transaction('rw', [db.folders, db.goals, db.milestones, db.entries, db.settings], async () => {
      await db.folders.clear();
      await db.goals.clear();
      await db.milestones.clear();
      await db.entries.clear();
      if (settings && settings.length > 0) {
        await db.settings.clear();
        await db.settings.bulkAdd(settings);
      }
      if (folders) await db.folders.bulkAdd(folders);
      if (goals) await db.goals.bulkAdd(goals);
      if (milestones) await db.milestones.bulkAdd(milestones);
      if (entries) await db.entries.bulkAdd(entries);
    });
  } else {
    // merge - use put to upsert
    await db.transaction('rw', [db.folders, db.goals, db.milestones, db.entries, db.settings], async () => {
      if (folders) await db.folders.bulkPut(folders);
      if (goals) await db.goals.bulkPut(goals);
      if (milestones) await db.milestones.bulkPut(milestones);
      if (entries) await db.entries.bulkPut(entries);
      if (settings && settings.length > 0) await db.settings.bulkPut(settings);
    });
  }
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.folders, db.goals, db.milestones, db.entries], async () => {
    await db.folders.clear();
    await db.goals.clear();
    await db.milestones.clear();
    await db.entries.clear();
  });
}
