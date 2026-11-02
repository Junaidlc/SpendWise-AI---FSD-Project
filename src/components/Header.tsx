import React from 'react';
import { Plus, Database, Sparkles, ShieldCheck } from 'lucide-react';
import { UserProfile, SupabaseConfig } from '../types/finance';

interface HeaderProps {
  currentViewTitle: string;
  user: UserProfile;
  supabaseConfig: SupabaseConfig;
  onOpenAddExpense: () => void;
  onOpenSupabaseModal: () => void;
  currency: string;
  onChangeCurrency: (c: string) => void;
  onQuickAiAudit: () => void;
  isAuditing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentViewTitle,
  user,
  supabaseConfig,
  onOpenAddExpense,
  onOpenSupabaseModal,
  currency,
  onChangeCurrency,
  onQuickAiAudit,
  isAuditing,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between gap-8">
      {/* Zone 1: Contextual Breadcrumb & Title */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold tracking-tight text-white whitespace-nowrap">
          ApexSpend
        </span>
        <span className="text-slate-600" aria-hidden="true">/</span>
        <span className="text-sm text-slate-400 whitespace-nowrap">
          {currentViewTitle}
        </span>
      </div>

      {/* Zone 2: System Status & Currency Selector */}
      <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-400">
        <button
          onClick={onOpenSupabaseModal}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:text-slate-200 transition-colors cursor-pointer"
          title="Click to configure Supabase PostgreSQL connection"
        >
          <Database className={`w-3.5 h-3.5 ${supabaseConfig.isConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="whitespace-nowrap">
            {supabaseConfig.isConnected ? 'Supabase Connected' : 'Local PostgreSQL Mode'}
          </span>
          <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
            {supabaseConfig.isConnected ? 'Cloud DB' : 'Embedded'}
          </span>
        </button>

        <div className="flex items-center gap-1 border border-slate-800 bg-slate-900/60 rounded-lg p-0.5">
          {['USD', 'EUR', 'GBP'].map((cur) => (
            <button
              key={cur}
              onClick={() => onChangeCurrency(cur)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                currency === cur
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cur === 'USD' ? '$ USD' : cur === 'EUR' ? '€ EUR' : '£ GBP'}
            </button>
          ))}
        </div>
      </div>

      {/* Zone 3: Actions & Profile */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onQuickAiAudit}
          disabled={isAuditing}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 border border-slate-800 rounded-lg bg-slate-900 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 text-emerald-400 ${isAuditing ? 'animate-spin' : ''}`} />
          <span>{isAuditing ? 'Analyzing...' : 'Gemini AI Audit'}</span>
        </button>

        <button
          onClick={onOpenAddExpense}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Add Expense</span>
        </button>

        <div
          onClick={onOpenSupabaseModal}
          className="flex items-center gap-2.5 pl-2 border-l border-slate-800 cursor-pointer group"
          title="User profile and account settings"
        >
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover border border-slate-700 group-hover:border-emerald-400 transition-colors"
            referrerPolicy="no-referrer"
          />
          <div className="hidden xl:block text-left">
            <p className="text-xs font-medium text-slate-200 group-hover:text-white transition-colors leading-none">
              {user.name}
            </p>
            <p className="text-[11px] text-slate-500 leading-none mt-1">
              {user.email}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
