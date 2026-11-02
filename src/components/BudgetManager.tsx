import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Plus,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Edit3,
  Trash2,
  Check,
  X,
  Sliders,
  ArrowUpDown,
  Filter,
  DollarSign,
  Calendar,
  Layers,
  Utensils,
  Car,
  Home,
  ShoppingBag,
  Film,
  Activity,
  CreditCard,
  Compass,
  Coffee,
  Heart,
  Dumbbell,
  Tag,
} from 'lucide-react';
import { Expense, CategoryBudget } from '../types/finance';

interface BudgetManagerProps {
  budgets: CategoryBudget[];
  expenses: Expense[];
  onUpdateBudget: (updated: CategoryBudget) => void;
  onAddBudget: (newBudget: CategoryBudget) => void;
  onDeleteBudget: (id: string) => void;
  currencySymbol: string;
}

const PRESET_CATEGORIES = [
  { name: 'Food & Dining', defaultColor: '#10B981', icon: 'Utensils' },
  { name: 'Housing & Utilities', defaultColor: '#6366F1', icon: 'Home' },
  { name: 'Transportation', defaultColor: '#F59E0B', icon: 'Car' },
  { name: 'Shopping', defaultColor: '#EC4899', icon: 'ShoppingBag' },
  { name: 'Entertainment', defaultColor: '#8B5CF6', icon: 'Film' },
  { name: 'Subscriptions', defaultColor: '#06B6D4', icon: 'CreditCard' },
  { name: 'Healthcare', defaultColor: '#EF4444', icon: 'Activity' },
  { name: 'Travel', defaultColor: '#14B8A6', icon: 'Compass' },
  { name: 'Groceries', defaultColor: '#84CC16', icon: 'ShoppingBag' },
  { name: 'Fitness & Gym', defaultColor: '#3B82F6', icon: 'Dumbbell' },
  { name: 'Coffee & Cafes', defaultColor: '#D97706', icon: 'Coffee' },
  { name: 'Personal Care', defaultColor: '#F43F5E', icon: 'Heart' },
];

