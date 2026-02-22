# Momentum — Codebase Guide for AI Assistants

## What This App Is

Momentum is a **habit-tracking Progressive Web App (PWA)** built with Next.js 14 (App Router) and TypeScript. It helps users build atomic habits by tracking daily check-ins, streaks, and progress. All data is stored **entirely on the user's device** in IndexedDB — there is no backend, no API, and no server-side data processing.

---

## Tech Stack

| Concern | Library |
|---|---|
| Framework | Next.js 14 (App Router) |
| UI | React 18 + TypeScript |
| Styling | Tailwind CSS + CSS custom properties |
| Database | Dexie (IndexedDB wrapper) |
| Reactive data | `dexie-react-hooks` (`useLiveQuery`) |
| UI state | Zustand |
| Animations | Motion v12 (Framer Motion) |
| Icons | Lucide React |
| Drag & drop | @dnd-kit |
| Charts | Recharts |
| Date utilities | date-fns |
| ID generation | nanoid |
| QR codes | qrcode.react |
| Fonts | Geist (variable font, bundled locally) |

---

## Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Today view (default route "/")
│   ├── dashboard/page.tsx  # Progress dashboard
│   ├── goals/page.tsx      # Goals list & management
│   ├── goals/[id]/page.tsx # Individual goal detail
│   ├── routine/page.tsx    # Routine blocks management
│   ├── settings/page.tsx   # App settings
│   ├── join/page.tsx       # Accept a shared challenge (QR/link)
│   ├── layout.tsx          # Root layout — wraps everything in AppShell
│   ├── globals.css         # Design system tokens + component classes
│   └── fonts/              # Geist variable fonts (woff)
│
├── components/
│   ├── layout/             # AppShell, Sidebar, BottomNav
│   ├── goals/              # GoalCard, GoalForm, GoalListItem, MiniHeatmap
│   ├── entries/            # BinaryEntry, NumericEntry, TimerEntry, EntryNoteModal
│   ├── folders/            # FolderForm, FolderSection
│   ├── dashboard/          # CompletionChart, GoalBreakdown, HabitFormationCard, SummaryCards
│   ├── today/              # WeekStrip
│   ├── sharing/            # ShareModal, VisibilityPicker
│   └── ui/                 # Primitives: Modal, Button, Input, Select, Toggle,
│                           #   ProgressBar, ProgressRing, ConfirmDialog, EmptyState,
│                           #   Confetti, AllDoneCelebration
│
├── hooks/                  # All data-access hooks + mutation functions
│   ├── useGoals.ts         # Goals CRUD + queries
│   ├── useEntries.ts       # Entry upsert/delete + queries
│   ├── useFolders.ts       # Folder CRUD
│   ├── useMilestones.ts    # Milestone CRUD
│   ├── useRoutine.ts       # Routine block CRUD + seed defaults
│   ├── useInvites.ts       # Invite management
│   ├── useStats.ts         # Streak/completion computations
│   ├── useSettings.ts      # Settings read/write
│   └── useTheme.ts         # Applies theme class to <html>
│
├── lib/
│   ├── db.ts               # Dexie database class + schema migrations
│   ├── store.ts            # Zustand UI store
│   ├── utils.ts            # Date helpers, scheduling logic, color constants
│   ├── export.ts           # JSON export/import/clear functions
│   ├── notifications.ts    # Push notification helpers
│   ├── seed.ts             # Demo data seeding
│   └── cn.ts               # clsx + tailwind-merge helper
│
└── types/
    └── index.ts            # All TypeScript interfaces and union types
```

---

## Data Model

Seven IndexedDB tables defined in `src/lib/db.ts` (currently at schema version 3):

| Table | Key fields | Description |
|---|---|---|
| `goals` | `id`, `folderId`, `routineBlockId`, `status`, `visibility`, `sortOrder` | Habits/goals |
| `entries` | `id`, `goalId`, `date` | Daily check-ins (one per goal per date) |
| `folders` | `id`, `sortOrder` | Organizational groups |
| `milestones` | `id`, `goalId`, `sortOrder` | Sub-tasks / checkpoints for a goal |
| `routineBlocks` | `id`, `sortOrder` | Named time blocks (Morning, Evening, etc.) |
| `invites` | `id`, `goalId`, `status` | Social accountability invites |
| `settings` | `id='settings'` | Single-row app settings |

### Key type details (`src/types/index.ts`)

- `GoalType`: `'binary' | 'numeric' | 'timer'`
- `Frequency`: `'daily' | 'weekly' | 'custom'`
- `GoalStatus`: `'active' | 'paused' | 'completed' | 'archived'`
- `GoalVisibility`: `'private' | 'invite-only' | 'public'`
- `Entry.date`: stored as `YYYY-MM-DD` string (never a timestamp)
- `createdAt` / `updatedAt`: Unix milliseconds (`Date.now()`)
- `id` fields: generated with `nanoid()`
- `sortOrder`: uses `1000`-increment steps to allow fractional insertion without reindex

---

## Architecture Patterns

### Data layer (hooks)
All database queries and mutations live in `src/hooks/`. Queries use `useLiveQuery` from `dexie-react-hooks` — they are **reactive**: components auto-re-render when relevant IndexedDB data changes. Mutations are plain `async` functions exported alongside the hooks (not React hooks themselves).

```ts
// Query — reactive, used in components
export function useGoals(folderId?: string) { return useLiveQuery(...) }

