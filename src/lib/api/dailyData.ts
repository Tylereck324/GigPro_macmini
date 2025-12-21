// src/lib/api/dailyData.ts
import type { DailyData, UpdateDailyData } from '@/types/dailyData';
import type { DailyDataRow, DailyDataUpdate } from '@/types/database';
import { supabase } from '../supabase'; // Use global supabase client
import { coerceNullableNumber } from './dbCoercion';

/**
 * Options for fetching daily data with filtering
 */
export interface GetDailyDataOptions {
  /** Date range filter */
  dateRange?: {
    /** Start date (inclusive) in YYYY-MM-DD format */
    start: string;
    /** End date (inclusive) in YYYY-MM-DD format */
    end: string;
  };
}

const DAILY_DATA_SELECT = 'id, date, mileage, gas_expense, created_at, updated_at';

// Helper function to map snake_case to camelCase
const mapDailyData = (entry: DailyDataRow): DailyData => ({
  id: entry.id,
  date: entry.date,
  mileage: coerceNullableNumber(entry.mileage),
  gasExpense: coerceNullableNumber(entry.gas_expense),
  createdAt: new Date(entry.created_at).getTime(),
  updatedAt: new Date(entry.updated_at).getTime(),
});

export const dailyDataApi = {
  async getAllDailyData(options?: GetDailyDataOptions): Promise<DailyData[]> {
    let query = supabase
      .from('daily_data')
      .select(DAILY_DATA_SELECT)
      .order('date', { ascending: false });

    if (options?.dateRange) {
      query = query
        .gte('date', options.dateRange.start)
        .lte('date', options.dateRange.end);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }
    return data.map(mapDailyData);
  },

  async upsertDailyData(date: string, data: Partial<UpdateDailyData>): Promise<DailyData> {
    // This function will attempt to update if the date exists, otherwise insert
    const dbUpdates: DailyDataUpdate = {
      date,
      mileage: data.mileage,
      gas_expense: data.gasExpense,
    };

    const { data: upsertedData, error } = await supabase
      .from('daily_data')
      .upsert(dbUpdates, { onConflict: 'date' })
      .select(DAILY_DATA_SELECT)
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return mapDailyData(upsertedData);
  },
};
