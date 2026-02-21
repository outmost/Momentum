'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const navItems = [
  { href: '/', label: 'Today' },
  { href: '/dashboard', label: 'Progress' },
  { href: '/routine', label: 'Routine' },
  { href: '/goals', label: 'Goals' },
  { href: '/settings', label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col h-full w-44 shrink-0"
      style={{ borderRight: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
    >
      {/* Wordmark */}
      <div className="px-6 pt-8 pb-6">
        <span
          className="text-xs font-bold uppercase tracking-[0.15em] transition-colors"
          style={{ color: 'var(--text)' }}
        >
          Momentum
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4">
        {navItems.map(({ href, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center py-2 text-sm transition-all duration-200',
                active ? 'font-semibold' : 'font-normal',
              )}
              style={{
                color: active ? 'var(--text)' : 'var(--text-3)',
              }}
            >
              {/* Active indicator bar with animated width */}
              <span
                className="absolute -left-4 top-1/2 -translate-y-1/2 rounded-r transition-all duration-300"
                style={{
                  backgroundColor: 'var(--accent)',
                  width: active ? 2 : 0,
                  height: active ? 16 : 0,
                  opacity: active ? 1 : 0,
                }}
              />
              <span className="transition-all duration-200">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Version footer */}
      <div className="px-6 pb-4">
        <span className="text-[10px] tabular" style={{ color: 'var(--text-3)' }}>v1.0</span>
      </div>
    </aside>
  );
}
