'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { CheckSquare, Repeat, Layers, Settings, Plus } from 'lucide-react';
import { useUIStore } from '@/lib/store';

const navItems = [
  { href: '/',         label: 'Today',    icon: CheckSquare },
  { href: '/goals',    label: 'Goals',    icon: Layers },
  // center (+) button occupies slot 2
  { href: '/routine',  label: 'Routine',  icon: Repeat },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const ITEM_W = 56;  // w-14
const GAP    = 2;   // gap-0.5
const PAD    = 8;   // px-2
const STEP   = ITEM_W + GAP; // 58px per slot

function getPillLeft(index: number) {
  // Items 0,1 are before the center button; items 2,3 are after
  // Center button occupies one visual slot (same width as a nav item)
  if (index < 2) return PAD + index * STEP;
  return PAD + (index + 1) * STEP; // +1 to skip center slot
}

export function BottomNav() {
  const pathname = usePathname();
  const setAddGoalOpen = useUIStore(s => s.setAddGoalOpen);

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
              width: ITEM_W,
              height: 52,
              top: 6,
              zIndex: 0,
            }}
            animate={{
              left: getPillLeft(activeIndex),
            }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 35,
            }}
          />
        )}

        {/* Left nav items (Today, Goals) */}
        {navItems.slice(0, 2).map(({ href, label, icon: Icon }) => {
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

        {/* Center (+) add button */}
        <div className="relative z-10 flex items-center justify-center w-14 h-[52px]">
          <motion.button
            onClick={() => setAddGoalOpen(true)}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white"
            style={{
              backgroundColor: 'var(--accent)',
              boxShadow: '0 2px 12px var(--glow), 0 1px 3px rgba(0,0,0,0.12)',
              marginTop: '-6px',
            }}
            whileTap={{ scale: 0.9 }}
            aria-label="Add goal"
          >
            <Plus size={20} strokeWidth={2.5} />
          </motion.button>
        </div>

        {/* Right nav items (Routine, Settings) */}
        {navItems.slice(2).map(({ href, label, icon: Icon }) => {
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
