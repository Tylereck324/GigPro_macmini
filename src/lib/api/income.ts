// src/lib/api/income.ts
import type { CreateIncomeEntry, IncomeEntry, UpdateIncomeEntry } from '@/types/income';
import { supabase } from '../supabase'; // Use global supabase client

// Helper function to map snake_case to camelCase
const normalizeDate = (dateStr: string | null): string | null => {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch (e) {
    console.warn('Failed to parse date, attempting string replacement:', dateStr);
  }

  // Safe string replacement with fallback
  try {
    return dateStr.replace(' ', 'T');
  } catch (e) {
    console.error('Failed to normalize date:', dateStr, e);
    return null;
  }
};

const mapIncomeEntry = (entry: any): IncomeEntry => {
  const createdAt = new Date(entry.created_at).getTime();
  const updatedAt = new Date(entry.updated_at).getTime();

  // Validate timestamps to prevent NaN propagation
  if (isNaN(createdAt)) {
    throw new Error(`Invalid created_at timestamp: ${entry.created_at}`);
  }
  if (isNaN(updatedAt)) {
    throw new Error(`Invalid updated_at timestamp: ${entry.updated_at}`);
  }

  return {
    id: entry.id,
    date: entry.date,
    platform: entry.platform,
    customPlatformName: entry.custom_platform_name,
    blockStartTime: normalizeDate(entry.block_start_time),
    blockEndTime: normalizeDate(entry.block_end_time),
    blockLength: entry.block_length,
    amount: entry.amount,
    notes: entry.notes,
    createdAt,
    updatedAt,
  };
};

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

  async getIncomeEntries(): Promise<IncomeEntry[]> {
    const { data, error } = await supabase
      .from('income_entries')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    return data.map(mapIncomeEntry);
  },

  async updateIncomeEntry(id: string, updates: UpdateIncomeEntry): Promise<IncomeEntry> {
    const dbUpdates: any = {};
    if (updates.date) dbUpdates.date = updates.date;
    if (updates.platform) dbUpdates.platform = updates.platform;
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
