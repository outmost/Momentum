'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckCircle, BarChart2, List, Settings, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUIStore } from '@/lib/store';

const navItems = [
  { href: '/', label: 'Today', icon: CheckCircle },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { href: '/goals', label: 'Goals', icon: List },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  
  return (
    <aside className={cn(
      'hidden md:flex flex-col h-full border-r border-gray-200 dark:border-gray-700',
      'bg-white dark:bg-gray-900 transition-all duration-200',
      sidebarCollapsed ? 'w-16' : 'w-56'
    )}>
      {/* Logo */}
      <div className={cn('flex items-center px-4 h-16 border-b border-gray-200 dark:border-gray-700', sidebarCollapsed ? 'justify-center' : 'gap-2')}>
        <Zap size={24} className="text-blue-500 shrink-0" />
        {!sidebarCollapsed && (
          <span className="font-bold text-gray-900 dark:text-white text-lg">Momentum</span>
        )}
      </div>
      
      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
                sidebarCollapsed && 'justify-center px-2'
              )}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon size={20} className="shrink-0" />
              {!sidebarCollapsed && label}
            </Link>
          );
        })}
      </nav>
      
      {/* Collapse button */}
      <button
        onClick={toggleSidebar}
        className="m-3 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
      >
        {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}
