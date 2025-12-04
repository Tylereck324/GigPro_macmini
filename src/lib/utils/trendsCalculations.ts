import { parseISO, getDay, getHours } from 'date-fns';
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
  DAYS.forEach(day => {
    stats[day] = {};
    TIME_SLOTS.forEach(time => {
      stats[day][time] = { totalEarnings: 0, totalMinutes: 0, count: 0 };
    });
  });

  entries.forEach(entry => {
    // Filter by platform
    if (platformFilter !== 'all' && entry.platform !== platformFilter) return;
    
    // Skip if missing critical data
    if (!entry.blockStartTime || !entry.blockLength) return;

    const date = parseISO(entry.blockStartTime);
    const dayIndex = getDay(date); // 0 = Sunday
    const dayName = DAYS[dayIndex];
    const hour = getHours(date);
    const timeSlot = getTimeOfDay(hour);

    // Accumulate data
    const slot = stats[dayName][timeSlot];
    slot.totalEarnings += entry.amount;
    slot.totalMinutes += entry.blockLength;
    slot.count += 1;
  });

  // Transform into HeatmapData (Rate per Hour)
  const heatmap: HeatmapData = {};

  DAYS.forEach(day => {
    heatmap[day] = {};
    TIME_SLOTS.forEach(time => {
      const { totalEarnings, totalMinutes, count } = stats[day][time];
      // Avoid division by zero
      const hourlyRate = totalMinutes > 0 ? (totalEarnings / (totalMinutes / 60)) : 0;
      
      heatmap[day][time] = {
        hourlyRate,
        count
      };
    });
  });

  return heatmap;
}

export function getMaxHourlyRate(data: HeatmapData): number {
  let max = 0;
  Object.values(data).forEach(dayData => {
    Object.values(dayData).forEach(slot => {
      if (slot.hourlyRate > max) max = slot.hourlyRate;
    });
  });
  return max;
}
