import React, { useState } from 'react';
import { 
  Server, 
  AlertTriangle, 
  Users, 
  Link2Off, 
  ShieldCheck, 
  Activity, 
  Layers, 
  Sparkles, 
  Database, 
  GitFork, 
  Maximize2, 
  Minimize2,
  Sun,
  Moon,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Building2
} from 'lucide-react';

export default function EnterprisePitchSlide({ onExploreSolution }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [previewTheme, setPreviewTheme] = useState('dark');

  return (
    <div className={`w-full transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 p-4 sm:p-8 bg-black/95 backdrop-blur-2xl flex items-center justify-center overflow-y-auto' : 'my-8'}`}>
      
      {/* 16:9 Presentation Slide Canvas */}
      <div className={`w-full max-w-7xl relative rounded-3xl overflow-hidden border border-[#1E293B] shadow-2xl transition-all duration-300 ${isFullscreen ? 'w-full max-w-7xl aspect-auto lg:aspect-[16/9]' : 'aspect-auto lg:aspect-[16/9]'} bg-[#0B0F19] text-slate-100 flex flex-col justify-between p-6 sm:p-8 lg:p-12 select-none group`}>
        
        {/* Subtle Background Precision Grid & Telemetry Glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Cyan to Violet Radial Glow Orbs */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/5 rounded-full blur-[120px]" />

          {/* Precision 32px Grid Lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="enterprise-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.75" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#enterprise-grid)" />
          </svg>

          {/* Interactive Knowledge Graph Node Traces */}
          <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <line x1="12%" y1="28%" x2="48%" y2="28%" stroke="#06B6D4" strokeWidth="1" strokeDasharray="3 4" />
            <line x1="48%" y1="28%" x2="88%" y2="28%" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="3 4" />
            <line x1="48%" y1="28%" x2="48%" y2="82%" stroke="#6366F1" strokeWidth="0.75" strokeDasharray="2 4" />
            
            {/* Pulsing Nodes */}
            <circle cx="12%" cy="28%" r="3" fill="#06B6D4" className="animate-ping" style={{ animationDuration: '3s' }} />
            <circle cx="12%" cy="28%" r="2" fill="#06B6D4" />
            <circle cx="48%" cy="28%" r="4" fill="#8B5CF6" />
            <circle cx="88%" cy="28%" r="3" fill="#EC4899" />
            <circle cx="48%" cy="82%" r="3" fill="#10B981" />
          </svg>
        </div>

        {/* ========================================================= */}
        {/* TOP BAR / TELEMETRY BADGES */}
        {/* ========================================================= */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1E293B]/80">
          
          {/* Top Left Badge Tag */}
          <div className="flex items-center space-x-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/60 text-cyan-400 text-[10px] font-mono font-bold tracking-widest uppercase shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>PROBLEM & MARKET DEFICIENCY // ENTERPRISE DECK</span>
            </div>
            <span className="hidden sm:inline-block text-[11px] font-mono text-slate-500 uppercase tracking-wider">
              VC Series A Pitch Slide • connectED
            </span>
          </div>

          {/* Top Right Controls & Shield Emblem */}
          <div className="flex items-center space-x-3 text-xs">
            
            {/* Verified Institution Shield Emblem */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-[#131B2E]/90 border border-[#233147] text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-semibold text-slate-300">ITS & Tier-1 Institutional Network</span>
            </div>

            {/* Subtle Light/Dark Theme Toggle Preview Button */}
            <button 
              onClick={() => setPreviewTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              title="Theme Preview Toggle"
              className="px-2.5 py-1 rounded-lg bg-[#162238] border border-[#253754] text-slate-300 hover:text-white transition flex items-center space-x-1.5 text-[11px] font-mono"
            >
              {previewTheme === 'dark' ? (
                <>
                  <Moon className="w-3 h-3 text-cyan-400" />
                  <span className="hidden sm:inline text-cyan-400">OBSIDIAN (#0B0F19)</span>
                </>
              ) : (
                <>
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline text-amber-400">ENTERPRISE SLATE</span>
                </>
              )}
            </button>

            {/* Expand / 16:9 Presentation Toggle Button */}
            <button 
              onClick={() => setIsFullscreen(prev => !prev)}
              className="p-1.5 rounded-lg bg-[#162238] border border-[#253754] text-slate-400 hover:text-white transition"
              title={isFullscreen ? "Exit Presentation Mode" : "Expand to 16:9 Presentation Slide"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* HEADER TYPOGRAPHY */}
        {/* ========================================================= */}
        <div className="relative z-10 py-6 sm:py-8 space-y-2">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-sans max-w-4xl leading-tight">
            The Problem: <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">Institutional Silos</span> & Stale Data Latency
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed font-normal">
            Legacy higher-education institutions face critical alumni telemetry loss, fragmented communication silos, and zero graph-based intelligence—leaving students stranded in unresponsive cold-outreach dead ends.
          </p>
        </div>

        {/* ========================================================= */}
        {/* THREE SYMMETRICAL FROSTED GLASSMORPHIC CARDS (3-CARD GRID) */}
        {/* ========================================================= */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 my-auto">
          
          {/* --------------------------------------------------------- */}
          {/* CARD 1: PROBLEM STATEMENT */}
          {/* --------------------------------------------------------- */}
          <div 
            onMouseEnter={() => setHoveredCard(1)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`rounded-2xl p-6 sm:p-7 border transition-all duration-300 flex flex-col justify-between backdrop-blur-xl relative overflow-hidden ${hoveredCard === 1 ? 'border-cyan-500/60 bg-gradient-to-b from-[#16243d]/90 to-[#0e1627]/95 shadow-[0_0_30px_rgba(6,182,212,0.15)] -translate-y-1' : 'border-[#1E293B] bg-gradient-to-b from-[#131B2E]/70 to-[#0B0F19]/80 shadow-lg'}`}
          >
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-cyan-400 to-transparent opacity-80" />

            <div className="space-y-4">
              {/* Card Header & Icon */}
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shadow-inner">
                  <Server className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400/90 font-bold px-2 py-0.5 rounded-full bg-cyan-950/50 border border-cyan-900/50">
                  Data Decay
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                  <span>Problem Statement</span>
                </h3>
                <p className="text-[11px] text-cyan-300/80 font-mono mt-0.5">SILOED METRICS & COLD OUTREACH</p>
              </div>

              <div className="space-y-3 pt-2 text-xs text-slate-300 leading-relaxed font-normal">
                <div className="flex items-start space-x-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-none" />
                  <span><strong>84% Annual Telemetry Decay:</strong> University databases go completely stale within 12–18 months of student graduation.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <XCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-none" />
                  <span><strong>Broken Cold-Outreach:</strong> Sub-3% reply rates across unverified cold emails and non-incentivized messages.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <Database className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-none" />
                  <span><strong>Departmental Silos:</strong> Placement cells, alumni offices, and academic faculty maintain isolated spreadsheets with zero bi-directional sync.</span>
                </div>
              </div>
            </div>

            {/* Bottom Metric Chips */}
            <div className="pt-6 border-t border-[#1E293B]/80 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-[#0F172A] border border-[#233147] text-rose-300 font-bold">
                84% Data Decay / Yr
              </span>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-[#0F172A] border border-[#233147] text-amber-300 font-bold">
                &lt;3% Reply Rate
              </span>
            </div>
          </div>

          {/* --------------------------------------------------------- */}
          {/* CARD 2: TARGET STAKEHOLDERS */}
          {/* --------------------------------------------------------- */}
          <div 
            onMouseEnter={() => setHoveredCard(2)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`rounded-2xl p-6 sm:p-7 border transition-all duration-300 flex flex-col justify-between backdrop-blur-xl relative overflow-hidden ${hoveredCard === 2 ? 'border-violet-500/60 bg-gradient-to-b from-[#1e1c3a]/90 to-[#0e1627]/95 shadow-[0_0_30px_rgba(139,92,246,0.15)] -translate-y-1' : 'border-[#1E293B] bg-gradient-to-b from-[#131B2E]/70 to-[#0B0F19]/80 shadow-lg'}`}
          >
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-400 to-transparent opacity-80" />

            <div className="space-y-4">
              {/* Card Header & Icon */}
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-violet-950/80 border border-violet-800/60 flex items-center justify-center text-violet-400 shadow-inner">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-violet-400/90 font-bold px-2 py-0.5 rounded-full bg-violet-950/50 border border-violet-900/50">
                  Tri-Party Nexus
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                  <span>Target Stakeholders</span>
                </h3>
                <p className="text-[11px] text-violet-300/80 font-mono mt-0.5">MULTI-ROLE ECOSYSTEM</p>
              </div>

              <div className="space-y-3 pt-2 text-xs text-slate-300 leading-relaxed font-normal">
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 mt-0.5 flex-none" />
                  <span><strong>Verified Students:</strong> Pre-placement candidates requiring objective skill benchmarks and institutional @its.edu.in access.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-none" />
                  <span><strong>Alumni Mentors:</strong> Bandwidth-constrained senior engineers (Google, Stripe) needing 1-click Telegram approvals.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-none" />
                  <span><strong>Institutional Placement Cells:</strong> Administrators demanding audit-ready verification and automated SLA enforcement.</span>
                </div>
              </div>
            </div>

            {/* Bottom Metric Chips */}
            <div className="pt-6 border-t border-[#1E293B]/80 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-[#0F172A] border border-[#233147] text-violet-300 font-bold">
                100% Verified Org Emails
              </span>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-[#0F172A] border border-[#233147] text-cyan-300 font-bold">
                Zero Portal Friction
              </span>
            </div>
          </div>

          {/* --------------------------------------------------------- */}
          {/* CARD 3: THE INCUMBENT FAILURE */}
          {/* --------------------------------------------------------- */}
          <div 
            onMouseEnter={() => setHoveredCard(3)}
            onMouseLeave={() => setHoveredCard(null)}
            className={`rounded-2xl p-6 sm:p-7 border transition-all duration-300 flex flex-col justify-between backdrop-blur-xl relative overflow-hidden ${hoveredCard === 3 ? 'border-rose-500/60 bg-gradient-to-b from-[#2b1828]/90 to-[#0e1627]/95 shadow-[0_0_30px_rgba(244,63,94,0.15)] -translate-y-1' : 'border-[#1E293B] bg-gradient-to-b from-[#131B2E]/70 to-[#0B0F19]/80 shadow-lg'}`}
          >
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-400 to-transparent opacity-80" />

            <div className="space-y-4">
              {/* Card Header & Icon */}
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400 shadow-inner">
                  <Link2Off className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400/90 font-bold px-2 py-0.5 rounded-full bg-rose-950/50 border border-rose-900/50">
                  Legacy Inefficiency
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                  <span>The Incumbent Failure</span>
                </h3>
                <p className="text-[11px] text-rose-300/80 font-mono mt-0.5">LINKEDIN & DIRECTORY DEFICIENCIES</p>
              </div>

              <div className="space-y-3 pt-2 text-xs text-slate-300 leading-relaxed font-normal">
                <div className="flex items-start space-x-2.5">
                  <XCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-none" />
                  <span><strong>LinkedIn Noise & Spam Bloat:</strong> Unverified skill endorsements, unmonitored inboxes, and zero institutional governance.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-none" />
                  <span><strong>Zero Knowledge-Graph Matching:</strong> Traditional directories lack semantic skill-gap models and deterministic match reasoning.</span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <Clock className="w-3.5 h-3.5 text-orange-400 mt-0.5 flex-none" />
                  <span><strong>Non-Automated Workflows:</strong> 5–7 day scheduling latency without SLA timeout enforcement or automated fallback routing.</span>
                </div>
              </div>
            </div>

            {/* Bottom Metric Chips */}
            <div className="pt-6 border-t border-[#1E293B]/80 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-[#0F172A] border border-[#233147] text-rose-400 font-bold">
                5–7 Day Latency
              </span>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-[#0F172A] border border-[#233147] text-amber-400 font-bold">
                0% SLA Enforcement
              </span>
            </div>
          </div>

        </div>

        {/* ========================================================= */}
        {/* BOTTOM TELEMETRY DOCK */}
        {/* ========================================================= */}
        <div className="relative z-10 pt-6 mt-6 border-t border-[#1E293B]/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          
          {/* Real-time Telemetry Metrics */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-300">TELEMETRY: <strong className="text-emerald-400 font-bold">ACTIVE</strong></span>
            </span>
            <span className="text-slate-600">•</span>
            <span>GRAPH MATCH LATENCY: <strong className="text-cyan-400">&lt;12ms</strong></span>
            <span className="text-slate-600">•</span>
            <span>SLA TIMEOUT: <strong className="text-indigo-400">48H PROTOCOL</strong></span>
            <span className="text-slate-600">•</span>
            <span>n8n AUTOMATION: <strong className="text-violet-400">SYNCED</strong></span>
          </div>

          {/* Action Callout */}
          {onExploreSolution && (
            <button 
              onClick={onExploreSolution}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition flex items-center space-x-2 active:scale-95"
            >
              <span>Explore connectED Solution Architecture</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

        </div>

      </div>

    </div>
  );
}
