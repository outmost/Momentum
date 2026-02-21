'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, BarChart3, Repeat, Layers, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

const navItems = [
  { href: '/', label: 'Today', icon: CheckSquare },
  { href: '/dashboard', label: 'Progress', icon: BarChart3 },
  { href: '/routine', label: 'Routine', icon: Repeat },
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
      <div className="px-5 pt-7 pb-6">
        <span
          className="text-sm font-bold tracking-tight"
          style={{ color: 'var(--text)' }}
        >
          Momentum
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="relative flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors duration-150"
              style={{ color: active ? 'var(--text)' : 'var(--text-3)' }}
            >
              {/* Active background pill — spring-animated between items */}
              {active && (
                <motion.div
                  layoutId="sidebar-active-bg"
                  className="absolute inset-0 rounded-lg"
                  style={{ backgroundColor: 'var(--border)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}

              <Icon
                size={16}
                strokeWidth={active ? 2.2 : 1.7}
                className="relative z-10 shrink-0 transition-all duration-150"
                style={{ color: active ? 'var(--accent)' : 'var(--text-3)' }}
              />
              <span
                className={cn(
                  'relative z-10 text-sm transition-all duration-150',
                  active ? 'font-semibold' : 'font-normal',
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Version footer */}
      <div className="px-5 pb-5">
        <span className="text-[10px] tabular" style={{ color: 'var(--text-3)' }}>v1.0</span>
      </div>
    </aside>
  );
}
