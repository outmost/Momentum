'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const navItems = [
  { href: '/', label: 'Today' },
  { href: '/dashboard', label: 'Dashboard' },
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
        <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text)' }}>
          Momentum
        </span>
      </div>

      {/* Nav — text only, no icons */}
      <nav className="flex-1 px-4">
        {navItems.map(({ href, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn('relative flex items-center py-2 text-sm transition-colors')}
              style={{ color: active ? 'var(--text)' : 'var(--text-3)' }}
            >
              {active && (
                <span
                  className="absolute -left-4 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r"
                  style={{ backgroundColor: 'var(--accent)' }}
                />
              )}
              <span style={{ fontWeight: active ? 600 : 400 }}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
