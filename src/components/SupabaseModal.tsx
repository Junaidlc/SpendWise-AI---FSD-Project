import React, { useState } from 'react';
import {
  Database,
  X,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Layers,
  Terminal,
  RotateCcw,
} from 'lucide-react';
import { SupabaseConfig } from '../types/finance';
import { saveSupabaseConfig, generatePostgresSchemaSql } from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SupabaseConfig;
  onConfigUpdated: (newConfig: SupabaseConfig) => void;
  onResetToDefaults: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigUpdated,
  onResetToDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<'connection' | 'sql' | 'architecture'>('connection');
  const [url, setUrl] = useState(config.url || '');
  const [anonKey, setAnonKey] = useState(config.anonKey || '');
  const [copiedSql, setCopiedSql] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveSupabaseConfig(url, anonKey);
    onConfigUpdated(updated);
    setSaveMessage(updated.isConnected ? 'Connected to Supabase project!' : 'Saved in local PostgreSQL mode');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const sqlCode = generatePostgresSchemaSql();

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Supabase & PostgreSQL Integration
              </h3>
              <p className="text-xs text-slate-400">
                Persistent relational data storage, authentication, and SQL schema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-800/80 flex items-center gap-2 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('connection')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'connection'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Project Connection
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'sql'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PostgreSQL Schema (SQL Editor)
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'architecture'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Stack Synergy & Vercel Deploy
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'connection' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${config.isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Current Database Status: {config.isConnected ? 'Cloud Supabase PostgreSQL' : 'Local PostgreSQL Mode'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {config.isConnected
                        ? `Synchronized with ${config.url}`
                        : 'Operating in high-speed zero-friction embedded mode with localStorage persistence.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onResetToDefaults}
                  className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white border border-slate-800 rounded-lg bg-slate-900 hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Reset sample seed transactions"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Seed Data</span>
                </button>
              </div>

              <form onSubmit={handleSaveConnection} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://your-project.supabase.co"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Supabase Anon Public API Key
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/60"
                  />
                </div>

                {saveMessage && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{saveMessage}</span>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Save & Connect Supabase
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    PostgreSQL Table Definitions & RLS Policies
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Paste this directly into your Supabase Dashboard SQL Editor to instantiate all tables.
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[360px] leading-relaxed">
                <code>{sqlCode}</code>
              </pre>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>How the Tech Stack Works Together</span>
                </h4>
                <ul className="space-y-2 text-slate-400">
                  <li>
                    <strong className="text-white">React.js:</strong> Renders the real-time financial interface, state management, modal workflows, and responsive dashboard.
                  </li>
                  <li>
                    <strong className="text-white">Supabase (PostgreSQL):</strong> Stores expenses, category budgets, savings goals, and user profiles securely with Row Level Security (RLS).
                  </li>
                  <li>
                    <strong className="text-white">Google Gemini API:</strong> Uses <code className="text-emerald-400 font-mono">gemini-3.8-flash</code> via server-side proxy to parse natural language inputs, analyze spending velocity, and provide personalized saving strategies.
                  </li>
                  <li>
                    <strong className="text-white">Recharts:</strong> Renders interactive SVG area curves, donut charts, and comparative budget bar charts.
                  </li>
                  <li>
                    <strong className="text-white">Vercel:</strong> Hosts the production web build with continuous deployment connected to your GitHub repository.
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2 font-mono text-[11px]">
                <h5 className="text-xs font-bold text-white font-sans flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Vercel Deployment Environment Variables</span>
                </h5>
                <p className="text-slate-400 font-sans text-xs">
                  Configure these in your Vercel Project Settings &gt; Environment Variables:
                </p>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <div><span className="text-emerald-400">GEMINI_API_KEY</span>="AIzaSy..."</div>
                  <div><span className="text-emerald-400">VITE_SUPABASE_URL</span>="https://xyz.supabase.co"</div>
                  <div><span className="text-emerald-400">VITE_SUPABASE_ANON_KEY</span>="eyJhbGciOi..."</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
