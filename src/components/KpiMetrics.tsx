import React from 'react';
import { DollarSign, Wallet, Flame, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Expense, CategoryBudget } from '../types/finance';

interface KpiMetricsProps {
  expenses: Expense[];
  budgets: CategoryBudget[];
  monthlyIncome: number;
  currencySymbol: string;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({
  expenses,
  budgets,
  monthlyIncome,
  currencySymbol,
}) => {
  const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalBudget = budgets.reduce((sum, b) => sum + (Number(b.allocatedAmount) || 0), 0);
  const remainingBudget = Math.max(0, totalBudget - totalSpent);
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Calculate daily burn velocity based on current day of month
  const today = new Date();
  const dayOfMonth = Math.max(1, today.getDate());
  const dailyBurn = totalSpent / dayOfMonth;

  const savingsRate = Math.max(0, ((monthlyIncome - totalSpent) / monthlyIncome) * 100);

  const kpis = [
    {
      label: 'Month Outflow',
      value: `${currencySymbol}${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: `${expenses.length} recorded transactions`,
      icon: DollarSign,
      delta: '-4.2% vs last month',
      isPositiveTrend: true,
    },
    {
      label: 'Budget Buffer',
      value: `${currencySymbol}${remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: `${budgetUtilization.toFixed(1)}% of total cap used`,
      icon: Wallet,
      delta: budgetUtilization > 90 ? 'Alert: Approaching Limit' : 'Within nominal range',
      isPositiveTrend: budgetUtilization <= 90,
    },
    {
      label: 'Daily Velocity',
      value: `${currencySymbol}${dailyBurn.toFixed(2)}/day`,
      subtext: `Day ${dayOfMonth} of month`,
      icon: Flame,
      delta: `Est. month total: ${currencySymbol}${(dailyBurn * 30).toFixed(0)}`,
      isPositiveTrend: dailyBurn * 30 <= totalBudget,
    },
    {
      label: 'Net Savings Rate',
      value: `${savingsRate.toFixed(1)}%`,
      subtext: `From ${currencySymbol}${monthlyIncome.toLocaleString()} net income`,
      icon: TrendingUp,
      delta: '+2.8% above benchmark',
      isPositiveTrend: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                {kpi.label}
              </span>
              <div className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300">
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-3">
              <div className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
                {kpi.value}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {kpi.subtext}
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px]">
              {kpi.isPositiveTrend ? (
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className={kpi.isPositiveTrend ? 'text-emerald-400' : 'text-amber-400'}>
                {kpi.delta}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
