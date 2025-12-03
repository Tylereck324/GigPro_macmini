import { StateCreator } from 'zustand';
import type { DailyData, UpdateDailyData } from '@/types/dailyData';
import { dailyDataApi } from '@/lib/api/dailyData';
import { updateDailyDataSchema } from '@/types/validation';

export interface DailyDataSlice {
  dailyData: Record<string, DailyData>; // Keyed by date
  dailyDataLoading: boolean;
  dailyDataError: string | null;

  // Actions
  loadDailyData: () => Promise<void>;
  updateDailyData: (date: string, data: Partial<UpdateDailyData>) => Promise<void>;
  getDailyData: (date: string) => DailyData | undefined;
  clearDailyDataError: () => void;
}

export const createDailyDataSlice: StateCreator<DailyDataSlice> = (set, get) => ({
  dailyData: {},
  dailyDataLoading: false,
  dailyDataError: null,

  loadDailyData: async () => {
    set({ dailyDataLoading: true, dailyDataError: null });
    try {
      const dataArray = await dailyDataApi.getAllDailyData();
      const dataMap = dataArray.reduce((acc, item) => {
        acc[item.date] = item;
        return acc;
      }, {} as Record<string, DailyData>);
      set({ dailyData: dataMap, dailyDataLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load daily data';
      console.error('Failed to load daily data:', error);
      set({ dailyDataLoading: false, dailyDataError: errorMessage });
      throw error;
    }
  },

  updateDailyData: async (date: string, data: Partial<UpdateDailyData>) => {
    set({ dailyDataError: null });
    try {
      // Validate input
      const validatedData = updateDailyDataSchema.parse(data);

      // Store original for rollback
      const original = get().dailyData[date];

      // Optimistic update
      set((state) => ({
        dailyData: {
          ...state.dailyData,
          [date]: original
            ? { ...original, ...validatedData, updatedAt: Date.now() }
            : {
                id: `temp-${date}`,
                date,
                ...validatedData,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              } as DailyData,
        },
      }));

      // Perform actual update (upsert)
      const updated = await dailyDataApi.upsertDailyData(date, validatedData);

      // Replace with real data
      set((state) => ({
        dailyData: {
          ...state.dailyData,
          [date]: updated,
        },
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update daily data';
      set({ dailyDataError: errorMessage });
      // Rollback on error
      if (original && !original.id.startsWith('temp-')) {
        set((state) => ({
          dailyData: {
            ...state.dailyData,
            [date]: original,
          },
        }));
      } else {
        // Remove if it was a new entry
        set((state) => {
          const { [date]: removed, ...rest } = state.dailyData;
          return { dailyData: rest };
        });
      }
      throw error;
    }
  },

  getDailyData: (date: string) => {
    return get().dailyData[date];
  },

  clearDailyDataError: () => {
    set({ dailyDataError: null });
  },
});
