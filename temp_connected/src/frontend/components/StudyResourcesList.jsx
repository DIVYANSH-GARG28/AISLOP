import React, { useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  Video, 
  GraduationCap, 
  Code2, 
  Layers, 
  ExternalLink, 
  Sparkles,
  Globe,
  ChevronDown,
  ChevronRight,
  FolderOpen
} from 'lucide-react';

const CATEGORY_CONFIG = {
  Documentation: {
    label: 'Official Documentation',
    icon: FileText,
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    defaultCta: 'Read Docs',
  },
  Video: {
    label: 'YouTube & Video Tutorials',
    icon: Video,
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    btnBg: 'bg-purple-600 hover:bg-purple-700 text-white',
    defaultCta: 'Watch Video',
  },
  Tutorial: {
    label: 'Tutorials & Deep Dives',
    icon: BookOpen,
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
    defaultCta: 'Learn Tutorial',
  },
  Course: {
    label: 'Structured Courses',
    icon: GraduationCap,
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    defaultCta: 'View Course',
  },
  Practice: {
    label: 'Coding & Practice Labs',
    icon: Code2,
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
    defaultCta: 'Practice Problems',
  },
  Project: {
    label: 'GitHub Repos & Projects',
    icon: Layers,
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    btnBg: 'bg-rose-600 hover:bg-rose-700 text-white',
    defaultCta: 'View Project',
  },
};

export default function StudyResourcesList({ resources = [], topics = [], loading = false }) {
  const [collapsedTopics, setCollapsedTopics] = useState({});

  const toggleTopicCollapse = (topicName) => {
    setCollapsedTopics(prev => ({ ...prev, [topicName]: !prev[topicName] }));
  };

  if (loading) {
    return (
      <div className="space-y-3 pt-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
          <Sparkles className="w-4 h-4 text-brand-500 animate-spin" />
          <span>Building AI Study Hub across milestone topics...</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-3.5 rounded-xl border border-slate-200 dark:border-[#253349] bg-slate-50 dark:bg-[#0d131f] animate-pulse space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-[#1a2638] rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 dark:bg-[#1a2638] rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!resources || resources.length === 0) {
    return (
      <div className="pt-3 pb-1 text-xs text-slate-500 dark:text-slate-400 italic flex items-center space-x-2">
        <Globe className="w-4 h-4 text-slate-400 flex-none" />
        <span>Study resources are currently unavailable for this topic.</span>
      </div>
    );
  }

  // Group resources by topic
  const groupedByTopic = {};
  resources.forEach(res => {
    const topicKey = res.topic || 'General Recommended Topics';
    if (!groupedByTopic[topicKey]) {
      groupedByTopic[topicKey] = [];
    }
    groupedByTopic[topicKey].push(res);
  });

  const topicNames = Object.keys(groupedByTopic);

  return (
    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-[#233147]">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-brand-500" />
          <span>AI Study Hub — Topic-Wise Learning Resources ({resources.length})</span>
        </h4>
        <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Tavily Verified Sources</span>
      </div>

      <div className="space-y-4">
        {topicNames.map((topicName) => {
          const topicResources = groupedByTopic[topicName];
          const isCollapsed = !!collapsedTopics[topicName];

          // Group by category within topic
          const catGroup = {};
          topicResources.forEach(res => {
            const cat = res.category || 'Tutorial';
            if (!catGroup[cat]) catGroup[cat] = [];
            catGroup[cat].push(res);
          });
          const categoriesPresent = Object.keys(catGroup);

          return (
            <div key={topicName} className="rounded-xl border border-slate-200 dark:border-[#233147] bg-white dark:bg-[#111927] overflow-hidden shadow-sm">
              {/* Topic Header Banner */}
              <div 
                onClick={() => toggleTopicCollapse(topicName)}
                className="p-3 bg-slate-50 dark:bg-[#182335] flex items-center justify-between cursor-pointer select-none border-b border-slate-200 dark:border-[#233147]"
              >
                <div className="flex items-center space-x-2.5">
                  <FolderOpen className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-none" />
                  <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                    Topic: <span className="text-brand-600 dark:text-brand-400">{topicName}</span>
                  </h5>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-[#0d131f] px-2 py-0.5 rounded-full">
                    {topicResources.length} Resources
                  </span>
                </div>

                <button className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded">
                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Topic Resource Categories Grid */}
              {!isCollapsed && (
                <div className="p-3.5 space-y-4">
                  {categoriesPresent.map(catKey => {
                    const catItems = catGroup[catKey];
                    const catConfig = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.Tutorial;
                    const CatIcon = catConfig.icon;

                    return (
                      <div key={catKey} className="space-y-2">
                        <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-[#1d2b3f] pb-1">
                          <CatIcon className="w-3.5 h-3.5 text-slate-500 flex-none" />
                          <span>{catConfig.label} ({catItems.length})</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {catItems.map((res, idx) => {
                            const safeUrl = res.url && (res.url.startsWith('http://') || res.url.startsWith('https://')) 
                              ? res.url 
                              : '#';
                            const ctaLabel = res.ctaText || catConfig.defaultCta;

                            return (
                              <div 
                                key={res.id || `res_${idx}`}
                                className="p-3 rounded-xl border border-slate-200 dark:border-[#233147] bg-slate-50/50 dark:bg-[#0d131f] hover:border-brand-300 dark:hover:border-brand-500 transition-all duration-200 flex flex-col justify-between space-y-2 group"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center space-x-1 ${catConfig.badgeBg}`}>
                                      <CatIcon className="w-3 h-3 flex-none" />
                                      <span>{res.category || catKey}</span>
                                    </span>

                                    {res.source && (
                                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[130px]" title={res.source}>
                                        {res.source}
                                      </span>
                                    )}
                                  </div>

                                  <h6 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                    {res.title}
                                  </h6>

                                  {res.snippet && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                      {res.snippet}
                                    </p>
                                  )}
                                </div>

                                <div className="pt-2 border-t border-slate-200/60 dark:border-[#1d2b3f] flex items-center justify-between text-xs">
                                  <span className="text-[10px] font-semibold text-slate-400">
                                    {res.score ? `Match: ${Math.round(res.score * 100)}%` : 'Verified Link'}
                                  </span>

                                  <a
                                    href={safeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center space-x-1.5 transition shadow-xs ${catConfig.btnBg}`}
                                  >
                                    <span>{ctaLabel}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
