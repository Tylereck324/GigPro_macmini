/**
 * Daily data types for tracking mileage and gas expenses
 */

// ============================================================================
// Database Models
// ============================================================================

/**
 * Daily tracking data stored in the database
 * Tracks mileage and gas expenses for a specific date
 */
export interface DailyData {
  /** Unique identifier */
  id: string;
  /** ISO date string (YYYY-MM-DD) - unique per day */
  date: string;
  /** Miles driven for the day */
  mileage: number | null;
  /** Gas expenses for the day in dollars */
  gasExpense: number | null;
  /** Timestamp when record was created */
  createdAt: number;
  /** Timestamp when record was last updated */
  updatedAt: number;
}

// ============================================================================
// Data Transfer Objects
// ============================================================================

/**
 * Data required to create a new daily data entry
 * Omits auto-generated fields (id, timestamps)
 */
export type CreateDailyData = Omit<DailyData, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Data for updating an existing daily data entry
 * All fields optional except id and date
 */
export type UpdateDailyData = Partial<Omit<DailyData, 'id' | 'date' | 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Computed Data
// ============================================================================

/**
 * Computed profit data for a single day
 * Combines income entries with daily expenses
 */
export interface DailyProfit {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Total income earned for the day */
  totalIncome: number;
  /** Gas expenses for the day */
  gasExpense: number;
  /** Net profit (income - gas expense) */
  profit: number;
  /** Income per mile driven, null if no mileage tracked */
  earningsPerMile: number | null;
}
