import { db } from './db';

export async function exportAllData(): Promise<string> {
  const [folders, goals, milestones, entries, settings, routineBlocks] = await Promise.all([
    db.folders.toArray(),
    db.goals.toArray(),
    db.milestones.toArray(),
    db.entries.toArray(),
    db.settings.toArray(),
    db.routineBlocks.toArray(),
  ]);

  const data = {
    version: 2,
    exportedAt: new Date().toISOString(),
    data: { folders, goals, milestones, entries, settings, routineBlocks },
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
  
  const { folders, goals, milestones, entries, settings, routineBlocks } = parsed.data;

  if (mode === 'replace') {
    await db.transaction('rw', [db.folders, db.goals, db.milestones, db.entries, db.settings, db.routineBlocks], async () => {
      await db.folders.clear();
      await db.goals.clear();
      await db.milestones.clear();
      await db.entries.clear();
      await db.routineBlocks.clear();
      if (settings && settings.length > 0) {
        await db.settings.clear();
        await db.settings.bulkAdd(settings);
      }
      if (folders) await db.folders.bulkAdd(folders);
      if (goals) await db.goals.bulkAdd(goals);
      if (milestones) await db.milestones.bulkAdd(milestones);
      if (entries) await db.entries.bulkAdd(entries);
      if (routineBlocks) await db.routineBlocks.bulkAdd(routineBlocks);
    });
  } else {
    // merge - use put to upsert
    await db.transaction('rw', [db.folders, db.goals, db.milestones, db.entries, db.settings, db.routineBlocks], async () => {
      if (folders) await db.folders.bulkPut(folders);
      if (goals) await db.goals.bulkPut(goals);
      if (milestones) await db.milestones.bulkPut(milestones);
      if (entries) await db.entries.bulkPut(entries);
      if (settings && settings.length > 0) await db.settings.bulkPut(settings);
      if (routineBlocks) await db.routineBlocks.bulkPut(routineBlocks);
    });
  }
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.folders, db.goals, db.milestones, db.entries, db.routineBlocks], async () => {
    await db.folders.clear();
    await db.goals.clear();
    await db.milestones.clear();
    await db.entries.clear();
    await db.routineBlocks.clear();
  });
}
