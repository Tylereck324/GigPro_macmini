/**
 * PaymentPlanForm Component
 *
 * Manages installment payment plans (Affirm, Klarna, PayPal Pay in 4, Other)
 * Supports two modes:
 * 1. Standard providers: Track progress through pre-defined payment plans
 * 2. Other provider: Calculate payments based on balance and deadline
 */

'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Input, Select, Card } from '../ui';
import { formatCurrency } from '@/lib/utils/profitCalculations';
import type { CreatePaymentPlan, PaymentPlan } from '@/types/expense';
import type { PaymentPlanProvider, PaymentFrequency } from '@/types/common';

// ============================================================================
// Constants
// ============================================================================

const PAYMENT_PROVIDERS = [
  { value: 'Affirm' as PaymentPlanProvider, label: 'Affirm' },
  { value: 'Klarna' as PaymentPlanProvider, label: 'Klarna' },
  { value: 'PayPalPayIn4' as PaymentPlanProvider, label: 'PayPal Pay in 4' },
  { value: 'Other' as PaymentPlanProvider, label: 'Other' },
];

const PAYMENT_FREQUENCIES = [
  { value: 'weekly' as PaymentFrequency, label: 'Weekly' },
  { value: 'biweekly' as PaymentFrequency, label: 'Bi-weekly' },
  { value: 'monthly' as PaymentFrequency, label: 'Monthly' },
];

// ============================================================================
// Types
// ============================================================================

