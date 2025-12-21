/**
 * Time calculation utilities for work block tracking
 * Handles start time, end time, and duration calculations with support for overnight shifts
 */

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
 * Convert minutes to hours
 *
 * @param minutes - Number of minutes
 * @returns Hours as decimal (e.g., 90 minutes = 1.5 hours)
 */
export function minutesToHours(minutes: number): number {
  return minutes / 60;
}
