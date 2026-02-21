'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, Repeat, Layers, Settings, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

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
      className="md:hidden fixed bottom-5 inset-x-0 z-40 flex justify-center pointer-events-none"
      aria-label="Main navigation"
    >
      <div
        className="flex items-center gap-0.5 pointer-events-auto px-2 py-2 rounded-full"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--surface) 95%, transparent)',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="relative flex items-center justify-center w-11 h-10 rounded-full transition-colors duration-200"
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: 'var(--accent-2)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <motion.div
                animate={active ? { scale: 1.08 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="relative z-10"
              >
                <Icon
                  size={19}
                  strokeWidth={active ? 2.25 : 1.6}
                  style={{ color: active ? 'var(--accent)' : 'var(--text-3)' }}
                />
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
