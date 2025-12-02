import { StateCreator } from 'zustand';
import type { Theme } from '@/types/common';
import { settingsRepository } from '@/lib/db';

export interface ThemeSlice {
  theme: Theme;
  themeLoading: boolean;
  themeError: string | null;

  // Actions
  loadTheme: () => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  toggleTheme: () => Promise<void>;
  clearThemeError: () => void;
}

// Helper to apply theme to document
const applyTheme = (theme: Theme) => {
  if (typeof document !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Also save to localStorage for instant loading
    localStorage.setItem('gigpro-theme', theme);
  }
};

export const createThemeSlice: StateCreator<ThemeSlice> = (set, get) => ({
  theme: 'light',
  themeLoading: false,
  themeError: null,

  loadTheme: async () => {
    set({ themeLoading: true, themeError: null });
    try {
      // Try to load from localStorage first (faster)
      const cachedTheme = typeof window !== 'undefined'
        ? localStorage.getItem('gigpro-theme') as Theme | null
        : null;

      if (cachedTheme) {
        set({ theme: cachedTheme });
        applyTheme(cachedTheme);
      }

      // Then load from IndexedDB (source of truth)
      const settings = await settingsRepository.get();
      set({ theme: settings.theme, themeLoading: false });
      applyTheme(settings.theme);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load theme';
      console.error('Failed to load theme:', error);
      set({ themeLoading: false, themeError: errorMessage });
      throw error;
    }
  },

  setTheme: async (theme: Theme) => {
    set({ themeError: null });
    try {
      await settingsRepository.update({ theme });
      set({ theme });
      applyTheme(theme);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set theme';
      set({ themeError: errorMessage });
      throw error;
    }
  },

  toggleTheme: async () => {
    const currentTheme = get().theme;
    const newTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
    await get().setTheme(newTheme);
  },

  clearThemeError: () => {
    set({ themeError: null });
  },
});
