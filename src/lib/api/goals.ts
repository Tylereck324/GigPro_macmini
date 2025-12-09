// src/lib/api/goals.ts
import type { CreateGoal, Goal, UpdateGoal } from '@/types/goal';
import { supabase } from '../supabase'; // Use global supabase client

// Helper function to map snake_case to camelCase
const mapGoal = (entry: any): Goal => ({
  id: entry.id,
  name: entry.name,
  period: entry.period,
  targetAmount: entry.target_amount,
  startDate: entry.start_date,
  endDate: entry.end_date,
  isActive: entry.is_active,
  priority: entry.priority,
  createdAt: new Date(entry.created_at).getTime(),
  updatedAt: new Date(entry.updated_at).getTime(),
});

export const goalsApi = {
  async createGoal(entry: CreateGoal): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .insert({
        name: entry.name,
        period: entry.period,
        target_amount: entry.targetAmount,
        start_date: entry.startDate,
        end_date: entry.endDate,
        is_active: entry.isActive,
        priority: entry.priority,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return mapGoal(data);
  },

  async getGoals(): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('priority', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }
    return data.map(mapGoal);
  },

  async updateGoal(id: string, updates: UpdateGoal): Promise<Goal> {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.period) dbUpdates.period = updates.period;
    if (updates.targetAmount !== undefined) dbUpdates.target_amount = updates.targetAmount;
    if (updates.startDate) dbUpdates.start_date = updates.startDate;
    if (updates.endDate) dbUpdates.end_date = updates.endDate;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;

    const { data, error } = await supabase
      .from('goals')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return mapGoal(data);
  },

  async deleteGoal(id: string): Promise<void> {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },
};
