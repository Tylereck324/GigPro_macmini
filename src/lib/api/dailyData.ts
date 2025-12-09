// src/lib/api/dailyData.ts
import type { CreateDailyData, DailyData, UpdateDailyData } from '@/types/dailyData';
import { supabase } from '../supabase'; // Use global supabase client

// Helper function to map snake_case to camelCase
const mapDailyData = (entry: any): DailyData => ({
  id: entry.id,
  date: entry.date,
  mileage: entry.mileage,
  gasExpense: entry.gas_expense,
  createdAt: new Date(entry.created_at).getTime(),
  updatedAt: new Date(entry.updated_at).getTime(),
});

export const dailyDataApi = {
  async getAllDailyData(): Promise<DailyData[]> {
    const { data, error } = await supabase
      .from('daily_data')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    return data.map(mapDailyData);
  },

  async upsertDailyData(date: string, data: Partial<UpdateDailyData>): Promise<DailyData> {
    // This function will attempt to update if the date exists, otherwise insert
    const dbUpdates: any = {
      date,
      mileage: data.mileage,
      gas_expense: data.gasExpense,
    };

    const { data: upsertedData, error } = await supabase
      .from('daily_data')
      .upsert(dbUpdates, { onConflict: 'date' })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return mapDailyData(upsertedData);
  },
};
