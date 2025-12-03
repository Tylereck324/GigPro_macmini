// src/lib/api/settings.ts
import type { AppSettings, UpdateAppSettings } from '@/types/settings';
import { apiRequest } from './apiClient';

const BASE_URL = '/api/settings';

export const settingsApi = {
  async getSettings(): Promise<AppSettings> {
    return apiRequest<AppSettings>(BASE_URL);
  },

  async updateSettings(updates: UpdateAppSettings): Promise<AppSettings> {
    return apiRequest<AppSettings>(BASE_URL, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};
