/**
 * Time calculation utilities for work block tracking
 * Handles start time, end time, and duration calculations with support for overnight shifts
 */

import { parseISO, differenceInMinutes, addMinutes, subMinutes } from 'date-fns';

// ============================================================================
// Types
// ============================================================================

/**
 * Time data for a work block
 */
export interface TimeData {
  /** ISO datetime string for block start */
  blockStartTime: string | null;
  /** ISO datetime string for block end */
  blockEndTime: string | null;
  /** Total duration in minutes */
  blockLength: number | null;
}

/**
 * Which time field was changed by the user
 */
export type TimeField = 'start' | 'end' | 'length';

// ============================================================================
// Time Calculations
// ============================================================================

/**
 * Calculate the missing time field based on the other two
 * Uses the changed field to determine calculation priority
 *
 * @param data - Current time data
 * @param changedField - Which field was last changed by the user
 * @returns Updated time data with calculated field
 *
 * @example
 * // User enters start and end times, calculate length
 * calculateMissingTime({
 *   blockStartTime: '2024-01-01T10:00:00',
 *   blockEndTime: '2024-01-01T14:00:00'
 * }, 'end');
 * // Returns: { blockStartTime, blockEndTime, blockLength: 240 }
 */
export function calculateMissingTime(
  data: Partial<TimeData>,
  changedField: TimeField
): TimeData {
  const { blockStartTime, blockEndTime, blockLength } = data;

  try {
    // User changed start time - preserve end and length if available
    if (changedField === 'start') {
      if (blockLength !== null && blockLength !== undefined && blockStartTime) {
        // Calculate end from start + length
        const start = parseISO(blockStartTime);
        const end = addMinutes(start, blockLength);
        return { blockStartTime, blockEndTime: end.toISOString(), blockLength };
      } else if (blockEndTime && blockStartTime) {
        // Calculate length from start to end
        const start = parseISO(blockStartTime);
        const end = parseISO(blockEndTime);
        let lengthMinutes = differenceInMinutes(end, start);

        // Handle overnight shifts
        if (lengthMinutes < 0) {
          lengthMinutes += 24 * 60;
        }

        return { blockStartTime, blockEndTime, blockLength: lengthMinutes };
      }
    }

    // User changed end time - preserve start and length if available
    if (changedField === 'end') {
      if (blockLength !== null && blockLength !== undefined && blockEndTime) {
        // Calculate start from end - length
        const end = parseISO(blockEndTime);
        const start = subMinutes(end, blockLength);
        return { blockStartTime: start.toISOString(), blockEndTime, blockLength };
      } else if (blockStartTime && blockEndTime) {
        // Calculate length from start to end
        const start = parseISO(blockStartTime);
        const end = parseISO(blockEndTime);
        let lengthMinutes = differenceInMinutes(end, start);

        // Handle overnight shifts
        if (lengthMinutes < 0) {
          lengthMinutes += 24 * 60;
        }

        return { blockStartTime, blockEndTime, blockLength: lengthMinutes };
      }
    }

    // User changed length - preserve start or end
    if (changedField === 'length' && blockLength !== null && blockLength !== undefined) {
      if (blockStartTime) {
        // Calculate end from start + length
        const start = parseISO(blockStartTime);
        const end = addMinutes(start, blockLength);
        return { blockStartTime, blockEndTime: end.toISOString(), blockLength };
      } else if (blockEndTime) {
        // Calculate start from end - length
        const end = parseISO(blockEndTime);
        const start = subMinutes(end, blockLength);
        return { blockStartTime: start.toISOString(), blockEndTime, blockLength };
      }
    }
  } catch (error) {
    console.error('Error calculating time:', error);
  }

  // Return as-is if insufficient data
  return {
    blockStartTime: blockStartTime ?? null,
    blockEndTime: blockEndTime ?? null,
    blockLength: blockLength ?? null,
  };
}

// ============================================================================
// Conversion & Formatting
// ============================================================================

/**
 * Format minutes to a human-readable duration string
 *
 * @param minutes - Total minutes to format
 * @returns Formatted duration (e.g., "4h 30m", "2h", "45m")
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
}

/**
 * Convert hours to minutes
 *
 * @param hours - Number of hours
 * @returns Total minutes (rounded)
 */
export function hoursToMinutes(hours: number): number {
  return Math.round(hours * 60);
}

/**
 * Convert minutes to hours
 *
 * @param minutes - Number of minutes
 * @returns Hours as decimal (e.g., 90 minutes = 1.5 hours)
 */
export function minutesToHours(minutes: number): number {
  return minutes / 60;
}
