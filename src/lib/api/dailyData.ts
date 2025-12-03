// src/lib/api/dailyData.ts
import type { CreateDailyData, UpdateDailyData, DailyData } from '@/types/dailyData';
import { apiRequest } from './apiClient';

const BASE_URL = '/api/dailyData';

export const dailyDataApi = {
  async createDailyData(data: CreateDailyData): Promise<DailyData> {
    return apiRequest<DailyData>(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAllDailyData(): Promise<DailyData[]> {
    return apiRequest<DailyData[]>(BASE_URL);
  },

  async getDailyDataByDate(date: string): Promise<DailyData | null> {
    try {
      return await apiRequest<DailyData>(`${BASE_URL}?date=${date}`);
    } catch (error: any) {
      if (error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  },

  async upsertDailyData(date: string, updates: UpdateDailyData): Promise<DailyData> {
    return apiRequest<DailyData>(`${BASE_URL}?date=${date}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};
