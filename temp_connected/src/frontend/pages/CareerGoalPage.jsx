import React, { useEffect, useState } from 'react';
import { 
  Target, 
  BarChart2, 
  ArrowRight,
  AlertTriangle,
  Award,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  BookOpen,
  Users,
  Code,
  Layers,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  X
} from 'lucide-react';
import { userApi, alumniApi } from '../services/api';

export default function CareerGoalPage({ user: propUser, setActiveTab, onOpenAI }) {
  const [user, setUser] = useState(propUser || null);
  const [skillGaps, setSkillGaps] = useState([]);
  const [biggestGap, setBiggestGap] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const careerGoalOptions = [
    { key: 'AI / ML Engineer', title: 'Senior AI Engineer', company: 'Google DeepMind', desc: 'Frontier model training, RAG pipelines, & LLM inference deployment.' },
    { key: 'Backend Systems Architect', title: 'Backend Systems Architect', company: 'Stripe', desc: 'High-scale distributed systems, PostgreSQL sharding, & API rate limiting.' },
    { key: 'Full Stack Software Engineer', title: 'Product Engineer', company: 'Vercel', desc: 'React, Next.js App Router, TypeScript, & edge rendering performance.' }
  ];

  useEffect(() => {
    if (propUser) {
      setUser(propUser);
    }
  }, [propUser]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [u, sg, bg, alumData] = await Promise.all([
        propUser ? Promise.resolve(propUser) : userApi.getCurrentUser(),
        userApi.getSkillGaps(),
        userApi.getBiggestGap(),
        alumniApi.getAlumni()
      ]);
      setUser(u);
      setSkillGaps(sg || []);
      setBiggestGap(bg);
      setMentors((alumData || []).slice(0, 3));
    } catch (e) {
      console.error("CareerGoalPage load error:", e);
    } finally {
      setLoading(false);
    }
  }

  const handleSelectGoal = async (goalKey) => {
    await userApi.updateCareerGoal(goalKey);
    setIsGoalModalOpen(false);
    await loadData();
  };

  if (loading || !user) {
    return (
      <div className="p-8 space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-32 bg-white dark:bg-[#162030] rounded-2xl border border-slate-200 dark:border-[#233147]"></div>
        <div className="h-64 bg-white dark:bg-[#162030] rounded-2xl border border-slate-200 dark:border-[#233147]"></div>
      </div>
    );
  }

  const isDemoAlex = user?.id === 'user_101' || user?.email === 'alex.johnson@kce.edu';
  const hasTargetGoal = Boolean(user?.targetRole && user?.targetRole.trim() !== '');

  // Expanded detailed skill data
  const alexDemoSkills = [
    {
      name: 'System Architecture & Scalability',
      current: 35,
      target: 80,
      status: 'CRITICAL GAP',
      missingConcepts: ['Distributed Caching (Redis)', 'Database Sharding & Replication', 'Vector Indexing (pgvector)'],
      recommendedMentor: 'Priya Sharma (Google)',
      resource: 'Scalable System Architecture Module'
    },
    {
      name: 'Cloud Infrastructure & MLOps',
      current: 40,
      target: 70,
      status: 'CRITICAL GAP',
      missingConcepts: ['Docker & Kubernetes Containerization', 'AWS EC2 & vLLM Serving', 'Prometheus Metrics'],
      recommendedMentor: 'Marcus Vance (DeepMind)',
      resource: 'Cloud Deployment & Monitoring'
    },
    {
      name: 'Machine Learning & LLM Pipelines',
      current: 54,
      target: 85,
      status: 'ON TRACK',
      missingConcepts: ['PyTorch Transformer Fine-tuning', 'LoRA & PEFT Quantization', 'RAG Retrieval Optimization'],
      recommendedMentor: 'Elena Rostova (OpenAI)',
      resource: 'Advanced Deep Learning & RAG'
    },
    {
      name: 'Python Internals & Async I/O',
      current: 72,
      target: 90,
      status: 'NEAR BENCHMARK',
      missingConcepts: ['AsyncIO Event Loop Benchmarks', 'Memory Management & Generators'],
      recommendedMentor: 'David Kim (Vercel)',
      resource: 'Python Async Masters Course'
    }
  ];

  const userSkillList = Array.isArray(user?.skillsList) ? user.skillsList : (Array.isArray(user?.skills) ? user.skills : []);
  const detailedSkills = isDemoAlex ? alexDemoSkills : (
    userSkillList.length > 0 ? userSkillList.map((sk, i) => {
      const sName = typeof sk === 'string' ? sk : (sk.name || `Skill ${i+1}`);
      const cur = typeof sk === 'object' ? (sk.current || 50) : 50;
      const tgt = typeof sk === 'object' ? (sk.target || 85) : 85;
      return {
        name: sName,
        current: cur,
        target: tgt,
        status: cur < 50 ? 'CRITICAL GAP' : (cur >= 80 ? 'NEAR BENCHMARK' : 'ON TRACK'),
        missingConcepts: [`Advanced ${sName} Patterns`, `Production ${sName} Optimization`],
        recommendedMentor: (mentors[i % mentors.length]?.name || 'Verified KCE Alum'),
        resource: `${sName} Mastery Module`
      };
    }) : []
  );

  const criticalCount = detailedSkills.filter(s => s.status === 'CRITICAL GAP').length;
  const readinessValue = user?.readiness || (detailedSkills.length > 0 ? Math.round(detailedSkills.reduce((a, b) => a + (b.current / b.target), 0) / detailedSkills.length * 100) : 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
      
      {/* 1. Header Banner */}
      <div className="pro-card p-6 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase tracking-wider">
              Career Goal Benchmark
            </span>
            <span className="text-xs text-slate-400 font-bold">• Placement Hiring Standard</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
            <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Target Role: {hasTargetGoal ? user.targetRole : 'Not Configured'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {hasTargetGoal ? (
              <>Benchmarked against verified hiring standards at <strong className="text-indigo-600 dark:text-indigo-400">{user.targetCompany || 'Target Enterprise'}</strong>.</>
            ) : (
              'Set up your target career role & company to initialize skill benchmark comparisons.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsGoalModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0d131f] hover:bg-slate-100 dark:hover:bg-[#192436] text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-[#253349] transition flex items-center space-x-1.5 shadow-sm active:scale-95"
          >
            <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{hasTargetGoal ? 'Switch Career Goal' : 'Set Target Career Goal'}</span>
          </button>
          <button 
            onClick={onOpenAI}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center space-x-2 active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-indigo-100" />
            <span>AI Gap Analysis</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Readiness Score */}
        <div className="pro-card p-4 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Target Readiness</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{readinessValue}%</div>
          <p className="text-[11px] text-slate-500 font-medium">Overall hiring qualification</p>
        </div>

        {/* Critical Gaps Count */}
        <div className="pro-card p-4 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Critical Gaps</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{criticalCount} Priority Skills</div>
          <p className="text-[11px] text-slate-500 font-medium">{criticalCount > 0 ? 'Requires roadmap focus' : 'No critical skill gaps'}</p>
        </div>

        {/* Benchmark Standard */}
        <div className="pro-card p-4 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Hiring Standard</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">85% Avg</div>
          <p className="text-[11px] text-slate-500 font-medium">{user?.targetCompany || 'Target'} threshold</p>
        </div>

        {/* Estimated Learning Time */}
        <div className="pro-card p-4 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Est. Time to Ready</span>
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{hasTargetGoal ? '4 Weeks' : 'Not Set'}</div>
          <p className="text-[11px] text-slate-500 font-medium">Roadmap execution horizon</p>
        </div>
      </div>

      {/* 3. BIGGEST GAP Spotlight Banner */}
      {biggestGap && (
        <div className="pro-card p-6 rounded-2xl border-2 border-amber-500/40 dark:border-amber-600/50 bg-white dark:bg-[#162030] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500 flex-none" />
              <span>#1 Priority Bottleneck Skill</span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{biggestGap.skill}</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-xl">
              You are currently <strong className="text-amber-600 dark:text-amber-400 font-bold">{biggestGap.gap}% below</strong> the benchmark level required by {user.targetCompany}. Completing <span className="underline decoration-amber-400">{biggestGap.resource}</span> will raise your overall readiness score to <strong className="text-emerald-600 dark:text-emerald-400 font-bold">72%</strong>.
            </p>
          </div>

          <button 
            onClick={() => setActiveTab('roadmap')}
            className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 flex-none active:scale-95"
          >
            <span>Start {biggestGap.skill} Roadmap Module</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Detailed Skill Benchmark Breakdown Matrix */}
      <div className="pro-card p-6 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#233147] pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Skill Benchmark Levels & Action Items</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Comparing student proficiency vs target hiring standards.</p>
          </div>
        </div>

        <div className="space-y-6">
          {detailedSkills.map((sk, idx) => (
            <div 
              key={idx} 
              className="p-5 rounded-xl bg-slate-50/70 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] space-y-4"
            >
              {/* Skill Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">{sk.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                    sk.status === 'CRITICAL GAP'
                      ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      : sk.status === 'ON TRACK'
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                      : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  }`}>
                    {sk.status}
                  </span>
                </div>

                <div className="text-xs font-bold space-x-3">
                  <span className="text-indigo-600 dark:text-indigo-400">You: {sk.current}%</span>
                  <span className="text-slate-400">/ Benchmark: {sk.target}%</span>
                </div>
              </div>

              {/* Progress Meters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Student level */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span>Student Level</span>
                    <span>{sk.current}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-[#162030] h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${sk.current < 50 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                      style={{ width: `${sk.current}%` }}
                    ></div>
                  </div>
                </div>

                {/* Target Requirement */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span>Hiring Requirement</span>
                    <span>{sk.target}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-[#162030] h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-slate-400 dark:bg-slate-500 h-full rounded-full"
                      style={{ width: `${sk.target}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Missing Concepts & Mentors */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-[#233147] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Missing Domain Concepts:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {sk.missingConcepts.map((concept, cIdx) => (
                      <span key={cIdx} className="px-2 py-0.5 rounded bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#253349] text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        • {concept}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-none pt-2 sm:pt-0">
                  <span className="text-[11px] text-slate-500 font-bold">Mentor Expert:</span>
                  <button 
                    onClick={() => setActiveTab('alumni')}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 transition text-xs flex items-center space-x-1"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{sk.recommendedMentor}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goal Selector Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#233147] pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Select Target Career Goal</h3>
              <button onClick={() => setIsGoalModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {careerGoalOptions.map(opt => (
                <div
                  key={opt.key}
                  onClick={() => handleSelectGoal(opt.key)}
                  className="p-4 rounded-xl border border-slate-200 dark:border-[#253349] bg-slate-50 dark:bg-[#0d131f] hover:border-indigo-500 cursor-pointer transition space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{opt.title}</span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">@ {opt.company}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
