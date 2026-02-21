'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
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

  const activeIndex = navItems.findIndex(({ href }) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)
  );

  return (
    <nav
      className="md:hidden fixed inset-x-0 z-40 flex justify-center pointer-events-none"
      style={{ bottom: 'max(16px, env(safe-area-inset-bottom, 0px))' }}
      aria-label="Main navigation"
    >
      <div
        className="relative flex items-center gap-0.5 pointer-events-auto px-2 py-1.5 rounded-[22px]"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)',
        }}
      >
        {/* Animated pill indicator */}
        {activeIndex >= 0 && (
          <motion.div
            className="absolute rounded-2xl"
            style={{
              backgroundColor: 'var(--accent-2)',
              width: 56,
              height: 52,
              top: 6,
              zIndex: 0,
            }}
            animate={{
              left: 8 + activeIndex * 58,
            }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 35,
            }}
          />
        )}

        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="relative z-10 flex flex-col items-center justify-center w-14 h-[52px] rounded-2xl gap-[3px]"
            >
              <Icon
                size={17}
                strokeWidth={active ? 2.2 : 1.6}
                style={{
                  color: active ? 'var(--accent)' : 'var(--text-3)',
                  transition: 'color 0.2s ease',
                }}
              />
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--accent)' : 'var(--text-3)',
                  transition: 'color 0.2s ease',
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
