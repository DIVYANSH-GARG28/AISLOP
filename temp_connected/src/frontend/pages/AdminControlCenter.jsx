import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Server, 
  Activity, 
  Sparkles, 
  Database,
  UserCheck,
  Building2,
  RefreshCw,
  Search
} from 'lucide-react';

export default function AdminControlCenter({ user, onOpenAI }) {
  const [verifications, setVerifications] = useState([
    { id: 'v1', name: 'Vikram Patel', role: 'Senior SWE @ Google', year: 2020, company: 'Google', status: 'PENDING' },
    { id: 'v2', name: 'Ananya Nair', role: 'Data Engineer @ Amazon', year: 2019, company: 'Amazon', status: 'PENDING' }
  ]);

  const handleVerify = (id) => {
    setVerifications(prev => prev.map(v => v.id === id ? { ...v, status: 'VERIFIED' } : v));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
      {/* 1. Header Banner */}
      <div className="pro-card p-6 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="relative flex-none w-16 h-16 sm:w-20 sm:h-20">
            <img 
              src={user?.avatar || 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250'} 
              alt={user?.name || 'Platform Admin'} 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-purple-500 shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 bg-purple-500 text-white p-1 rounded-full text-xs shadow" title="Platform Administrator">
              <ShieldCheck className="w-3.5 h-3.5 stroke-[3]" />
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{user?.name || 'Dr. Sarah Chen'}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                ADMINISTRATOR
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Head of Alumni Relations & Platform Admin • KCE Institute
            </p>
            <div className="flex items-center space-x-2 text-xs font-bold pt-0.5">
              <span className="text-slate-500 dark:text-slate-400">System Status:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> 100% Operational (Node.js + PostgreSQL + FastAPI)
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={onOpenAI}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-md flex-none"
        >
          <Sparkles className="w-4 h-4 text-indigo-100" />
          <span>AI Platform Audit</span>
        </button>
      </div>

      {/* 2. Top Metric KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="pro-card p-4 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Users</span>
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">1,240 Users</div>
          <p className="text-[11px] text-slate-500 font-medium">1,080 Students • 160 Alumni</p>
        </div>

        <div className="pro-card p-4 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Verified Alumni</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">158 Verified</div>
          <p className="text-[11px] text-slate-500 font-medium">98.7% Verification Rate</p>
        </div>

        <div className="pro-card p-4 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Mentorships Active</span>
            <UserCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">342 Sessions</div>
          <p className="text-[11px] text-slate-500 font-medium">System Design & AI Prep</p>
        </div>

        <div className="pro-card p-4 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">System Health</span>
            <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">99.9% Uptime</div>
          <p className="text-[11px] text-slate-500 font-medium">PostgreSQL + Express</p>
        </div>
      </div>

      {/* 3. Verification Queue & Service Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alumni Verification Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="pro-card p-6 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#233147] pb-3">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Alumni Verification Queue</span>
              </h2>
              <span className="text-xs text-slate-400 font-bold">2 Pending Approvals</span>
            </div>

            <div className="space-y-3">
              {verifications.map(v => (
                <div key={v.id} className="p-4 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] flex items-center justify-between gap-4">
                  <div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white">{v.name}</div>
                    <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{v.role}</div>
                    <div className="text-[11px] text-slate-400">KCE Class of {v.year}</div>
                  </div>

                  {v.status === 'VERIFIED' ? (
                    <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified Badge Issued</span>
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleVerify(v.id)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition"
                    >
                      Approve Verification
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Backend & DB Health Monitor */}
        <div className="space-y-4">
          <div className="pro-card p-6 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <Server className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Service Health Monitor</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">Express REST API (:5000)</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">HEALTHY</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">Prisma PostgreSQL DB</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">CONNECTED</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">FastAPI AI Engine (:8000)</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
