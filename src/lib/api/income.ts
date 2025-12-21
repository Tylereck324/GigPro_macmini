// src/lib/api/income.ts
import type { CreateIncomeEntry, IncomeEntry, UpdateIncomeEntry } from '@/types/income';
import type { IncomeEntryRow, IncomeEntryUpdate } from '@/types/database';
import { supabase } from '../supabase'; // Use global supabase client
import { coerceNumber, coerceNullableInteger } from './dbCoercion';

/**
 * Options for fetching income entries with pagination and filtering
 */
export interface GetIncomeEntriesOptions {
  /** Maximum number of entries to return */
  limit?: number;
  /** Number of entries to skip (for offset-based pagination) */
  offset?: number;
  /** Date range filter */
  dateRange?: {
    /** Start date (inclusive) in YYYY-MM-DD format */
    start: string;
    /** End date (inclusive) in YYYY-MM-DD format */
    end: string;
  };
}

// Helper function to map snake_case to camelCase
const normalizeDate = (dateStr: string | null): string | null => {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch (e) {
    // Fall through to string replacement
  }
  return dateStr.replace(' ', 'T');
};

const mapIncomeEntry = (entry: IncomeEntryRow): IncomeEntry => ({
  id: entry.id,
  date: entry.date,
  platform: entry.platform as IncomeEntry['platform'], // Cast from string to GigPlatform
  customPlatformName: entry.custom_platform_name ?? undefined,
  blockStartTime: normalizeDate(entry.block_start_time),
  blockEndTime: normalizeDate(entry.block_end_time),
  blockLength: coerceNullableInteger(entry.block_length),
  amount: coerceNumber(entry.amount),
  notes: entry.notes,
  createdAt: new Date(entry.created_at).getTime(),
  updatedAt: new Date(entry.updated_at).getTime(),
});

export const incomeApi = {
  async createIncomeEntry(entry: CreateIncomeEntry): Promise<IncomeEntry> {
    const { data, error } = await supabase
      .from('income_entries')
      .insert({
        date: entry.date,
        platform: entry.platform,
        custom_platform_name: entry.customPlatformName,
        block_start_time: entry.blockStartTime,
        block_end_time: entry.blockEndTime,
        block_length: entry.blockLength,
        amount: entry.amount,
        notes: entry.notes,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return mapIncomeEntry(data);
  },

  async getIncomeEntries(options?: GetIncomeEntriesOptions): Promise<IncomeEntry[]> {
    let query = supabase
      .from('income_entries')
      .select('*')
      .order('date', { ascending: false });

    // Apply date range filter if provided
    if (options?.dateRange) {
      query = query
        .gte('date', options.dateRange.start)
        .lte('date', options.dateRange.end);
    }

    // Apply pagination if provided
    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }

    if (options?.offset !== undefined) {
      const limit = options.limit || 100; // Default limit for range
      query = query.range(options.offset, options.offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }
    return data.map(mapIncomeEntry);
  },

  async updateIncomeEntry(id: string, updates: UpdateIncomeEntry): Promise<IncomeEntry> {
    const dbUpdates: IncomeEntryUpdate = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.platform !== undefined) dbUpdates.platform = updates.platform;
    if (updates.customPlatformName !== undefined) dbUpdates.custom_platform_name = updates.customPlatformName;
    if (updates.blockStartTime !== undefined) dbUpdates.block_start_time = updates.blockStartTime;
    if (updates.blockEndTime !== undefined) dbUpdates.block_end_time = updates.blockEndTime;
    if (updates.blockLength !== undefined) dbUpdates.block_length = updates.blockLength;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

    const { data, error } = await supabase
      .from('income_entries')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return mapIncomeEntry(data);
  },

  async deleteIncomeEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from('income_entries')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },
};
