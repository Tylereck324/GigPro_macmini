import { nanoid } from 'nanoid';
import { db } from '../schema';
import type { DailyData, CreateDailyData, UpdateDailyData } from '@/types/dailyData';

export const dailyDataRepository = {
  // Create or update daily data for a specific date
  async upsert(date: string, data: Partial<UpdateDailyData>): Promise<DailyData> {
    const existing = await db.dailyData.where('date').equals(date).first();

    if (existing) {
      // Update existing record
      await db.dailyData.update(existing.id, {
        ...data,
        updatedAt: Date.now(),
      });
      return (await db.dailyData.get(existing.id))!;
    } else {
      // Create new record
      const now = Date.now();
      const newData: DailyData = {
        id: nanoid(),
        date,
        mileage: data.mileage ?? null,
        gasExpense: data.gasExpense ?? null,
        createdAt: now,
        updatedAt: now,
      };
      await db.dailyData.add(newData);
      return newData;
    }
  },

  // Get daily data by date
  async getByDate(date: string): Promise<DailyData | undefined> {
    return await db.dailyData.where('date').equals(date).first();
  },

  // Get daily data for multiple dates
  async getByDateRange(startDate: string, endDate: string): Promise<DailyData[]> {
    return await db.dailyData
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  },

  // Get all daily data
  async getAll(): Promise<DailyData[]> {
    return await db.dailyData.toArray();
  },

  // Delete daily data for a date
  async deleteByDate(date: string): Promise<void> {
    const data = await db.dailyData.where('date').equals(date).first();
    if (data) {
      await db.dailyData.delete(data.id);
    }
  },

  // Delete all daily data (for data reset)
  async deleteAll(): Promise<void> {
    await db.dailyData.clear();
  },
};
