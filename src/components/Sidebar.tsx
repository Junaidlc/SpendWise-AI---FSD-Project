import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  BarChart3,
  Bot,
  Target,
  Database,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';
import { SupabaseConfig } from '../types/finance';

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
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  currency: string;
  onChangeCurrency: (c: string) => void;
  supabaseConfig: SupabaseConfig;
  onOpenSupabaseModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onQuickAddViaPrompt,
  totalExpensesCount,
  isOpenMobile,
  onCloseMobile,
  currency,
  onChangeCurrency,
  supabaseConfig,
  onOpenSupabaseModal,
}) => {
  const [quickInput, setQuickInput] = useState('');

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onQuickAddViaPrompt(quickInput.trim());
    setQuickInput('');
    onCloseMobile();
  };

  const handleSelectNav = (tab: ActiveNavTab) => {
    onSelectTab(tab);
    onCloseMobile();
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
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-64 lg:static border-r border-slate-800 bg-slate-950 flex flex-col justify-between shrink-0 min-h-screen overflow-y-auto transition-transform duration-200 ease-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Lockup */}
          <div className="h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-800/80">
            <div className="flex items-center gap-3">
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

            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick AI Expense Input in Sidebar */}
          <div className="p-4 border-b border-slate-900">
            <form onSubmit={handleQuickSubmit} className="relative">
              <input
                type="text"
                placeholder="e.g. ₹420 lunch yesterday..."
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-3 pr-10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
              <button
                type="submit"
                disabled={!quickInput.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-emerald-400 disabled:opacity-30 transition-colors cursor-pointer"
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
                  onClick={() => handleSelectNav(item.id)}
                  className={`w-full min-h-[44px] lg:min-h-0 flex items-center justify-between px-3 py-2.5 lg:py-2 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-900 text-emerald-400 border border-slate-800 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
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

          {/* Mobile-only Currency & DB Quick Controls */}
          <div className="lg:hidden px-4 py-3 border-t border-slate-900 space-y-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1.5">
                Display Currency
              </span>
              <div className="grid grid-cols-4 gap-1 border border-slate-800 bg-slate-900/60 rounded-lg p-1">
                {['INR', 'USD', 'EUR', 'GBP'].map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => onChangeCurrency(cur)}
                    className={`py-2 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                      currency === cur
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onCloseMobile();
                onOpenSupabaseModal();
              }}
              className="w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-lg border border-slate-800 bg-slate-900/60 text-xs text-slate-300 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Database className={`w-3.5 h-3.5 ${supabaseConfig.isConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span>{supabaseConfig.isConnected ? 'Supabase Connected' : 'Local Storage Mode'}</span>
              </span>
              <span className="text-[10px] text-slate-500">Configure</span>
            </button>
          </div>
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
    </>
  );
};