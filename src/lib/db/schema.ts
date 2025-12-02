import Dexie, { Table } from 'dexie';
import type { IncomeEntry } from '@/types/income';
import type { DailyData } from '@/types/dailyData';
import type { FixedExpense, VariableExpense, PaymentPlan, PaymentPlanPayment } from '@/types/expense';
import type { AppSettings } from '@/types/settings';
import type { Goal } from '@/types/goal';

export class GigProDatabase extends Dexie {
  // Declare tables
  incomeEntries!: Table<IncomeEntry, string>;
  dailyData!: Table<DailyData, string>;
  fixedExpenses!: Table<FixedExpense, string>;
  variableExpenses!: Table<VariableExpense, string>;
  paymentPlans!: Table<PaymentPlan, string>;
  paymentPlanPayments!: Table<PaymentPlanPayment, string>;
  settings!: Table<AppSettings, string>;
  goals!: Table<Goal, string>;

  constructor() {
    super('gigpro-db');

    // Define database schema
    this.version(1).stores({
      incomeEntries: 'id, date, platform, createdAt',
      dailyData: 'id, &date', // & prefix means unique index
      fixedExpenses: 'id, isActive',
      variableExpenses: 'id, month, isPaid',
      paymentPlans: 'id, isComplete',
      paymentPlanPayments: 'id, paymentPlanId, month, isPaid',
      settings: 'id',
    });

    // Add goals table in version 2
    this.version(2).stores({
      incomeEntries: 'id, date, platform, createdAt',
      dailyData: 'id, &date',
      fixedExpenses: 'id, isActive',
      variableExpenses: 'id, month, isPaid',
      paymentPlans: 'id, isComplete',
      paymentPlanPayments: 'id, paymentPlanId, month, isPaid',
      settings: 'id',
      goals: 'id, period, startDate, isActive',
    });

    // Add name and priority fields to goals in version 3
    this.version(3).stores({
      incomeEntries: 'id, date, platform, createdAt',
      dailyData: 'id, &date',
      fixedExpenses: 'id, isActive',
      variableExpenses: 'id, month, isPaid',
      paymentPlans: 'id, isComplete',
      paymentPlanPayments: 'id, paymentPlanId, month, isPaid',
      settings: 'id',
      goals: 'id, period, startDate, isActive, priority',
    });
  }
}

// Create database instance
export const db = new GigProDatabase();
