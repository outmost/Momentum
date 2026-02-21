'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, BarChart3, Repeat, Layers, Settings } from 'lucide-react';
import { cn } from '@/lib/cn';

const navItems = [
  { href: '/',          label: 'Today',    icon: CheckSquare },
  { href: '/dashboard', label: 'Progress', icon: BarChart3 },
  { href: '/routine',   label: 'Routine',  icon: Repeat },
  { href: '/goals',     label: 'Goals',    icon: Layers },
  { href: '/settings',  label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col h-full w-[200px] shrink-0"
      style={{
        borderRight: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
      }}
    >
      {/* Wordmark */}
      <div className="px-5 pt-7 pb-7">
        <div className="flex items-center gap-2.5">
          <div
            className="w-[26px] h-[26px] rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, #000) 100%)',
              boxShadow: '0 2px 8px var(--glow)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 10C2.5 10 4.5 6 7 6C9.5 6 11.5 10 11.5 10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="7" cy="3.5" r="1.75" fill="white"/>
            </svg>
          </div>
          <span
            className="text-[13px] font-bold tracking-tight"
            style={{ color: 'var(--text)' }}
          >
            Momentum
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="relative flex items-center gap-3 px-3 py-[9px] rounded-xl transition-colors duration-150"
              style={{
                backgroundColor: active ? 'var(--border)' : 'transparent',
                color: active ? 'var(--text)' : 'var(--text-3)',
              }}
            >
              <Icon
                size={16}
                strokeWidth={active ? 2.2 : 1.65}
                className="shrink-0 transition-all duration-150"
                style={{ color: active ? 'var(--accent)' : 'var(--text-3)' }}
              />
              <span
                className={cn(
                  'text-[13px] transition-all duration-150',
                  active ? 'font-semibold' : 'font-normal',
                )}
              >
                {label}
              </span>
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
