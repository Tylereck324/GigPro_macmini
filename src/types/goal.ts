/**
 * Goal tracking types for income goals
 */

// ============================================================================
// Database Models
// ============================================================================

/**
 * Goal period types - weekly or monthly income goals
 */
export type GoalPeriod = 'weekly' | 'monthly';

/**
 * Goal record for tracking income targets
 * Tracks target amounts and time periods for income goals
 */
export interface Goal {
  /** Unique identifier */
  id: string;
  /** Goal name for identification */
  name: string;
  /** Goal period - weekly or monthly */
  period: GoalPeriod;
  /** Target amount to achieve in dollars */
  targetAmount: number;
  /** ISO date string (YYYY-MM-DD) - start of period */
  startDate: string;
  /** ISO date string (YYYY-MM-DD) - end of period */
  endDate: string;
  /** Whether this goal is currently active */
  isActive: boolean;
  /** Priority for income allocation (1 = highest priority, monthly goals only) */
  priority: number;
  /** Timestamp when record was created */
  createdAt: number;
  /** Timestamp when record was last updated */
  updatedAt: number;
}

// ============================================================================
// Data Transfer Objects
// ============================================================================

/**
 * Data required to create a new goal
 * Omits auto-generated fields (id, timestamps)
 */
export type CreateGoal = Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Data for updating an existing goal
 * All fields optional except id
 */
export type UpdateGoal = Partial<Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Progress Tracking Types
// ============================================================================

/**
 * Goal progress tracking with computed values
 * Combines goal data with current income progress
 */
export interface GoalProgress {
  /** The goal being tracked */
  goal: Goal;
  /** Current income amount achieved */
  currentAmount: number;
  /** Progress percentage (0-100) */
  percentComplete: number;
  /** Remaining amount to reach goal */
  remainingAmount: number;
  /** Whether goal target has been reached */
  isComplete: boolean;
}
