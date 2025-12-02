/**
 * Common types used across the application
 * These types define shared enums and constants used by multiple modules
 */

// ============================================================================
// Gig Platform Types
// ============================================================================

/**
 * Supported gig platforms for income tracking
 */
export type GigPlatform = 'AmazonFlex' | 'DoorDash' | 'WalmartSpark' | 'Other';

// ============================================================================
// Theme Types
// ============================================================================

/**
 * Available theme modes for the application
 */
export type Theme = 'light' | 'dark';

// ============================================================================
// Expense Types
// ============================================================================

/**
 * Payment plan providers for installment purchases
 */
export type PaymentPlanProvider = 'Affirm' | 'Klarna' | 'PayPalPayIn4' | 'Other';

/**
 * Payment frequency options for recurring payments
 */
export type PaymentFrequency = 'weekly' | 'biweekly' | 'monthly';

/**
 * Categories for variable expenses
 */
export type ExpenseCategory = 'grocery' | 'utility' | 'other';
