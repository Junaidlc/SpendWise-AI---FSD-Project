import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  BarChart3,
  Bot,
  Target,
  Database,
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react';

export type ActiveNavTab =
  | 'overview'
  | 'expenses'
  | 'charts'
  | 'budgets'
  | 'advisor'
  | 'savings'
  | 'supabase';

interface SidebarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  onQuickAddViaPrompt: (promptText: string) => void;
  totalExpensesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onQuickAddViaPrompt,
  totalExpensesCount,
}) => {
  const [quickInput, setQuickInput] = useState('');

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onQuickAddViaPrompt(quickInput.trim());
    setQuickInput('');
  };

  const navItems: Array<{ id: ActiveNavTab; label: string; icon: React.ElementType; badge?: string }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt, badge: `${totalExpensesCount}` },
    { id: 'charts', label: 'Analytics & Charts', icon: BarChart3 },
    { id: 'budgets', label: 'Budgets & Limits', icon: PieChart },
    { id: 'advisor', label: 'AI Financial Advisor', icon: Bot, badge: 'Gemini' },
    { id: 'savings', label: 'Savings Goals', icon: Target },
    { id: 'supabase', label: 'Supabase & SQL', icon: Database },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Brand Lockup */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base">
            ▲
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-none">
              ApexSpend
            </h1>
            <p className="text-[11px] text-slate-500 mt-1 leading-none font-mono">
              Fintech Intelligence
            </p>
          </div>
        </div>

        {/* Quick AI Expense Input in Sidebar */}
        <div className="p-4 border-b border-slate-900">
          <form onSubmit={handleQuickSubmit} className="relative">
            <input
              type="text"
              placeholder="e.g. $42 sushi yesterday..."
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-3 pr-8 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!quickInput.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-400 disabled:opacity-30 transition-colors cursor-pointer"
              title="Parse and add with Gemini"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
            <span>Natural language quick add</span>
            <span className="font-mono text-emerald-400/80">Gemini 3.8</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-emerald-400 border border-slate-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tech Stack Footer / Architecture Badge */}
      <div className="p-4 m-3 rounded-lg border border-slate-900 bg-slate-900/30">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Architecture Stack</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 space-y-1 font-mono">
          <div className="flex justify-between">
            <span className="text-slate-500">Frontend</span>
            <span className="text-slate-300">React + Recharts</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Database</span>
            <span className="text-slate-300">Supabase (PostgreSQL)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Intelligence</span>
            <span className="text-emerald-400">Gemini 3.8 Flash</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
