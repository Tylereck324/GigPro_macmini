/**
 * Expense Calculation Utilities
 * Canonical implementations for payment plan calculations
 * 
 * ALL payment plan calculations should use these functions to ensure consistency.
 */

import type { PaymentPlan } from '@/types/expense';

/**
 * Get the effective payment amount for a plan
 * Uses minimumMonthlyPayment if set, otherwise falls back to paymentAmount
 * 
 * @param plan - The payment plan
 * @returns The effective payment amount per period
 */
export function getPaymentAmount(plan: PaymentPlan): number {
    return plan.minimumMonthlyPayment ?? plan.paymentAmount;
}

/**
 * Calculate remaining payments and amount for a payment plan
 * 
 * The currentPayment field is 1-indexed and represents the NEXT payment to make.
 * So if currentPayment = 2, it means payment #1 has been made (1 payment made).
 * 
 * @param plan - The payment plan
 * @returns Object with paymentsMade, remainingPayments, and remainingAmount
 */
export function calculatePaymentPlanRemaining(plan: PaymentPlan): {
    paymentsMade: number;
    remainingPayments: number;
    remainingAmount: number;
} {
    // currentPayment is 1-indexed (represents the NEXT payment to make)
    // So paymentsMade = currentPayment - 1
    const paymentsMade = Math.max((plan.currentPayment ?? 1) - 1, 0);

    // Clamp to not exceed total payments
    const clampedPaymentsMade = Math.min(paymentsMade, plan.totalPayments);

    // Calculate remaining
    const remainingPayments = Math.max(plan.totalPayments - clampedPaymentsMade, 0);
    const remainingAmount = Math.max(
        plan.initialCost - clampedPaymentsMade * getPaymentAmount(plan),
        0
    );

    return {
        paymentsMade: clampedPaymentsMade,
        remainingPayments,
        remainingAmount
    };
}
