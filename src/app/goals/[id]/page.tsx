'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, subDays } from 'date-fns';
import {
  Edit2, Pause, Play, Archive, Trash2, CheckCircle, ChevronLeft,
  Share2, UserPlus, Check, X, Clock,
} from 'lucide-react';
import { useGoal, deleteGoal, pauseGoal, resumeGoal, archiveGoal, completeGoal } from '@/hooks/useGoals';
import { useEntries, useEntryForDate, upsertEntry } from '@/hooks/useEntries';
import { useGoalStats } from '@/hooks/useStats';
import { BinaryEntry } from '@/components/entries/BinaryEntry';
import { NumericEntry } from '@/components/entries/NumericEntry';
import { TimerEntry } from '@/components/entries/TimerEntry';
import { useInvites, createInvite, updateInviteStatus, deleteInvite } from '@/hooks/useInvites';
import { Modal } from '@/components/ui/Modal';
import { GoalForm } from '@/components/goals/GoalForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ShareModal } from '@/components/sharing/ShareModal';
import { VisibilityBadge } from '@/components/sharing/VisibilityPicker';
import { formatDuration } from '@/lib/utils';

// ─── 66-day progress ring ──────────────────────────────────────────────────

function HabitRing({
  currentStreak,
  totalCompletions,
  color,
}: {
  currentStreak: number;
  totalCompletions: number;
  color: string;
}) {
  const GOAL = 66;
  const progress = Math.min(totalCompletions, GOAL);
  const pct = progress / GOAL;
  const r = 38;
  const cx = 48;
  const cy = 48;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * pct;
  const gap = circumference - dash;

  const milestones = [21, 44, 66]; // key habit-formation checkpoints

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
          {/* Progress arc */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
          {/* Milestone dots */}
          {milestones.map(m => {
            const angle = (m / GOAL) * 2 * Math.PI - Math.PI / 2;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            const reached = totalCompletions >= m;
            return (
              <circle
                key={m}
                cx={x} cy={y} r={3.5}
                fill={reached ? color : 'var(--surface)'}
                stroke={color}
                strokeWidth="1.5"
              />
            );
          })}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tabular leading-none" style={{ color }}>
            {progress}
          </span>
          <span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
            / 66
          </span>
        </div>
      </div>
      <div className="text-center space-y-0.5">
        <p className="text-[11px] font-semibold" style={{ color: 'var(--text-2)' }}>
          {progress >= 66
            ? 'Habit formed! 🎉'
            : `${66 - progress} days to go`}
        </p>
        {currentStreak > 0 && (
          <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>
            {currentStreak}-day streak active
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Invite / Approval panel ────────────────────────────────────────────────

function InvitePanel({ goalId }: { goalId: string }) {
  const invites = useInvites(goalId);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setAdding(true);
    try {
      await createInvite(goalId, name.trim(), note.trim() || undefined);
      setName('');
      setNote('');
    } finally {
      setAdding(false);
    }
  }

  const pending  = (invites ?? []).filter(i => i.status === 'pending');
  const approved = (invites ?? []).filter(i => i.status === 'approved');
  const denied   = (invites ?? []).filter(i => i.status === 'denied');

  const STATUS_ICON = {
    pending:  <Clock size={11} style={{ color: '#F59E0B' }} />,
    approved: <Check size={11} style={{ color: 'var(--success)' }} />,
    denied:   <X    size={11} style={{ color: 'var(--danger)' }} />,
  };

  return (
    <div className="space-y-3">
      {/* Add invite */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Name or contact"
            className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
            style={{ border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)' }}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !name.trim()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white disabled:opacity-40 transition-all active:scale-95"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <UserPlus size={12} /> Invite
          </button>
        </div>
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Optional note"
          className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
          style={{ border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-2)' }}
        />
      </div>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#F59E0B' }}>
            Pending ({pending.length})
          </p>
          {pending.map(inv => (
            <div
              key={inv.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1"
              style={{ border: '1px solid var(--border)' }}
            >
              {STATUS_ICON[inv.status]}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{inv.name}</p>
                {inv.note && <p className="text-[10px] truncate" style={{ color: 'var(--text-3)' }}>{inv.note}</p>}
              </div>
              <button
                onClick={() => updateInviteStatus(inv.id, 'approved')}
                className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all active:scale-95"
                style={{ color: 'var(--success)', backgroundColor: 'color-mix(in srgb, var(--success) 10%, transparent)' }}
              >
                <Check size={10} /> Approve
              </button>
              <button
                onClick={() => updateInviteStatus(inv.id, 'denied')}
                className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium ml-1 transition-all active:scale-95"
                style={{ color: 'var(--danger)', backgroundColor: 'color-mix(in srgb, var(--danger) 8%, transparent)' }}
              >
                <X size={10} /> Deny
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Approved */}
      {approved.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--success)' }}>
            Approved ({approved.length})
          </p>
          {approved.map(inv => (
            <div
              key={inv.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1"
              style={{ border: '1px solid var(--border)' }}
            >
              {STATUS_ICON[inv.status]}
              <p className="flex-1 text-sm truncate" style={{ color: 'var(--text-2)' }}>{inv.name}</p>
              <button
                onClick={() => deleteInvite(inv.id)}
                className="w-6 h-6 flex items-center justify-center rounded transition-colors"
                style={{ color: 'var(--text-3)' }}
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Denied */}
      {denied.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-3)' }}>
            Denied ({denied.length})
          </p>
          {denied.map(inv => (
            <div
              key={inv.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1 opacity-60"
              style={{ border: '1px solid var(--border)' }}
            >
              {STATUS_ICON[inv.status]}
              <p className="flex-1 text-sm truncate" style={{ color: 'var(--text-3)' }}>{inv.name}</p>
              <button
                onClick={() => updateInviteStatus(inv.id, 'approved')}
                className="px-2 py-1 rounded text-[11px] transition-all"
                style={{ color: 'var(--text-3)' }}
              >
                Undo
              </button>
              <button
                onClick={() => deleteInvite(inv.id)}
                className="w-6 h-6 flex items-center justify-center rounded"
                style={{ color: 'var(--text-3)' }}
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {(invites ?? []).length === 0 && (
        <p className="text-xs text-center py-4" style={{ color: 'var(--text-3)' }}>
          No participants yet. Invite friends to join your challenge!
        </p>
      )}
    </div>
  );
}

// ─── Heatmap ────────────────────────────────────────────────────────────────

function CalendarHeatmap({ goalId, goal }: { goalId: string; goal: { type: string; target?: number; duration?: number; color?: string } }) {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const entries = useEntries(goalId);
  const entryMap = new Map((entries ?? []).map(e => [e.date, e]));
  const accentColor = goal.color || '#16A34A';

  // Build 10 weeks × 7 days = 70 days, column-major; today is always the last cell
  const startOfGrid = subDays(today, 69);

  const columns: string[][] = [];
  for (let col = 0; col < 10; col++) {
    const week: string[] = [];
    for (let row = 0; row < 7; row++) {
      const d = new Date(startOfGrid.getTime() + (col * 7 + row) * 86400000);
      week.push(format(d, 'yyyy-MM-dd'));
    }
    columns.push(week);
  }

  function getColor(dateStr: string): string {
    if (dateStr > todayStr) return 'transparent';
    const entry = entryMap.get(dateStr);
    if (!entry || (!entry.completed && !entry.value)) return 'var(--border)';
    let intensity = 0;
    if (goal.type === 'binary') intensity = entry.completed ? 1 : 0;
    else if (goal.target) intensity = Math.min(1, (entry.value ?? 0) / goal.target);
    else if (goal.duration) intensity = Math.min(1, (entry.value ?? 0) / goal.duration);
    else intensity = entry.completed ? 1 : 0;
    if (intensity <= 0) return 'var(--border)';
    if (intensity < 0.33) return `${accentColor}40`;
    if (intensity < 0.66) return `${accentColor}80`;
    return accentColor;
  }

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="w-full">
      <div className="flex gap-0.5 w-full">
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-0.5 mr-1 shrink-0" style={{ paddingTop: 0 }}>
          {dayLabels.map((d, i) => (
            <div
              key={i}
              className="flex items-center justify-center"
              style={{ height: 14, fontSize: 9, color: 'var(--text-3)', fontWeight: 500 }}
            >
              {i % 2 === 0 ? d : ''}
            </div>
          ))}
        </div>

        {/* Grid columns — each column fills equal width */}
        {columns.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5 flex-1">
            {week.map(dateStr => {
              const bg = getColor(dateStr);
              const isFuture = dateStr > todayStr;
              const isFull = bg === accentColor;
              const isToday = dateStr === todayStr;
              return (
                <div
                  key={dateStr}
                  className="rounded-[3px] transition-colors duration-200"
                  style={{
                    aspectRatio: '1',
                    backgroundColor: bg,
                    opacity: isFuture ? 0.12 : 1,
                    border: isToday ? `1.5px solid ${accentColor}` : undefined,
                    boxShadow: isFull ? `0 0 4px ${accentColor}40` : 'none',
                  }}
                  title={dateStr}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function GoalDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const goal = useGoal(params.id);
  const entries = useEntries(params.id);
  const stats = useGoalStats(params.id, goal ?? undefined);
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayEntry = useEntryForDate(params.id, today);
  const [editOpen, setEditOpen]         = useState(false);
  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [shareOpen, setShareOpen]       = useState(false);

  if (goal === undefined) return <div className="text-center py-12 text-sm" style={{ color: 'var(--text-3)' }}>Loading…</div>;
  if (goal === null) return <div className="text-center py-12 text-sm" style={{ color: 'var(--text-3)' }}>Goal not found.</div>;

  const recentEntries = (entries ?? []).slice(0, 30);
  const goalColor = goal.color || '#16A34A';
  const totalCompletions = (entries ?? []).filter(e =>
    goal.type === 'binary' ? e.completed : (e.completed || (e.value ?? 0) > 0)
  ).length;

  const currentMissRun = (() => {
    let n = 0;
    for (const e of recentEntries) {
      if (!e.completed) n++;
      else break;
    }
    return n;
  })();

  const COMEBACK_MESSAGES: Record<number, string> = {
    2: "Two days gone — make today the comeback.",
    3: "Missing days happens to everyone. What defines you is coming back.",
  };
  const comebackMsg =
    currentMissRun >= 4
      ? "Champions aren't people who never miss. They're people who always return."
      : COMEBACK_MESSAGES[currentMissRun] ?? null;

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm transition-all duration-200 active:scale-95"
        style={{ color: 'var(--text-3)' }}
      >
        <ChevronLeft size={15} /> Back
      </button>

      {/* Header card */}
      <div
        className="rounded-xl p-5 animate-in"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ backgroundColor: 'var(--border)', color: 'var(--text-3)' }}
              >
                {goal.type}
              </span>
              <span
                className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded capitalize"
                style={{
                  backgroundColor: goal.status === 'active' ? 'rgba(22,163,74,0.1)' : 'var(--border)',
                  color: goal.status === 'active' ? 'var(--success)' : 'var(--text-3)',
                }}
              >
                {goal.status}
              </span>
              {goal.visibility && (
                <VisibilityBadge visibility={goal.visibility} />
              )}
            </div>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>{goal.title}</h1>
            {goal.why && (
              <p className="text-sm mt-1 italic" style={{ color: 'var(--text-3)' }}>&ldquo;{goal.why}&rdquo;</p>
            )}
            {goal.description && (
              <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{goal.description}</p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            {goal.visibility && goal.visibility !== 'private' && (
              <button
                onClick={() => setShareOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded transition-all duration-200 hover:scale-110 active:scale-90"
                style={{ color: 'var(--accent)' }}
                title="Share"
              >
                <Share2 size={14} />
              </button>
            )}
            <button onClick={() => setEditOpen(true)} className="w-8 h-8 flex items-center justify-center rounded transition-all duration-200 hover:scale-110 active:scale-90" style={{ color: 'var(--text-3)' }}>
              <Edit2 size={14} />
            </button>
            <button onClick={() => setDeleteOpen(true)} className="w-8 h-8 flex items-center justify-center rounded transition-all duration-200 hover:scale-110 active:scale-90" style={{ color: 'var(--text-3)' }}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {goal.status === 'active' && (
            <button onClick={() => pauseGoal(goal.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 active:scale-95" style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}>
              <Pause size={12} /> Pause
            </button>
          )}
          {goal.status === 'paused' && (
            <button onClick={() => resumeGoal(goal.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 active:scale-95" style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}>
              <Play size={12} /> Resume
            </button>
          )}
          {goal.status === 'active' && (
            <button onClick={() => setCompleteOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 active:scale-95" style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}>
              <CheckCircle size={12} /> Complete
            </button>
          )}
          <button onClick={() => archiveGoal(goal.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 active:scale-95" style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}>
            <Archive size={12} /> Archive
          </button>
        </div>
      </div>

      {/* 66-day ring + stats grid */}
      <div className="grid grid-cols-[auto_1fr] gap-4">
        <div
          className="rounded-xl p-4 flex items-center justify-center animate-stagger-in"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '50ms' }}
        >
          <HabitRing
            currentStreak={stats?.currentStreak ?? 0}
            totalCompletions={totalCompletions}
            color={goalColor}
          />
        </div>

        {stats && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: '7-day', value: `${stats.completionRate7}%`, accent: stats.completionRate7 >= 80 },
              { label: '30-day', value: `${stats.completionRate30}%`, accent: stats.completionRate30 >= 80 },
              { label: 'Total', value: stats.totalEntries, accent: false },
              { label: 'Best', value: `${stats.bestStreak}d`, accent: stats.bestStreak >= 7 },
            ].map(({ label, value, accent }, i) => (
              <div
                key={label}
                className="rounded-xl p-3 text-center animate-stagger-in"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: accent ? `1px solid ${goalColor}30` : '1px solid var(--border)',
                  animationDelay: `${100 + i * 50}ms`,
                }}
              >
                <p className="text-xl font-semibold tabular" style={{ color: accent ? goalColor : 'var(--text)' }}>
                  {value}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-3)' }}>{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Track today */}
      {goal.status === 'active' && (
        <div
          className="rounded-xl p-5 animate-stagger-in"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '280ms' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>
            Track today
          </p>
          {goal.type === 'binary' && (
            <div className="flex items-center gap-3">
              <BinaryEntry
                completed={todayEntry?.completed ?? false}
                onChange={completed => upsertEntry(goal.id, today, { completed })}
                color={goalColor}
              />
              <span className="text-sm" style={{ color: 'var(--text-2)' }}>
                {todayEntry?.completed ? 'Done for today!' : 'Mark as done'}
              </span>
            </div>
          )}
          {goal.type === 'numeric' && (
            <NumericEntry
              value={todayEntry?.value ?? 0}
              target={goal.target ?? 0}
              unit={goal.unit}
              onChange={value =>
                upsertEntry(goal.id, today, { value, completed: value >= (goal.target ?? 0) })
              }
              color={goalColor}
            />
          )}
          {goal.type === 'timer' && (
            <TimerEntry
              goalId={goal.id}
              value={todayEntry?.value ?? 0}
              target={goal.duration ?? 0}
              onChange={value =>
                upsertEntry(goal.id, today, { value, completed: value >= (goal.duration ?? 0) })
              }
              color={goalColor}
            />
          )}
        </div>
      )}

      {/* Heatmap */}
      <div
        className="rounded-xl p-5 animate-stagger-in"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '300ms' }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>Last 66 days</p>
        <CalendarHeatmap goalId={goal.id} goal={goal} />
      </div>

      {/* Invite / Approval panel — invite-only goals only */}
      {goal.visibility === 'invite-only' && (
        <div
          className="rounded-xl p-5 animate-stagger-in"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid #7C3AED30', animationDelay: '350ms' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: '#7C3AED' }}>
            Participants
          </p>
          <InvitePanel goalId={goal.id} />
        </div>
      )}

      {/* Recent history */}
      <div
        className="rounded-xl overflow-hidden animate-stagger-in"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '400ms' }}
      >
        <p className="px-5 py-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
          Recent history
        </p>
        {recentEntries.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-3)' }}>No entries yet.</p>
        ) : (
          <div>
            {comebackMsg && (
              <div
                className="px-5 py-2.5 text-xs italic animate-slide-down"
                style={{
                  color: 'var(--accent)',
                  backgroundColor: 'color-mix(in srgb, var(--accent) 6%, transparent)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {comebackMsg}
              </div>
            )}
            {recentEntries.map(entry => {
              const hasPartial = !entry.completed && entry.value != null && entry.value > 0;
              const dotColor = entry.completed
                ? goalColor
                : hasPartial ? '#F59E0B' : 'var(--border-2)';
              const label = entry.completed ? 'Done' : hasPartial ? 'Partial' : '—';
              const labelColor = entry.completed
                ? 'var(--text-2)'
                : hasPartial ? '#F59E0B' : 'var(--text-3)';
              return (
                <div key={entry.id} className="flex items-center px-5 py-2.5 gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="text-xs tabular w-20 shrink-0" style={{ color: 'var(--text-3)' }}>{entry.date}</span>
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300"
                    style={{
                      backgroundColor: dotColor,
                      boxShadow: entry.completed ? `0 0 4px ${goalColor}30` : 'none',
                    }}
                  />
                  <span className="text-sm flex-1" style={{ color: labelColor }}>
                    {label}
                    {entry.value != null && goal.type !== 'binary' && (
                      <span className="ml-2 tabular" style={{ color: hasPartial ? '#F59E0B' : 'var(--text-3)' }}>
                        {goal.type === 'timer'
                          ? formatDuration(entry.value)
                          : `${entry.value}${goal.unit ? ` ${goal.unit}` : ''}`}
                      </span>
                    )}
                  </span>
                  {entry.note && (
                    <span className="text-xs italic truncate max-w-[100px]" style={{ color: 'var(--text-3)' }}>{entry.note}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit goal">
        <GoalForm goal={goal} onClose={() => setEditOpen(false)} />
      </Modal>
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => { await deleteGoal(goal.id); router.push('/goals'); }}
        title="Delete goal"
        message="This will permanently delete the goal and all its history. This cannot be undone."
        confirmLabel="Delete Goal"
        variant="danger"
      />
      <ConfirmDialog
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onConfirm={() => { completeGoal(goal.id); setCompleteOpen(false); }}
        title="Mark complete"
        message="Mark this goal as completed? It will be hidden from active views."
        confirmLabel="Mark Complete"
        variant="primary"
      />
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        goal={goal}
      />
    </div>
  );
}
