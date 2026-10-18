import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Bell, 
  Bot, 
  GraduationCap,
  ShieldCheck,
  LogOut,
  User,
  Settings,
  Target,
  ChevronDown,
  Sun,
  Moon,
  Menu,
  Layers,
  Briefcase,
  Sparkles
} from 'lucide-react';

export default function Navbar({ 
  onToggleAIAssistant, 
  activeUser, 
  isAuthenticated, 
  onOpenAuth, 
  onLogout,
  onNavigateTab,
  onOpenEditProfile,
  onOpenProModal,
  onOpenRAGModal,
  theme = 'dark',
  onToggleTheme,
  onToggleMobileMenu,
  notifications = [],
  onMarkAllNotificationsRead,
  onSelectNotification
}) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="flex-none z-30 w-full bg-[#FBF9F5] dark:bg-[#111215] border-b-2 border-black dark:border-white/20 px-4 lg:px-8 py-2.5 flex items-center justify-between transition-colors duration-200">
      {/* Brand & Search Command */}
      <div className="flex items-center space-x-4">
        {isAuthenticated && (
          <button 
            onClick={onToggleMobileMenu}
            className="p-1.5 rounded-xl text-black dark:text-white md:hidden hover:bg-black/5 dark:hover:bg-white/10 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#E2F952]"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5 text-black dark:text-white" />
          </button>
        )}
        
        <div 
          onClick={() => onNavigateTab ? onNavigateTab('dashboard') : null}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="h-9 w-9 rounded-xl bg-black dark:bg-[#E2F952] border-2 border-black flex items-center justify-center text-white dark:text-black shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#E2F952] flex-none group-hover:-translate-y-0.5 transition">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display text-xl sm:text-2xl font-normal tracking-tight text-black dark:text-white">
                Connect<i className="font-normal italic">Ed</i>
              </span>
              <span className="studio-tag">
                EDITION // 2026
              </span>
            </div>
          </div>
        </div>

        {/* Studio-Style Search & Command Hint */}
        <button 
          onClick={onToggleAIAssistant}
          className="hidden md:flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#181A20] hover:bg-[#F7F4EE] dark:hover:bg-[#20232B] border-2 border-black dark:border-white/80 shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#E2F952] text-xs text-stone-600 dark:text-stone-300 transition"
          title="Open AI Command Search (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-stone-500" />
          <span className="text-[11px] font-mono font-medium">Search index: jobs, mentors, roadmaps...</span>
          <span className="kbd-chip">Ctrl K</span>
        </button>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center space-x-2 sm:space-x-2.5 flex-none">
        {/* Live Jobs & Placement Radar Pill */}
        <button 
          onClick={() => {
            if (isAuthenticated && onNavigateTab) {
              onNavigateTab('jobs');
            } else {
              const el = document.getElementById('live-jobs-radar');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#181A20] hover:bg-[#F7F4EE] dark:hover:bg-[#20232B] border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#E2F952] transition flex items-center space-x-2 text-xs font-mono font-bold text-black dark:text-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          title="Live Campus & Alumni Opportunities"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-none" />
          <span className="hidden sm:inline">Jobs Radar</span>
          <span className="editorial-lime-badge">
            18 Live
          </span>
        </button>

        {/* ConnectEd Pro Plan Badge & RAG Launcher Button */}
        <button 
          onClick={onOpenProModal}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#E2F952] hover:bg-[#D4F63D] text-black border-2 border-black shadow-[3px_3px_0px_0px_#000] font-mono font-bold text-xs transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          title="ConnectEd Pro: 12h Priority SLA & Resume RAG Chatbot"
        >
          <Sparkles className="w-3.5 h-3.5 text-black flex-none" />
          <span>{activeUser?.isPro ? 'Pro Active' : 'Pro Plan'}</span>
          <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded bg-black text-[#E2F952]">
            {activeUser?.isPro ? '★' : 'NEW'}
          </span>
        </button>

        {/* Resume RAG Copilot Direct Launcher */}
        {onOpenRAGModal && (
          <button 
            onClick={onOpenRAGModal}
            className="hidden md:inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-900 dark:text-violet-200 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#E2F952] font-mono font-bold text-xs transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            title="Open Resume RAG AI Co-pilot"
          >
            <Bot className="w-3.5 h-3.5 text-violet-700 dark:text-violet-300" />
            <span>RAG AI</span>
          </button>
        )}

        {/* VC Pitch Deck // Arch button */}
        <button 
          onClick={() => {
            if (isAuthenticated && onNavigateTab) {
              onNavigateTab('enterprise');
            } else {
              const el = document.getElementById('enterprise-pitch-deck');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }}
          className="hidden lg:flex px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#181A20] hover:bg-[#F7F4EE] dark:hover:bg-[#20232B] text-black dark:text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#E2F952] transition items-center space-x-1.5 text-xs font-mono font-bold"
          title="Enterprise VC Pitch Deck & Architecture Slide"
        >
          <Layers className="w-3.5 h-3.5 text-black dark:text-white" />
          <span className="text-[11px] uppercase tracking-wider">VC Deck</span>
        </button>

        {/* Light / Dark Theme Switcher Button */}
        <button 
          onClick={onToggleTheme}
          className="p-2 rounded-xl bg-white dark:bg-[#181A20] text-black dark:text-white hover:bg-[#F7F4EE] dark:hover:bg-[#20232B] border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#E2F952] transition flex items-center active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#E2F952]" />
          ) : (
            <Moon className="w-4 h-4 text-black" />
          )}
        </button>

        {/* AI Copilot Button */}
        <button 
          onClick={onToggleAIAssistant}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#E2F952] font-mono font-bold text-xs transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          title="Open AI Career Copilot"
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>

        {/* Notifications Button & Dropdown Menu */}
        <div ref={notifRef} className="relative">
          <button 
            onClick={() => setIsNotificationsOpen(prev => !prev)}
            aria-label="View notifications"
            className="relative p-2 rounded-xl text-black dark:text-white hover:bg-[#F7F4EE] dark:hover:bg-[#20232B] bg-white dark:bg-[#181A20] border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#E2F952] transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 bg-[#E2F952] text-black border border-black rounded-full text-[9px] font-mono font-extrabold flex items-center justify-center shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] rounded-2xl shadow-2xl p-4 space-y-3 text-xs animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#233147] pb-2.5">
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => {
                      if (onMarkAllNotificationsRead) onMarkAllNotificationsRead();
                    }}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 space-y-1">
                    <Bell className="w-6 h-6 mx-auto stroke-1" />
                    <p className="text-xs font-medium">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        if (onSelectNotification) onSelectNotification(n);
                      }}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-start space-x-3 ${
                        !n.read 
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60' 
                          : 'bg-slate-50/60 dark:bg-[#0d131f] border-slate-200/60 dark:border-[#233147] opacity-80'
                      }`}
                    >
                      <div className="h-8 w-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-none mt-0.5">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 dark:text-white truncate">{n.title}</span>
                          <span className="text-[10px] text-slate-400 flex-none ml-2">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Auth / Profile Controls */}
        {isAuthenticated && activeUser ? (
          <div ref={menuRef} className="relative pl-2 border-l border-slate-200 dark:border-[#253349]">
            <button 
              onClick={() => setIsProfileMenuOpen(prev => !prev)}
              className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1f2d45] transition"
            >
              <img 
                src={activeUser.avatar || activeUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'} 
                alt={activeUser.name}
                className="w-8 h-8 rounded-xl object-cover ring-2 ring-indigo-500/40" 
              />
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center">
                  {activeUser.name}
                  <ShieldCheck className="w-3.5 h-3.5 ml-1 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">KCE • Class of {activeUser?.graduationYear || 2026}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 top-12 z-50 w-60 bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] rounded-2xl shadow-xl p-2 space-y-1 text-xs animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-[#233147]">
                  <div className="font-bold text-slate-900 dark:text-white">{activeUser.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{activeUser.email}</div>
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-0.5 capitalize">{activeUser.role} • {activeUser.university || 'KCE'}</div>
                </div>

                <button 
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    if (onOpenEditProfile) onOpenEditProfile();
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1f2d45] text-slate-800 dark:text-slate-200 text-left font-bold transition"
                >
                  <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>View & Edit Full Profile</span>
                </button>

                <button 
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onNavigateTab('goal');
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1f2d45] text-slate-800 dark:text-slate-200 text-left font-bold transition"
                >
                  <Target className="w-4 h-4 text-slate-400" />
                  <span>Career Goal Setup</span>
                </button>

                <div className="pt-1 border-t border-slate-100 dark:border-[#233147]">
                  <button 
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-left font-bold transition"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-[#253349]">
            <button 
              onClick={() => onOpenAuth('login')}
              className="px-3.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1f2d45] font-bold text-xs border border-slate-200 dark:border-[#253349] transition"
            >
              Sign In
            </button>
            <button 
              onClick={() => onOpenAuth('register')}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition"
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
