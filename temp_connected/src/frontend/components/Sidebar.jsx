import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  Compass, 
  UserCheck, 
  Bot, 
  CheckCircle2, 
  User, 
  MessageSquare, 
  X,
  GraduationCap,
  Building2,
  Layers,
  Briefcase,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onOpenAI, isMobileOpen, onCloseMobile, activeUser }) {
  const userRole = (activeUser?.role || 'student').toLowerCase();

  const enterpriseSection = {
    index: 'IV',
    title: 'Enterprise Architecture',
    items: [
      { id: 'enterprise', num: '10', label: 'VC Deck // Arch', icon: Layers, badge: '16:9' }
    ]
  };

  const studentSections = [
    {
      index: 'I',
      title: 'Career & Opportunities',
      items: [
        { id: 'dashboard', num: '01', label: 'Dashboard', icon: LayoutDashboard, badge: null },
        { id: 'jobs', num: '02', label: 'Live Jobs Radar', icon: Briefcase, badge: '18 Live' },
        { id: 'institute', num: '03', label: 'Institute Hub', icon: GraduationCap, badge: activeUser?.is_institution_verified ? 'Verified' : 'Verify' },
        { id: 'goal', num: '04', label: 'Goals & Benchmarks', icon: Target, badge: null },
        { id: 'roadmap', num: '05', label: 'Career Roadmap', icon: Compass, badge: 'Active' },
      ]
    },
    {
      index: 'II',
      title: 'Network & Mentorship',
      items: [
        { id: 'alumni', num: '06', label: 'Alumni Directory', icon: Users, badge: 'Match' },
        { id: 'mentors', num: '07', label: 'Mentor Matching', icon: UserCheck, badge: 'Match' },
        { id: 'messages', num: '08', label: 'Outreach & Chat', icon: MessageSquare, badge: 'Chat' },
      ]
    },
    {
      index: 'III',
      title: 'Dossier & Settings',
      items: [
        { id: 'profile', num: '09', label: 'Candidate Profile', icon: User, badge: 'Edit' }
      ]
    },
    enterpriseSection
  ];

  const alumniSections = [
    {
      index: 'I',
      title: 'Alumni Portal',
      items: [
        { id: 'dashboard', num: '01', label: 'Alumni Overview', icon: LayoutDashboard, badge: 'Portal' },
        { id: 'jobs', num: '02', label: 'Live Jobs Radar', icon: Briefcase, badge: 'Refer' },
        { id: 'alumni', num: '03', label: 'Alumni Network', icon: Users, badge: null },
        { id: 'mentors', num: '04', label: 'Session Requests', icon: UserCheck, badge: 'Pending' },
        { id: 'messages', num: '05', label: 'Student Messages', icon: MessageSquare, badge: 'Chat' },
      ]
    },
    {
      index: 'II',
      title: 'Account Settings',
      items: [
        { id: 'profile', num: '06', label: 'Mentor Dossier', icon: User, badge: 'Edit' }
      ]
    },
    enterpriseSection
  ];

  const adminSections = [
    {
      index: 'I',
      title: 'Control Center',
      items: [
        { id: 'dashboard', num: '01', label: 'Platform Telemetry', icon: LayoutDashboard, badge: 'Admin' },
        { id: 'jobs', num: '02', label: 'Manage Jobs & Radar', icon: Briefcase, badge: 'Drives' },
        { id: 'alumni', num: '03', label: 'Alumni Directory', icon: Users, badge: 'Verify' },
        { id: 'mentors', num: '04', label: 'Mentor Directory', icon: UserCheck, badge: null },
      ]
    },
    {
      index: 'II',
      title: 'Administration',
      items: [
        { id: 'profile', num: '05', label: 'Admin Settings', icon: User, badge: 'Manage' }
      ]
    },
    enterpriseSection
  ];

  const sections = userRole === 'alumni' ? alumniSections : userRole === 'admin' ? adminSections : studentSections;

  const sidebarContent = (
    <aside className="w-68 min-w-[17rem] h-full flex-none bg-[#FBF9F5] dark:bg-[#111215] border-r-2 border-black dark:border-[#292C36] flex flex-col justify-between p-4 select-none overflow-y-auto transition-colors duration-200">
      <div className="space-y-6">
        {/* Mobile Header with Close button */}
        <div className="flex md:hidden items-center justify-between pb-3 border-b-2 border-black dark:border-white">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 bg-[#E2F952] text-black border border-black rounded shadow-[1px_1px_0px_0px_#000]">
              INDEX
            </span>
            <span className="font-display font-bold text-base text-black dark:text-white">Navigation</span>
          </div>
          <button 
            onClick={onCloseMobile}
            className="p-1 rounded-lg border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Studio Catalogue Index Header */}
        <div className="hidden md:flex items-center justify-between pb-3 border-b-2 border-black dark:border-[#292C36]">
          <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            [ SECTOR DIRECTORY ]
          </span>
          <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-black dark:bg-white text-white dark:text-black">
            2026 // ED-01
          </span>
        </div>

        {sections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center space-x-2 px-1">
              <span className="font-mono text-[10px] font-extrabold text-slate-400 dark:text-slate-500">
                {section.index}
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {section.title}
              </span>
            </div>

            <nav className="space-y-1.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                      isActive
                        ? 'bg-[#E2F952] text-black font-extrabold border-2 border-black shadow-[3px_3px_0px_0px_#000000] translate-x-0.5'
                        : 'bg-white dark:bg-[#181A20] text-slate-800 dark:text-slate-200 font-semibold border-2 border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_#E2F952]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className={`font-mono text-[10px] font-bold ${isActive ? 'text-black opacity-70' : 'text-slate-400 dark:text-slate-500'}`}>
                        {item.num}
                      </span>
                      <Icon className={`w-3.5 h-3.5 flex-none ${isActive ? 'text-black stroke-[2.5]' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span className="whitespace-nowrap text-left text-xs tracking-tight truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded border flex-none whitespace-nowrap ml-1.5 ${
                        isActive 
                          ? 'bg-black text-[#E2F952] border-black'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 border-black/20 dark:border-white/20'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}

        {/* AI Career Copilot Card - Neo-Brutalist Box */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#181A20] border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_#000000] dark:shadow-[3px_3px_0px_0px_#E2F952] text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#E2F952] text-black border border-black">
              AI ENGINE
            </span>
            <span className="font-mono text-[9px] text-slate-400">RAG READY</span>
          </div>
          <div className="space-y-0.5">
            <h4 className="font-display font-bold text-xs text-black dark:text-white">Career Copilot</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
              Outreach notes, skill gap strategies & interview prep.
            </p>
          </div>
          <button 
            onClick={() => {
              onOpenAI();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full py-1.5 px-3 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold font-mono border-2 border-black dark:border-white flex items-center justify-center space-x-1.5 shadow-[2px_2px_0px_0px_#E2F952] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition"
          >
            <Sparkles className="w-3 h-3 text-[#E2F952] dark:text-black" />
            <span>Launch Copilot</span>
          </button>
        </div>
      </div>

      {/* Footer Status - Editorial Monospace Footnote */}
      <div className="pt-3 mt-4 border-t-2 border-black/10 dark:border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-[#E2F952] border border-black animate-pulse" />
          <span className="font-bold text-black dark:text-white">EDITION 2026.1</span>
        </div>
        <span className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 border border-black/20 dark:border-white/20 rounded font-bold">
          VERIFIED
        </span>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <div className="hidden md:block h-full flex-none">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-black/60 transition-opacity" 
            onClick={onCloseMobile}
          />
          <div className="relative w-68 h-full bg-[#FBF9F5] dark:bg-[#111215] z-10 shadow-[6px_0px_0px_0px_#000] animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
