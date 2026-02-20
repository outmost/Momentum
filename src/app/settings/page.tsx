'use client';
import React, { useState, useRef } from 'react';
import { Sun, Moon, Monitor, Download, Upload, Trash2 } from 'lucide-react';
import { useSettings, updateSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { requestNotificationPermission } from '@/lib/notifications';
import { exportAllData, downloadJSON, importData, clearAllData } from '@/lib/export';
import { Toggle } from '@/components/ui/Toggle';

export default function SettingsPage() {
  const settings = useSettings();
  const { theme, setTheme } = useTheme();
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [clearStep2, setClearStep2] = useState(false);
  const [clearInput, setClearInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const fileRef = useRef<HTMLInputElement>(null);
  
  async function handleExport() {
    const data = await exportAllData();
    downloadJSON(data, `momentum-export-${new Date().toISOString().split('T')[0]}.json`);
  }
  
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    try {
      const text = await file.text();
      await importData(text, importMode);
      alert('Import successful!');
    } catch (err) {
      alert('Import failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }
  
  async function handleClearAll() {
    if (clearInput !== 'DELETE') return;
    await clearAllData();
    setClearConfirmOpen(false);
    setClearStep2(false);
    setClearInput('');
  }
  
  async function handleNotificationToggle(enabled: boolean) {
    if (enabled) {
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        alert('Notification permission denied. Please enable notifications in your browser settings.');
        return;
      }
    }
    await updateSettings({ notificationsEnabled: enabled });
  }
  
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Settings</h1>
      
      <div className="space-y-6">
        {/* Appearance */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Appearance</h2>
          </div>
          <div className="p-5">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Theme</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'system', label: 'System', icon: Monitor },
              ] as const).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                    theme === value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon size={20} className={theme === value ? 'text-blue-500' : 'text-gray-400'} />
                  <span className={`text-xs font-medium ${theme === value ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
        
        {/* Preferences */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Preferences</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Week starts on</p>
              <div className="flex gap-2">
                {([
                  { value: 0, label: 'Sunday' },
                  { value: 1, label: 'Monday' },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => updateSettings({ weekStartsOn: value })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      settings?.weekStartsOn === value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Default view</p>
              <div className="flex gap-2">
                {([
                  { value: 'today', label: 'Today' },
                  { value: 'dashboard', label: 'Dashboard' },
                ] as const).map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => updateSettings({ defaultView: value })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      settings?.defaultView === value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* Notifications */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Notifications</h2>
          </div>
          <div className="p-5 space-y-3">
            <Toggle
              checked={settings?.notificationsEnabled ?? false}
              onChange={handleNotificationToggle}
              label="Enable notifications"
            />
            <p className="text-xs text-gray-400">
              Per-goal reminders are configured on each goal's edit form.
            </p>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                📱 SMS reminders — coming soon
              </p>
            </div>
          </div>
        </section>
        
        {/* Data */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Data</h2>
          </div>
          <div className="p-5 space-y-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
            >
              <Download size={16} className="text-blue-500" />
              Export all data as JSON
            </button>
            
            <div className="flex gap-2">
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                {(['merge', 'replace'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setImportMode(mode)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors capitalize ${
                      importMode === mode
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-500'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                className="flex items-center gap-2 flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                <Upload size={16} className="text-green-500" />
                {importing ? 'Importing...' : 'Import from JSON'}
              </button>
              <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            </div>
            
            <button
              onClick={() => setClearConfirmOpen(true)}
              className="flex items-center gap-2 w-full px-4 py-3 bg-red-50 dark:bg-red-900/10 rounded-xl text-sm text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-left"
            >
              <Trash2 size={16} />
              Clear all data
            </button>
          </div>
        </section>
        
        {/* About */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="p-5 text-center space-y-1">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Momentum</p>
            <p className="text-xs text-gray-400">Version 1.0.0</p>
            <p className="text-xs text-gray-400">Built with care · Local-first, no account required</p>
          </div>
        </section>
      </div>
      
      {/* Clear data confirmation */}
      {clearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setClearConfirmOpen(false); setClearStep2(false); setClearInput(''); }} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Clear all data?</h3>
            {!clearStep2 ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">This will permanently delete all your goals, entries, and history.</p>
                <div className="flex gap-3">
                  <button onClick={() => setClearConfirmOpen(false)} className="flex-1 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                  <button onClick={() => setClearStep2(true)} className="flex-1 px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">Continue</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">This cannot be undone. Type <strong>DELETE</strong> to confirm.</p>
                <input
                  value={clearInput}
                  onChange={e => setClearInput(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-3 py-2 rounded-lg border border-red-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <div className="flex gap-3">
                  <button onClick={() => { setClearConfirmOpen(false); setClearStep2(false); setClearInput(''); }} className="flex-1 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                  <button
                    onClick={handleClearAll}
                    disabled={clearInput !== 'DELETE'}
                    className="flex-1 px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
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
