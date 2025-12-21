/**
 * Zod validation schemas for common types
 */

import { z } from 'zod';

// ============================================================================
// Gig Platform Validation
// ============================================================================

export const gigPlatformSchema = z.enum(['AmazonFlex', 'DoorDash', 'WalmartSpark', 'Other']);

// ============================================================================
// Theme Validation
// ============================================================================

export const themeSchema = z.enum(['light', 'dark']);

// ============================================================================
// Expense Validation
// ============================================================================

export const paymentPlanProviderSchema = z.enum(['Affirm', 'Klarna', 'PayPalPayIn4', 'Other']);

export const paymentFrequencySchema = z.enum(['weekly', 'biweekly', 'monthly']);

export const expenseCategorySchema = z.enum(['grocery', 'utility', 'other']);
