'use client';
import { useEffect } from 'react';
import { useSettings, updateSettings } from './useSettings';

export function useTheme() {
  const settings = useSettings();
  const theme = settings?.theme ?? 'system';
  
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (mediaQuery.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      const handler = (e: MediaQueryListEvent) => {
        if (e.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };
      
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);
  
  return {
    theme,
    setTheme: (t: 'light' | 'dark' | 'system') => updateSettings({ theme: t }),
  };
}
