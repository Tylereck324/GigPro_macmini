import { nanoid } from 'nanoid';
import { db } from '../schema';
import type { Goal, CreateGoal, UpdateGoal, GoalPeriod } from '@/types/goal';

/**
 * Repository for managing goal records in IndexedDB
 * Provides CRUD operations and specialized queries for goals
 */
export const goalRepository = {
  /**
   * Create a new goal
   */
  async create(data: CreateGoal): Promise<Goal> {
    const now = Date.now();
    const goal: Goal = {
      id: nanoid(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.goals.add(goal);
    return goal;
  },

  /**
   * Get all goals
   */
  async getAll(): Promise<Goal[]> {
    return await db.goals.toArray();
  },

  /**
   * Get active goals only
   */
  async getActive(): Promise<Goal[]> {
    return await db.goals.where('isActive').equals(1).toArray();
  },

  /**
   * Get goals by period (weekly or monthly)
   */
  async getByPeriod(period: GoalPeriod): Promise<Goal[]> {
    return await db.goals.where('period').equals(period).toArray();
  },

  /**
   * Get current goal for a specific period and date
   * Returns the first active goal that contains the given date
   */
  async getCurrentGoal(period: GoalPeriod, date: string): Promise<Goal | undefined> {
    const goals = await db.goals
      .where('period')
      .equals(period)
      .and((g) => g.startDate <= date && g.endDate >= date && g.isActive)
      .toArray();
    return goals[0];
  },

  /**
   * Get a single goal by ID
   */
  async getById(id: string): Promise<Goal | undefined> {
    return await db.goals.get(id);
  },

  /**
   * Update a goal
   */
  async update(id: string, updates: UpdateGoal): Promise<void> {
    await db.goals.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  /**
   * Delete a goal
   */
  async delete(id: string): Promise<void> {
    await db.goals.delete(id);
  },

  /**
   * Delete all goals (use with caution)
   */
  async deleteAll(): Promise<void> {
    await db.goals.clear();
  },
};
