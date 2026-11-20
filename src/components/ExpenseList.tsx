import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Receipt,
  Download,
  Calendar,
  CreditCard,
  Tag,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react';
import { Expense, CategoryName } from '../types/finance';

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  currencySymbol: string;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  onDeleteExpense,
  currencySymbol,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [selectedExpenseForModal, setSelectedExpenseForModal] = useState<Expense | null>(null);

  // Available categories in the dataset
  const categories = useMemo(() => {
    const set = new Set(expenses.map((e) => e.category));
    return ['All', ...Array.from(set)];
  }, [expenses]);

  // Filtered & Sorted Expenses
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
        const matchesSearch =
          !searchQuery.trim() ||
          e.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (e.tags && e.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'amount-desc') return b.amount - a.amount;
        if (sortBy === 'amount-asc') return a.amount - b.amount;
        return 0;
      });
  }, [expenses, searchQuery, selectedCategory, sortBy]);

  // CSV Export
  const exportToCsv = () => {
    const headers = ['ID', 'Date', 'Merchant', 'Amount', 'Category', 'PaymentMethod', 'Notes', 'Tags'];
    const rows = filteredExpenses.map((e) => [
      e.id,
      e.date,
      `"${e.merchant.replace(/"/g, '""')}"`,
      e.amount,
      `"${e.category}"`,
      `"${e.paymentMethod}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
      `"${(e.tags || []).join(';')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `apexspend_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 md:max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search merchants, items, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[40px] sm:min-h-0 bg-slate-900/90 border border-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="min-h-[40px] sm:min-h-0 bg-slate-900/90 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
          >
            {categories.map((c) => (
              <option key={c} value={c} className="bg-slate-900">
                {c === 'All' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-400 flex-1 sm:flex-initial">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full sm:w-auto min-h-[40px] sm:min-h-0 bg-slate-900/90 border border-slate-800 rounded-lg py-1.5 px-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>

          <button
            onClick={exportToCsv}
            className="min-h-[40px] sm:min-h-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="md:hidden divide-y divide-slate-800/70">
        {filteredExpenses.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-500">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-sm font-medium text-slate-400">No matching expenses found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search filters or add a new transaction.</p>
          </div>
        ) : (
          filteredExpenses.map((expense) => (
            <div key={expense.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-white truncate">
                    {expense.merchant}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span>{expense.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{expense.date}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 font-mono font-bold tabular-nums text-sm text-white">
                  {currencySymbol}
                  {Number(expense.amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>

              {expense.notes && (
                <p className="text-xs text-slate-400 line-clamp-2">{expense.notes}</p>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <CreditCard className="w-3 h-3 text-slate-500" />
                  <span>{expense.paymentMethod}</span>
                  {expense.isRecurring && (
                    <span className="text-[10px] text-emerald-400/90 font-mono">(Recurring)</span>
                  )}
                </span>

                <div className="flex items-center gap-1">
                  {expense.items && expense.items.length > 0 && (
                    <button
                      onClick={() => setSelectedExpenseForModal(expense)}
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 transition-colors cursor-pointer"
                      title="View receipt breakdown"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteExpense(expense.id)}
                    className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800/60 transition-colors cursor-pointer"
                    title="Delete expense"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop High-Density Data Grid (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-[11px]">
              <th className="py-2.5 px-4 font-medium">Merchant & Description</th>
              <th className="py-2.5 px-4 font-medium">Category</th>
              <th className="py-2.5 px-4 font-medium">Date</th>
              <th className="py-2.5 px-4 font-medium">Payment Rail</th>
              <th className="py-2.5 px-4 font-medium text-right">Amount</th>
              <th className="py-2.5 px-4 font-medium text-center w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                  <p className="text-sm font-medium text-slate-400">No matching expenses found</p>
                  <p className="text-xs text-slate-500 mt-1">Try adjusting your search filters or add a new transaction.</p>
                </td>
              </tr>
            ) : (
              filteredExpenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  {/* Merchant & details with clean unboxed metadata */}
                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                      {expense.merchant}
                    </div>
                    {expense.notes && (
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                        {expense.notes}
                      </div>
                    )}
                    {expense.tags && expense.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                        {expense.tags.map((tag, i) => (
                          <React.Fragment key={tag}>
                            <span>#{tag}</span>
                            {i < (expense.tags?.length || 0) - 1 && <span aria-hidden="true">·</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Category */}
                  <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">
                    {expense.category}
                  </td>

                  {/* Date */}
                  <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {expense.date}
                  </td>

                  {/* Payment Method */}
                  <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3 h-3 text-slate-500" />
                      <span>{expense.paymentMethod}</span>
                      {expense.isRecurring && (
                        <span className="text-[10px] text-emerald-400/90 font-mono">
                          (Recurring)
                        </span>
                      )}
                    </span>
                  </td>

                  {/* Amount (right-aligned, tabular figures) */}
                  <td className="py-2.5 px-4 text-right font-mono font-bold tabular-nums text-white whitespace-nowrap">
                    {currencySymbol}
                    {Number(expense.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {expense.items && expense.items.length > 0 && (
                        <button
                          onClick={() => setSelectedExpenseForModal(expense)}
                          className="p-1 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                          title="View receipt breakdown"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteExpense(expense.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary */}
      <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
        <span>
          Showing {filteredExpenses.length} of {expenses.length} records
        </span>
        <span className="font-mono">
          Subtotal: <strong className="text-white tabular-nums">{currencySymbol}{filteredExpenses.reduce((s, e) => s + Number(e.amount), 0).toFixed(2)}</strong>
        </span>
      </div>

      {/* Line Item Receipt Modal */}
      {selectedExpenseForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-semibold text-white">
                Itemized Receipt: {selectedExpenseForModal.merchant}
              </h4>
              <button
                onClick={() => setSelectedExpenseForModal(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="py-3 space-y-2 max-h-60 overflow-y-auto">
              {selectedExpenseForModal.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-800/60 font-mono">
                  <span className="text-slate-300">{item.name}</span>
                  <span className="text-white font-bold tabular-nums">
                    {currencySymbol}{item.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-800 flex justify-between font-mono text-xs">
              <span className="text-slate-400 font-semibold">Total Paid</span>
              <span className="text-emerald-400 font-bold tabular-nums text-sm">
                {currencySymbol}{Number(selectedExpenseForModal.amount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
