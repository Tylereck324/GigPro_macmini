import { describe, it, expect } from 'vitest';
import {
    calculateIncomeForRange,
    calculateWeeklyIncome,
    calculateMonthlyIncome,
    calculateGoalProgress,
    calculatePrioritizedGoalProgress,
    getCurrentWeekRange,
    getCurrentMonthRange,
} from '../goalCalculations';
import type { IncomeEntry } from '@/types/income';
import type { Goal, GoalPeriod } from '@/types/goal';

// Helper to create mock income entries
function createIncomeEntry(
    id: string,
    date: string,
    amount: number,
    platform: 'AmazonFlex' | 'DoorDash' | 'WalmartSpark' | 'Other' = 'AmazonFlex'
): IncomeEntry {
    return {
        id,
        date,
        platform,
        amount,
        notes: '',
        blockStartTime: null,
        blockEndTime: null,
        blockLength: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
}

// Helper to create mock goals
function createGoal(
    id: string,
    name: string,
    targetAmount: number,
    period: GoalPeriod,
    startDate: string,
    endDate: string,
    priority: number = 1,
    isActive: boolean = true
): Goal {
    return {
        id,
        name,
        period,
        targetAmount,
        startDate,
        endDate,
        priority,
        isActive,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
}

describe('goalCalculations', () => {
    describe('calculateIncomeForRange', () => {
        it('should sum income entries within date range', () => {
            const entries: IncomeEntry[] = [
                createIncomeEntry('1', '2025-01-01', 100),
                createIncomeEntry('2', '2025-01-02', 150),
                createIncomeEntry('3', '2025-01-03', 200),
                createIncomeEntry('4', '2025-01-04', 50), // Outside range
            ];

            const result = calculateIncomeForRange(entries, '2025-01-01', '2025-01-03');
            expect(result).toBe(450); // 100 + 150 + 200
        });

        it('should return 0 for empty entries', () => {
            const result = calculateIncomeForRange([], '2025-01-01', '2025-01-07');
            expect(result).toBe(0);
        });

        it('should return 0 when no entries in range', () => {
            const entries: IncomeEntry[] = [
                createIncomeEntry('1', '2025-02-01', 100),
            ];

            const result = calculateIncomeForRange(entries, '2025-01-01', '2025-01-07');
            expect(result).toBe(0);
        });
    });

    describe('calculateGoalProgress', () => {
        it('should calculate correct percentage', () => {
            const goal = createGoal('1', 'Weekly Goal', 500, 'weekly', '2025-01-01', '2025-01-07');
            const entries: IncomeEntry[] = [
                createIncomeEntry('1', '2025-01-01', 100),
                createIncomeEntry('2', '2025-01-02', 150),
            ];

            const result = calculateGoalProgress(goal, entries);
            expect(result.currentAmount).toBe(250);
            expect(result.percentComplete).toBe(50);
            expect(result.remainingAmount).toBe(250);
            expect(result.isComplete).toBe(false);
        });

        it('should cap percentage at 100%', () => {
            const goal = createGoal('1', 'Weekly Goal', 100, 'weekly', '2025-01-01', '2025-01-07');
            const entries: IncomeEntry[] = [
                createIncomeEntry('1', '2025-01-01', 200),
            ];

            const result = calculateGoalProgress(goal, entries);
            expect(result.percentComplete).toBe(100);
            expect(result.remainingAmount).toBe(0);
            expect(result.isComplete).toBe(true);
        });

        it('should handle zero target amount', () => {
            const goal = createGoal('1', 'Zero Goal', 0, 'weekly', '2025-01-01', '2025-01-07');
            const entries: IncomeEntry[] = [];

            const result = calculateGoalProgress(goal, entries);
            expect(result.percentComplete).toBe(0);
            expect(result.currentAmount).toBe(0);
        });
    });

    describe('calculatePrioritizedGoalProgress', () => {
        it('should allocate income to highest priority goal first', () => {
            const goals: Goal[] = [
                createGoal('1', 'High Priority', 300, 'monthly', '2025-01-01', '2025-01-31', 1),
                createGoal('2', 'Low Priority', 200, 'monthly', '2025-01-01', '2025-01-31', 2),
            ];
            const entries: IncomeEntry[] = [
                createIncomeEntry('1', '2025-01-15', 400),
            ];

            const results = calculatePrioritizedGoalProgress(goals, entries);

            // High priority goal should get 300 (capped at target)
            const highPriority = results.find(r => r.goal.id === '1');
            expect(highPriority?.currentAmount).toBe(300);
            expect(highPriority?.isComplete).toBe(true);

            // Low priority goal should get remaining 100
            const lowPriority = results.find(r => r.goal.id === '2');
            expect(lowPriority?.currentAmount).toBe(100);
            expect(lowPriority?.isComplete).toBe(false);
        });

        it('should handle empty goals array', () => {
            const results = calculatePrioritizedGoalProgress([], []);
            expect(results).toEqual([]);
        });
    });

    describe('getCurrentWeekRange', () => {
        it('should return start and end of current week', () => {
            const testDate = new Date('2025-01-15'); // Wednesday
            const { startDate, endDate } = getCurrentWeekRange(testDate);

            expect(startDate).toBe('2025-01-12'); // Sunday
            expect(endDate).toBe('2025-01-18'); // Saturday
        });
    });

    describe('getCurrentMonthRange', () => {
        it('should return start and end of current month', () => {
            const testDate = new Date('2025-01-15');
            const { startDate, endDate } = getCurrentMonthRange(testDate);

            expect(startDate).toBe('2025-01-01');
            expect(endDate).toBe('2025-01-31');
        });
    });
});
