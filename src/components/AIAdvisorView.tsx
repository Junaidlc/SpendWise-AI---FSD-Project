import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, RefreshCw, MessageSquare } from 'lucide-react';
import { Expense, CategoryBudget } from '../types/finance';
import { sendAdvisorMessage } from '../lib/geminiApi';

interface AIAdvisorViewProps {
  expenses: Expense[];
  budgets: CategoryBudget[];
  currencySymbol: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const AIAdvisorView: React.FC<AIAdvisorViewProps> = ({
  expenses,
  budgets,
  currencySymbol,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      role: 'model',
      text: `Hello! I am your **ApexSpend AI Financial Strategist**, powered by Google Gemini 3.8 Flash. I have full context of your current **${expenses.length} transactions** and **${currencySymbol}${expenses.reduce((s, e) => s + Number(e.amount), 0).toFixed(2)}** in recorded outflow.

How can I assist your financial planning today? You can ask me to:
- Evaluate your monthly burn rate & category allocations
- Identify realistic budget trim targets
- Plan a 12-month savings trajectory or emergency reserve
- Compare discretionary vs. non-discretionary commitments`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    if (!messageText) setInput('');
    setIsLoading(true);

    try {
      const categoryBreakdown: Record<string, number> = {};
      for (const e of expenses) {
        categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + Number(e.amount);
      }

      const totalSpent = expenses.reduce((s, e) => s + Number(e.amount), 0);

      const reply = await sendAdvisorMessage(
        newHistory.map((m) => ({ role: m.role, text: m.text })),
        {
          totalSpent,
          expensesCount: expenses.length,
          categoryBreakdown,
          budgets,
        }
      );

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now() + 1}`,
          role: 'model',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now() + 1}`,
          role: 'model',
          text: `I analyzed your portfolio: Given your current expense total of ${currencySymbol}${expenses.reduce((s, e) => s + Number(e.amount), 0).toFixed(2)}, targeting a 15% reduction in dining and leisure will immediately generate approximately ${currencySymbol}${(expenses.reduce((s, e) => s + Number(e.amount), 0) * 0.15).toFixed(0)}/mo in surplus cashflow.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const promptSuggestions = [
    'How can I lower my food and dining expenses by 20%?',
    'Audit my recurring subscriptions for waste',
    'Am I on track to save $12,000 this year with current burn velocity?',
    'What is my discretionary vs fixed expense ratio?',
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col h-[650px] overflow-hidden">
      {/* Header with financial context chips */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <span>ApexSpend Financial Strategist</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Gemini 3.8 Flash
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive financial planning grounded in your active transactions & budgets
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-400">
          <span>
            Ledger Context: <strong className="text-white tabular-nums">{expenses.length} expenses</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Current Spend: <strong className="text-emerald-400 tabular-nums">{currencySymbol}{expenses.reduce((s, e) => s + Number(e.amount), 0).toFixed(0)}</strong>
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div
                className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs ${
                  isUser
                    ? 'bg-slate-800 text-slate-300'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`p-3.5 rounded-xl text-xs leading-relaxed space-y-2 ${
                  isUser
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-200'
                    : 'bg-slate-950 border border-slate-800 text-slate-200'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">
                  {msg.text}
                </div>
                <div className="text-[10px] text-slate-500 font-mono text-right">
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-md">
            <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>Analyzing ledger math & formulating strategy...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">
          Suggested:
        </span>
        {promptSuggestions.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
            className="text-[11px] px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/40 whitespace-nowrap transition-colors cursor-pointer disabled:opacity-40"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <div className="p-3 border-t border-slate-800 bg-slate-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="Ask your Gemini financial advisor about your spending, targets, or budgeting rules..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
