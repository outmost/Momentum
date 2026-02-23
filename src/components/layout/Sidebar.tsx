'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, Repeat, Layers, Settings, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUIStore } from '@/lib/store';

const navItems = [
  { href: '/',         label: 'Today',    icon: CheckSquare },
  { href: '/goals',    label: 'Habits',   icon: Layers },
  { href: '/routine',  label: 'Routine',  icon: Repeat },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const setAddGoalOpen = useUIStore(s => s.setAddGoalOpen);

  return (
    <aside
      className="hidden md:flex flex-col h-full w-[220px] shrink-0"
      style={{
        borderRight: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
      }}
    >
      {/* Wordmark */}
      <div className="px-5 pt-8 pb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-[28px] h-[28px] rounded-[9px] flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 65%, #000) 100%)',
              boxShadow: '0 2px 8px var(--glow)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 10C2.5 10 4.5 6 7 6C9.5 6 11.5 10 11.5 10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="7" cy="3.5" r="1.75" fill="white"/>
            </svg>
          </div>
          <span
            className="text-[14px] font-bold"
            style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}
          >
            Momentum
          </span>
        </div>
      </div>

      {/* New key result button */}
      <div className="px-3 mb-4">
        <button
          onClick={() => setAddGoalOpen(true)}
          className="btn btn-primary w-full"
        >
          <Plus size={15} strokeWidth={2.5} />
          New Key Result
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="relative flex items-center gap-3 px-3 py-[10px] rounded-xl transition-all duration-200"
              style={{
                backgroundColor: active ? 'var(--accent-2)' : 'transparent',
                color: active ? 'var(--text)' : 'var(--text-3)',
              }}
            >
              <Icon
                size={16}
                strokeWidth={active ? 2.2 : 1.65}
                className="shrink-0 transition-all duration-200"
                style={{ color: active ? 'var(--accent)' : 'var(--text-3)' }}
              />
              <span
                className={cn(
                  'text-[13px] transition-all duration-200',
                  active ? 'font-semibold' : 'font-normal',
                )}
              >
                {label}
              </span>
              {active && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
                  style={{ backgroundColor: 'var(--accent)' }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 pb-5">
        <span className="text-[10px] tabular" style={{ color: 'var(--text-3)' }}>v1.0</span>
      </div>
    </aside>
  );
}
