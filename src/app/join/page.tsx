'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, AlertCircle, Globe, Users, Lock, Zap } from 'lucide-react';
import { createGoal } from '@/hooks/useGoals';
import type { GoalVisibility } from '@/types';

interface ChallengePayload {
  app: string;
  v: number;
  challenge: {
    title: string;
    why?: string;
    type: 'binary' | 'numeric' | 'timer';
    frequency: 'daily' | 'weekly' | 'custom';
    target?: number;
    unit?: string;
    duration?: number;
    visibility: GoalVisibility;
    shareCode?: string;
  };
}

function parsePayload(raw: string | null): ChallengePayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (parsed?.app !== 'momentum' || !parsed?.challenge?.title) return null;
    return parsed as ChallengePayload;
  } catch {
    return null;
  }
}

const VISIBILITY_META: Record<GoalVisibility, { icon: React.ReactNode; label: string; color: string }> = {
  private:       { icon: <Lock size={12} />,  label: 'Private',     color: 'var(--text-3)' },
  'invite-only': { icon: <Users size={12} />, label: 'Invite-only', color: '#7C3AED' },
  public:        { icon: <Globe size={12} />, label: 'Public',      color: 'var(--accent)' },
};

const TYPE_LABELS: Record<string, string> = {
  binary: 'Done / not done',
  numeric: 'Track a number',
  timer: 'Time-based',
};

function formatDurationMins(seconds: number) {
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}min` : `${h}h`;
}

function JoinContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const raw          = searchParams.get('c');
  const payload      = parsePayload(raw);

  const [status, setStatus] = useState<'idle' | 'joining' | 'joined' | 'error'>('idle');

  // Redirect to today after successful join
  useEffect(() => {
    if (status === 'joined') {
      const t = setTimeout(() => router.push('/'), 2000);
      return () => clearTimeout(t);
    }
  }, [status, router]);

  if (!payload) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-6">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'color-mix(in srgb, var(--danger) 10%, transparent)' }}
        >
          <AlertCircle size={28} style={{ color: 'var(--danger)' }} />
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Invalid challenge link</h1>
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>
            This link appears to be broken or expired.
          </p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all active:scale-95"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          Go to Momentum
        </button>
      </div>
    );
  }

  const { challenge } = payload;
  const vis = VISIBILITY_META[challenge.visibility ?? 'public'];

  async function handleJoin() {
    setStatus('joining');
    try {
      await createGoal({
        title: challenge.title,
        why: challenge.why,
        type: challenge.type,
        status: 'active',
        frequency: challenge.frequency,
        target: challenge.target,
        unit: challenge.unit,
        duration: challenge.duration,
        reminderEnabled: false,
        visibility: 'private',   // imported goals start private; user can change
        shareCode: undefined,
      });
      setStatus('joined');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'joined') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center animate-in"
          style={{ backgroundColor: 'color-mix(in srgb, var(--success) 12%, transparent)' }}
        >
          <CheckCircle size={32} style={{ color: 'var(--success)' }} />
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Challenge added!</h1>
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>
            Taking you to your habits…
          </p>
        </div>
      </div>
    );
  }

  const shareURL = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-0">
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
      >
        {/* Header banner */}
        <div
          className="px-6 py-5 text-center"
          style={{
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface)) 0%, var(--surface) 100%)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{
              color: 'var(--accent)',
              backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)',
            }}
          >
            <Zap size={10} /> Momentum challenge
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            {challenge.title}
          </h1>
          {challenge.why && (
            <p className="text-sm italic mt-1.5" style={{ color: 'var(--text-3)' }}>
              &ldquo;{challenge.why}&rdquo;
            </p>
          )}
        </div>

        {/* Details */}
        <div className="px-6 py-4 space-y-3">
          {/* Metadata chips */}
          <div className="flex flex-wrap gap-2">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium capitalize"
              style={{ backgroundColor: 'var(--border)', color: 'var(--text-2)' }}
            >
              {TYPE_LABELS[challenge.type]}
            </span>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium capitalize"
              style={{ backgroundColor: 'var(--border)', color: 'var(--text-2)' }}
            >
              {challenge.frequency}
            </span>
            {challenge.target && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{ backgroundColor: 'var(--border)', color: 'var(--text-2)' }}
              >
                {challenge.target}{challenge.unit ? ` ${challenge.unit}` : ''}
              </span>
            )}
            {challenge.duration && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{ backgroundColor: 'var(--border)', color: 'var(--text-2)' }}
              >
                {formatDurationMins(challenge.duration)}
              </span>
            )}
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{
                color: vis.color,
                backgroundColor: `color-mix(in srgb, ${vis.color} 10%, transparent)`,
              }}
            >
              {vis.icon} {vis.label}
            </span>
          </div>

          {/* 66-day callout */}
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg font-bold tabular"
              style={{
                border: '2px solid var(--accent)',
                color: 'var(--accent)',
                fontSize: '11px',
              }}
            >
              66
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
              It takes <strong style={{ color: 'var(--text)' }}>66 days</strong> to form a habit.
              Complete this challenge and it becomes part of who you are.
            </p>
          </div>
        </div>

        {/* QR code — useful if someone is viewing this on desktop and wants to scan on mobile */}
        {shareURL && (
          <div className="px-6 pb-4 flex flex-col items-center gap-2">
            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-3)' }}>
              Scan to open on another device
            </p>
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: '#fff' }}>
              <QRCodeSVG value={shareURL} size={96} level="M" bgColor="#ffffff" fgColor="#1A1A18" />
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="px-6 pb-6 space-y-2">
          <button
            onClick={handleJoin}
            disabled={status === 'joining'}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {status === 'joining' ? 'Adding to your habits…' : 'Start this challenge'}
          </button>
          {status === 'error' && (
            <p className="text-xs text-center" style={{ color: 'var(--danger)' }}>
              Something went wrong. Try again.
            </p>
          )}
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 rounded-xl text-sm transition-all active:scale-[0.98]"
            style={{ color: 'var(--text-3)' }}
          >
            No thanks
          </button>
        </div>
      </div>

      <p className="text-[10px] mt-6 text-center" style={{ color: 'var(--text-3)' }}>
        Powered by <strong>Momentum</strong> · Your data stays on your device
      </p>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>Loading challenge…</p>
      </div>
    }>
      <JoinContent />
    </Suspense>
  );
}
