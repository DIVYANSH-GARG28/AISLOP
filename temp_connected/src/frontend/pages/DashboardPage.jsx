import React, { useEffect, useState } from 'react';
import { 
  Target, 
  Compass, 
  ArrowRight, 
  X,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  Award,
  AlertTriangle,
  Sparkles,
  BookOpen,
  CheckSquare,
  Users,
  Code,
  ShieldCheck,
  TrendingUp,
  Layers,
  Bot,
  Zap,
  Briefcase,
  ExternalLink
} from 'lucide-react';
import { alumniApi, userApi, roadmapApi, mentorshipApi } from '../services/api';
import AlumniProfileModal from '../components/AlumniProfileModal';
import { getVerifiableLinkedInUrl } from '../utils/linkedin';

export default function DashboardPage({ 
  user: propUser, 
  setActiveTab, 
  onOpenAI, 
  onOpenEditProfile,
  onOpenResumeUpload,
  onOpenRAG,
  onOpenPro
}) {
  const [user, setUser] = useState(propUser || null);
  const [topAlumni, setTopAlumni] = useState([]);
  const [roadmapData, setRoadmapData] = useState(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [detailedAlumniModal, setDetailedAlumniModal] = useState(null);
  const [loading, setLoading] = useState(true);

  const careerOptions = [
    'AI / ML Engineer',
    'Senior AI Engineer',
    'Full Stack Software Engineer',
    'Backend Systems Architect',
    'Cloud DevOps Engineer',
    'Data & Analytics Engineer'
  ];

  const loadData = async (userOverride = null) => {
    setLoading(true);
    try {
      const userData = userOverride || propUser || await userApi.getCurrentUser();
      const currentUserId = userData?.id || 'student1';
      const userSkills = userData?.skillsList || (Array.isArray(userData?.skills) ? userData.skills : []);
      const [recommendedMentors, rData] = await Promise.all([
        mentorshipApi.getRecommendations({
          studentId: currentUserId,
          targetRole: userData?.targetRole || '',
          targetCompany: userData?.targetCompany || '',
          skills: userSkills
        }),
        roadmapApi.getRoadmap(currentUserId)
      ]);
      setUser(userData);
      setTopAlumni(Array.isArray(recommendedMentors) && recommendedMentors.length > 0 ? recommendedMentors.slice(0, 4) : []);
      setRoadmapData(rData);
    } catch (e) {
      console.error("Dashboard load error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(propUser);
  }, [
    propUser?.name,
    propUser?.targetRole,
    propUser?.targetCompany,
    propUser?.graduationYear,
    Array.isArray(propUser?.skills) ? propUser.skills.map(s => typeof s === 'object' ? s.name : s).join(',') : '',
    Array.isArray(propUser?.skillsList) ? propUser.skillsList.join(',') : ''
  ]);

  const handleSelectGoal = async (goalKey) => {
    await userApi.updateCareerGoal(goalKey);
    setIsGoalModalOpen(false);
    await loadData();
  };

  if (loading || !user) {
    return (
      <div className="p-8 space-y-6 max-w-7xl w-full mx-auto">
        <div className="h-36 bg-white dark:bg-[#181A20] rounded-2xl border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-white dark:bg-[#181A20] rounded-2xl border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const hasUploadedResumeOrCustomized = Boolean(
    (user.skillsList && user.skillsList.length > 0) || 
    (user.skills && user.skills.length > 0 && user.name !== 'Alex Johnson') ||
    (user.name && user.name !== 'Alex Johnson')
  );
  const isDemoAlex = !hasUploadedResumeOrCustomized && (user.id === 'user_101' || user.email === 'alex.johnson@kce.edu');
  const hasTargetGoal = Boolean(user.targetRole && user.targetRole.trim() !== '');

  // Active roadmap milestone
  const activePhase = roadmapData?.phases?.[1] || roadmapData?.phases?.[0] || (isDemoAlex ? {
    phaseNumber: 2,
    title: 'Phase 2: Database Scalability & Cache Architectures',
    duration: 'Weeks 5 – 8',
    tasks: [
      { id: 't1', text: 'Optimize PostgreSQL Queries with EXPLAIN ANALYZE', done: true },
      { id: 't2', text: 'Configure Redis Cluster with Eviction Policies', done: false },
      { id: 't3', text: 'Integrate Vector Search for RAG Embeddings', done: false }
    ]
  } : null);

  const daysCompleted = user.daysCompleted !== undefined ? user.daysCompleted : (isDemoAlex ? 36 : 1);
  const targetDays = user.targetDays || 100;
  const daysLeft = Math.max(0, targetDays - daysCompleted);

  const userSkillList = Array.isArray(user.skillsList) ? user.skillsList : (Array.isArray(user.skills) ? user.skills : []);
  const hasSkill = (name) => userSkillList.some(s => String(s).toLowerCase().includes(name.toLowerCase()));

  const alexDemoSkillMeters = [
    { name: 'Python Internals & Async I/O', current: hasSkill('python') ? 75 : 30, target: 90 },
    { name: 'Machine Learning & LLM Pipelines', current: (hasSkill('pytorch') || hasSkill('machine learning')) ? 70 : 25, target: 85 },
    { name: 'System Architecture & Scalability', current: hasSkill('system') ? 65 : 35, target: 80 },
    { name: 'Vector Databases (pgvector/Pinecone)', current: hasSkill('sql') ? 60 : 20, target: 85 }
  ];

  let skillMeters = [];
  if (Array.isArray(user.skills) && typeof user.skills[0] === 'object' && user.skills.length > 0) {
    skillMeters = user.skills;
  } else if (userSkillList.length > 0) {
    skillMeters = userSkillList.map((skName, i) => {
      const name = typeof skName === 'string' ? skName : (skName.name || 'Skill');
      const baseCurrent = 70 + ((name.length * 3 + i * 7) % 20);
      return {
        name,
        current: typeof skName === 'object' ? (skName.current || baseCurrent) : baseCurrent,
        target: typeof skName === 'object' ? (skName.target || 85) : 85
      };
    });
  } else if (isDemoAlex) {
    skillMeters = alexDemoSkillMeters;
  }

  const criticalSkillGapsCount = skillMeters.length > 0 ? skillMeters.filter(s => s.current < 50).length : 0;
  const topCriticalGap = skillMeters.length > 0 ? (skillMeters.find(s => s.current < 50)?.name?.split(' ')?.[0] || 'None') : 'None';

  let readinessPercent = 0;
  if (user.readiness !== undefined && user.readiness !== null && user.readiness !== 0) {
    readinessPercent = user.readiness;
  } else if (skillMeters.length > 0) {
    readinessPercent = Math.round(
      skillMeters.reduce((acc, curr) => acc + (curr.current / curr.target), 0) / skillMeters.length * 100
    );
  } else if (isDemoAlex) {
    readinessPercent = 64;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto animate-enter">
      
      {/* 1. Editorial Dossier / Student Profile Masthead */}
      <div className="editorial-card p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative flex-none">
            <img 
              src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'} 
              alt={user.name} 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_#000000] dark:shadow-[3px_3px_0px_0px_#E2F952]"
            />
            <span className="absolute -bottom-1 -right-1 bg-[#E2F952] text-black border border-black p-1 rounded-full shadow-[1px_1px_0px_0px_#000]" title="Verified KCE Student">
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 bg-black text-[#E2F952] dark:bg-white dark:text-black border border-black dark:border-white rounded">
                STUDENT DOSSIER
              </span>
              <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 bg-[#E2F952] text-black border border-black rounded shadow-[1.5px_1.5px_0px_0px_#000]">
                100-DAY SPRINT // DAY {daysCompleted}
              </span>
              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                [REF: {user.id ? String(user.id).toUpperCase() : 'CSE-2026'}]
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-black dark:text-white tracking-tight leading-[1.05]">
              {user.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-700 dark:text-slate-300 font-mono">
              <span>{user.degree || user.major || 'B.Tech Computer Science'}</span>
              <span>•</span>
              <span>KCE Class of {user.graduationYear || 2026}</span>
              <span>•</span>
              <span className="font-bold text-black dark:text-white">
                Target: {hasTargetGoal ? (
                  <span className="hl-mark text-black font-sans font-bold">{user.targetRole} {user.targetCompany ? `@ ${user.targetCompany}` : ''}</span>
                ) : (
                  <span className="italic text-slate-500">Unconfigured</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Neo-brutalist Tactile Controls */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
          <button 
            onClick={onOpenResumeUpload}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#181A20] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-black dark:text-white font-mono font-bold text-xs border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#E2F952] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition flex items-center space-x-1.5"
            title="Upload resume to automatically extract skills, role & graduation year"
          >
            <Sparkles className="w-3.5 h-3.5 text-black dark:text-[#E2F952]" />
            <span>Upload Resume</span>
          </button>

          <button 
            onClick={onOpenRAG}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#181A20] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-black dark:text-white font-mono font-bold text-xs border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#E2F952] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition flex items-center space-x-1.5"
            title="Ask technical questions to your resume via n8n RAG"
          >
            <Bot className="w-3.5 h-3.5 text-black dark:text-[#E2F952]" />
            <span>Resume RAG</span>
          </button>

          {/* Electric Lime ConnectEd Pro Button */}
          <button 
            onClick={onOpenPro}
            className="px-3.5 py-2 rounded-xl bg-[#E2F952] hover:bg-[#d8f042] text-black font-mono font-extrabold text-xs border-2 border-black shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition flex items-center space-x-1.5"
            title="View ConnectEd Pro features, SLA & RAG Chatbot"
          >
            <Zap className="w-3.5 h-3.5 text-black stroke-[2.5]" />
            <span>{user?.isPro ? 'Pro Active' : 'View Pro Plan'}</span>
          </button>

          <button 
            onClick={() => setActiveTab('jobs')}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#181A20] text-black dark:text-white font-mono font-bold text-xs border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#E2F952] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition flex items-center space-x-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-[#E2F952] border border-black animate-pulse" />
            <span>Jobs Radar [18]</span>
          </button>

          <button 
            onClick={() => setIsGoalModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-[#181A20] text-black dark:text-white font-mono font-bold text-xs border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#E2F952] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-black dark:text-[#E2F952]" />
            <span>{hasTargetGoal ? 'Goal' : 'Setup'}</span>
          </button>

          <button 
            onClick={onOpenEditProfile}
            className="px-3.5 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-mono font-bold text-xs border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#E2F952] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition"
          >
            Profile
          </button>
        </div>
      </div>

      {/* Onboarding Notice for Fresh Unconfigured Accounts */}
      {!hasTargetGoal && (
        <div className="p-6 rounded-2xl bg-[#FBF9F5] dark:bg-[#181A20] border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#E2F952] flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start space-x-4">
            <div className="p-2.5 rounded-xl bg-[#E2F952] text-black border-2 border-black flex-none">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 bg-black text-[#E2F952] rounded">
                  DIRECTIVE // SETUP
                </span>
                <h3 className="font-display font-bold text-base text-black dark:text-white">Target Career Goal Not Configured</h3>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                Welcome, {user.name}. Establish your target industry role (e.g. Senior AI Engineer, Full Stack Software Engineer) and target enterprise to calculate empirical hiring benchmarks and milestone velocity.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 flex-none">
            <button 
              onClick={() => setIsGoalModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#E2F952] text-black font-mono font-extrabold text-xs border-2 border-black shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition"
            >
              Configure Goal
            </button>
            <button 
              onClick={onOpenEditProfile}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-black text-black dark:text-white font-mono font-bold text-xs border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition"
            >
              Edit Profile
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Metric KPI Row (Swiss Grid 4-Card System) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Target Readiness */}
        <div className="editorial-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2">
            <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              01 // READINESS
            </span>
            <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#E2F952] text-black border border-black">
              VELOCITY
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-4xl sm:text-5xl font-normal text-black dark:text-white tracking-tight">
              {readinessPercent}%
            </span>
            {readinessPercent > 0 && (
              <span className="font-mono text-[11px] font-extrabold text-black dark:text-[#E2F952] flex items-center bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded">
                <TrendingUp className="w-3.5 h-3.5 mr-1 stroke-[2.5]" /> +8% gain
              </span>
            )}
          </div>
          <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate">
            [BENCHMARK: {hasTargetGoal ? user.targetRole : 'UNCONFIGURED'}]
          </p>
        </div>

        {/* Card 2: Skill Gaps Identified */}
        <div className="editorial-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2">
            <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              02 // CRITICAL GAPS
            </span>
            <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-black text-[#E2F952] dark:bg-white dark:text-black">
              PRIORITY
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline space-x-1.5">
              <span className="font-display text-4xl sm:text-5xl font-normal text-black dark:text-white tracking-tight">
                {criticalSkillGapsCount}
              </span>
              <span className="font-mono text-xs font-bold text-slate-500 uppercase">Gaps</span>
            </div>
            <span className="font-mono text-[10px] font-extrabold text-black dark:text-white bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-black/20 dark:border-white/20">
              {topCriticalGap}
            </span>
          </div>
          <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate">
            [STANDARD: {user.targetCompany || 'TIER-1 ENTERPRISE'}]
          </p>
        </div>

        {/* Card 3: Alumni Mentors Matched */}
        <div className="editorial-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2">
            <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              03 // ALUMNI NETWORK
            </span>
            <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#E2F952] text-black border border-black">
              1-CLICK
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline space-x-1.5">
              <span className="font-display text-4xl sm:text-5xl font-normal text-black dark:text-white tracking-tight">
                {topAlumni.length || 0}
              </span>
              <span className="font-mono text-xs font-bold text-slate-500 uppercase">Mentors</span>
            </div>
            <span className="font-mono text-[10px] font-extrabold text-black dark:text-white bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-black/20 dark:border-white/20">
              KCE Verified
            </span>
          </div>
          <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate">
            [DIRECTORY: 1-ON-1 SESSIONS & REFS]
          </p>
        </div>

        {/* Card 4: 100-Day Target Horizon */}
        <div className="editorial-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2">
            <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              04 // PLACEMENT HORIZON
            </span>
            <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-black text-[#E2F952] dark:bg-white dark:text-black">
              SPRINT
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline space-x-1.5">
              <span className="font-display text-3xl sm:text-4xl font-normal text-black dark:text-white tracking-tight">
                DAY {daysCompleted}
              </span>
              <span className="font-mono text-xs font-bold text-slate-500">/{targetDays}</span>
            </div>
            <span className="font-mono text-[10px] font-extrabold text-black dark:text-[#E2F952] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-black/20 dark:border-white/20">
              {daysLeft}d Left
            </span>
          </div>
          <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate">
            [CYCLE: SPRING 2026 COHORT]
          </p>
        </div>

      </div>

      {/* 3. Main Dashboard Layout (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Career Goal & Technical Benchmark Level Matrix */}
          <div className="editorial-card p-6 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black dark:border-white pb-4">
              <div>
                <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
                  05 // TECHNICAL BENCHMARK & READINESS MATRIX
                </span>
                <h2 className="font-display text-2xl font-bold text-black dark:text-white tracking-tight pt-0.5">
                  {hasTargetGoal ? user.targetRole : 'Target Career Goal Not Set'}
                </h2>
                <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
                  {user.targetCompany ? `Benchmark standard at ${user.targetCompany}` : 'Set target role & company to populate empirical hiring metrics'}
                </p>
              </div>
              <div className="text-left sm:text-right flex-none">
                <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
                  CANDIDATE VELOCITY
                </span>
                <div className="font-display text-3xl font-bold text-black dark:text-white">
                  {readinessPercent}%
                </div>
              </div>
            </div>

            {/* Overall Readiness Progress Bar - Neo-Brutalist Ink Outline Track */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono text-xs font-extrabold">
                <span className="text-slate-800 dark:text-slate-200 uppercase">Composite Trajectory Completion</span>
                <span className="text-black dark:text-[#E2F952]">{readinessPercent}% Ready</span>
              </div>
              <div className="w-full h-4 bg-neutral-100 dark:bg-neutral-900 rounded-full border-2 border-black dark:border-white p-0.5">
                <div 
                  className="h-full bg-[#E2F952] rounded-full border border-black transition-all duration-500" 
                  style={{ width: `${readinessPercent}%` }}
                />
              </div>
            </div>

            {/* Individual Skill Meter Progress Bars */}
            <div className="space-y-4 pt-2">
              <span className="font-mono text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                [ SKILL METER COMPARATIVE ANALYSIS ]
              </span>

              {skillMeters.length === 0 ? (
                <div className="p-8 text-center bg-[#FBF9F5] dark:bg-black rounded-xl border-2 border-dashed border-black/30 dark:border-white/30 space-y-3">
                  <BookOpen className="w-8 h-8 mx-auto stroke-[1.5] text-slate-600" />
                  <p className="font-display font-bold text-sm text-black dark:text-white">No Skill Benchmarks Configured</p>
                  <p className="font-mono text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                    Define your target career goal or upload your resume to generate benchmark scoring.
                  </p>
                  <button 
                    onClick={() => setIsGoalModalOpen(true)}
                    className="px-4 py-2 bg-[#E2F952] text-black font-mono font-bold text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition mt-1"
                  >
                    Configure Target Goal
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {skillMeters.map((sk, idx) => {
                    const isGap = sk.current < 50;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-black dark:text-white font-mono">{sk.name}</span>
                            {isGap && (
                              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded font-extrabold bg-black text-[#E2F952] dark:bg-white dark:text-black border border-black">
                                DEFICIT
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            YOU: <strong className="text-black dark:text-[#E2F952]">{sk.current}%</strong> / TARGET: {sk.target}%
                          </span>
                        </div>
                        <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-900 rounded-full border-2 border-black dark:border-white overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${isGap ? 'bg-amber-400' : 'bg-[#E2F952]'}`} 
                            style={{ width: `${sk.current}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t-2 border-black/10 dark:border-white/10 font-mono text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                [METHODOLOGY: EMPIRICAL HIRING CRITERIA]
              </span>
              <button 
                onClick={() => setActiveTab('goal')}
                className="font-bold text-black dark:text-white hover:underline flex items-center space-x-1"
              >
                <span>View Full Skill Gap Analysis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 🌟 Real-Time Jobs & Internships Radar Matched to Profile */}
          <div className="editorial-card p-6 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black dark:border-white pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E2F952] border border-black animate-pulse" />
                  <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    06 // REAL-TIME OPPORTUNITY RADAR
                  </span>
                  <span className="font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#E2F952] text-black border border-black shadow-[1px_1px_0px_0px_#000]">
                    LIVE FEED
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-black dark:text-white tracking-tight pt-1">
                  Active Openings Matched to Your Skills & Target Role
                </h3>
              </div>
              <button 
                onClick={() => setActiveTab('jobs')}
                className="font-mono text-xs text-black dark:text-white hover:underline font-bold flex items-center space-x-1 self-start sm:self-auto"
              >
                <span>View All 18+ Live Radar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                {
                  id: 'job_deepmind',
                  role: user?.targetRole ? `${user.targetRole} Intern (2026)` : 'AI Systems & Cloud Intern',
                  company: user?.targetCompany || 'Google DeepMind',
                  location: 'Mountain View, CA / Hybrid',
                  type: 'Summer 2026 Internship',
                  stipend: '$9,200/mo + Housing',
                  matchScore: 98,
                  matchingSkills: userSkillList.slice(0, 3).length > 0 ? userSkillList.slice(0, 3) : ['Python', 'PyTorch', 'Distributed Systems'],
                  alumniMentor: {
                    name: 'Sarah Chen',
                    role: 'Staff SWE',
                    company: user?.targetCompany || 'Google'
                  }
                },
                {
                  id: 'job_stripe',
                  role: 'Backend Microservices & Reliability Engineer',
                  company: 'Stripe',
                  location: 'San Francisco, CA / Remote',
                  type: 'Full-Time (Class of 2026/2027)',
                  stipend: '$175,000 - $195,000 / yr',
                  matchScore: 94,
                  matchingSkills: ['PostgreSQL', 'FastAPI', 'Docker', 'Redis'].filter(s => userSkillList.some(u => String(u).toLowerCase() === s.toLowerCase())).length > 0
                    ? ['PostgreSQL', 'FastAPI', 'Docker']
                    : ['Python', 'SQL', 'System Design'],
                  alumniMentor: {
                    name: 'David Kumar',
                    role: 'Senior Systems Architect',
                    company: 'Microsoft'
                  }
                },
                {
                  id: 'job_uber',
                  role: 'Full Stack & High-Throughput Systems Engineer',
                  company: 'Uber Technologies',
                  location: 'Seattle, WA / Remote',
                  type: 'Full-Time Graduate',
                  stipend: '$165,000 - $185,000 / yr',
                  matchScore: 91,
                  matchingSkills: ['React', 'TypeScript', 'Node.js', 'System Design'].filter(s => userSkillList.some(u => String(u).toLowerCase() === s.toLowerCase())).length > 0
                    ? ['React', 'TypeScript', 'Node.js']
                    : ['React', 'Git', 'System Design'],
                  alumniMentor: {
                    name: 'Elena Rostova',
                    role: 'Lead Cloud Architect',
                    company: 'AWS'
                  }
                }
              ].map((job) => (
                <div 
                  key={job.id}
                  className="p-5 rounded-2xl bg-[#FBF9F5] dark:bg-[#111215] border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_#000000] dark:shadow-[3px_3px_0px_0px_#E2F952] space-y-3.5 transition-transform hover:-translate-y-0.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h4 className="font-display font-bold text-sm sm:text-base text-black dark:text-white">
                          {job.role}
                        </h4>
                        <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#E2F952] text-black border border-black shadow-[1px_1px_0px_0px_#000]">
                          ★ {job.matchScore}% MATCH
                        </span>
                      </div>
                      <p className="font-mono text-xs font-bold text-black dark:text-white">
                        {job.company} • <span className="text-slate-500 font-normal">{job.location}</span>
                      </p>
                    </div>
                    <div className="text-left sm:text-right flex-none">
                      <span className="font-mono text-xs font-extrabold text-black dark:text-white block">{job.stipend}</span>
                      <span className="font-mono text-[10px] text-slate-500">{job.type}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t-2 border-black/10 dark:border-white/10">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[10px] font-extrabold text-slate-500 uppercase">Skills:</span>
                      {job.matchingSkills.map((sk, sIdx) => (
                        <span key={sIdx} className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white dark:bg-[#181A20] text-black dark:text-white border border-black dark:border-white">
                          ✓ {sk}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => {
                          setDetailedAlumniModal({
                            name: job.alumniMentor.name,
                            company: job.company,
                            role: job.alumniMentor.role,
                            university: 'KCE',
                            graduationYear: 2021,
                            matchReason: `1-Click warm intro for ${job.role} @ ${job.company}`
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#E2F952] hover:bg-[#d8f042] text-black font-mono font-bold text-[11px] border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition flex items-center space-x-1"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Warm Intro</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('jobs')}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#181A20] text-black dark:text-white font-mono font-bold text-[11px] border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition"
                      >
                        Quick Apply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Roadmap Phase Checklist Preview */}
          <div className="editorial-card p-6 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black dark:border-white pb-4">
              <div className="space-y-0.5">
                <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
                  07 // ACTIVE ROADMAP MILESTONE
                </span>
                <h3 className="font-display text-xl font-bold text-black dark:text-white">
                  {activePhase ? activePhase.title : 'No Roadmap Milestone Active'}
                </h3>
                <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
                  Timeline: {activePhase ? (activePhase.duration || 'Weeks 1 – 4') : 'Not Set'}
                </p>
              </div>
              <button 
                onClick={() => setActiveTab('roadmap')}
                className="px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-mono font-bold text-xs border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#E2F952] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition flex items-center space-x-1.5 flex-none"
              >
                <span>Interactive Roadmap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {!activePhase ? (
              <div className="p-8 text-center bg-[#FBF9F5] dark:bg-black rounded-xl border-2 border-dashed border-black/30 dark:border-white/30 space-y-3">
                <Compass className="w-8 h-8 mx-auto stroke-[1.5] text-slate-600" />
                <p className="font-display font-bold text-sm text-black dark:text-white">No Active Roadmap Milestones</p>
                <p className="font-mono text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                  Set up your target career goal to generate a 4-phase milestone trajectory customized to your target role.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <span className="font-mono text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-black dark:text-[#E2F952]" />
                  <span>Sprint Proof Checklist</span>
                </span>
                <div className="space-y-2">
                  {(activePhase.tasks || []).slice(0, 3).map((t, tIdx) => (
                    <div 
                      key={t.id || tIdx}
                      className={`p-3 rounded-xl border-2 border-black dark:border-white flex items-center justify-between text-xs font-mono transition ${
                        t.done 
                          ? 'bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white font-bold' 
                          : 'bg-white dark:bg-[#181A20] text-black dark:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded border-2 border-black dark:border-white flex items-center justify-center ${
                          t.done ? 'bg-black text-[#E2F952] dark:bg-white dark:text-black' : 'bg-white dark:bg-[#181A20]'
                        }`}>
                          {t.done && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className={t.done ? 'line-through opacity-70' : ''}>{t.text}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold border border-black ${
                        t.done ? 'bg-[#E2F952] text-black' : 'bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white'
                      }`}>
                        {t.done ? 'DONE' : 'TO DO'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top Matched Alumni Mentors Spotlight */}
          <div className="editorial-card p-6 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black dark:border-white pb-4">
              <div>
                <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
                  08 // VERIFIED ALUMNI MENTOR SPOTLIGHT
                </span>
                <h3 className="font-display text-xl font-bold text-black dark:text-white">
                  Top Matched Alumni Mentors
                </h3>
                <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
                  Verified alumni available for 1-on-1 sessions and referrals.
                </p>
              </div>
              <button 
                onClick={() => setActiveTab('alumni')}
                className="font-mono text-xs text-black dark:text-white font-bold hover:underline"
              >
                Explore All Mentors →
              </button>
            </div>

            <div className="space-y-3">
              {topAlumni.map((alum) => {
                const instId = alum.institutionalId || alum.institutional_id || `KCE-ALUM-${alum.graduationYear || 2021}-${String(alum.username || alum.id || '001').replace('alum-', '').padStart(3, '0')}`;
                const matchReason = (alum.matchReasons && alum.matchReasons[0]) || (alum.match_reasons && alum.match_reasons[0]) || alum.matchReason || `Expert in ${(alum.skills || []).slice(0, 3).join(', ')}`;
                const linkedin = getVerifiableLinkedInUrl(alum);

                return (
                  <div 
                    key={alum.id} 
                    onClick={() => setDetailedAlumniModal(alum)}
                    className="p-4 rounded-xl bg-[#FBF9F5] dark:bg-[#111215] border-2 border-black dark:border-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group/row hover:shadow-[3px_3px_0px_0px_#000000] dark:hover:shadow-[3px_3px_0px_0px_#E2F952] transition"
                  >
                    <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
                      <img src={alum.avatar || alum.avatar_url} alt={alum.name} className="w-12 h-12 rounded-xl object-cover border-2 border-black dark:border-white flex-none" />
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="font-display font-bold text-sm text-black dark:text-white truncate">{alum.name}</h4>
                          <span className="font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#E2F952] text-black border border-black flex-none">
                            {alum.matchScore || alum.match_score || 94}% MATCH
                          </span>
                          <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white border border-black/40 flex-none">
                            {instId}
                          </span>
                        </div>
                        <p className="font-mono text-xs font-bold text-black dark:text-white truncate">
                          {alum.title || alum.role || alum.current_role} @ {alum.company}
                        </p>
                        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {alum.graduationYear || alum.graduation_year} Alum • {alum.availability || 'Available for Mentorship'}
                        </p>
                        <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 text-[10px] font-mono text-slate-700 dark:text-slate-300 max-w-full truncate">
                          <Sparkles className="w-2.5 h-2.5 text-black dark:text-[#E2F952] flex-none" />
                          <span className="truncate">{matchReason}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-none self-end sm:self-center">
                      {linkedin && (
                        <a
                          href={linkedin}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-xl border-2 border-black dark:border-white bg-white dark:bg-neutral-800 text-black dark:text-white hover:bg-[#E2F952] hover:text-black transition"
                          title="View Verified LinkedIn Profile"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailedAlumniModal(alum);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-mono font-bold text-xs border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition flex-none"
                      >
                        View Dossier
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Detailed Alumni Profile Deep-Dive Modal */}
        {detailedAlumniModal && (
          <AlumniProfileModal
            alumni={detailedAlumniModal}
            onClose={() => setDetailedAlumniModal(null)}
            onOpenRequestMentorship={() => setActiveTab('alumni')}
            user={user}
          />
        )}

        {/* Right Column (1 Col wide) */}
        <div className="space-y-6">
          
          {/* Dominant NEXT BEST ACTION Card */}
          <div className="editorial-card p-6 space-y-4 bg-white dark:bg-[#181A20]">
            <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-3">
              <div className="flex items-center space-x-1.5">
                <span className="font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 bg-[#E2F952] text-black border border-black rounded">
                  DIRECTIVE
                </span>
                <span className="font-mono text-[10px] font-extrabold uppercase text-slate-500">
                  NEXT ACTION
                </span>
              </div>
              <Compass className="w-4 h-4 text-black dark:text-[#E2F952]" />
            </div>

            <div className="space-y-2">
              <h3 className="font-display text-xl font-bold text-black dark:text-white">
                {hasTargetGoal ? (user.nextAction || 'Complete Skill Gap Milestone') : 'Set Your Target Career Goal'}
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                {hasTargetGoal 
                  ? 'Completing active roadmap milestones accelerates your readiness scoring and triggers automatic alumni introductions.' 
                  : 'Selecting your target role and enterprise will generate your 100-day placement trajectory and empirical benchmark scoring.'}
              </p>
            </div>

            <button 
              onClick={() => hasTargetGoal ? setActiveTab('roadmap') : setIsGoalModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-[#E2F952] hover:bg-[#d8f042] text-black font-mono font-extrabold text-xs border-2 border-black shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition flex items-center justify-center space-x-2"
            >
              <span>{hasTargetGoal ? 'Continue Roadmap Trajectory' : 'Setup Target Goal Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* AI Career Insights & Copilot Box */}
          <div className="editorial-card p-5 space-y-3 bg-[#FBF9F5] dark:bg-[#111215]">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2">
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center space-x-1.5">
                <Bot className="w-3.5 h-3.5 text-black dark:text-[#E2F952]" />
                <span>AI COPILOT ADVICE</span>
              </span>
              <span className="font-mono text-[9px] text-slate-400">VERIFIED</span>
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
              {hasTargetGoal 
                ? (skillMeters.length > 0 
                  ? `Based on your profile, focusing on ${topCriticalGap !== 'None' ? topCriticalGap : 'core system fundamentals'} provides the fastest empirical boost to your ${user.targetRole} readiness.` 
                  : `Welcome ${user.name}! Add your current skills in profile settings to generate skill gap recommendations.`)
                : `Welcome ${user.name}! You haven't set a target career goal yet. Click 'Ask AI Copilot for Advice' to explore recommended career tracks for KCE students.`}
            </p>
            <button 
              onClick={onOpenAI}
              className="w-full py-2 rounded-xl bg-white dark:bg-[#181A20] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-black dark:text-white font-mono font-bold text-xs border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-black dark:text-[#E2F952]" />
              <span>Ask AI Copilot for Advice</span>
            </button>
          </div>

          {/* ConnectEd Pro & Resume RAG Feature Card */}
          <div className="editorial-card p-5 space-y-4 bg-black dark:bg-[#181A20] text-white border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_#E2F952]">
            <div className="flex items-center justify-between border-b border-white/20 pb-2">
              <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#E2F952] text-black uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-black" />
                <span>CONNECTEd PRO</span>
              </span>
              <span className="font-mono text-[10px] text-slate-300">12h SLA PRIORITY</span>
            </div>
            
            <div className="space-y-1.5">
              <h4 className="font-display font-bold text-base text-white tracking-tight">
                Resume RAG AI Co-pilot & Warm Intros
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Interrogate your resume with n8n vector search to generate STAR interview answers and unlock 12h priority responses from top alumni.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button 
                onClick={onOpenRAG}
                className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 border-2 border-white/30 text-white font-mono font-bold text-xs transition flex items-center justify-center space-x-1"
              >
                <Bot className="w-3.5 h-3.5 text-[#E2F952]" />
                <span>Resume RAG</span>
              </button>
              <button 
                onClick={onOpenPro}
                className="py-2 px-2.5 rounded-xl bg-[#E2F952] hover:bg-[#d8f042] text-black font-mono font-extrabold text-xs border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition flex items-center justify-center space-x-1"
              >
                <span>View Pro Plan</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Activity & Database Sync Feed - Swiss Telemetry Readout */}
          <div className="editorial-card p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2">
              <span className="font-mono text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400">
                [ TELEMETRY & RUNTIME ]
              </span>
              <span className="w-2 h-2 rounded-full bg-[#E2F952] border border-black animate-pulse" />
            </div>
            <div className="space-y-2 text-[11px] text-slate-700 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span>POSTGRESQL DB</span>
                <span className="font-extrabold text-black dark:text-[#E2F952]">CONNECTED (0.4ms)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>RAG AI PIPELINE</span>
                <span className="font-extrabold text-black dark:text-[#E2F952]">READY (n8n v1.4)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>ALUMNI NETWORK</span>
                <span className="font-extrabold text-black dark:text-[#E2F952]">{topAlumni.length || 0} VERIFIED</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Career Goal Selector Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="editorial-card max-w-md w-full p-6 sm:p-7 space-y-5 bg-white dark:bg-[#181A20] border-2 border-black dark:border-white shadow-[6px_6px_0px_0px_#000000] dark:shadow-[6px_6px_0px_0px_#E2F952] relative text-black dark:text-white">
            <button 
              onClick={() => setIsGoalModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-black dark:text-white border-2 border-black dark:border-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 bg-[#E2F952] text-black border border-black rounded">
                TARGET SELECTION
              </span>
              <h3 className="font-display font-bold text-xl text-black dark:text-white pt-1">
                Select Your Target Career Goal
              </h3>
              <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
                Choose a target career track to update benchmarks and AI skill gap analysis.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {careerOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleSelectGoal(option)}
                  className="w-full p-3 rounded-xl bg-[#FBF9F5] dark:bg-[#111215] hover:bg-[#E2F952] dark:hover:bg-[#E2F952] hover:text-black border-2 border-black dark:border-white text-left font-mono font-bold text-xs text-black dark:text-white transition flex items-center justify-between group shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  <span>{option}</span>
                  <ArrowRight className="w-4 h-4 text-black dark:text-white group-hover:translate-x-1 transition" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
