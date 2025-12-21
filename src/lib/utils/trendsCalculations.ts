import { format } from 'date-fns';
import type { IncomeEntry } from '@/types/income';

export type TimeOfDay = 'Early Morning' | 'Morning' | 'Afternoon' | 'Evening' | 'Night';
export type DayOfWeek = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export const TIME_SLOTS: TimeOfDay[] = ['Early Morning', 'Morning', 'Afternoon', 'Evening', 'Night'];
export const DAYS: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface SlotStats {
  totalEarnings: number;
  totalMinutes: number;
  count: number;
}

export interface HeatmapData {
  [day: string]: {
    [time: string]: {
      hourlyRate: number;
      count: number;
    };
  };
}

// Helper to categorize hour into TimeOfDay
const getTimeOfDay = (hour: number): TimeOfDay => {
  if (hour >= 4 && hour < 8) return 'Early Morning'; // 4am - 8am
  if (hour >= 8 && hour < 12) return 'Morning';      // 8am - 12pm
  if (hour >= 12 && hour < 16) return 'Afternoon';   // 12pm - 4pm
  if (hour >= 16 && hour < 20) return 'Evening';     // 4pm - 8pm
  return 'Night';                                    // 8pm - 4am
};

export function calculateTrends(entries: IncomeEntry[], platformFilter: string | 'all'): HeatmapData {
  const stats: Record<string, Record<string, SlotStats>> = {};

  // Initialize structure
  for (const day of DAYS) {
    stats[day] = {};
    for (const time of TIME_SLOTS) {
      stats[day][time] = { totalEarnings: 0, totalMinutes: 0, count: 0 };
    }
  }

  // Process entries - filter by platform and accumulate stats
  for (const entry of entries) {
    // Filter by platform - early exit for better performance
    if (platformFilter !== 'all' && entry.platform !== platformFilter) continue;

    // Skip if missing critical data
    if (!entry.blockStartTime || !entry.blockLength) continue;

    const date = new Date(entry.blockStartTime);
    // Use date-fns for consistent date handling
    const dayName = format(date, 'EEE') as DayOfWeek; // Returns 'Sun', 'Mon', etc.
    const hour = date.getHours();
    const timeSlot = getTimeOfDay(hour);

    // Accumulate data
    const slot = stats[dayName][timeSlot];
    slot.totalEarnings += entry.amount;
    slot.totalMinutes += entry.blockLength;
    slot.count += 1;
  }

  // Transform into HeatmapData (Rate per Hour)
  const heatmap: HeatmapData = {};

  for (const day of DAYS) {
    heatmap[day] = {};
    for (const time of TIME_SLOTS) {
      const { totalEarnings, totalMinutes, count } = stats[day][time];
      // Avoid division by zero
      const hourlyRate = totalMinutes > 0 ? (totalEarnings / (totalMinutes / 60)) : 0;

      heatmap[day][time] = {
        hourlyRate,
        count
      };
    }
  }

  return heatmap;
}

export function getMaxHourlyRate(data: HeatmapData): number {
  let max = 0;
  // Optimized: use for-of instead of nested forEach for better performance
  for (const day of DAYS) {
    if (!data[day]) continue;
    for (const time of TIME_SLOTS) {
      const slot = data[day][time];
      if (slot && slot.hourlyRate > max) {
        max = slot.hourlyRate;
      }
    }
  }
  return max;
}