// Mutation — plain async, called in event handlers
export async function createGoal(data: ...) { await db.goals.add(...) }
```

### UI state (Zustand)
`src/lib/store.ts` holds **only ephemeral UI state** that doesn't belong in the database:
- `selectedDate` — currently viewed date in Today view
- `activeModal` — which modal is open
- `editingGoalId` / `editingFolderId` — which item is in edit mode
- `activeTimer` — running timer state
- `addGoalOpen` — global "New Goal" modal flag
- `toast` — undo-able toast notification

### No API routes
There are zero Next.js API routes. Everything runs in the browser. The `next.config.mjs` is intentionally minimal.

---

## Development Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint
```

---

## Design System

The design system is defined as CSS custom properties in `src/app/globals.css` and consumed via inline styles and Tailwind utilities.

### CSS tokens

```css
/* Surfaces */
--bg, --surface, --surface-2, --surface-3, --border, --border-2

/* Text hierarchy */
--text, --text-2, --text-3

/* Brand */
--accent, --accent-2, --accent-hover, --accent-glow

/* Semantic */
--success, --success-soft, --success-glow
--streak, --streak-soft, --streak-glow
--danger, --danger-soft
--progress

/* Shadows */
--shadow-xs, --shadow-sm, --shadow-md, --shadow-lg, --shadow-xl

/* Geometry */
--radius (16px), --radius-sm (10px), --radius-lg (24px)
--nav-height (80px)

/* Easing */
--ease-out-expo, --ease-spring, --ease-smooth
```

Light mode is `:root`, dark mode is `.dark` on `<html>`. Theme switching is handled by `useTheme` hook.

### Component classes (via `@layer components`)

| Class | Purpose |
|---|---|
| `.card` | Standard card surface |
| `.card-overflow` | Card with `overflow: hidden` (for lists with dividers) |
| `.card-sm` | Smaller radius card |
| `.card-inset` | Inset/secondary surface |
| `.card-interactive` | Clickable card with hover/active states |
| `.card-elevated` | More prominent shadow |
| `.btn`, `.btn-primary`, `.btn-lg` | Button variants |
| `.page-title` | Large heading |
| `.section-label` | Small uppercase section header |
| `.tabular` | Monospace/tabular number rendering |
| `.streak-badge` | Flame streak indicator |

### Inline style preference
Components use `style={{ color: 'var(--text-2)' }}` directly for token-based colors rather than custom Tailwind classes. This is the established pattern — follow it.

---

## Scheduling Logic

`isScheduledForDate(dateStr, frequency, customDays?)` in `src/lib/utils.ts` determines whether a goal appears on a given date:
- `'daily'` → always true
- `'weekly'` → always true (any day counts in a week)
- `'custom'` → `customDays` is an array of weekday numbers (0=Sun … 6=Sat)

---

## Sharing System

Goals can be shared via QR code or deep link. The `/join` route handles accepting shared challenges.

- Share codes are 8-char uppercase alphanumeric, auto-generated when visibility changes from `private`
- The share URL encodes a `ChallengePayload` JSON object in a `?c=` query param
- Imported goals always start as `visibility: 'private'` regardless of the original

---

## Conventions to Follow

1. **Date strings**: Always `YYYY-MM-DD`. Use `format(date, 'yyyy-MM-dd')` from `date-fns`. Never store `Date` objects or timestamps for day-level data.
2. **IDs**: Always `nanoid()`. Never use `Math.random()` or sequential integers.
3. **Sort order**: Insert at `maxExisting + 1000`. Use `(before + after) / 2` for mid-list insertion.
4. **Mutations always set `updatedAt: Date.now()`**.
5. **Transactions**: Use `db.transaction('rw', [...tables], async () => {...})` when a mutation touches multiple tables.
6. **Import alias**: Use `@/` for all imports (maps to `src/`). Never use relative `../../` paths.
7. **No new API routes**: Keep the app fully client-side.
8. **Schema migrations**: Adding new Dexie indices requires a new `this.version(N).stores({...})` block — never modify existing version definitions.
9. **Styling**: Use design system CSS variables via inline `style` props for semantic colors. Use Tailwind for layout/spacing. Avoid hardcoded hex values in components.
10. **Animations**: Use `motion` from `motion/react` (not `framer-motion`). Prefer spring animations for interactive elements, ease-out-expo for page/list entries.
11. **Component size**: Keep components focused. Data-fetching hooks stay in `src/hooks/`, not inside component files.
