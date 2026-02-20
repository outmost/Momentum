'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, BarChart2, Layers, Settings } from 'lucide-react';
import { cn } from '@/lib/cn';

const navItems = [
  { href: '/', label: 'Today', icon: CheckSquare },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { href: '/goals', label: 'Goals', icon: Layers },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col h-full w-48 shrink-0"
      style={{ borderRight: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
    >
      {/* Wordmark */}
      <div className="px-6 h-14 flex items-center" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
          Momentum
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-3 px-6 py-2.5 text-sm transition-colors',
                active ? 'font-medium' : 'font-normal'
              )}
              style={{ color: active ? 'var(--text)' : 'var(--text-2)' }}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r"
                  style={{ backgroundColor: 'var(--accent)' }}
                />
              )}
              <Icon size={16} strokeWidth={active ? 2 : 1.5} className="shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
