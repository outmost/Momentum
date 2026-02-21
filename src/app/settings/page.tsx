'use client';
import React, { useState, useRef } from 'react';
import { Sun, Moon, Monitor, Download, Upload, Trash2, Sparkles } from 'lucide-react';
import { useSettings, updateSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { requestNotificationPermission } from '@/lib/notifications';
import { exportAllData, downloadJSON, importData } from '@/lib/export';
import { seedDemoData, clearAllAppData } from '@/lib/seed';
import { Toggle } from '@/components/ui/Toggle';

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="section-label mb-2.5">{label}</p>
      <div className="card-overflow">
        {children}
      </div>
    </section>
  );
}

function Row({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div
      className="px-4 py-4"
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
  const [clearStep2, setClearStep2]             = useState(false);
  const [clearInput, setClearInput]             = useState('');
  const [importing, setImporting]               = useState(false);
  const [seedMsg, setSeedMsg]                   = useState<string | null>(null);
  const [importMode, setImportMode]             = useState<'merge' | 'replace'>('merge');
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
      <h1 className="page-title mb-1 animate-in">Settings</h1>
      <p className="page-subtitle mb-8 animate-in">Customize your experience</p>

      <div className="space-y-7">
        {/* Appearance */}
        <Section label="Appearance">
          <Row>
            <p className="text-[13px] mb-3" style={{ color: 'var(--text-2)' }}>Theme</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'light', label: 'Light',  icon: Sun },
                { value: 'dark',  label: 'Dark',   icon: Moon },
                { value: 'system',label: 'System', icon: Monitor },
              ] as const).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className="flex flex-col items-center gap-2 py-3 rounded-xl transition-all"
                  style={{
                    border:          `1.5px solid ${theme === value ? 'var(--accent)' : 'var(--border)'}`,
                    backgroundColor: theme === value ? 'var(--accent-2)' : 'transparent',
                    color:           theme === value ? 'var(--accent)' : 'var(--text-3)',
                  }}
                >
                  <Icon size={16} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </Row>
          <Row last>
            <p className="text-[13px] mb-3" style={{ color: 'var(--text-2)' }}>Week starts on</p>
            <div className="flex gap-2">
              {([{ value: 0, label: 'Sunday' }, { value: 1, label: 'Monday' }] as const).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateSettings({ weekStartsOn: value })}
                  className={settings?.weekStartsOn === value ? 'chip chip-active' : 'chip'}
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
              Per-goal reminders are set in each goal&apos;s edit form.
            </p>
          </Row>
        </Section>

        {/* Data */}
        <Section label="Data">
          <Row>
            <button
              onClick={handleLoadSample}
              className="flex items-center gap-3 w-full text-[13px] transition-colors text-left"
              style={{ color: 'var(--text-2)' }}
            >
              <Sparkles size={15} style={{ color: 'var(--accent)' }} />
              Load sample data
            </button>
            {seedMsg && <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>{seedMsg}</p>}
          </Row>
          <Row>
            <button
              onClick={handleExport}
              className="flex items-center gap-3 w-full text-[13px] transition-colors text-left"
              style={{ color: 'var(--text-2)' }}
            >
              <Download size={15} style={{ color: 'var(--accent)' }} />
              Export all data as JSON
            </button>
          </Row>
          <Row>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ backgroundColor: 'var(--border)' }}>
                {(['merge', 'replace'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setImportMode(mode)}
                    className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize"
                    style={{
                      backgroundColor: importMode === mode ? 'var(--surface)' : 'transparent',
                      color:           importMode === mode ? 'var(--text)' : 'var(--text-3)',
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                className="flex items-center gap-2 flex-1 text-[13px] text-left transition-colors disabled:opacity-50"
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
              className="flex items-center gap-3 w-full text-[13px] text-left transition-colors"
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
              <span className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>Momentum</span>
              <span className="text-xs tabular" style={{ color: 'var(--text-3)' }}>v1.0.0</span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Local-first · No account required</p>
          </Row>
        </Section>
      </div>

      {/* Clear confirmation overlay */}
      {clearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => { setClearConfirmOpen(false); setClearStep2(false); setClearInput(''); }}
          />
          <div
            className="relative w-full max-w-sm card p-6"
            style={{ boxShadow: 'var(--shadow-lg)' }}
          >
            <h3 className="text-[13px] font-semibold mb-2" style={{ color: 'var(--text)' }}>Clear all data?</h3>
            {!clearStep2 ? (
              <>
                <p className="text-[13px] mb-5" style={{ color: 'var(--text-2)' }}>
                  This will permanently delete all goals, entries, and history.
                </p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setClearConfirmOpen(false)} className="btn btn-secondary btn-sm">Cancel</button>
                  <button onClick={() => setClearStep2(true)} className="btn btn-danger btn-sm">Continue</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-[13px] mb-3" style={{ color: 'var(--text-2)' }}>
                  Type <strong style={{ color: 'var(--text)' }}>DELETE</strong> to confirm.
                </p>
                <input
                  value={clearInput}
                  onChange={e => setClearInput(e.target.value)}
                  placeholder="DELETE"
                  className="field mb-4"
                  style={{ borderColor: 'var(--danger)' }}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setClearConfirmOpen(false); setClearStep2(false); setClearInput(''); }}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearAll}
                    disabled={clearInput !== 'DELETE'}
                    className="btn btn-danger btn-sm"
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
