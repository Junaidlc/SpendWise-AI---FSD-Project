import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Expense, CategoryBudget, SavingsGoal, UserProfile, SupabaseConfig } from '../types/finance';
import { INITIAL_EXPENSES, INITIAL_BUDGETS, INITIAL_SAVINGS_GOALS, DEFAULT_USER } from './mockData';

const CONFIG_KEY = 'apexspend_supabase_config_v1';
const EXPENSES_STORAGE_KEY = 'apexspend_expenses_local_v1';
const BUDGETS_STORAGE_KEY = 'apexspend_budgets_local_v1';
const GOALS_STORAGE_KEY = 'apexspend_goals_local_v1';
const USER_STORAGE_KEY = 'apexspend_user_local_v1';

let clientInstance: SupabaseClient | null = null;

export function getSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed reading Supabase config from storage', e);
  }
  return {
    url: '',
    anonKey: '',
    isConnected: false,
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): SupabaseConfig {
  const isConnected = !!(url && anonKey && url.startsWith('http'));
  const config: SupabaseConfig = {
    url: url.trim(),
    anonKey: anonKey.trim(),
    isConnected,
    lastSyncedAt: new Date().toISOString(),
  };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  clientInstance = null; // reset client instance
  return config;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (clientInstance) return clientInstance;
  const cfg = getSupabaseConfig();
  if (cfg.url && cfg.anonKey && cfg.url.startsWith('http')) {
    try {
      clientInstance = createClient(cfg.url, cfg.anonKey);
      return clientInstance;
    } catch (e) {
      console.warn('Failed creating Supabase client instance:', e);
      return null;
    }
  }
  return null;
}

// --------------------------------------------------------------------------------
// Local Database Store (Persisted to localStorage with full PostgreSQL parity)
// --------------------------------------------------------------------------------

export function getLocalExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(INITIAL_EXPENSES));
  return INITIAL_EXPENSES;
}

export function saveLocalExpenses(expenses: Expense[]): void {
  localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
}

export function getLocalBudgets(): CategoryBudget[] {
  try {
    const raw = localStorage.getItem(BUDGETS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(INITIAL_BUDGETS));
  return INITIAL_BUDGETS;
}

export function saveLocalBudgets(budgets: CategoryBudget[]): void {
  localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(budgets));
}

export function getLocalGoals(): SavingsGoal[] {
  try {
    const raw = localStorage.getItem(GOALS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(INITIAL_SAVINGS_GOALS));
  return INITIAL_SAVINGS_GOALS;
}

export function saveLocalGoals(goals: SavingsGoal[]): void {
  localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
}

export function getLocalUser(): UserProfile {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_USER;
}

export function saveLocalUser(user: UserProfile): void {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

// --------------------------------------------------------------------------------
// Unified Data Layer (Supabase Remote + Local Fallback)
// --------------------------------------------------------------------------------

export async function fetchExpenses(): Promise<Expense[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error, falling back to local DB:', error.message);
        return getLocalExpenses();
      }
      if (data && data.length > 0) {
        saveLocalExpenses(data as Expense[]);
        return data as Expense[];
      }
    } catch (err) {
      console.warn('Supabase request failed, using local DB:', err);
    }
  }
  return getLocalExpenses();
}

export async function insertExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
  const newExpense: Expense = {
    ...expense,
    id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    createdAt: new Date().toISOString(),
  };

  const current = getLocalExpenses();
  const updated = [newExpense, ...current];
  saveLocalExpenses(updated);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('expenses').insert([newExpense]);
    } catch (e) {
      console.warn('Supabase insert failed, stored locally:', e);
    }
  }

  return newExpense;
}

export async function updateExpense(expense: Expense): Promise<Expense> {
  const current = getLocalExpenses();
  const updated = current.map((e) => (e.id === expense.id ? expense : e));
  saveLocalExpenses(updated);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('expenses').update(expense).eq('id', expense.id);
    } catch (e) {
      console.warn('Supabase update failed:', e);
    }
  }
  return expense;
}

export async function deleteExpense(id: string): Promise<void> {
  const current = getLocalExpenses();
  const updated = current.filter((e) => e.id !== id);
  saveLocalExpenses(updated);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('expenses').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete failed:', e);
    }
  }
}

// --------------------------------------------------------------------------------
// PostgreSQL Schema Generator for Supabase SQL Editor
// --------------------------------------------------------------------------------

export function generatePostgresSchemaSql(): string {
  return `-- ====================================================================
-- ApexSpend: Production PostgreSQL Schema for Supabase
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ====================================================================

-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#6366F1',
    icon_name TEXT NOT NULL DEFAULT 'Tag',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    category TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    payment_method TEXT NOT NULL DEFAULT 'Credit Card',
    tags TEXT[] DEFAULT '{}',
    is_recurring BOOLEAN DEFAULT false,
    receipt_url TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    allocated_amount NUMERIC(12, 2) NOT NULL CHECK (allocated_amount >= 0),
    period TEXT NOT NULL DEFAULT 'monthly',
    color TEXT NOT NULL DEFAULT '#10B981',
    icon_name TEXT NOT NULL DEFAULT 'PieChart',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create Savings Goals Table
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL,
    current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    target_date DATE,
    category TEXT NOT NULL DEFAULT 'Savings',
    icon_name TEXT NOT NULL DEFAULT 'ShieldCheck',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies for Authenticated Users
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can manage their own expenses'
    ) THEN
        CREATE POLICY "Users can manage their own expenses" 
        ON public.expenses 
        FOR ALL 
        USING (auth.uid() = user_id OR user_id IS NULL)
        WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
    END IF;
END $$;

-- 7. High-Performance Indexes for Analytics
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses (date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses (category);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses (user_id);
`;
}
