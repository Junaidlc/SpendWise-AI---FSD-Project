export type StandardCategory =
  | 'Housing & Utilities'
  | 'Food & Dining'
  | 'Transportation'
  | 'Shopping'
  | 'Healthcare'
  | 'Entertainment'
  | 'Subscriptions'
  | 'Education'
  | 'Travel'
  | 'Personal Care'
  | 'Investments'
  | 'Other';

export type CategoryName = StandardCategory | string;

export type PaymentMethod =
  | 'Credit Card'
  | 'Debit Card'
  | 'Cash'
  | 'Bank Transfer'
  | 'Apple Pay'
  | 'PayPal';

export interface ExpenseItem {
  name: string;
  price: number;
}

export interface Expense {
  id: string;
  merchant: string;
  amount: number;
  category: CategoryName;
  date: string; // YYYY-MM-DD
  notes?: string;
  paymentMethod: PaymentMethod;
  tags?: string[];
  isRecurring?: boolean;
  receiptUrl?: string;
  items?: ExpenseItem[];
  createdAt: string;
  userId?: string;
}

export interface CategoryBudget {
  id: string;
  category: string;
  allocatedAmount: number;
  period: 'monthly' | 'yearly';
  color: string;
  iconName?: string;
  warningThresholdPercent?: number; // e.g. 80 or 85%
  notes?: string;
  createdAt?: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  iconName: string;
}

export interface AIAnalysisResult {
  executiveSummary: string;
  burnRateAnalysis: {
    dailyAverage: number;
    projectedMonthEnd: number;
    savingsRate: number;
    budgetHealth: 'Healthy' | 'Caution' | 'Critical';
  };
  savingsSuggestions: Array<{
    title: string;
    potentialSavings: number;
    impact: 'High' | 'Medium' | 'Low';
    description: string;
    actionableStep: string;
  }>;
  anomalies: Array<{
    category: string;
    description: string;
    severity: 'warning' | 'info' | 'alert';
  }>;
  recurringItems?: Array<{
    merchant: string;
    estimatedMonthlyCost: number;
    frequency: string;
    status: string;
  }>;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  monthlyIncome: number;
  currency: string;
  role: 'Owner' | 'Member';
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastSyncedAt?: string;
}
