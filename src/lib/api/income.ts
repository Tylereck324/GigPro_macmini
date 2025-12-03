// src/lib/api/income.ts
import type { CreateIncomeEntry, UpdateIncomeEntry, IncomeEntry } from '@/types/income';
import { apiRequest } from './apiClient';

const BASE_URL = '/api/income';

export const incomeApi = {
  async createIncomeEntry(entry: CreateIncomeEntry): Promise<IncomeEntry> {
    return apiRequest<IncomeEntry>(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },

  async getIncomeEntries(): Promise<IncomeEntry[]> {
    return apiRequest<IncomeEntry[]>(BASE_URL);
  },

  async updateIncomeEntry(id: string, updates: UpdateIncomeEntry): Promise<IncomeEntry> {
    return apiRequest<IncomeEntry>(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteIncomeEntry(id: string): Promise<void> {
    return apiRequest<void>(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },
};
