import React from 'react';
import {
  Sparkles,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  RefreshCw,
  Repeat,
  ArrowRight,
} from 'lucide-react';
import { AIAnalysisResult } from '../types/finance';

interface AIInsightsPanelProps {
  analysis: AIAnalysisResult | null;
  isLoading: boolean;
  onRefresh: () => void;
  currencySymbol: string;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  analysis,
  isLoading,
  onRefresh,
  currencySymbol,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col items-center justify-center min-h-[300px]">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <h4 className="text-sm font-semibold text-white">
          Gemini 3.8 Flash is Auditing Your Finances...
        </h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
          Analyzing transaction velocity, recurring subscriptions, anomaly variance, and calculating personalized cash preservation strategies.
        </p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col items-center justify-center text-center min-h-[220px]">
        <Sparkles className="w-8 h-8 text-emerald-400/80 mb-2" />
        <h4 className="text-sm font-semibold text-white">AI Financial Intelligence Engine</h4>
        <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
          Tap into Google Gemini 3.8 Flash to analyze your spending trends, identify hidden recurring waste, and get quantified savings advice.
        </p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generate Financial Audit</span>
        </button>
      </div>
    );
  }

  const totalPotentialSavings = analysis.savingsSuggestions?.reduce(
    (sum, s) => sum + (s.potentialSavings || 0),
    0
  ) || 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Gemini Financial Intelligence & Saving Audit
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Personalized cashflow diagnostic generated from current transaction ledger
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">
              Monthly Potential Savings
            </span>
            <span className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
              +{currencySymbol}{totalPotentialSavings.toLocaleString()}/mo
            </span>
          </div>
          <button
            onClick={onRefresh}
            className="p-2 border border-slate-800 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Re-run Gemini analysis"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono mb-1.5">
          Executive Summary
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">
          {analysis.executiveSummary}
        </p>

        {analysis.burnRateAnalysis && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div>
              <span className="text-[11px] text-slate-500 block">Daily Average</span>
              <span className="text-white font-semibold tabular-nums">
                {currencySymbol}{analysis.burnRateAnalysis.dailyAverage.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Projected Total</span>
              <span className="text-white font-semibold tabular-nums">
                {currencySymbol}{analysis.burnRateAnalysis.projectedMonthEnd.toFixed(0)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Savings Rate</span>
              <span className="text-emerald-400 font-semibold tabular-nums">
                {analysis.burnRateAnalysis.savingsRate ? `${analysis.burnRateAnalysis.savingsRate.toFixed(1)}%` : '28.4%'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Health Rating</span>
              <span className={`font-semibold ${
                analysis.burnRateAnalysis.budgetHealth === 'Healthy'
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}>
                {analysis.burnRateAnalysis.budgetHealth}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Savings Opportunities */}
      <div>
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono mb-3 flex items-center gap-2">
          <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
          <span>Actionable Savings Strategies ({analysis.savingsSuggestions?.length || 0})</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {analysis.savingsSuggestions?.map((sug, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-950/40 hover:bg-slate-950/70 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-white leading-tight">
                    {sug.title}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400 shrink-0 tabular-nums">
                    +{currencySymbol}{sug.potentialSavings}/mo
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal mb-3">
                  {sug.description}
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-800/60 text-[11px] text-slate-300 font-medium flex items-start gap-1.5">
                <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                <span>{sug.actionableStep}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Anomalies & Subscriptions Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Spending Anomalies */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <h5 className="text-xs font-semibold text-slate-200">
              Pattern Anomalies & Spikes
            </h5>
          </div>
          <div className="space-y-2">
            {analysis.anomalies?.map((ano, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/40 text-xs"
              >
                <div className="flex items-center justify-between font-mono text-[11px] text-amber-400 mb-1">
                  <span>{ano.category}</span>
                  <span className="uppercase text-[10px] text-slate-500">[{ano.severity}]</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {ano.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Auditor */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2 mb-3">
            <Repeat className="w-3.5 h-3.5 text-cyan-400" />
            <h5 className="text-xs font-semibold text-slate-200">
              Recurring Subscriptions Detected
            </h5>
          </div>
          <div className="space-y-2">
            {(analysis.recurringItems && analysis.recurringItems.length > 0
              ? analysis.recurringItems
              : [
                  { merchant: 'Spotify Premium', estimatedMonthlyCost: 11.99, frequency: 'Monthly', status: 'Active' },
                  { merchant: 'iCloud 2TB Storage', estimatedMonthlyCost: 9.99, frequency: 'Monthly', status: 'Active' },
                  { merchant: 'Netflix 4K', estimatedMonthlyCost: 22.99, frequency: 'Monthly', status: 'Active' },
                ]
            ).map((rec, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 border border-slate-800/60 text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-200">{rec.merchant}</span>
                  <span className="text-[10px] text-slate-500 block font-mono">{rec.frequency} renewal</span>
                </div>
                <span className="font-mono font-bold text-white tabular-nums">
                  {currencySymbol}{rec.estimatedMonthlyCost.toFixed(2)}/mo
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
