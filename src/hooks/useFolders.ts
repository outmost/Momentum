import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import type { Folder } from '@/types';

export function useFolders() {
  return useLiveQuery(() => db.folders.orderBy('sortOrder').toArray());
}

export function useFolder(id: string) {
  return useLiveQuery(() => db.folders.get(id), [id]);
}

export async function createFolder(data: Omit<Folder, 'id' | 'createdAt' | 'sortOrder'>) {
  const maxOrder = await db.folders.toArray().then(folders =>
    folders.reduce((max, f) => Math.max(max, f.sortOrder), 0)
  );
  
  const folder: Folder = {
    ...data,
    id: nanoid(),
    sortOrder: maxOrder + 1000,
    createdAt: Date.now(),
  };
  
  await db.folders.add(folder);
  return folder;
}

export async function updateFolder(id: string, data: Partial<Folder>) {
  await db.folders.update(id, data);
}

export async function deleteFolder(id: string) {
  await db.transaction('rw', [db.folders, db.goals], async () => {
    // Move goals to uncategorized
    const goals = await db.goals.where('folderId').equals(id).toArray();
    for (const goal of goals) {
      await db.goals.update(goal.id, { folderId: undefined, updatedAt: Date.now() });
    }
    await db.folders.delete(id);
  });
}

export async function reorderFolders(folderIds: string[], sortOrders: number[]) {
  await db.transaction('rw', db.folders, async () => {
    for (let i = 0; i < folderIds.length; i++) {
      await db.folders.update(folderIds[i], { sortOrder: sortOrders[i] });
    }
  });
}
