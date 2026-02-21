'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, Repeat, Layers, Settings, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/cn';

const navItems = [
  { href: '/', label: 'Today', icon: CheckSquare },
  { href: '/dashboard', label: 'Progress', icon: BarChart3 },
  { href: '/routine', label: 'Routine', icon: Repeat },
  { href: '/goals', label: 'Goals', icon: Layers },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40"
      style={{
        backgroundColor: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[52px]',
                'text-[10px] font-medium transition-all duration-200',
                active && 'relative',
              )}
              style={{ color: active ? 'var(--accent)' : 'var(--text-3)' }}
            >
              {/* Active dot indicator */}
              {active && (
                <span
                  className="absolute top-0 w-4 h-[2px] rounded-full animate-in"
                  style={{ backgroundColor: 'var(--accent)' }}
                />
              )}
              <Icon
                size={19}
                strokeWidth={active ? 2.2 : 1.5}
                className={cn(
                  'transition-all duration-200',
                  active && 'animate-bounce-subtle',
                )}
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
