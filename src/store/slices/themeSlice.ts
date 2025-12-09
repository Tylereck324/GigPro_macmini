import { StateCreator } from 'zustand';
import type { Theme } from '@/types/common';
import { settingsApi } from '@/lib/api/settings'; // Import the new API helper

export interface ThemeSlice {
  theme: Theme;
  themeLoading: boolean;
  themeError: string | null;
  amazonFlexDailyCapacity: number; // Add to slice
  amazonFlexWeeklyCapacity: number; // Add to slice

  // Actions
  loadTheme: () => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  toggleTheme: () => Promise<void>;
  clearThemeError: () => void;
  setAmazonFlexDailyCapacity: (capacity: number) => Promise<void>; // New action
  setAmazonFlexWeeklyCapacity: (capacity: number) => Promise<void>; // New action
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
  amazonFlexDailyCapacity: 8 * 60, // Default in minutes
  amazonFlexWeeklyCapacity: 40 * 60, // Default in minutes

  loadTheme: async () => {
    set({ themeLoading: true, themeError: null });
    try {
      // Try to load theme from localStorage first (faster)
      const cachedTheme = typeof window !== 'undefined'
        ? localStorage.getItem('gigpro-theme') as Theme | null
        : null;

      if (cachedTheme) {
        set({ theme: cachedTheme });
        applyTheme(cachedTheme);
      }

      // Load all settings from API (source of truth)
      const settings = await settingsApi.getSettings();
      set({
        theme: settings.theme,
        amazonFlexDailyCapacity: settings.amazonFlexDailyCapacity,
        amazonFlexWeeklyCapacity: settings.amazonFlexWeeklyCapacity,
        themeLoading: false,
      });
      applyTheme(settings.theme); // Apply theme from API as ultimate source
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load theme and settings';
      console.error('Failed to load theme and settings:', error);
      set({ themeLoading: false, themeError: errorMessage });
      throw error;
    }
  },

  setTheme: async (theme: Theme) => {
    set({ themeError: null });
    try {
      // Update theme via API
      const updatedSettings = await settingsApi.updateSettings({ theme });
      set({ theme: updatedSettings.theme });
      applyTheme(updatedSettings.theme);
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

  setAmazonFlexDailyCapacity: async (capacity: number) => {
    set({ themeError: null });
    try {
      const updatedSettings = await settingsApi.updateSettings({ amazonFlexDailyCapacity: capacity });
      set({ amazonFlexDailyCapacity: updatedSettings.amazonFlexDailyCapacity });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set Amazon Flex daily capacity';
      set({ themeError: errorMessage });
      throw error;
    }
  },

  setAmazonFlexWeeklyCapacity: async (capacity: number) => {
    set({ themeError: null });
    try {
      const updatedSettings = await settingsApi.updateSettings({ amazonFlexWeeklyCapacity: capacity });
      set({ amazonFlexWeeklyCapacity: updatedSettings.amazonFlexWeeklyCapacity });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set Amazon Flex weekly capacity';
      set({ themeError: errorMessage });
      throw error;
    }
  },

  clearThemeError: () => {
    set({ themeError: null });
  },
});
