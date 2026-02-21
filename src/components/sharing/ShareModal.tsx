'use client';
import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Globe, Users, Lock, Download, Copy, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import type { Goal } from '@/types';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  goal: Goal;
}

function buildShareURL(goal: Goal): string {
  // Encode the challenge as a deep-link / query-string that another Momentum
  // user can open.  We keep it URL-safe and human-readable.
  const data = encodeURIComponent(
    JSON.stringify({
      app: 'momentum',
      v: 1,
      challenge: {
        title: goal.title,
        ...(goal.why ? { why: goal.why } : {}),
        type: goal.type,
        frequency: goal.frequency,
        ...(goal.target ? { target: goal.target, unit: goal.unit } : {}),
        ...(goal.duration ? { duration: goal.duration } : {}),
        visibility: goal.visibility,
        shareCode: goal.shareCode ?? goal.id.slice(0, 8),
      },
    })
  );
  // Use the current origin so it works on any deployment.
  const base =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://momentum.app';
  return `${base}/join?c=${data}`;
}

const VISIBILITY_LABELS = {
  private: { icon: <Lock size={12} />, label: 'Private', note: 'Only visible to you.' },
  'invite-only': { icon: <Users size={12} />, label: 'Invite-only', note: 'Share with your circle. Participants need your approval.' },
  public: { icon: <Globe size={12} />, label: 'Public', note: 'Anyone who scans can join your challenge.' },
};

export function ShareModal({ open, onClose, goal }: ShareModalProps) {
  const qrRef = useRef<SVGSVGElement>(null);
  const [copied, setCopied] = useState(false);

  const shareURL = buildShareURL(goal);
  const vis = VISIBILITY_LABELS[goal.visibility];

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareURL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  }

  function handleDownload() {
    if (!qrRef.current) return;
    const svg = qrRef.current;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `momentum-${goal.title.replace(/\s+/g, '-').toLowerCase()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Modal open={open} onClose={onClose} title="Share challenge">
      <div className="p-5 space-y-5">

        {/* Share card */}
        <div
          className="rounded-xl p-5 flex flex-col items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, var(--surface) 0%, color-mix(in srgb, var(--accent) 6%, var(--surface)) 100%)',
            border: '1px solid var(--border)',
          }}
        >
          {/* QR code */}
          <div
            className="p-3 rounded-xl"
            style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
          >
            <QRCodeSVG
              ref={qrRef}
              value={shareURL}
              size={160}
              level="M"
              bgColor="#ffffff"
              fgColor="#1A1A18"
              imageSettings={{
                src: '/icons/icon-192x192.png',
                height: 28,
                width: 28,
                excavate: true,
              }}
            />
          </div>

          {/* Challenge info */}
          <div className="text-center space-y-1">
            <p
              className="text-base font-semibold tracking-tight"
              style={{ color: 'var(--text)' }}
            >
              {goal.title}
            </p>
            {goal.why && (
              <p className="text-xs italic" style={{ color: 'var(--text-3)' }}>
                &ldquo;{goal.why}&rdquo;
              </p>
            )}
            <p className="text-[10px] font-semibold uppercase tracking-widest mt-1" style={{ color: 'var(--text-3)' }}>
              66-day challenge · {goal.frequency}
            </p>
          </div>

          {/* Visibility badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium"
            style={{
              backgroundColor: 'var(--border)',
              color: 'var(--text-2)',
            }}
          >
            {vis.icon}
            <span>{vis.label}</span>
            <span style={{ color: 'var(--text-3)' }}>·</span>
            <span style={{ color: 'var(--text-3)' }}>{vis.note}</span>
          </div>
        </div>

        {/* Share URL */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
            Share link
          </p>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface-2)' }}
          >
            <p className="flex-1 text-xs truncate tabular" style={{ color: 'var(--text-2)' }}>
              {shareURL}
            </p>
            <button
              onClick={handleCopy}
              className="shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-all duration-200 active:scale-95"
              style={{
                color: copied ? 'var(--success)' : 'var(--accent)',
                backgroundColor: copied
                  ? 'color-mix(in srgb, var(--success) 10%, transparent)'
                  : 'color-mix(in srgb, var(--accent) 10%, transparent)',
              }}
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95"
            style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}
          >
            <Download size={14} />
            Download QR
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 active:scale-95"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
