'use client';
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Calendar } from 'lucide-react';
import { useRoutineBlocks, createRoutineBlock, updateRoutineBlock, deleteRoutineBlock } from '@/hooks/useRoutine';
import { useActiveGoals } from '@/hooks/useGoals';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { RoutineBlock, Goal } from '@/types';

const BLOCK_EMOJIS = ['🌅', '☀️', '🌙', '💪', '🧠', '🎯', '☕', '🏃'];

function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour   = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

function BlockForm({ block, onClose }: { block?: RoutineBlock; onClose: () => void }) {
  const [name, setName]           = useState(block?.name ?? '');
  const [emoji, setEmoji]         = useState(block?.emoji ?? '🌅');
  const [startTime, setStartTime] = useState(block?.startTime ?? '08:00');
  const [saving, setSaving]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (block) {
        await updateRoutineBlock(block.id, { name: name.trim(), emoji, startTime });
      } else {
        await createRoutineBlock({ name: name.trim(), emoji, startTime });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-5">
      <div>
        <label className="section-label block mb-2">Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Morning, Lunch break, After work"
          maxLength={30}
          autoFocus
          className="field"
        />
      </div>

      <div>
        <label className="section-label block mb-2">Icon</label>
        <div className="flex gap-2 flex-wrap">
          {BLOCK_EMOJIS.map(e => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all"
              style={{
                border:          emoji === e ? '2px solid var(--accent)' : '1px solid var(--border)',
                backgroundColor: emoji === e ? 'var(--accent-2)' : 'transparent',
                transform:       emoji === e ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="section-label block mb-2">Start time</label>
        <input
          type="time"
          value={startTime}
          onChange={e => setStartTime(e.target.value)}
          className="field"
          style={{ width: 'auto' }}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
        <button type="submit" disabled={saving || !name.trim()} className="btn btn-primary">
          {saving ? 'Saving…' : block ? 'Update' : 'Add block'}
        </button>
      </div>
    </form>
  );
}

function TimelineBlock({
  block, linkedGoals, isLast, onEdit, onDelete,
}: {
  block: RoutineBlock;
  linkedGoals: Goal[];
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative flex gap-4 group">
      <div className="relative w-6 shrink-0 flex flex-col items-center">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0 mt-[18px] z-10"
          style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 0 3px var(--bg)' }}
        />
        {!isLast && (
          <div className="w-px flex-1 mt-1.5" style={{ backgroundColor: 'var(--border)' }} />
        )}
      </div>

      <div className="card flex-1 mb-4">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="text-xl">{block.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--text)' }}>
              {block.name}
            </p>
            <p className="text-[11px] mt-0.5 tabular" style={{ color: 'var(--text-3)' }}>
              {formatTime12(block.startTime)}
            </p>
          </div>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
            <button onClick={onEdit} className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--border)]" style={{ color: 'var(--text-3)' }}>
              <Edit2 size={13} />
            </button>
            <button onClick={onDelete} className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--border)]" style={{ color: 'var(--text-3)' }}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {linkedGoals.length > 0 && (
          <div className="px-4 py-3 flex flex-wrap gap-1.5" style={{ borderTop: '1px solid var(--border)' }}>
            {linkedGoals.map(goal => (
              <span
                key={goal.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: goal.color || 'var(--accent)' }} />
                {goal.title}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoutinePage() {
  const routineBlocks               = useRoutineBlocks();
  const goals                       = useActiveGoals();
  const [blockFormOpen, setBlockFormOpen]   = useState(false);
  const [editingBlock, setEditingBlock]     = useState<RoutineBlock | undefined>();
  const [deleteBlockId, setDeleteBlockId]   = useState<string | null>(null);

  const blocks = routineBlocks ?? [];
  const goalsByBlock = new Map<string, Goal[]>();
  for (const goal of goals ?? []) {
    if (goal.routineBlockId) {
      if (!goalsByBlock.has(goal.routineBlockId)) goalsByBlock.set(goal.routineBlockId, []);
      goalsByBlock.get(goal.routineBlockId)!.push(goal);
    }
  }

  return (
    <div>
      <h1 className="page-title mb-1">Your Day</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-3)' }}>
        Shape the rhythm of your typical day.
      </p>

      {blocks.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text)' }}>No time blocks yet</p>
          <p className="text-xs mb-5" style={{ color: 'var(--text-3)' }}>
            Add blocks for parts of your day — morning, lunch, evening — then link habits to each one.
          </p>
          <button onClick={() => { setEditingBlock(undefined); setBlockFormOpen(true); }} className="btn btn-primary">
            <Plus size={14} /> Add first block
          </button>
        </div>
      ) : (
        <div>
          <div className="pl-1">
            {blocks.map((block, i) => (
              <TimelineBlock
                key={block.id}
                block={block}
                linkedGoals={goalsByBlock.get(block.id) ?? []}
                isLast={i === blocks.length - 1}
                onEdit={() => { setEditingBlock(block); setBlockFormOpen(true); }}
                onDelete={() => setDeleteBlockId(block.id)}
              />
            ))}
          </div>
          <div className="flex gap-4 pl-1 mt-1">
            <div className="w-6 shrink-0 flex justify-center">
              <div className="w-2.5 h-2.5 rounded-full mt-1 border-2 border-dashed" style={{ borderColor: 'var(--border-2)' }} />
            </div>
            <button
              onClick={() => { setEditingBlock(undefined); setBlockFormOpen(true); }}
              className="flex items-center gap-1.5 text-xs font-medium transition-colors"
              style={{ color: 'var(--text-3)' }}
            >
              <Plus size={12} /> Add time block
            </button>
          </div>
        </div>
      )}

      <div className="mt-10 space-y-3">
        <div className="card p-5">
          <p className="section-label mb-3">How it works</p>
          <div className="space-y-2.5 text-xs" style={{ color: 'var(--text-2)' }}>
            <p><strong style={{ color: 'var(--text)' }}>1.</strong> Create time blocks for parts of your day</p>
            <p><strong style={{ color: 'var(--text)' }}>2.</strong> When adding a habit, link it to a block</p>
            <p><strong style={{ color: 'var(--text)' }}>3.</strong> Your Today view groups habits by when they happen</p>
            <p className="pt-1 italic" style={{ color: 'var(--text-3)' }}>
              &quot;When it&apos;s morning, I will meditate for 10 minutes.&quot;
            </p>
          </div>
        </div>

        <div className="card p-5 flex items-start gap-3">
          <Calendar size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--text-3)' }} />
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-2)' }}>Coming soon</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              Connect your calendar to automatically fit habits around meetings and commitments.
            </p>
          </div>
        </div>
      </div>

      <Modal
        open={blockFormOpen}
        onClose={() => { setBlockFormOpen(false); setEditingBlock(undefined); }}
        title={editingBlock ? 'Edit block' : 'New time block'}
      >
        <BlockForm block={editingBlock} onClose={() => { setBlockFormOpen(false); setEditingBlock(undefined); }} />
      </Modal>

      <ConfirmDialog
        open={deleteBlockId !== null}
        onClose={() => setDeleteBlockId(null)}
        onConfirm={async () => {
          if (deleteBlockId) await deleteRoutineBlock(deleteBlockId);
          setDeleteBlockId(null);
        }}
        title="Delete time block"
        message="Habits linked to this block will move to Anytime. This can't be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