const COLOR_PALETTE = [
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#3B82F6', // Blue
  '#84CC16', // Lime
  '#F97316', // Orange
  '#64748B', // Slate
];

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  budgets,
  expenses,
  onUpdateBudget,
  onAddBudget,
  onDeleteBudget,
  currencySymbol,
}) => {
  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<CategoryBudget | null>(null);

  // Form Fields
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);
  const [categoryName, setCategoryName] = useState(PRESET_CATEGORIES[0].name);
  const [customNameInput, setCustomNameInput] = useState('');
  const [allocatedAmount, setAllocatedAmount] = useState<string>('500');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [warningThreshold, setWarningThreshold] = useState<number>(85);
  const [notes, setNotes] = useState('');

  // Quick Inline Edit State
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineAmount, setInlineAmount] = useState<string>('');

  // Filter & Sort state
  const [statusFilter, setStatusFilter] = useState<'all' | 'on-track' | 'warning' | 'exceeded'>('all');
  const [sortBy, setSortBy] = useState<'utilization-desc' | 'budget-desc' | 'spent-desc' | 'name-asc'>('utilization-desc');

  // Compute spent amount per category
  const spentMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const exp of expenses) {
      const cat = exp.category || 'Other';
      map[cat] = (map[cat] || 0) + (Number(exp.amount) || 0);
    }
    return map;
  }, [expenses]);

  // Aggregate stats
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
  const totalSpentAcrossBudgets = budgets.reduce((sum, b) => sum + (spentMap[b.category] || 0), 0);
  const overallUtilization = totalBudgeted > 0 ? (totalSpentAcrossBudgets / totalBudgeted) * 100 : 0;
  const totalRemaining = Math.max(0, totalBudgeted - totalSpentAcrossBudgets);

  // Day of month calculation for pacing run rate
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthProgressPercent = (dayOfMonth / daysInMonth) * 100;

  // Process and filter budgets
  const processedBudgets = useMemo(() => {
    return budgets
      .map((b) => {
        const spent = spentMap[b.category] || 0;
        const allocated = b.allocatedAmount || 1;
        const percentage = (spent / allocated) * 100;
        const threshold = b.warningThresholdPercent || 85;
        const remaining = allocated - spent;
        const isOver = spent > allocated;
        const isWarning = percentage >= threshold && !isOver;

        // Pacing: expected spend up to today's date
        const expectedPacedSpend = (allocated / daysInMonth) * dayOfMonth;
        const pacingDelta = spent - expectedPacedSpend; // > 0 means pacing faster than normal

        let status: 'on-track' | 'warning' | 'exceeded' = 'on-track';
        if (isOver) status = 'exceeded';
        else if (isWarning) status = 'warning';

        return {
          ...b,
          spent,
          percentage,
          remaining,
          isOver,
          isWarning,
          status,
          expectedPacedSpend,
          pacingDelta,
        };
      })
      .filter((b) => {
        if (statusFilter === 'all') return true;
        return b.status === statusFilter;
      })
      .sort((a, b) => {
        if (sortBy === 'utilization-desc') return b.percentage - a.percentage;
        if (sortBy === 'budget-desc') return b.allocatedAmount - a.allocatedAmount;
        if (sortBy === 'spent-desc') return b.spent - a.spent;
        if (sortBy === 'name-asc') return a.category.localeCompare(b.category);
        return 0;
      });
  }, [budgets, spentMap, daysInMonth, dayOfMonth, statusFilter, sortBy]);

  // Open modal for new budget
  const handleOpenCreate = () => {
    setEditingBudget(null);
    setIsCustomCategoryMode(false);
    setCategoryName(PRESET_CATEGORIES[0].name);
    setCustomNameInput('');
    setAllocatedAmount('500');
    setSelectedColor(COLOR_PALETTE[0]);
    setPeriod('monthly');
    setWarningThreshold(85);
    setNotes('');
    setIsModalOpen(true);
  };

  // Open modal to edit existing budget
  const handleOpenEdit = (budget: CategoryBudget) => {
    setEditingBudget(budget);
    const isPreset = PRESET_CATEGORIES.some((p) => p.name === budget.category);
    if (isPreset) {
      setIsCustomCategoryMode(false);
      setCategoryName(budget.category);
      setCustomNameInput('');
    } else {
      setIsCustomCategoryMode(true);
      setCustomNameInput(budget.category);
    }
    setAllocatedAmount(String(budget.allocatedAmount));
    setSelectedColor(budget.color || COLOR_PALETTE[0]);
    setPeriod(budget.period || 'monthly');
    setWarningThreshold(budget.warningThresholdPercent || 85);
    setNotes(budget.notes || '');
    setIsModalOpen(true);
  };

  // Submit Modal Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategoryName = (isCustomCategoryMode ? customNameInput : categoryName).trim();
    const parsedAmount = parseFloat(allocatedAmount);

    if (!finalCategoryName || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please provide a valid category name and positive budget amount.');
      return;
    }

    if (editingBudget) {
      onUpdateBudget({
        ...editingBudget,
        category: finalCategoryName,
        allocatedAmount: parsedAmount,
        color: selectedColor,
        period,
        warningThresholdPercent: warningThreshold,
        notes: notes.trim() || undefined,
      });
    } else {
      onAddBudget({
        id: `b_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        category: finalCategoryName,
        allocatedAmount: parsedAmount,
        color: selectedColor,
        period,
        warningThresholdPercent: warningThreshold,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
    }

    setIsModalOpen(false);
  };

  // Save quick inline edit
  const handleSaveInline = (budget: CategoryBudget) => {
    const parsed = parseFloat(inlineAmount);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateBudget({
        ...budget,
        allocatedAmount: parsed,
      });
    }
    setInlineEditId(null);
  };

  return (
    <div className="space-y-6">
      {/* Overview & Summary Strip */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Category Budget Intelligence & Limits
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Configure custom budget allocations, observe real-time spend variance, and track monthly burn pacing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Create Custom Budget</span>
            </button>
          </div>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 font-mono text-xs">
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
            <span className="text-[11px] text-slate-500 block font-sans">Total Monthly Budget</span>
            <span className="text-base font-bold text-white tabular-nums">
              {currencySymbol}{totalBudgeted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">{budgets.length} active categories</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
            <span className="text-[11px] text-slate-500 block font-sans">Current Burn</span>
            <span className="text-base font-bold text-emerald-400 tabular-nums">
              {currencySymbol}{totalSpentAcrossBudgets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-sans">Across active budgets</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
            <span className="text-[11px] text-slate-500 block font-sans">Buffer Remaining</span>
            <span className={`text-base font-bold tabular-nums ${totalRemaining > 0 ? 'text-white' : 'text-rose-400'}`}>
              {currencySymbol}{totalRemaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-sans">
              {totalRemaining > 0 ? 'Liquid surplus' : 'Deficit'}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
            <span className="text-[11px] text-slate-500 block font-sans">Budget Utilization</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-base font-bold tabular-nums ${overallUtilization > 100 ? 'text-rose-400' : overallUtilization > 85 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {overallUtilization.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500">
                (Day {dayOfMonth}/{daysInMonth})
              </span>
            </div>
            {/* Mini month elapsed bar */}
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1.5" title={`Month Elapsed: ${monthProgressPercent.toFixed(0)}%`}>
              <div
                className="h-full bg-slate-500"
                style={{ width: `${Math.min(100, monthProgressPercent)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1 mr-1" />
          {[
            { id: 'all', label: 'All Budgets', count: budgets.length },
            { id: 'on-track', label: 'On Track', count: budgets.filter((b) => (spentMap[b.category] || 0) <= b.allocatedAmount * ((b.warningThresholdPercent || 85) / 100)).length },
            { id: 'warning', label: 'Near Cap (85%+)', count: budgets.filter((b) => {
              const spent = spentMap[b.category] || 0;
              const thresh = b.allocatedAmount * ((b.warningThresholdPercent || 85) / 100);
              return spent >= thresh && spent <= b.allocatedAmount;
            }).length },
            { id: 'exceeded', label: 'Exceeded', count: budgets.filter((b) => (spentMap[b.category] || 0) > b.allocatedAmount).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${statusFilter === tab.id ? 'bg-slate-700 text-white' : 'bg-slate-950 text-slate-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg py-1 px-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/60"
          >
            <option value="utilization-desc">Highest Utilization %</option>
            <option value="budget-desc">Highest Budget Cap</option>
            <option value="spent-desc">Highest Actual Spend</option>
            <option value="name-asc">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Custom Budgets Grid */}
      {processedBudgets.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/30">
          <PieChart className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <h4 className="text-sm font-semibold text-white">No budgets match this filter</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try switching your filter tabs above or click below to create a custom category budget.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Custom Budget</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {processedBudgets.map((b) => {
            const isEditingThis = inlineEditId === b.id;
            const thresholdPercent = b.warningThresholdPercent || 85;

            return (
              <div
                key={b.id}
                className={`p-5 rounded-xl border bg-slate-900/40 transition-all flex flex-col justify-between ${
                  b.isOver
                    ? 'border-rose-900/60 bg-rose-950/10 hover:border-rose-700/60'
                    : b.isWarning
                    ? 'border-amber-900/50 bg-amber-950/10 hover:border-amber-700/60'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-md shrink-0 shadow-xs"
                        style={{ backgroundColor: b.color || '#10B981' }}
                      />
                      <div>
                        <h4 className="text-sm font-bold text-white tracking-tight">
                          {b.category}
                        </h4>
                        {b.notes && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {b.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center gap-2 shrink-0">
                      {b.isOver ? (
                        <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                          <AlertOctagon className="w-3.5 h-3.5" />
                          <span>EXCEEDED</span>
                        </div>
                      ) : b.isWarning ? (
                        <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>NEARING CAP</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ON TRACK</span>
                        </div>
                      )}

                      {/* Card Actions */}
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                        title="Edit budget settings"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete the budget for "${b.category}"?`)) {
                            onDeleteBudget(b.id);
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete budget"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Quantitative Values & Large Percentage Spent */}
                  <div className="my-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">
                        Actual Outflow
                      </span>
                      <div className="text-xl font-bold font-mono tabular-nums text-white">
                        {currencySymbol}
                        {b.spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">
                        Allocated Limit
                      </span>
                      {isEditingThis ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs text-slate-400 font-mono">{currencySymbol}</span>
                          <input
                            type="number"
                            value={inlineAmount}
                            onChange={(e) => setInlineAmount(e.target.value)}
                            className="w-20 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white font-mono"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInline(b);
                              if (e.key === 'Escape') setInlineEditId(null);
                            }}
                          />
                          <button
                            onClick={() => handleSaveInline(b)}
                            className="text-emerald-400 p-0.5 cursor-pointer hover:text-emerald-300"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setInlineEditId(null)}
                            className="text-slate-500 p-0.5 cursor-pointer hover:text-slate-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setInlineEditId(b.id);
                            setInlineAmount(String(b.allocatedAmount));
                          }}
                          className="text-sm font-semibold font-mono tabular-nums text-slate-300 hover:text-emerald-400 cursor-pointer transition-colors"
                          title="Click to edit budget cap inline"
                        >
                          {currencySymbol}{b.allocatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Multi-Threshold Visual Progress Bar */}
                  <div className="relative w-full h-3 rounded-full bg-slate-950 overflow-hidden my-2 border border-slate-800/80">
                    {/* Warning threshold indicator marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-600/80 z-10"
                      style={{ left: `${thresholdPercent}%` }}
                      title={`Warning Threshold: ${thresholdPercent}%`}
                    />

                    {/* Progress Fill */}
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        b.isOver
                          ? 'bg-gradient-to-r from-rose-500 to-rose-600'
                          : b.isWarning
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                          : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, b.percentage)}%` }}
                    />
                  </div>

                  {/* Visual Progress Indicators: Percentage & Amount Remaining */}
                  <div className="flex items-center justify-between text-xs font-mono pt-1">
                    <span className="text-slate-400 font-semibold tabular-nums">
                      {b.percentage.toFixed(1)}% spent
                    </span>

                    <span
                      className={`font-semibold tabular-nums ${
                        b.isOver
                          ? 'text-rose-400'
                          : b.isWarning
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {b.isOver
                        ? `+${currencySymbol}${Math.abs(b.remaining).toFixed(2)} over budget`
                        : `${currencySymbol}${b.remaining.toFixed(2)} remaining`}
                    </span>
                  </div>
                </div>

                {/* Footer Insight: Pacing based on Month Day */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-sans">
                  <span>
                    Threshold: <strong className="text-slate-400 font-mono">{thresholdPercent}%</strong>
                  </span>
                  <span className="font-mono text-[10px]">
                    {b.pacingDelta > 0 ? (
                      <span className="text-amber-400">
                        Pacing +{currencySymbol}{b.pacingDelta.toFixed(0)} ahead of day {dayOfMonth}
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        Pacing {currencySymbol}{Math.abs(b.pacingDelta).toFixed(0)} below target pace
                      </span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Custom Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {editingBudget ? 'Edit Category Budget' : 'Create Custom Budget'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Allocate budget limits for your custom spending categories
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 overflow-y-auto space-y-4">
              {/* Category Mode Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Category Name *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCategoryMode(!isCustomCategoryMode)}
                    className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                  >
                    {isCustomCategoryMode ? '← Pick from standard presets' : '+ Type custom category'}
                  </button>
                </div>

                {isCustomCategoryMode ? (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pet Care, Gaming, Coffee & Snacks, Baby & Kids"
                    value={customNameInput}
                    onChange={(e) => setCustomNameInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
                    autoFocus
                  />
                ) : (
                  <select
                    value={categoryName}
                    onChange={(e) => {
                      setCategoryName(e.target.value);
                      const match = PRESET_CATEGORIES.find((p) => p.name === e.target.value);
                      if (match) setSelectedColor(match.defaultColor);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60"
                  >
                    {PRESET_CATEGORIES.map((preset) => (
                      <option key={preset.name} value={preset.name}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Monthly Allocation Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Monthly Allocated Cap ({currencySymbol}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    placeholder="500"
                    value={allocatedAmount}
                    onChange={(e) => setAllocatedAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500/60"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex gap-1.5 mt-2">
                  {[100, 250, 500, 800, 1500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAllocatedAmount(String(amt))}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
                    >
                      {currencySymbol}{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Accent Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Visual Category Color Tag
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-7 h-7 rounded-lg transition-transform cursor-pointer flex items-center justify-center ${
                        selectedColor === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {selectedColor === c && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Warning Threshold Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Warning Alert Threshold
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {warningThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="95"
                  step="5"
                  value={warningThreshold}
                  onChange={(e) => setWarningThreshold(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>60% (Cautious)</span>
                  <span>85% (Recommended)</span>
                  <span>95% (Strict)</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Budget Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Includes weekend dinners and coffee meetings"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                >
                  {editingBudget ? 'Save Changes' : 'Create Custom Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
