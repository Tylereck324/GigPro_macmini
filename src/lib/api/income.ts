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
    // Fall through to string replacement
  }
  return dateStr.replace(' ', 'T');
};

const mapIncomeEntry = (entry: any): IncomeEntry => ({
  id: entry.id,
  date: entry.date,
  platform: entry.platform,
  customPlatformName: entry.custom_platform_name,
  blockStartTime: normalizeDate(entry.block_start_time),
  blockEndTime: normalizeDate(entry.block_end_time),
  blockLength: entry.block_length,
  amount: entry.amount,
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
