import { db } from './db';
import { nanoid } from 'nanoid';
import { format, subDays, getDay } from 'date-fns';
import type { Entry } from '@/types';

// Deterministic pseudo-random — same seed gives same demo every time
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Seeds the DB with realistic demo data if no goals exist.
 * Returns true if seeded, false if data already present.
 */
export async function seedDemoData(): Promise<boolean> {
  const count = await db.goals.count();
  if (count > 0) return false;

  const rng = makeRng(42);
  const now = Date.now();

  // ── Folders ──────────────────────────────────────────────────────────────
  const healthId = nanoid();
  const learningId = nanoid();

  await db.folders.bulkAdd([
    { id: healthId,   name: 'Health',   color: '#22C55E', icon: '💪', sortOrder: 1000, createdAt: now },
    { id: learningId, name: 'Learning', color: '#8B5CF6', icon: '📚', sortOrder: 2000, createdAt: now },
  ]);

  // ── Goals ─────────────────────────────────────────────────────────────────
  const meditateId  = nanoid();
  const pushupsId   = nanoid();
  const waterId     = nanoid();
  const deepworkId  = nanoid();
  const readId      = nanoid();
  const spanishId   = nanoid();

  await db.goals.bulkAdd([
    {
      id: meditateId, title: 'Meditate', type: 'binary', status: 'active',
      folderId: healthId, sortOrder: 1000, frequency: 'daily',
      reminderEnabled: false, color: '#22C55E', createdAt: now, updatedAt: now,
    },
    {
      id: pushupsId, title: 'Press-ups', type: 'numeric', status: 'active',
      folderId: healthId, sortOrder: 2000, frequency: 'daily',
      target: 30, unit: 'reps',
      reminderEnabled: false, color: '#16A34A', createdAt: now, updatedAt: now,
    },
    {
      id: waterId, title: 'Water', type: 'numeric', status: 'active',
      folderId: healthId, sortOrder: 3000, frequency: 'daily',
      target: 8, unit: 'glasses',
      reminderEnabled: false, color: '#0EA5E9', createdAt: now, updatedAt: now,
    },
    {
      id: deepworkId, title: 'Deep work', type: 'timer', status: 'active',
      folderId: undefined, sortOrder: 1000, frequency: 'custom',
      customDays: [1, 2, 3, 4, 5], // Mon–Fri
      duration: 90 * 60,
      reminderEnabled: false, color: '#0057FF', createdAt: now, updatedAt: now,
    },
    {
      id: readId, title: 'Read', type: 'numeric', status: 'active',
      folderId: learningId, sortOrder: 1000, frequency: 'daily',
      target: 20, unit: 'pages',
      reminderEnabled: false, color: '#8B5CF6', createdAt: now, updatedAt: now,
    },
    {
      id: spanishId, title: 'Spanish', type: 'timer', status: 'active',
      folderId: learningId, sortOrder: 2000, frequency: 'daily',
      duration: 15 * 60,
      reminderEnabled: false, color: '#F59E0B', createdAt: now, updatedAt: now,
    },
  ]);

  // ── Entries — last 30 days (realistic, varied) ────────────────────────────
  const entries: Entry[] = [];

  for (let i = 30; i >= 1; i--) {
    const d = subDays(new Date(), i);
    const date = format(d, 'yyyy-MM-dd');
    const dow = getDay(d);
    const isWeekday = dow >= 1 && dow <= 5;

    // Meditate — 78% completion
    if (rng() < 0.78) {
      entries.push({ id: nanoid(), goalId: meditateId, date, completed: true, createdAt: now, updatedAt: now });
    }

    // Press-ups — log 88% of days; value 12–37; complete when ≥30 (~55%)
    if (rng() < 0.88) {
      const v = 12 + Math.floor(rng() * 26);
      entries.push({ id: nanoid(), goalId: pushupsId, date, completed: v >= 30, value: v, createdAt: now, updatedAt: now });
    }

    // Water — log 90%; value 4–9 glasses; complete when ≥8 (~50%)
    if (rng() < 0.90) {
      const v = 4 + Math.floor(rng() * 6);
      entries.push({ id: nanoid(), goalId: waterId, date, completed: v >= 8, value: v, createdAt: now, updatedAt: now });
    }

    // Deep work — weekdays only; 30–100 min; complete when ≥90 min (~40%)
    if (isWeekday && rng() < 0.80) {
      const v = 1800 + Math.floor(rng() * 4200);
      entries.push({ id: nanoid(), goalId: deepworkId, date, completed: v >= 5400, value: v, createdAt: now, updatedAt: now });
    }

    // Read — log 85%; 8–29 pages; complete when ≥20 (~60%)
    if (rng() < 0.85) {
      const v = 8 + Math.floor(rng() * 22);
      entries.push({ id: nanoid(), goalId: readId, date, completed: v >= 20, value: v, createdAt: now, updatedAt: now });
    }

    // Spanish — log 85%; 8–20 min; complete when ≥15 min (~60%)
    if (rng() < 0.85) {
      const v = 480 + Math.floor(rng() * 720);
      entries.push({ id: nanoid(), goalId: spanishId, date, completed: v >= 900, value: v, createdAt: now, updatedAt: now });
    }
  }

  // ── Today: a realistic mid-day snapshot ──────────────────────────────────
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayIsWeekday = (() => { const d = getDay(new Date()); return d >= 1 && d <= 5; })();

  entries.push({ id: nanoid(), goalId: meditateId, date: today, completed: true,  createdAt: now, updatedAt: now });               // done ✓
  entries.push({ id: nanoid(), goalId: pushupsId,  date: today, completed: false, value: 18,   createdAt: now, updatedAt: now });   // in progress
  entries.push({ id: nanoid(), goalId: waterId,    date: today, completed: false, value: 5,    createdAt: now, updatedAt: now });   // in progress
  if (todayIsWeekday) {
    entries.push({ id: nanoid(), goalId: deepworkId, date: today, completed: false, value: 2700, createdAt: now, updatedAt: now }); // 45 / 90 min
  }
  entries.push({ id: nanoid(), goalId: readId,    date: today, completed: true,  value: 24,   createdAt: now, updatedAt: now });   // done ✓
  entries.push({ id: nanoid(), goalId: spanishId, date: today, completed: false, value: 720,  createdAt: now, updatedAt: now });   // 12 / 15 min

  await db.entries.bulkAdd(entries);
  return true;
}

/**
 * Wipes everything — used by "Clear all data" in settings.
 */
export async function clearAllAppData() {
  await db.transaction('rw', [db.goals, db.folders, db.entries, db.milestones, db.settings], async () => {
    await db.entries.clear();
    await db.milestones.clear();
    await db.goals.clear();
    await db.folders.clear();
    // Keep settings (theme preference etc)
  });
}
