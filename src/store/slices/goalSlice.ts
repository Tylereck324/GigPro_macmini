import { StateCreator } from 'zustand';
import type { Goal, CreateGoal, UpdateGoal } from '@/types/goal';
import { goalsApi } from '@/lib/api/goals';
import { createGoalSchema, updateGoalSchema } from '@/types/validation';

export interface GoalSlice {
  goals: Goal[];
  goalsLoading: boolean;
  goalsError: string | null;

  // Actions
  loadGoals: () => Promise<void>;
  addGoal: (goal: CreateGoal) => Promise<Goal>;
  updateGoal: (id: string, updates: UpdateGoal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Selectors
  getActiveGoals: () => Goal[];
  getCurrentWeeklyGoal: (date: string) => Goal | undefined;
  getCurrentMonthlyGoal: (date: string) => Goal | undefined;
  clearGoalsError: () => void;
}

export const createGoalSlice: StateCreator<GoalSlice> = (set, get) => ({
  goals: [],
  goalsLoading: false,
  goalsError: null,

  loadGoals: async () => {
    set({ goalsLoading: true, goalsError: null });
    try {
      const goals = await goalsApi.getGoals();
      set({ goals, goalsLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load goals';
      console.error('Failed to load goals:', error);
      set({ goalsLoading: false, goalsError: errorMessage });
      throw error;
    }
  },

  addGoal: async (goal: CreateGoal) => {
    set({ goalsError: null });
    try {
      // Validate input
      const validatedGoal = createGoalSchema.parse(goal);

      // Perform actual creation
      const newGoal = await goalsApi.createGoal(validatedGoal);

      // Update state with new goal
      set((state) => ({
        goals: [...state.goals, newGoal],
      }));

      return newGoal;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add goal';
      set({ goalsError: errorMessage });
      throw error;
    }
  },

  updateGoal: async (id: string, updates: UpdateGoal) => {
    set({ goalsError: null });
    try {
      // Validate input
      const validatedUpdates = updateGoalSchema.parse(updates);

      // Store original for rollback
      const original = get().goals.find((g) => g.id === id);

      // Optimistic update
      set((state) => ({
        goals: state.goals.map((goal) =>
          goal.id === id ? { ...goal, ...validatedUpdates, updatedAt: Date.now() } : goal
        ),
      }));

      // Perform actual update
      await goalsApi.updateGoal(id, validatedUpdates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update goal';
      set({ goalsError: errorMessage });
      // Rollback on error
      if (original) {
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? original : g)),
        }));
      }
      throw error;
    }
  },

  deleteGoal: async (id: string) => {
    set({ goalsError: null });
    try {
      // Store original for rollback
      const original = get().goals.find((g) => g.id === id);

      // Optimistic delete
      set((state) => ({
        goals: state.goals.filter((goal) => goal.id !== id),
      }));

      // Perform actual delete
      await goalsApi.deleteGoal(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete goal';
      set({ goalsError: errorMessage });
      // Rollback on error
      if (original) {
        set((state) => ({
          goals: [...state.goals, original],
        }));
      }
      throw error;
    }
  },

  getActiveGoals: () => {
    return get().goals.filter((goal) => goal.isActive);
  },

  getCurrentWeeklyGoal: (date: string) => {
    return get().goals.find(
      (goal) =>
        goal.period === 'weekly' &&
        goal.isActive &&
        goal.startDate <= date &&
        goal.endDate >= date
    );
  },

  getCurrentMonthlyGoal: (date: string) => {
    return get().goals.find(
      (goal) =>
        goal.period === 'monthly' &&
        goal.isActive &&
        goal.startDate <= date &&
        goal.endDate >= date
    );
  },

  clearGoalsError: () => {
    set({ goalsError: null });
  },
});
