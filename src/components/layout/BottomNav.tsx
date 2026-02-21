'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, Repeat, Layers, Settings, BarChart3 } from 'lucide-react';

const navItems = [
  { href: '/',          label: 'Today',    icon: CheckSquare },
  { href: '/dashboard', label: 'Progress', icon: BarChart3 },
  { href: '/routine',   label: 'Routine',  icon: Repeat },
  { href: '/goals',     label: 'Goals',    icon: Layers },
  { href: '/settings',  label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed inset-x-0 z-40 flex justify-center pointer-events-none"
      style={{ bottom: 'max(20px, env(safe-area-inset-bottom, 0px))' }}
      aria-label="Main navigation"
    >
      <div
        className="flex items-center gap-0.5 pointer-events-auto px-2 py-1.5 rounded-[20px]"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 6px rgba(0,0,0,0.06)',
        }}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="relative flex flex-col items-center justify-center w-14 h-[52px] rounded-2xl gap-[3px]"
              style={{
                backgroundColor: active ? 'var(--accent-2)' : 'transparent',
                transition: 'background-color 0.18s ease',
              }}
            >
              <Icon
                size={17}
                strokeWidth={active ? 2.2 : 1.6}
                style={{
                  color: active ? 'var(--accent)' : 'var(--text-3)',
                  transition: 'color 0.18s ease',
                }}
              />
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--accent)' : 'var(--text-3)',
                  transition: 'color 0.18s ease',
                  letterSpacing: '0.01em',
                  lineHeight: 1,
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
