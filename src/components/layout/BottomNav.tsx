'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckCircle, BarChart2, List, Settings } from 'lucide-react';
import { cn } from '@/lib/cn';

const navItems = [
  { href: '/', label: 'Today', icon: CheckCircle },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { href: '/goals', label: 'Goals', icon: List },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-40">
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-1 text-xs font-medium transition-colors min-h-[56px]',
                active
                  ? 'text-blue-500'
                  : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
              )}
            >
              <Icon size={22} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
