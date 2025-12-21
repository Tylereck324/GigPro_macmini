/**
 * Income tracking types for gig work entries
 */

import type { GigPlatform } from './common';

// ============================================================================
// Database Models
// ============================================================================

/**
 * Income entry record for a gig work block
 * Tracks earnings, time worked, and platform information
 */
export interface IncomeEntry {
  /** Unique identifier */
  id: string;
  /** ISO date string (YYYY-MM-DD) when work was performed */
  date: string;
  /** Gig platform used for this work */
  platform: GigPlatform;
  /** Custom platform name when platform is 'Other' */
  customPlatformName?: string;
  /** ISO datetime string for block start time */
  blockStartTime: string | null;
  /** ISO datetime string for block end time */
  blockEndTime: string | null;
  /** Total minutes worked */
  blockLength: number | null;
  /** Amount earned in dollars */
  amount: number;
  /** Optional notes about the work block */
  notes: string;
  /** Timestamp when record was created */
  createdAt: number;
  /** Timestamp when record was last updated */
  updatedAt: number;
}

// ============================================================================
// Data Transfer Objects
// ============================================================================

/**
 * Data required to create a new income entry
 * Omits auto-generated fields (id, timestamps)
 */
export type CreateIncomeEntry = Omit<IncomeEntry, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Data for updating an existing income entry
 * All fields optional except id
 */
export type UpdateIncomeEntry = Partial<Omit<IncomeEntry, 'id' | 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Platform-Specific Types
// ============================================================================

/**
 * Amazon Flex hours tracking
 * Monitors daily and weekly hour limits
 */
export interface AmazonFlexHours {
  /** Hours worked today */
  dailyHoursUsed: number;
  /** Hours worked this week */
  weeklyHoursUsed: number;
  /** Remaining hours for today (8 hour limit) */
  dailyRemaining: number;
  /** Remaining hours for this week (40 hour limit) */
  weeklyRemaining: number;
}

// ============================================================================
// Summary Types
// ============================================================================

/**
 * Income summary aggregated by platform
 * Includes total income across all platforms
 */
export interface IncomeSummary {
  /** Platform name mapped to total amount earned */
  [key: string]: number;
  /** Total income across all platforms */
  total: number;
}
