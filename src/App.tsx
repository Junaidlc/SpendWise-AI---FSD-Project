import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar, ActiveNavTab } from './components/Sidebar';
import { KpiMetrics } from './components/KpiMetrics';
import { SpendingCharts } from './components/SpendingCharts';
import { ExpenseList } from './components/ExpenseList';
import { AddExpenseModal } from './components/AddExpenseModal';
import { AIInsightsPanel } from './components/AIInsightsPanel';
import { AIAdvisorView } from './components/AIAdvisorView';
import { BudgetManager } from './components/BudgetManager';
import { SavingsGoals } from './components/SavingsGoals';
import { SupabaseModal } from './components/SupabaseModal';
import {
  fetchExpenses,
  insertExpense,
  deleteExpense,
  getLocalBudgets,
  saveLocalBudgets,
  getLocalGoals,
  saveLocalGoals,
  getLocalUser,
  getSupabaseConfig,
  saveLocalExpenses,
} from './lib/supabase';
import { generateSpendingAudit, categorizeNaturalLanguageExpense } from './lib/geminiApi';
import { INITIAL_EXPENSES } from './lib/mockData';
import {
  Expense,
  CategoryBudget,
  SavingsGoal,
  UserProfile,
  SupabaseConfig,
  AIAnalysisResult,
  CategoryName,
} from './types/finance';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('overview');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [user, setUser] = useState<UserProfile>(getLocalUser());
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getSupabaseConfig());

  // Currency
  const [currency, setCurrency] = useState<string>('INR');
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';

  // Modals & Mobile Drawer
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial Data Load
  useEffect(() => {
    async function initData() {
      const loadedExpenses = await fetchExpenses();
      setExpenses(loadedExpenses);
      setBudgets(getLocalBudgets());
      setGoals(getLocalGoals());
    }
    initData();
  }, []);

  // Run AI Financial Audit
  const runAiAudit = useCallback(async () => {
    if (expenses.length === 0) return;
    setIsAuditing(true);
    try {
      const result = await generateSpendingAudit(
        expenses,
        budgets,
        new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        user.monthlyIncome
      );
      setAiAnalysis(result);
      showToast('Gemini 3.8 Flash financial audit generated successfully');
    } catch (err: any) {
      console.error('Audit failed:', err);
      showToast('Audit generated with heuristic fallback');
    } finally {
      setIsAuditing(false);
    }
  }, [expenses, budgets, user.monthlyIncome]);

  // Trigger initial audit when expenses load
  useEffect(() => {
    if (expenses.length > 0 && !aiAnalysis && !isAuditing) {
      runAiAudit();
    }
  }, [expenses.length]);

  // Expense Handlers
  const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    try {
      const added = await insertExpense(expenseData);
      setExpenses((prev) => [added, ...prev]);
      showToast(`Added "${added.merchant}" (${currencySymbol}${added.amount.toFixed(2)})`);
    } catch (e: any) {
      console.error(e);
      showToast('Failed to add expense');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      showToast('Expense removed');
    } catch (e: any) {
      console.error(e);
    }
  };

  // Quick Add from Sidebar Prompt
  const handleQuickAddViaPrompt = async (promptText: string) => {
    showToast('Parsing with Gemini 3.8 Flash...');
    try {
      const parsed = await categorizeNaturalLanguageExpense(
        promptText,
        budgets.map((b) => b.category)
      );

      const newExpense = await insertExpense({
        merchant: parsed.merchant || 'Quick Expense',
        amount: parsed.amount || 25,
        category: (parsed.category as CategoryName) || 'Food & Dining',
        date: parsed.date || new Date().toISOString().split('T')[0],
        notes: parsed.notes || `Quick prompt: "${promptText}"`,
        paymentMethod: (parsed.paymentMethod as any) || 'Credit Card',
        tags: parsed.tags || ['quick-add'],
      });

      setExpenses((prev) => [newExpense, ...prev]);
      showToast(`Added: ${newExpense.merchant} (${currencySymbol}${newExpense.amount.toFixed(2)})`);
    } catch (e: any) {
      console.error(e);
      showToast('Could not auto-parse. Opening expense logger...');
      setIsAddExpenseOpen(true);
    }
  };

  // Budget Handlers
  const handleUpdateBudget = (updated: CategoryBudget) => {
    const nextBudgets = budgets.map((b) => (b.id === updated.id ? updated : b));
    setBudgets(nextBudgets);
    saveLocalBudgets(nextBudgets);
    showToast(`Updated budget for ${updated.category}`);
  };

  const handleAddBudget = (newB: CategoryBudget) => {
    const nextBudgets = [...budgets, newB];
    setBudgets(nextBudgets);
    saveLocalBudgets(nextBudgets);
    showToast(`Created budget for ${newB.category}`);
  };

  const handleDeleteBudget = (id: string) => {
    const deletedBudget = budgets.find((b) => b.id === id);
    const nextBudgets = budgets.filter((b) => b.id !== id);
    setBudgets(nextBudgets);
    saveLocalBudgets(nextBudgets);
    showToast(`Deleted budget for ${deletedBudget?.category || 'category'}`);
  };

  // Savings Goal Handlers
  const handleAddContribution = (goalId: string, amount: number) => {
    const nextGoals = goals.map((g) =>
      g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g
    );
    setGoals(nextGoals);
    saveLocalGoals(nextGoals);
    showToast(`Deposited ${currencySymbol}${amount} toward goal!`);
  };

  const handleCreateGoal = (goal: Omit<SavingsGoal, 'id'>) => {
    const newG: SavingsGoal = {
      ...goal,
      id: `goal_${Date.now()}`,
    };
    const nextGoals = [...goals, newG];
    setGoals(nextGoals);
    saveLocalGoals(nextGoals);
    showToast(`Created goal: "${newG.title}"`);
  };

  // Reset to default dataset
  const handleResetToDefaults = () => {
    saveLocalExpenses(INITIAL_EXPENSES);
    setExpenses(INITIAL_EXPENSES);
    showToast('Reset to default transaction dataset');
  };

  const viewTitles: Record<ActiveNavTab, string> = {
    overview: 'Financial Intelligence Overview',
    expenses: 'Transaction Ledger',
    charts: 'Data Visualizations & Recharts',
    budgets: 'Category Budget Allocations',
    advisor: 'Gemini AI Financial Strategist',
    savings: 'Target Savings Goals',
    supabase: 'Supabase & PostgreSQL Management',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden">
      <div className="flex flex-1 min-h-screen">
        {/* Sidebar (Drawer on mobile, Fixed Rail on lg+) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onQuickAddViaPrompt={handleQuickAddViaPrompt}
          totalExpensesCount={expenses.length}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          currency={currency}
          onChangeCurrency={setCurrency}
          supabaseConfig={supabaseConfig}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            currentViewTitle={viewTitles[activeTab]}
            user={user}
            supabaseConfig={supabaseConfig}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
            onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
            currency={currency}
            onChangeCurrency={setCurrency}
            onQuickAiAudit={runAiAudit}
            isAuditing={isAuditing}
          />

          <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8">
            {/* VIEW 1: OVERVIEW (Unified Executive Dashboard) */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <KpiMetrics
                  expenses={expenses}
                  budgets={budgets}
                  monthlyIncome={user.monthlyIncome}
                  currencySymbol={currencySymbol}
                />

                <SpendingCharts
                  expenses={expenses}
                  budgets={budgets}
                  currencySymbol={currencySymbol}
                />

                <AIInsightsPanel
                  analysis={aiAnalysis}
                  isLoading={isAuditing}
                  onRefresh={runAiAudit}
                  currencySymbol={currencySymbol}
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white tracking-tight">
                      Recent Transactions
                    </h3>
                    <button
                      onClick={() => setActiveTab('expenses')}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                    >
                      View All ({expenses.length}) →
                    </button>
                  </div>
                  <ExpenseList
                    expenses={expenses.slice(0, 8)}
                    onDeleteExpense={handleDeleteExpense}
                    currencySymbol={currencySymbol}
                  />
                </div>
              </div>
            )}

            {/* VIEW 2: EXPENSES */}
            {activeTab === 'expenses' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      Transactions Ledger
                    </h2>
                    <p className="text-xs text-slate-400">
                      Query, sort, filter, and export all recorded outflows
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddExpenseOpen(true)}
                    className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-all cursor-pointer whitespace-nowrap"
                  >
                    + Add New Transaction
                  </button>
                </div>

                <ExpenseList
                  expenses={expenses}
                  onDeleteExpense={handleDeleteExpense}
                  currencySymbol={currencySymbol}
                />
              </div>
            )}

            {/* VIEW 3: CHARTS & RECHARTS */}
            {activeTab === 'charts' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Data Visualizations & Deep Analytics
                  </h2>
                  <p className="text-xs text-slate-400">
                    High-density multi-axis graphs powered by Recharts
                  </p>
                </div>
                <SpendingCharts
                  expenses={expenses}
                  budgets={budgets}
                  currencySymbol={currencySymbol}
                />
                <AIInsightsPanel
                  analysis={aiAnalysis}
                  isLoading={isAuditing}
                  onRefresh={runAiAudit}
                  currencySymbol={currencySymbol}
                />
              </div>
            )}

            {/* VIEW 4: BUDGETS */}
            {activeTab === 'budgets' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Budget Caps & Spending Thresholds
                  </h2>
                  <p className="text-xs text-slate-400">
                    Control category variance and maintain positive savings margins
                  </p>
                </div>
                <BudgetManager
                  budgets={budgets}
                  expenses={expenses}
                  onUpdateBudget={handleUpdateBudget}
                  onAddBudget={handleAddBudget}
                  onDeleteBudget={handleDeleteBudget}
                  currencySymbol={currencySymbol}
                />
              </div>
            )}

            {/* VIEW 5: AI ADVISOR (Chat) */}
            {activeTab === 'advisor' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Gemini AI Financial Strategist
                  </h2>
                  <p className="text-xs text-slate-400">
                    Real-time conversational financial guidance grounded in your transactions
                  </p>
                </div>
                <AIAdvisorView
                  expenses={expenses}
                  budgets={budgets}
                  currencySymbol={currencySymbol}
                />
              </div>
            )}

            {/* VIEW 6: SAVINGS GOALS */}
            {activeTab === 'savings' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Target Savings Goals
                  </h2>
                  <p className="text-xs text-slate-400">
                    Track capital accumulation towards safety buffers and life milestones
                  </p>
                </div>
                <SavingsGoals
                  goals={goals}
                  onAddContribution={handleAddContribution}
                  onCreateGoal={handleCreateGoal}
                  currencySymbol={currencySymbol}
                />
              </div>
            )}

            {/* VIEW 7: SUPABASE & SQL */}
            {activeTab === 'supabase' && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      Supabase PostgreSQL & Cloud Architecture
                    </h2>
                    <button
                      onClick={() => setIsSupabaseModalOpen(true)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors cursor-pointer"
                    >
                      Configure Credentials & SQL
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                    ApexSpend is architected to run seamlessly against your Supabase project using PostgreSQL, Supabase Auth, and Row Level Security (RLS). You can also run in embedded mode with instant offline persistence.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                      <span className="text-[11px] font-mono text-slate-500 uppercase block">Active Database</span>
                      <span className="text-sm font-bold text-white mt-1 block">
                        {supabaseConfig.isConnected ? 'Cloud Supabase' : 'Local PostgreSQL Mode'}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        {expenses.length} records persisted
                      </span>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                      <span className="text-[11px] font-mono text-slate-500 uppercase block">AI Model</span>
                      <span className="text-sm font-bold text-emerald-400 mt-1 block">
                        Google Gemini 3.8 Flash
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Server-side proxy execution
                      </span>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                      <span className="text-[11px] font-mono text-slate-500 uppercase block">Deployment</span>
                      <span className="text-sm font-bold text-white mt-1 block">
                        Vercel + GitHub
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Production static & edge ready
                      </span>
                    </div>
                  </div>
                </div>

                <AIInsightsPanel
                  analysis={aiAnalysis}
                  isLoading={isAuditing}
                  onRefresh={runAiAudit}
                  currencySymbol={currencySymbol}
                />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onAddExpense={handleAddExpense}
        categories={budgets.map((b) => b.category)}
        currencySymbol={currencySymbol}
      />

      {/* Supabase Config & SQL Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        config={supabaseConfig}
        onConfigUpdated={(cfg) => {
          setSupabaseConfig(cfg);
          showToast(cfg.isConnected ? 'Connected to Supabase project' : 'Updated database config');
        }}
        onResetToDefaults={handleResetToDefaults}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700/80 shadow-2xl text-xs font-medium text-white flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}