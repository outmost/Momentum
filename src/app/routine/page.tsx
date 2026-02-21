'use client';
import React, { useState } from 'react';
import { Plus, Trash2, Clock, Edit2 } from 'lucide-react';
import { useRoutineBlocks, createRoutineBlock, updateRoutineBlock, deleteRoutineBlock, updateDayTypeMap } from '@/hooks/useRoutine';
import { useSettings } from '@/hooks/useSettings';
import { useActiveGoals } from '@/hooks/useGoals';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { DayType, RoutineBlock } from '@/types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const BLOCK_EMOJIS = ['🌅', '☀️', '🌙', '💪', '🧠', '🎯', '☕', '🏃'];

function BlockForm({ block, onClose }: { block?: RoutineBlock; onClose: () => void }) {
  const [name, setName] = useState(block?.name ?? '');
  const [emoji, setEmoji] = useState(block?.emoji ?? '🌅');
  const [startTime, setStartTime] = useState(block?.startTime ?? '08:00');
  const [dayTypes, setDayTypes] = useState<DayType[]>(block?.dayTypes ?? ['workday', 'restday']);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (block) {
        await updateRoutineBlock(block.id, { name: name.trim(), emoji, startTime, dayTypes });
      } else {
        await createRoutineBlock({ name: name.trim(), emoji, startTime, dayTypes });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const labelStyle = { color: 'var(--text-2)', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '6px' } as const;

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div>
        <label style={labelStyle}>Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Morning, After work"
          maxLength={30}
          autoFocus
          className="w-full px-3 py-2 rounded-md text-sm focus:outline-none"
          style={{ border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)' }}
        />
      </div>

      <div>
        <label style={labelStyle}>Icon</label>
        <div className="flex gap-2 flex-wrap">
          {BLOCK_EMOJIS.map(e => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className="w-8 h-8 rounded flex items-center justify-center text-lg transition-colors"
              style={{
                border: emoji === e ? '2px solid var(--accent)' : '1px solid var(--border)',
                backgroundColor: emoji === e ? 'var(--accent-2)' : 'transparent',
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle}>When does this block start?</label>
        <input
          type="time"
          value={startTime}
          onChange={e => setStartTime(e.target.value)}
          className="px-3 py-2 rounded-md text-sm focus:outline-none"
          style={{ border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)' }}
        />
      </div>

      <div>
        <label style={labelStyle}>Applies to</label>
        <div className="flex gap-2">
          {(['workday', 'restday'] as DayType[]).map(dt => (
            <button
              key={dt}
              type="button"
              onClick={() => {
                setDayTypes(prev =>
                  prev.includes(dt) ? prev.filter(d => d !== dt) : [...prev, dt]
                );
              }}
              className="px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors"
              style={{
                backgroundColor: dayTypes.includes(dt) ? 'var(--text)' : 'transparent',
                color: dayTypes.includes(dt) ? 'var(--bg)' : 'var(--text-3)',
                border: dayTypes.includes(dt) ? '1px solid transparent' : '1px solid var(--border)',
              }}
            >
              {dt === 'workday' ? 'Work days' : 'Rest days'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md" style={{ color: 'var(--text-2)', border: '1px solid var(--border)' }}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !name.trim() || dayTypes.length === 0}
          className="px-4 py-2 text-sm font-medium rounded-md text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {saving ? 'Saving...' : block ? 'Update' : 'Add block'}
        </button>
      </div>
    </form>
  );
}

export default function RoutinePage() {
  const routineBlocks = useRoutineBlocks();
  const settings = useSettings();
  const goals = useActiveGoals();
  const [blockFormOpen, setBlockFormOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<RoutineBlock | undefined>();
  const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null);

  const dayTypeMap = settings?.dayTypeMap ?? {};

  function toggleDayType(dow: number) {
    const current = dayTypeMap[dow] ?? 'workday';
    const next: DayType = current === 'workday' ? 'restday' : 'workday';
    updateDayTypeMap({ ...dayTypeMap, [dow]: next });
  }

  // Count goals linked to each block
  const goalsByBlock = new Map<string, number>();
  for (const goal of goals ?? []) {
    if (goal.routineBlockId) {
      goalsByBlock.set(goal.routineBlockId, (goalsByBlock.get(goal.routineBlockId) ?? 0) + 1);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-2" style={{ color: 'var(--text)' }}>
        Routine
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-3)' }}>
        Define your typical day. Habits fit around your routine.
      </p>

      <div className="space-y-8">
        {/* ── Week shape ── */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>
            Your week
          </p>
          <div
            className="rounded-lg p-4"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs mb-3" style={{ color: 'var(--text-2)' }}>
              Tap to toggle work / rest days
            </p>
            <div className="flex gap-1.5">
              {DAY_NAMES.map((name, dow) => {
                const dt = dayTypeMap[dow] ?? 'workday';
                const isWork = dt === 'workday';
                return (
                  <button
                    key={dow}
                    onClick={() => toggleDayType(dow)}
                    className="flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-md transition-colors"
                    style={{
                      backgroundColor: isWork ? 'var(--accent-2)' : 'var(--border)',
                      border: isWork ? '1px solid var(--accent)' : '1px solid transparent',
                    }}
                  >
                    <span
                      className="text-[10px] font-semibold uppercase"
                      style={{ color: isWork ? 'var(--accent)' : 'var(--text-3)' }}
                    >
                      {name}
                    </span>
                    <span
                      className="text-[9px]"
                      style={{ color: isWork ? 'var(--accent)' : 'var(--text-3)' }}
                    >
                      {isWork ? 'work' : 'rest'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Time blocks ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
              Time blocks
            </p>
            <button
              onClick={() => { setEditingBlock(undefined); setBlockFormOpen(true); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              <Plus size={12} /> Block
            </button>
          </div>

          <p className="text-xs mb-4" style={{ color: 'var(--text-2)' }}>
            When you add a habit, link it to a time block. Think: &quot;When it&apos;s [morning], I will [meditate].&quot;
          </p>

          {(!routineBlocks || routineBlocks.length === 0) ? (
            <div
              className="rounded-lg p-6 text-center"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>No blocks yet. Add your first time block.</p>
            </div>
          ) : (
            <div
              className="rounded-lg overflow-hidden"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {routineBlocks.map((block, i) => {
                const count = goalsByBlock.get(block.id) ?? 0;
                return (
                  <div
                    key={block.id}
                    className="flex items-center gap-3 px-4 py-3.5"
                    style={{ borderBottom: i < routineBlocks.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <span className="text-lg">{block.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{block.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-3)' }}>
                          <Clock size={9} /> {block.startTime}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                          {block.dayTypes.map(dt => dt === 'workday' ? 'Work' : 'Rest').join(' + ')}
                        </span>
                        {count > 0 && (
                          <span className="text-[10px] font-medium" style={{ color: 'var(--accent)' }}>
                            {count} habit{count !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => { setEditingBlock(block); setBlockFormOpen(true); }}
                      className="w-7 h-7 flex items-center justify-center rounded transition-colors"
                      style={{ color: 'var(--text-3)' }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteBlockId(block.id)}
                      className="w-7 h-7 flex items-center justify-center rounded transition-colors"
                      style={{ color: 'var(--text-3)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── How it works ── */}
        <section>
          <div
            className="rounded-lg p-5"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>
              How routines build habits
            </p>
            <div className="space-y-2.5 text-xs" style={{ color: 'var(--text-2)' }}>
              <p><strong style={{ color: 'var(--text)' }}>1.</strong> Define your week shape above (work vs rest days)</p>
              <p><strong style={{ color: 'var(--text)' }}>2.</strong> Create time blocks for parts of your day</p>
              <p><strong style={{ color: 'var(--text)' }}>3.</strong> When adding a habit, link it to a block</p>
              <p style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>
                &quot;When it&apos;s [morning], I will [meditate for 10 min].&quot;
              </p>
              <p className="pt-1" style={{ color: 'var(--text-3)' }}>
                Anchoring habits to time and context makes them stick.
              </p>
            </div>
          </div>
        </section>
      </div>

      <Modal
        open={blockFormOpen}
        onClose={() => { setBlockFormOpen(false); setEditingBlock(undefined); }}
        title={editingBlock ? 'Edit block' : 'New time block'}
      >
        <BlockForm
          block={editingBlock}
          onClose={() => { setBlockFormOpen(false); setEditingBlock(undefined); }}
        />
      </Modal>

      <ConfirmDialog
        open={deleteBlockId !== null}
        onClose={() => setDeleteBlockId(null)}
        onConfirm={async () => {
          if (deleteBlockId) await deleteRoutineBlock(deleteBlockId);
          setDeleteBlockId(null);
        }}
        title="Delete time block"
        message="Habits linked to this block will move to 'Anytime'. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
