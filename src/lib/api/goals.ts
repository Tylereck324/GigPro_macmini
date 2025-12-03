// src/lib/api/goals.ts
import type { CreateGoal, UpdateGoal, Goal } from '@/types/goal';
import { apiRequest } from './apiClient';

const BASE_URL = '/api/goals';

export const goalsApi = {
  async createGoal(goal: CreateGoal): Promise<Goal> {
    return apiRequest<Goal>(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(goal),
    });
  },

  async getGoals(): Promise<Goal[]> {
    return apiRequest<Goal[]>(BASE_URL);
  },

  async getGoal(id: string): Promise<Goal> {
    return apiRequest<Goal>(`${BASE_URL}/${id}`);
  },

  async updateGoal(id: string, updates: UpdateGoal): Promise<Goal> {
    return apiRequest<Goal>(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteGoal(id: string): Promise<void> {
    return apiRequest<void>(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },
};
