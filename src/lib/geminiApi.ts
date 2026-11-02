import { Expense, CategoryBudget, AIAnalysisResult } from '../types/finance';

export interface ParsedExpenseResponse {
  merchant: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  paymentMethod?: string;
  tags?: string[];
  confidence?: number;
}

export async function categorizeNaturalLanguageExpense(
  input: string,
  availableCategories?: string[]
): Promise<ParsedExpenseResponse> {
  const response = await fetch('/api/gemini/categorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, availableCategories }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to auto-categorize expense');
  }

  return response.json();
}

export async function generateSpendingAudit(
  expenses: Expense[],
  budgets: CategoryBudget[],
  month?: string,
  totalIncome?: number
): Promise<AIAnalysisResult> {
  const response = await fetch('/api/gemini/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expenses, budgets, month, totalIncome }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to analyze spending habits');
  }

  return response.json();
}

export async function sendAdvisorMessage(
  messages: Array<{ role: 'user' | 'model'; text: string }>,
  userContext: {
    totalSpent: number;
    expensesCount: number;
    categoryBreakdown: Record<string, number>;
    budgets: CategoryBudget[];
  }
): Promise<string> {
  const response = await fetch('/api/gemini/advisor-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, userContext }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to communicate with AI advisor');
  }

  const data = await response.json();
  return data.reply;
}

export async function scanReceiptImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<{
  merchant: string;
  amount: number;
  date: string;
  category: string;
  tax?: number;
  items?: Array<{ name: string; price: number }>;
  notes?: string;
  confidence?: number;
}> {
  const response = await fetch('/api/gemini/receipt-ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to process receipt');
  }

  return response.json();
}