interface PaymentPlanFormProps {
  /** Initial data for editing existing plan */
  initialData?: PaymentPlan;
  /** Callback when form is saved */
  onSave: (data: CreatePaymentPlan) => Promise<void>;
  /** Optional callback when form is cancelled */
  onCancel?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function PaymentPlanForm({ initialData, onSave, onCancel }: PaymentPlanFormProps) {
  // Form state
  const [name, setName] = useState(initialData?.name ?? '');
  const [provider, setProvider] = useState<PaymentPlanProvider>(initialData?.provider ?? 'Affirm');
  const [initialCost, setInitialCost] = useState(initialData?.initialCost?.toString() ?? '');
  const [totalPayments, setTotalPayments] = useState(initialData?.totalPayments?.toString() ?? '');
  const [currentPayment, setCurrentPayment] = useState(initialData?.currentPayment?.toString() ?? '1');
  const [minimumMonthlyPayment, setMinimumMonthlyPayment] = useState(initialData?.minimumMonthlyPayment?.toString() ?? '');
  const [startDate, setStartDate] = useState(initialData?.startDate ?? '');
  const [frequency, setFrequency] = useState<PaymentFrequency>(initialData?.frequency ?? 'biweekly');
  const [endDate, setEndDate] = useState(initialData?.endDate ?? '');
  const [minimumPayment, setMinimumPayment] = useState(initialData?.minimumPayment?.toString() ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================================================================
  // Calculation Functions
  // ============================================================================

  /**
   * Calculate number of months from now to a future date
   */
  const calculateMonthsFromNow = (end: string): number => {
    if (!end) return 0;
    const now = new Date();
    const endDate = new Date(end);

    const yearDiff = endDate.getFullYear() - now.getFullYear();
    const monthDiff = endDate.getMonth() - now.getMonth();

    return yearDiff * 12 + monthDiff + 1; // +1 to include the end month
  };

  /**
   * Calculate recommended monthly payment for 'Other' provider
   */
  const calculateRecommendedPayment = (): number => {
    if (provider !== 'Other' || !initialCost || !endDate) return 0;
    const months = calculateMonthsFromNow(endDate);
    if (months <= 0) return 0;
    return parseFloat(initialCost) / months;
  };

  /**
   * Calculate payment amount per installment
   */
  const calculatePaymentAmount = (): number => {
    if (!initialCost || !totalPayments) return 0;
    return parseFloat(initialCost) / parseInt(totalPayments, 10);
  };

  /**
   * Calculate remaining payments and amount
   */
  const calculateRemaining = () => {
    if (!totalPayments || !currentPayment) {
      return { payments: 0, amount: 0 };
    }

    const paymentAmount = calculatePaymentAmount();
    const total = parseInt(totalPayments, 10);
    const current = parseInt(currentPayment, 10);

    // Remaining = total - current + 1
    // (current payment still needs to be made)
    const remaining = total - current + 1;

    return {
      payments: remaining,
      amount: remaining * paymentAmount,
    };
  };

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Validate form data before submission
   */
  const validateForm = (): boolean => {
    if (provider === 'Other') {
      if (!name || !initialCost || !endDate) {
        toast.error('Please fill in all required fields (Name, Balance Remaining, and End Date)');
        return false;
      }

      const now = new Date();
      const end = new Date(endDate);

      if (end <= now) {
        toast.error('End date must be in the future');
        return false;
      }

      // Warn if minimum payment is too high
      if (minimumPayment) {
        const minPay = parseFloat(minimumPayment);
        const recommended = calculateRecommendedPayment();
        if (minPay > recommended) {
          toast.error('Warning: Minimum payment is higher than recommended payment to meet deadline', {
            duration: 5000,
          });
        }
      }
    } else {
      // Standard payment plans
      if (!name || !initialCost || !totalPayments || !currentPayment) {
        toast.error('Please fill in all required fields');
        return false;
      }

      const totalNum = parseInt(totalPayments, 10);
      const currentNum = parseInt(currentPayment, 10);

      if (currentNum > totalNum) {
        toast.error('Current payment cannot be greater than total payments');
        return false;
      }
    }

    return true;
  };

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (provider === 'Other') {
        // Save custom payment plan
        const totalMonths = calculateMonthsFromNow(endDate);
        const today = new Date().toISOString().split('T')[0];
        const recommendedPayment = calculateRecommendedPayment();

        await onSave({
          name,
          provider,
          initialCost: parseFloat(initialCost),
          totalPayments: totalMonths,
          currentPayment: 1,
          paymentAmount: recommendedPayment,
          minimumMonthlyPayment: minimumMonthlyPayment ? parseFloat(minimumMonthlyPayment) : undefined,
          startDate: today,
          endDate,
          frequency: 'monthly',
          minimumPayment: minimumPayment ? parseFloat(minimumPayment) : undefined,
          isComplete: false,
        });
      } else {
        // Save standard payment plan
        const totalNum = parseInt(totalPayments, 10);
        const currentNum = parseInt(currentPayment, 10);

        await onSave({
          name,
          provider,
          initialCost: parseFloat(initialCost),
          totalPayments: totalNum,
          currentPayment: currentNum,
          paymentAmount: calculatePaymentAmount(),
          minimumMonthlyPayment: minimumMonthlyPayment ? parseFloat(minimumMonthlyPayment) : undefined,
          startDate: startDate || new Date().toISOString().split('T')[0],
          endDate: endDate || undefined,
          frequency,
          isComplete: currentNum > totalNum,
        });
      }

      // Reset form after successful save
      resetForm();
    } catch (error) {
      console.error('Failed to save payment plan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save payment plan';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setName('');
    setInitialCost('');
    setTotalPayments('');
    setCurrentPayment('1');
    setMinimumMonthlyPayment('');
    setStartDate('');
    setEndDate('');
    setMinimumPayment('');
  };

  // ============================================================================
  // Computed Values
  // ============================================================================

  const remaining = calculateRemaining();
  const paymentAmount = calculatePaymentAmount();
  const recommendedPayment = calculateRecommendedPayment();

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-semibold text-text">
          {initialData ? 'Edit Payment Plan' : 'Add Payment Plan'}
        </h3>

        {/* Provider Selection */}
        <Select
          label="Payment Provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value as PaymentPlanProvider)}
          options={PAYMENT_PROVIDERS}
          required
          fullWidth
        />

        {/* 'Other' Provider Form */}
        {provider === 'Other' ? (
          <>
            <p className="text-sm text-textSecondary">
              Track custom payment plans. Enter your remaining balance and deadline to calculate how much you need to pay monthly.
            </p>

            <Input
              type="text"
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="PayPal Credit, Credit Card, etc."
              required
              fullWidth
            />

            <Input
              type="number"
              label="Balance Remaining"
              value={initialCost}
              onChange={(e) => setInitialCost(e.target.value)}
              placeholder="363.05"
              min="0.01"
              step="0.01"
              required
              fullWidth
            />

            <Input
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              fullWidth
            />

            <Input
              type="number"
              label="Minimum Payment (Optional)"
              value={minimumPayment}
              onChange={(e) => setMinimumPayment(e.target.value)}
              placeholder="25.00"
              min="0.01"
              step="0.01"
              fullWidth
            />

            <Input
              type="number"
              label="Minimum Monthly Payment (Optional)"
              value={minimumMonthlyPayment}
              onChange={(e) => setMinimumMonthlyPayment(e.target.value)}
              placeholder="25.00"
              min="0.01"
              step="0.01"
              fullWidth
            />

            {/* Recommended Payment Display */}
            {initialCost && endDate && (
              <div className="p-4 bg-success/10 rounded-lg border border-success/30 space-y-2">
                <h4 className="text-sm font-semibold text-success">Payment Recommendation</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-textSecondary">Months Until Deadline:</span>
                    <span className="font-semibold text-text">{calculateMonthsFromNow(endDate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-textSecondary">Recommended Monthly Payment:</span>
                    <span className="text-lg font-bold text-success">{formatCurrency(recommendedPayment)}</span>
                  </div>
                  {minimumPayment && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-textSecondary">Your Minimum Payment:</span>
                      <span className="font-semibold text-text">{formatCurrency(parseFloat(minimumPayment))}</span>
                    </div>
                  )}
                  {minimumPayment && parseFloat(minimumPayment) < recommendedPayment && (
                    <p className="text-xs text-warning mt-2">
                      ⚠️ Minimum payment is below recommended. You may not meet your deadline.
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Standard Provider Form */}
            <p className="text-sm text-textSecondary">
              Track payment plans like Affirm, Klarna, or PayPal Pay in 4. Enter the total number of payments and track your progress.
            </p>

            <Input
              type="text"
              label="Item/Purchase Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New Phone, Laptop, etc."
              required
              fullWidth
            />

            <Input
              type="number"
              label="Initial Cost"
              value={initialCost}
              onChange={(e) => setInitialCost(e.target.value)}
              placeholder="500.00"
              min="0.01"
              step="0.01"
              required
              fullWidth
            />

            <Input
              type="number"
              label="Total Payments"
              value={totalPayments}
              onChange={(e) => setTotalPayments(e.target.value)}
              placeholder="4"
              min="1"
              required
              fullWidth
            />

            <Input
              type="number"
              label="Current Payment #"
              value={currentPayment}
              onChange={(e) => setCurrentPayment(e.target.value)}
              placeholder="1"
              min="1"
              required
              fullWidth
            />

            <Input
              type="number"
              label="Minimum Monthly Payment (Optional)"
              value={minimumMonthlyPayment}
              onChange={(e) => setMinimumMonthlyPayment(e.target.value)}
              placeholder="25.00"
              min="0.01"
              step="0.01"
              fullWidth
            />

            <Select
              label="Payment Frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as PaymentFrequency)}
              options={PAYMENT_FREQUENCIES}
              required
              fullWidth
            />

            <Input
              type="date"
              label="Start Date (Optional)"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
            />

            <Input
              type="date"
              label="End Date (Optional)"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
            />

            {/* Payment Breakdown */}
            {initialCost && totalPayments && (
              <div className="p-4 bg-background rounded-lg border border-border space-y-2">
                <h4 className="text-sm font-semibold text-text">Payment Breakdown</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-textSecondary">Total Payments:</span>
                  </div>
                  <div className="font-semibold text-text text-right">
                    {totalPayments}
                  </div>
                  <div>
                    <span className="text-textSecondary">{frequency === 'monthly' ? 'Monthly' : 'Payment'} Amount:</span>
                  </div>
                  <div className="font-semibold text-text text-right">
                    {formatCurrency(paymentAmount)}
                  </div>
                  <div>
                    <span className="text-textSecondary">Remaining Payments:</span>
                  </div>
                  <div className="font-semibold text-warning text-right">
                    {remaining.payments}
                  </div>
                  <div>
                    <span className="text-textSecondary">Remaining Amount:</span>
                  </div>
                  <div className="font-semibold text-danger text-right">
                    {formatCurrency(remaining.amount)}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Form Actions */}
        <div className="flex gap-3">
          <Button type="submit" variant="primary" disabled={isSubmitting} fullWidth>
            {isSubmitting ? 'Saving...' : initialData ? 'Update Plan' : 'Add Plan'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} fullWidth>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
