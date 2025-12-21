import type { GigPlatform } from '@/types/common';

export const GIG_PLATFORMS: Array<{ value: GigPlatform; label: string }> = [
  { value: 'AmazonFlex', label: 'Amazon Flex' },
  { value: 'DoorDash', label: 'DoorDash' },
  { value: 'WalmartSpark', label: 'Walmart Spark' },
  { value: 'Other', label: 'Other' },
];
