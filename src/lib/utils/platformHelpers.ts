/**
 * Platform helper utilities for income tracking
 * Provides consistent platform naming and styling across the application
 */

import type { IncomeEntry } from '@/types/income';

/**
 * Get platform-specific color class for UI styling
 * @param platform - Platform identifier
 * @returns Tailwind color class name
 */
export function getPlatformColor(platform: string): string {
  switch (platform) {
    case 'AmazonFlex':
      return 'text-amazonFlex';
    case 'DoorDash':
      return 'text-doorDash';
    case 'WalmartSpark':
      return 'text-walmartSpark';
    default:
      return 'text-primary';
  }
}

/**
 * Get user-friendly display label for a platform
 * Handles custom platform names for "Other" category
 * @param entry - Income entry or platform string
 * @returns Human-readable platform name
 */
export function getPlatformLabel(entry: IncomeEntry | string): string {
  // Handle string input (for backwards compatibility)
  if (typeof entry === 'string') {
    switch (entry) {
      case 'AmazonFlex':
        return 'Amazon Flex';
      case 'DoorDash':
        return 'DoorDash';
      case 'WalmartSpark':
        return 'Walmart Spark';
      case 'Other':
        return 'Other';
      default:
        return entry;
    }
  }

  // Handle IncomeEntry input
  if (entry.platform === 'Other' && entry.customPlatformName) {
    return entry.customPlatformName;
  }

  switch (entry.platform) {
    case 'AmazonFlex':
      return 'Amazon Flex';
    case 'DoorDash':
      return 'DoorDash';
    case 'WalmartSpark':
      return 'Walmart Spark';
    case 'Other':
      return 'Other';
    default:
      return entry.platform;
  }
}
