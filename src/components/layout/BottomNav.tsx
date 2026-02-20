'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, BarChart2, Layers, Settings } from 'lucide-react';
import { cn } from '@/lib/cn';

const navItems = [
  { href: '/', label: 'Today', icon: CheckSquare },
  { href: '/dashboard', label: 'Stats', icon: BarChart2 },
  { href: '/goals', label: 'Goals', icon: Layers },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40"
      style={{ backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)' }}
    >
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 min-h-[52px]',
                'text-[11px] font-medium transition-colors'
              )}
              style={{ color: active ? 'var(--accent)' : 'var(--text-3)' }}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
