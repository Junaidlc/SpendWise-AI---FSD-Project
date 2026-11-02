import React, { useState } from 'react';
import { Target, Plus, ShieldCheck, Plane, TrendingUp, Sparkles, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SavingsGoal } from '../types/finance';

interface SavingsGoalsProps {
  goals: SavingsGoal[];
  onAddContribution: (goalId: string, amount: number) => void;
  onCreateGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  currencySymbol: string;
}

export const SavingsGoals: React.FC<SavingsGoalsProps> = ({
  goals,
  onAddContribution,
  onCreateGoal,
  currencySymbol,
}) => {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [contributionInput, setContributionInput] = useState<string>('250');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // New goal form state
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newCurrent, setNewCurrent] = useState('0');
  const [newDate, setNewDate] = useState('2026-12-31');

  const handleDeposit = (goal: SavingsGoal) => {
    const val = parseFloat(contributionInput);
    if (!isNaN(val) && val > 0) {
      onAddContribution(goal.id, val);
      // Trigger confetti celebration!
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10B981', '#6366F1', '#F59E0B'],
      });
      setSelectedGoalId(null);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseFloat(newTarget);
    if (!newTitle.trim() || isNaN(targetVal) || targetVal <= 0) return;

    onCreateGoal({
      title: newTitle.trim(),
      targetAmount: targetVal,
      currentAmount: parseFloat(newCurrent) || 0,
      targetDate: newDate,
      category: 'Savings',
      iconName: 'Target',
    });

    setNewTitle('');
    setNewTarget('');
    setIsCreatingNew(false);
  };

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Target Savings Goals & Milestones
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Track funded capital against targeted future liquidity commitments
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right font-mono text-xs">
            <span className="text-[11px] text-slate-500 block">Total Funded</span>
            <span className="text-sm font-bold text-emerald-400 tabular-nums">
              {currencySymbol}{totalSaved.toLocaleString()} / {currencySymbol}{totalTarget.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => setIsCreatingNew(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Goal</span>
          </button>
        </div>
      </div>

      {/* New Goal Modal/Card */}
      {isCreatingNew && (
        <form onSubmit={handleCreateSubmit} className="p-4 rounded-xl border border-slate-700 bg-slate-950/80 space-y-3">
          <h4 className="text-xs font-semibold text-white">Create Targeted Savings Goal</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="Goal Title (e.g. Down Payment)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
            />
            <input
              type="number"
              required
              placeholder={`Target Amount (${currencySymbol})`}
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
            />
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg"
            >
              Save Goal
            </button>
          </div>
        </form>
      )}

      {/* Goals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          const isDepositOpen = selectedGoalId === goal.id;

          return (
            <div
              key={goal.id}
              className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Target className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                    {progress.toFixed(0)}%
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mb-1">
                  {goal.title}
                </h4>
                <p className="text-[11px] text-slate-400 font-mono">
                  Target Date: {goal.targetDate}
                </p>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden my-3">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Current</span>
                    <span className="text-white font-bold tabular-nums">
                      {currencySymbol}{goal.currentAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Target</span>
                    <span className="text-slate-400 tabular-nums">
                      {currencySymbol}{goal.targetAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deposit Quick Action */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                {isDepositOpen ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={contributionInput}
                        onChange={(e) => setContributionInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                        placeholder="Deposit amount"
                      />
                      <button
                        onClick={() => handleDeposit(goal)}
                        className="px-3 py-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold rounded cursor-pointer whitespace-nowrap"
                      >
                        Contribute
                      </button>
                    </div>
                    <button
                      onClick={() => setSelectedGoalId(null)}
                      className="text-[11px] text-slate-500 hover:text-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedGoalId(goal.id);
                      setContributionInput('100');
                    }}
                    className="w-full py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3 h-3 text-emerald-400" />
                    <span>Contribute Funds</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
