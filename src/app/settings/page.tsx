'use client';
import React, { useState, useRef } from 'react';
import { Sun, Moon, Monitor, Download, Upload, Trash2, Sparkles } from 'lucide-react';
import { useSettings, updateSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { requestNotificationPermission } from '@/lib/notifications';
import { exportAllData, downloadJSON, importData, clearAllData } from '@/lib/export';
import { seedDemoData, clearAllAppData } from '@/lib/seed';
import { Toggle } from '@/components/ui/Toggle';

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>
        {label}
      </p>
      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        {children}
      </div>
    </section>
  );
}

function Row({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div
      className="px-4 py-3.5"
      style={{ borderBottom: last ? 'none' : '1px solid var(--border)' }}
    >
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const settings = useSettings();
  const { theme, setTheme } = useTheme();
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [clearStep2, setClearStep2] = useState(false);
  const [clearInput, setClearInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    const data = await exportAllData();
    downloadJSON(data, `momentum-${new Date().toISOString().split('T')[0]}.json`);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      await importData(await file.text(), importMode);
      alert('Import successful!');
    } catch (err) {
      alert('Import failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleLoadSample() {
    const seeded = await seedDemoData();
    setSeedMsg(seeded ? 'Sample data loaded!' : 'You already have goals — sample data skipped.');
    setTimeout(() => setSeedMsg(null), 3000);
  }

  async function handleClearAll() {
    if (clearInput !== 'DELETE') return;
    await clearAllAppData();
    setClearConfirmOpen(false);
    setClearStep2(false);
    setClearInput('');
  }

  async function handleNotificationToggle(enabled: boolean) {
    if (enabled) {
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        alert('Notification permission denied. Enable notifications in your browser settings.');
        return;
      }
    }
    await updateSettings({ notificationsEnabled: enabled });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-8" style={{ color: 'var(--text)' }}>Settings</h1>

      <div className="space-y-8">
        {/* Appearance */}
        <Section label="Appearance">
          <Row>
            <p className="text-sm mb-3" style={{ color: 'var(--text-2)' }}>Theme</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'system', label: 'System', icon: Monitor },
              ] as const).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className="flex flex-col items-center gap-2 py-3 rounded-md transition-colors"
                  style={{
                    border: `1px solid ${theme === value ? 'var(--accent)' : 'var(--border)'}`,
                    backgroundColor: theme === value ? 'var(--accent-2)' : 'transparent',
                    color: theme === value ? 'var(--accent)' : 'var(--text-3)',
                  }}
                >
                  <Icon size={16} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </Row>
          <Row last>
            <p className="text-sm mb-3" style={{ color: 'var(--text-2)' }}>Week starts on</p>
            <div className="flex gap-2">
              {([{ value: 0, label: 'Sunday' }, { value: 1, label: 'Monday' }] as const).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateSettings({ weekStartsOn: value })}
                  className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: settings?.weekStartsOn === value ? 'var(--text)' : 'transparent',
                    color: settings?.weekStartsOn === value ? 'var(--bg)' : 'var(--text-2)',
                    border: settings?.weekStartsOn === value ? '1px solid transparent' : '1px solid var(--border)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        {/* Notifications */}
        <Section label="Notifications">
          <Row last>
            <Toggle
              checked={settings?.notificationsEnabled ?? false}
              onChange={handleNotificationToggle}
              label="Enable push notifications"
            />
            <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
              Per-goal reminders are set in each goal's edit form.
            </p>
          </Row>
        </Section>

        {/* Data */}
        <Section label="Data">
          <Row>
            <button
              onClick={handleLoadSample}
              className="flex items-center gap-3 w-full text-sm transition-colors text-left"
              style={{ color: 'var(--text-2)' }}
            >
              <Sparkles size={15} style={{ color: 'var(--accent)' }} />
              Load sample data
            </button>
            {seedMsg && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>{seedMsg}</p>
            )}
          </Row>
          <Row>
            <button
              onClick={handleExport}
              className="flex items-center gap-3 w-full text-sm transition-colors text-left"
              style={{ color: 'var(--text-2)' }}
            >
              <Download size={15} style={{ color: 'var(--accent)' }} />
              Export all data as JSON
            </button>
          </Row>
          <Row>
            <div className="flex items-center gap-2">
              {/* Mode toggle */}
              <div
                className="flex gap-0.5 p-0.5 rounded"
                style={{ backgroundColor: 'var(--border)' }}
              >
                {(['merge', 'replace'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setImportMode(mode)}
                    className="px-2 py-1 rounded text-xs font-medium transition-colors capitalize"
                    style={{
                      backgroundColor: importMode === mode ? 'var(--surface)' : 'transparent',
                      color: importMode === mode ? 'var(--text)' : 'var(--text-3)',
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                className="flex items-center gap-2 flex-1 text-sm text-left transition-colors disabled:opacity-50"
                style={{ color: 'var(--text-2)' }}
              >
                <Upload size={15} style={{ color: 'var(--success)' }} />
                {importing ? 'Importing…' : 'Import from JSON'}
              </button>
              <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            </div>
          </Row>
          <Row last>
            <button
              onClick={() => setClearConfirmOpen(true)}
              className="flex items-center gap-3 w-full text-sm text-left transition-colors"
              style={{ color: 'var(--danger)' }}
            >
              <Trash2 size={15} />
              Clear all data
            </button>
          </Row>
        </Section>

        {/* About */}
        <Section label="About">
          <Row last>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>Momentum</span>
              <span className="text-xs tabular" style={{ color: 'var(--text-3)' }}>v1.0.0</span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Local-first · No account required</p>
          </Row>
        </Section>
      </div>

      {/* Clear confirmation overlay */}
      {clearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => { setClearConfirmOpen(false); setClearStep2(false); setClearInput(''); }} />
          <div
            className="relative w-full max-w-sm rounded-xl p-6"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>Clear all data?</h3>
            {!clearStep2 ? (
              <>
                <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>
                  This will permanently delete all goals, entries, and history.
                </p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setClearConfirmOpen(false)} className="px-3 py-1.5 text-sm rounded-md" style={{ color: 'var(--text-2)', border: '1px solid var(--border)' }}>Cancel</button>
                  <button onClick={() => setClearStep2(true)} className="px-3 py-1.5 text-sm rounded-md font-medium text-white" style={{ backgroundColor: 'var(--danger)' }}>Continue</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm mb-3" style={{ color: 'var(--text-2)' }}>
                  Type <strong style={{ color: 'var(--text)' }}>DELETE</strong> to confirm. This cannot be undone.
                </p>
                <input
                  value={clearInput}
                  onChange={e => setClearInput(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 rounded-md text-sm mb-4 focus:outline-none"
                  style={{ border: '1px solid var(--danger)', backgroundColor: 'transparent', color: 'var(--text)' }}
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setClearConfirmOpen(false); setClearStep2(false); setClearInput(''); }} className="px-3 py-1.5 text-sm rounded-md" style={{ color: 'var(--text-2)', border: '1px solid var(--border)' }}>Cancel</button>
                  <button
                    onClick={handleClearAll}
                    disabled={clearInput !== 'DELETE'}
                    className="px-3 py-1.5 text-sm rounded-md font-medium text-white disabled:opacity-40"
                    style={{ backgroundColor: 'var(--danger)' }}
                  >
                    Clear All Data
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
