import { nanoid } from 'nanoid';
import { db } from '../schema';
import type { IncomeEntry, CreateIncomeEntry, UpdateIncomeEntry } from '@/types/income';

export const incomeRepository = {
  // Create a new income entry
  async create(data: CreateIncomeEntry): Promise<IncomeEntry> {
    const now = Date.now();
    const entry: IncomeEntry = {
      id: nanoid(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.incomeEntries.add(entry);
    return entry;
  },

  // Get all income entries
  async getAll(): Promise<IncomeEntry[]> {
    return await db.incomeEntries.toArray();
  },

  // Get income entries by date
  async getByDate(date: string): Promise<IncomeEntry[]> {
    return await db.incomeEntries.where('date').equals(date).toArray();
  },

  // Get income entries by platform
  async getByPlatform(platform: string): Promise<IncomeEntry[]> {
    return await db.incomeEntries.where('platform').equals(platform).toArray();
  },

  // Get income entries in date range
  async getByDateRange(startDate: string, endDate: string): Promise<IncomeEntry[]> {
    return await db.incomeEntries
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  },

  // Get a single income entry by ID
  async getById(id: string): Promise<IncomeEntry | undefined> {
    return await db.incomeEntries.get(id);
  },

  // Update an income entry
  async update(id: string, updates: UpdateIncomeEntry): Promise<void> {
    await db.incomeEntries.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  // Delete an income entry
  async delete(id: string): Promise<void> {
    await db.incomeEntries.delete(id);
  },

  // Delete all income entries (for data reset)
  async deleteAll(): Promise<void> {
    await db.incomeEntries.clear();
  },
};
