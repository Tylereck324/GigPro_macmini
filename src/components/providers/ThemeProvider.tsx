'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { loadTheme } = useThemeStore();

  useEffect(() => {
    // Load theme immediately on mount
    loadTheme();
  }, [loadTheme]);

  return <>{children}</>;
}
