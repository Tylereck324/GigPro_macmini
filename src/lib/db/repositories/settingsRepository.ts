import { db } from '../schema';
import type { AppSettings, UpdateAppSettings } from '@/types/settings';

const SETTINGS_ID = 'settings';

export const settingsRepository = {
  // Get app settings (creates default if doesn't exist)
  async get(): Promise<AppSettings> {
    let settings = await db.settings.get(SETTINGS_ID);

    if (!settings) {
      // Create default settings
      settings = {
        id: SETTINGS_ID,
        theme: 'light',
        lastExportDate: null,
        lastImportDate: null,
        updatedAt: Date.now(),
      };
      await db.settings.add(settings);
    }

    return settings;
  },

  // Update app settings
  async update(updates: UpdateAppSettings): Promise<void> {
    const settings = await this.get();
    await db.settings.update(SETTINGS_ID, {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  // Reset settings to default
  async reset(): Promise<void> {
    await db.settings.delete(SETTINGS_ID);
    await this.get(); // Creates default
  },
};
