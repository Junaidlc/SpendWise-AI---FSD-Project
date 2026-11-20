import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Expense, CategoryBudget } from '../types/finance';

interface SpendingChartsProps {
  expenses: Expense[];
  budgets: CategoryBudget[];
  currencySymbol: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Housing & Utilities': '#6366F1',
  'Food & Dining': '#10B981',
  'Transportation': '#F59E0B',
  'Shopping': '#EC4899',
  'Entertainment': '#8B5CF6',
  'Subscriptions': '#06B6D4',
  'Healthcare': '#EF4444',
  'Travel': '#14B8A6',
  'Education': '#3B82F6',
  'Personal Care': '#F43F5E',
  'Investments': '#10B981',
  'Other': '#64748B',
};

export const SpendingCharts: React.FC<SpendingChartsProps> = ({
  expenses,
  budgets,
  currencySymbol,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'categories' | 'budgets' | 'methods'>('timeline');

  // 1. Timeline Data (Daily aggregates sorted by date)
  const timelineData = useMemo(() => {
    const dailyMap: Record<string, number> = {};
    for (const exp of expenses) {
      const dateKey = exp.date;
      dailyMap[dateKey] = (dailyMap[dateKey] || 0) + Number(exp.amount);
    }
    const dates = Object.keys(dailyMap).sort();
    let cumulative = 0;
    return dates.map((date) => {
      const amount = dailyMap[date];
      cumulative += amount;
      const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      return {
        rawDate: date,
        date: formattedDate,
        daily: Number(amount.toFixed(2)),
        cumulative: Number(cumulative.toFixed(2)),
      };
    });
  }, [expenses]);

  // 2. Category Breakdown Data
  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {};
    for (const exp of expenses) {
      catMap[exp.category] = (catMap[exp.category] || 0) + Number(exp.amount);
    }
    const total = Object.values(catMap).reduce((a, b) => a + b, 0);
    return Object.entries(catMap)
      .map(([name, value]) => {
        const budgetColor = budgets.find((b) => b.category === name)?.color;
        return {
          name,
          value: Number(value.toFixed(2)),
          percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
          color: budgetColor || CATEGORY_COLORS[name] || '#94A3B8',
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [expenses, budgets]);

  // 3. Budget vs Actual Comparison Data
  const budgetComparisonData = useMemo(() => {
    const spendMap: Record<string, number> = {};
    for (const exp of expenses) {
      spendMap[exp.category] = (spendMap[exp.category] || 0) + Number(exp.amount);
    }

    return budgets.map((b) => {
      const spent = spendMap[b.category] || 0;
      const allocated = b.allocatedAmount;
      return {
        category: b.category.split(' ')[0], // short name
        fullName: b.category,
        allocated,
        spent: Number(spent.toFixed(2)),
        remaining: Math.max(0, allocated - spent),
        overspent: Math.max(0, spent - allocated),
      };
    });
  }, [expenses, budgets]);

  // 4. Payment Method Breakdown Data
  const paymentMethodData = useMemo(() => {
    const methodMap: Record<string, number> = {};
    for (const exp of expenses) {
      const m = exp.paymentMethod || 'Credit Card';
      methodMap[m] = (methodMap[m] || 0) + Number(exp.amount);
    }
    return Object.entries(methodMap).map(([name, value]) => ({
      name,
      amount: Number(value.toFixed(2)),
    })).sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700/80 p-2.5 rounded-lg shadow-xl text-xs font-mono">
          <p className="text-slate-300 font-semibold mb-1">{label}</p>
          {payload.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-4 py-0.5">
              <span className="text-slate-400 capitalize">{item.name}:</span>
              <span className="text-white font-bold tabular-nums">
                {currencySymbol}{Number(item.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5">
      {/* Chart View Selection Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Financial Trajectory & Analytics
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Real-time interactive data visualizer rendered with Recharts
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'timeline'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Spending Velocity
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'categories'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'budgets'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Budget vs Actual
          </button>
          <button
            onClick={() => setActiveTab('methods')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'methods'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Payment Rails
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className={`pt-4 w-full ${activeTab === 'categories' ? 'min-h-[320px] md:h-[320px]' : 'h-[260px] sm:h-[320px]'}`}>
        {activeTab === 'timeline' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(val) => `${currencySymbol}${val}`} />
              <Tooltip content={customTooltip} />
              <Area
                type="monotone"
                dataKey="cumulative"
                name="Cumulative Spend"
                stroke="#6366F1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#cumulativeGradient)"
              />
              <Area
                type="monotone"
                dataKey="daily"
                name="Daily Transaction"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#velocityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'categories' && (
          <div className="h-full flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="w-full md:w-1/2 h-[220px] md:h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0F172A" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={customTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Category Scannable Legend */}
            <div className="w-full md:w-1/2 max-h-[280px] overflow-y-auto pr-2 space-y-2">
              {categoryData.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cat.color }} />
                    <span className="text-slate-300 font-medium">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono tabular-nums">
                    <span className="text-slate-400">{cat.percentage}%</span>
                    <span className="text-white font-semibold">
                      {currencySymbol}{cat.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'budgets' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={budgetComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="category" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(val) => `${currencySymbol}${val}`} />
              <Tooltip content={customTooltip} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
              />
              <Bar dataKey="allocated" name="Budget Limit" fill="#475569" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spent" name="Actual Spent" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'methods' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={paymentMethodData} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
              <XAxis type="number" stroke="#64748B" fontSize={11} tickFormatter={(val) => `${currencySymbol}${val}`} />
              <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <Tooltip content={customTooltip} />
              <Bar dataKey="amount" name="Volume" fill="#06B6D4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
