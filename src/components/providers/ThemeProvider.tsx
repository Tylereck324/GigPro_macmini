'use client';

import { Profiler, useEffect } from 'react';
import { useThemeStore } from '@/store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { loadTheme } = useThemeStore();

  useEffect(() => {
    // Load theme immediately on mount
    void loadTheme().catch((error) => {
      // Log error but don't break app - use default theme
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load theme, using default:', error);
      }
    });
  }, [loadTheme]);

  const isProfilerEnabled = process.env.NEXT_PUBLIC_PROFILE_RENDERS === 'true';
  if (!isProfilerEnabled) return <>{children}</>;

  const onRender: React.ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration
  ) => {
    // Perf instrumentation (disabled by default):
    // export NEXT_PUBLIC_PROFILE_RENDERS=true to log render timings.
    // Keep logs minimal to avoid distorting results.
    // Only log in development to prevent console output in production
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[Profiler]', { id, phase, actualDuration, baseDuration });
    }
  };

  return (
    <Profiler id="GigPro" onRender={onRender}>
      {children}
    </Profiler>
  );
}
