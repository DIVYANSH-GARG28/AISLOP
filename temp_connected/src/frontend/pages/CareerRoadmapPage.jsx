import React, { useEffect, useState } from 'react';
import { 
  Compass, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  Users, 
  Clock,
  Check,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Award,
  Database,
  RefreshCw,
  X,
  ExternalLink,
  BookOpen,
  Code,
  Layers,
  CheckSquare
} from 'lucide-react';
import { roadmapApi, userApi } from '../services/api';
import StudyResourcesList from '../components/StudyResourcesList';

export default function CareerRoadmapPage({ user: propUser, setActiveTab, onOpenAI }) {
  const [roadmapData, setRoadmapData] = useState(null);
  const [user, setUser] = useState(propUser || null);
  const [expandedPhases, setExpandedPhases] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dbSaved, setDbSaved] = useState(false);
  
  // Custom AI Roadmap Modal state
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [targetRoleInput, setTargetRoleInput] = useState('');
  const [timelineWeeksInput, setTimelineWeeksInput] = useState(12);

  const presetRoles = [
    'Full Stack Software Engineer',
    'AI / ML Engineer',
    'Backend Systems Architect',
    'Data & Analytics Engineer',
    'Cloud DevOps Engineer',
    'Product Manager'
  ];

  useEffect(() => {
    if (propUser) {
      setUser(propUser);
    }
  }, [propUser]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const u = propUser ? await Promise.resolve(propUser) : await userApi.getCurrentUser();
      setUser(u);
      
      const currentUserId = u?.id || 'student1';
      const rData = await roadmapApi.getRoadmap(currentUserId);
      
      let parsedRoadmap = rData;
      if (Array.isArray(rData)) {
        parsedRoadmap = normalizeLegacyRoadmap(rData, u);
      }
      
      // Ensure we always have valid phases
      if (!parsedRoadmap || !parsedRoadmap.phases || !Array.isArray(parsedRoadmap.phases) || parsedRoadmap.phases.length === 0) {
        parsedRoadmap = getDefault4PhaseRoadmap(u?.targetRole, u);
      }

      // Check if any phase lacks study resources and perform auto-enrichment in background
      const needsEnrichment = parsedRoadmap.phases.some(p => !p.resources || p.resources.length === 0);
      setRoadmapData(parsedRoadmap);

      if (parsedRoadmap && parsedRoadmap.phases && parsedRoadmap.phases.length > 0) {
        setExpandedPhases({ [parsedRoadmap.phases[0].phaseNumber || 1]: true });
      }
      setLoading(false);

      if (needsEnrichment) {
        // Auto-enrich resources live from Tavily AI endpoint
        enrichRoadmapPhasesLive(parsedRoadmap, u?.targetRole || 'Senior AI Engineer', currentUserId);
      }
    }
    load();
  }, []);

  async function enrichRoadmapPhasesLive(currentRoadmap, targetRole, userId) {
    if (!currentRoadmap || !currentRoadmap.phases) return;
    let updated = false;
    const enrichedPhases = await Promise.all(
      currentRoadmap.phases.map(async (phase) => {
        if (phase.resources && phase.resources.length > 0) return phase;
        
        const topics = phase.recommendedTopics || [phase.title];
        let phaseRes = [];
        for (const t of topics.slice(0, 2)) {
          const res = await roadmapApi.searchTopicResources(t, targetRole);
          if (Array.isArray(res) && res.length > 0) {
            phaseRes.push(...res);
          }
        }
        if (phaseRes.length > 0) {
          updated = true;
          return { ...phase, resources: phaseRes };
        }
        return phase;
      })
    );

    if (updated) {
      const newRoadmapData = { ...currentRoadmap, phases: enrichedPhases };
      setRoadmapData(newRoadmapData);
      roadmapApi.saveRoadmap({
        studentId: userId || user?.id || 'student1',
        targetRole: newRoadmapData.targetRole || targetRole,
        roadmapData: newRoadmapData,
        skillsToAcquire: newRoadmapData.skillGapAnalysis?.missingSkills || []
      });
    }
  }

  function generateDefaultResourcesForTopic(topicName, targetRole, phaseNum) {
    const role = targetRole || 'Software Engineer';
    return [
      {
        id: `res_doc_${phaseNum}_1`,
        title: `${topicName} Official Documentation & Developer Reference`,
        url: topicName.toLowerCase().includes('python') 
          ? 'https://docs.python.org/3/' 
          : topicName.toLowerCase().includes('postgre') || topicName.toLowerCase().includes('index')
            ? 'https://www.postgresql.org/docs/current/indexes.html'
            : topicName.toLowerCase().includes('docker')
              ? 'https://docs.docker.com/build/building/multi-stage/'
              : 'https://developer.mozilla.org/en-US/docs/Web',
        category: 'Documentation',
        source: 'Official Docs',
        snippet: `Comprehensive official documentation and technical specifications for mastering ${topicName} in enterprise software production environments.`,
        score: 0.95,
        topic: topicName,
        phaseNumber: phaseNum,
        ctaText: 'Read Docs'
      },
      {
        id: `res_vid_${phaseNum}_1`,
        title: `${topicName} Complete Masterclass & Engineering Walkthrough`,
        url: 'https://www.youtube.com/watch?v=Aceg0n04LJw',
        category: 'Video',
        source: 'youtube.com',
        snippet: `In-depth video lecture and step-by-step practical implementation tutorial covering ${topicName} architectural principles and production usage.`,
        score: 0.91,
        topic: topicName,
        phaseNumber: phaseNum,
        ctaText: 'Watch Video'
      },
      {
        id: `res_tut_${phaseNum}_1`,
        title: `Deep Dive Guide: ${topicName} Best Practices & Architecture Patterns`,
        url: 'https://realpython.com/async-io-python/',
        category: 'Tutorial',
        source: 'realpython.com',
        snippet: `Detailed hands-on technical tutorial breaking down ${topicName} internals, common pitfalls, memory optimization, and enterprise design patterns.`,
        score: 0.88,
        topic: topicName,
        phaseNumber: phaseNum,
        ctaText: 'Learn Tutorial'
      },
      {
        id: `res_crs_${phaseNum}_1`,
        title: `Production ${topicName} & Backend Engineering Specialization`,
        url: 'https://www.coursera.org/resources/back-end-development-interview-prep-guide',
        category: 'Course',
        source: 'coursera.org',
        snippet: `Structured learning pathway and certification prep course focused on building production-grade solutions using ${topicName}.`,
        score: 0.86,
        topic: topicName,
        phaseNumber: phaseNum,
        ctaText: 'View Course'
      },
      {
        id: `res_prc_${phaseNum}_1`,
        title: `${topicName} Coding Labs & Algorithm Practice Problems`,
        url: 'https://leetcode.com/problemset/all/',
        category: 'Practice',
        source: 'leetcode.com',
        snippet: `Interactive coding challenges, query tuning exercises, and algorithmic practice problems centered on ${topicName}.`,
        score: 0.84,
        topic: topicName,
        phaseNumber: phaseNum,
        ctaText: 'Practice Problems'
      },
      {
        id: `res_prj_${phaseNum}_1`,
        title: `GitHub Repository: ${topicName} Open Source Reference Implementation`,
        url: 'https://github.com/jaydeepkarale/backend-engineering-resources',
        category: 'Project',
        source: 'github.com',
        snippet: `Production-ready open-source GitHub repository featuring clean code, automated tests, and deployment manifests for ${topicName}.`,
        score: 0.89,
        topic: topicName,
        phaseNumber: phaseNum,
        ctaText: 'View Project'
      }
    ];
  }

  function getDefault4PhaseRoadmap(targetRole, userInfo) {
    const isDemoAlex = userInfo?.id === 'user_101' || userInfo?.email === 'alex.johnson@kce.edu';
    const hasRole = Boolean(targetRole || userInfo?.targetRole);
    const roleName = targetRole || userInfo?.targetRole || (isDemoAlex ? 'Senior AI Engineer' : '');
    const companyName = userInfo?.targetCompany || (isDemoAlex ? 'Google DeepMind' : '');
    const possessed = (userInfo?.skillsList || userInfo?.skills?.map(s => typeof s === 'string' ? s : s.name)) || (isDemoAlex ? ['Python', 'React', 'Git', 'Data Structures'] : []);
    const readiness = userInfo?.readiness !== undefined && userInfo?.readiness !== null && userInfo?.readiness !== 0 ? userInfo.readiness : (isDemoAlex ? 64 : 0);

    const p1Topics = ['Event Loop Internals', 'Memory Optimization & Garbage Collection', 'Clean Code Principles'];
    const p2Topics = ['B-Tree Indexing & EXPLAIN ANALYZE', 'Write-Through vs Cache-Aside Patterns', 'HNSW Vector Indexes'];
    const p3Topics = ['Container Security & Image Minimization', 'Zero-downtime Rolling Updates', 'Observability & Metrics'];
    const p4Topics = ['Distributed Rate Limiting (Token Bucket)', 'CAP Theorem & Eventual Consistency', 'Behavioral & Architecture Interview Prep'];

    return {
      studentName: userInfo?.name || (isDemoAlex ? 'Alex Johnson' : 'Student'),
      targetRole: roleName,
      targetCompany: companyName,
      skillGapAnalysis: {
        possessedSkills: possessed,
        missingSkills: hasRole ? ['System Design & Architecture', 'Docker & Kubernetes', 'PostgreSQL & Vector DBs', 'Model Deployment & Monitoring'] : [],
        readinessScore: readiness,
        analysisSummary: hasRole 
          ? `Solid foundation in core engineering. Focused execution on milestone tasks will bridge your benchmark gap to target readiness.`
          : `Target career goal not configured. Set up your target goal to generate your personalized 4-phase placement trajectory.`
      },
      phases: [
        {
          phaseNumber: 1,
          title: 'Phase 1: Deep Core Mastery & System Foundations',
          duration: 'Weeks 1 – 4',
          description: 'Solidify core programming language internals, asynchronous I/O models, and clean architectural design patterns.',
          skillsToLearn: ['Data Structures & Algorithms', 'Python Internals', 'Async Concurrency', 'REST & gRPC APIs'],
          keyProjects: ['High-Throughput Concurrent Task Queue Engine'],
          recommendedTopics: p1Topics,
          resources: p1Topics.flatMap((t, idx) => generateDefaultResourcesForTopic(t, roleName, 1)),
          tasks: [
            { id: 'p1_t1', text: 'Master Advanced Async/Await & Event Loop Internals', done: true },
            { id: 'p1_t2', text: 'Implement Custom Concurrent Queue with Exponential Backoff Retry', done: true },
            { id: 'p1_t3', text: 'Build High-Performance gRPC Microservice Communication Layer', done: false }
          ]
        },
        {
          phaseNumber: 2,
          title: 'Phase 2: Database Scalability & Cache Architectures',
          duration: 'Weeks 5 – 8',
          description: 'Master relational schema optimization, query indexing, caching strategies, and vector data persistence.',
          skillsToLearn: ['PostgreSQL Indexing & Partitioning', 'Redis Caching Clusters', 'Vector DBs (pgvector/Pinecone)', 'Schema Migrations'],
          keyProjects: ['Distributed Cache & Vector Search Engine for AI Embeddings'],
          recommendedTopics: p2Topics,
          resources: p2Topics.flatMap((t, idx) => generateDefaultResourcesForTopic(t, roleName, 2)),
          tasks: [
            { id: 'p2_t1', text: 'Optimize PostgreSQL Queries using Composite Indexes & EXPLAIN ANALYZE', done: true },
            { id: 'p2_t2', text: 'Configure Distributed Redis Cluster with LRU Eviction Policies', done: false },
            { id: 'p2_t3', text: 'Integrate Vector Similarity Search for RAG Embeddings', done: false }
          ]
        },
        {
          phaseNumber: 3,
          title: 'Phase 3: Containerization, Kubernetes & DevOps Infrastructure',
          duration: 'Weeks 9 – 12',
          description: 'Deploy microservice stacks using Docker containers, automated CI/CD pipelines, and cloud orchestrators.',
          skillsToLearn: ['Docker Multi-stage Builds', 'Kubernetes Orchestration', 'CI/CD Pipelines (GitHub Actions)', 'Prometheus & Grafana Tracing'],
          keyProjects: ['Production CI/CD Pipeline & Kubernetes Deployment Manifests'],
          recommendedTopics: p3Topics,
          resources: p3Topics.flatMap((t, idx) => generateDefaultResourcesForTopic(t, roleName, 3)),
          tasks: [
            { id: 'p3_t1', text: 'Dockerize Full-Stack Services with Multi-stage Minimal Images', done: false },
            { id: 'p3_t2', text: 'Setup Automated GitHub Actions CI/CD Integration Pipeline', done: false },
            { id: 'p3_t3', text: 'Deploy Kubernetes Ingress & Configure Health Check Probes', done: false }
          ]
        },
        {
          phaseNumber: 4,
          title: 'Phase 4: Enterprise Architecture & Alumni Mock Interview Prep',
          duration: 'Weeks 13 – 16',
          description: 'Synthesize full-stack systems knowledge into high-availability architecture diagrams and practice mock technical interviews.',
          skillsToLearn: ['System Design Architecture', 'Load Balancing & Rate Limiting', 'Failover & Circuit Breakers', 'Alumni Mock Interview Mastery'],
          keyProjects: ['End-to-End Scalable System Architecture Portfolio Presentation'],
          recommendedTopics: p4Topics,
          resources: p4Topics.flatMap((t, idx) => generateDefaultResourcesForTopic(t, roleName, 4)),
          tasks: [
            { id: 'p4_t1', text: 'Design End-to-End High Availability System Architecture Diagram', done: false },
            { id: 'p4_t2', text: 'Schedule Mock Technical Architecture Interview with Verified Alumni Mentor', done: false },
            { id: 'p4_t3', text: 'Request Direct Internal Job Referral via ConnectEd Alumni Network', done: false }
          ]
        }
      ]
    };
  }

  function normalizeLegacyRoadmap(legacyArray, userInfo) {
    if (!legacyArray || legacyArray.length === 0) return getDefault4PhaseRoadmap(userInfo?.targetRole, userInfo);
    const role = userInfo?.targetRole || 'Software Engineer';
    return {
      studentName: userInfo?.name || 'Alex Johnson',
      targetRole: role,
      targetCompany: userInfo?.targetCompany || 'Google',
      skillGapAnalysis: {
        possessedSkills: userInfo?.skills?.map(s => typeof s === 'string' ? s : s.name) || ['Java', 'React', 'SQL'],
        missingSkills: ['System Design', 'Docker', 'PostgreSQL', 'Cloud Deployments'],
        readinessScore: userInfo?.readiness || 65,
        analysisSummary: `Solid background. Focus on system architecture and cloud infrastructure to reach target readiness.`
      },
      phases: legacyArray.map((node, idx) => {
        const topics = node.recommendedTopics || ['REST APIs', 'Cloud Services', 'Database Query Tuning'];
        return {
          phaseNumber: idx + 1,
          title: node.title || `Phase ${idx + 1}`,
          duration: node.duration || `Weeks ${idx * 3 + 1}-${idx * 3 + 3}`,
          description: node.subtitle || 'Milestone phase for target role mastery.',
          skillsToLearn: node.skills || ['System Design', 'Docker', 'PostgreSQL'],
          keyProjects: node.projects || ['Hands-on Architecture Project'],
          recommendedTopics: topics,
          resources: node.resources && node.resources.length > 0
            ? node.resources
            : topics.flatMap(t => generateDefaultResourcesForTopic(t, role, idx + 1)),
          tasks: node.tasks || [
            { id: `t_${idx}_1`, text: 'Core Architecture Review', done: true },
            { id: `t_${idx}_2`, text: 'Build Practical Demo Module', done: false }
          ]
        };
      })
    };
  }

  const togglePhaseExpand = (phaseNum) => {
    setExpandedPhases(prev => ({ ...prev, [phaseNum]: !prev[phaseNum] }));
  };

  const handleToggleTask = async (phaseIndex, taskIndex) => {
    if (!roadmapData || !roadmapData.phases) return;

    const updatedPhases = [...roadmapData.phases];
    const targetPhase = { ...updatedPhases[phaseIndex] };
    const updatedTasks = [...(targetPhase.tasks || [])];
    
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      done: !updatedTasks[taskIndex].done
    };
    targetPhase.tasks = updatedTasks;
    updatedPhases[phaseIndex] = targetPhase;

    const totalTasks = updatedPhases.reduce((acc, p) => acc + (p.tasks?.length || 0), 0);
    const completedTasks = updatedPhases.reduce((acc, p) => acc + (p.tasks?.filter(t => t.done)?.length || 0), 0);
    const newReadiness = totalTasks > 0 ? Math.min(98, Math.max(35, Math.round((completedTasks / totalTasks) * 60 + 35))) : 65;

    const updatedRoadmapData = {
      ...roadmapData,
      phases: updatedPhases,
      skillGapAnalysis: {
        ...roadmapData.skillGapAnalysis,
        readinessScore: newReadiness
      }
    };

    setRoadmapData(updatedRoadmapData);

    const res = await roadmapApi.saveRoadmap({
      studentId: user?.id || 'student1',
      targetRole: updatedRoadmapData.targetRole || user?.targetRole || 'Software Engineer',
      roadmapData: updatedRoadmapData,
      skillsToAcquire: updatedRoadmapData.skillGapAnalysis?.missingSkills || []
    });

    if (res.success) {
      setDbSaved(true);
      setTimeout(() => setDbSaved(false), 2500);
    }
  };

  const handleGenerateCustomAIRoadmap = async (roleToGenerate) => {
    const role = roleToGenerate || targetRoleInput || user?.targetRole || 'Senior AI Engineer';
    setGenerating(true);
    try {
      const generatedData = await roadmapApi.generateAIRoadmap({
        studentName: user?.name || 'Alex Johnson',
        targetRole: role,
        currentSkills: user?.skills?.map(s => typeof s === 'string' ? s : s.name) || ['JavaScript', 'React', 'Git', 'Python'],
        bio: user?.bio || '',
        timelineWeeks: timelineWeeksInput
      });

      const finalRoadmap = (generatedData && generatedData.phases && generatedData.phases.length > 0) 
        ? generatedData 
        : getDefault4PhaseRoadmap(role, user);

      setRoadmapData(finalRoadmap);
      if (finalRoadmap?.phases && finalRoadmap.phases.length > 0) {
        setExpandedPhases({ [finalRoadmap.phases[0].phaseNumber || 1]: true });
      }

      setIsCustomizerOpen(false);
      setDbSaved(true);
      setTimeout(() => setDbSaved(false), 3000);
    } catch (e) {
      console.error("Generate roadmap error", e);
      setRoadmapData(getDefault4PhaseRoadmap(role, user));
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="p-8 text-center text-slate-400 space-y-4 max-w-4xl mx-auto">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="font-bold text-sm">Loading Database-Persisted Career Roadmap...</p>
      </div>
    );
  }

  const currentRole = roadmapData?.targetRole || user.targetRole;
  const readiness = roadmapData?.skillGapAnalysis?.readinessScore || user.readiness || 65;
  const missingSkills = roadmapData?.skillGapAnalysis?.missingSkills || ['System Design', 'Docker', 'Cloud Services'];
  const possessedSkills = roadmapData?.skillGapAnalysis?.possessedSkills || ['JavaScript', 'React', 'Git'];
  const phases = roadmapData?.phases || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
      {/* DB Persistence Status Alert */}
      {dbSaved && (
        <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Progress automatically saved to PostgreSQL Database!</span>
          </div>
          <span className="text-[10px] bg-emerald-800 text-white px-2 py-0.5 rounded font-bold">DATABASE SYNCED</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black dark:border-white pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 bg-[#E2F952] text-black border border-black rounded shadow-[1px_1px_0px_0px_#000]">
              SECTOR 05 // TRAJECTORY
            </span>
            <span className="font-mono text-[10px] font-bold text-slate-500">
              [DATABASE PERSISTED]
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-black dark:text-white tracking-tight pt-1 flex items-center space-x-2.5">
            <Compass className="w-6 h-6 text-black dark:text-[#E2F952]" />
            <span>Interactive Career Roadmap Trajectory</span>
          </h1>
          <p className="font-mono text-xs text-slate-600 dark:text-slate-400 mt-1">
            Empirical 4-phase milestone trajectory for target role: <strong className="text-black dark:text-white font-bold">{currentRole}</strong>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={() => handleGenerateCustomAIRoadmap()}
            disabled={generating}
            className="px-4 py-2.5 rounded-xl bg-[#E2F952] hover:bg-[#d8f042] text-black font-mono font-extrabold text-xs border-2 border-black shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition flex items-center space-x-2 disabled:opacity-50"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing Path...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-black stroke-[2.5]" />
                <span>Analyse Career Path</span>
              </>
            )}
          </button>

          <button 
            onClick={() => setIsCustomizerOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#181A20] text-black dark:text-white font-mono font-bold text-xs border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#E2F952] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition flex items-center space-x-2"
          >
            <RefreshCw className="w-3.5 h-3.5 text-black dark:text-[#E2F952]" />
            <span>Customize AI Target Role</span>
          </button>
        </div>
      </div>

      {/* Target Destination & Skill Gap Banner */}
      <div className="editorial-card p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black dark:border-white pb-4">
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase font-bold text-slate-500 tracking-wider">CAREER DESTINATION GOAL</span>
            <h2 className="font-display text-2xl font-bold text-black dark:text-white tracking-tight">{currentRole}</h2>
            <p className="font-mono text-xs text-slate-600 dark:text-slate-400">Target Focus: {roadmapData?.targetCompany || user.targetCompany || 'Top Tech Enterprise'}</p>
          </div>
          <div className="sm:text-right space-y-1">
            <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Target Readiness</span>
            <div className="inline-flex items-center space-x-2 bg-[#E2F952] px-3.5 py-1.5 rounded-xl border-2 border-black text-black shadow-[2px_2px_0px_0px_#000]">
              <Award className="w-4 h-4 text-black stroke-[2.5]" />
              <span className="font-mono text-sm font-extrabold">{readiness}% Ready</span>
            </div>
          </div>
        </div>

        {/* Skill Gap Analysis Pills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] space-y-2">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Possessed Core Skills</span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {possessedSkills.map((sk, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-[11px]">
                  ✓ {sk}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] space-y-2">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">Critical Missing Skill Gaps</span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {missingSkills.map((sk, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-[11px]">
                  ! {sk}
                </span>
              ))}
            </div>
          </div>
        </div>

        {roadmapData?.skillGapAnalysis?.analysisSummary && (
          <p className="text-xs text-slate-600 dark:text-slate-300 italic border-t border-slate-200 dark:border-[#233147] pt-3 leading-relaxed">
            "{roadmapData.skillGapAnalysis.analysisSummary}"
          </p>
        )}
      </div>

      {/* Visual Connected Node Trajectory */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>4-Phase Milestone Trajectory</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Click phases to expand interactive tasks & resources</span>
        </div>

        <div className="space-y-4">
          {phases.map((phase, pIdx) => {
            const phaseNum = phase.phaseNumber || (pIdx + 1);
            const isExpanded = !!expandedPhases[phaseNum];
            const tasks = phase.tasks || [];
            const doneCount = tasks.filter(t => t.done).length;
            const isCompleted = tasks.length > 0 && doneCount === tasks.length;
            const isCurrent = !isCompleted && (pIdx === 0 || phases[pIdx - 1]?.tasks?.every(t => t.done));

            return (
              <div key={phaseNum} className="relative flex flex-col items-center">
                {/* Connector line between phase cards */}
                {pIdx > 0 && <div className="w-0.5 h-5 bg-slate-300 dark:bg-[#253349] my-0.5"></div>}

                {/* Phase Main Card */}
                <div className={`w-full pro-card rounded-xl border transition-all duration-200 ${
                  isCurrent
                    ? 'border-2 border-indigo-500 bg-white dark:bg-[#162030] shadow-md dark:shadow-lg'
                    : isCompleted
                      ? 'border-emerald-300 dark:border-emerald-800/80 bg-white dark:bg-[#162030]'
                      : 'border-slate-200 dark:border-[#233147] bg-white dark:bg-[#162030]'
                }`}>
                  {/* Phase Header */}
                  <div 
                    onClick={() => togglePhaseExpand(phaseNum)}
                    className="p-5 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Phase Number Node */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm flex-none shadow-sm ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                            ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                            : 'bg-slate-100 dark:bg-[#0d131f] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#253349]'
                      }`}>
                        {isCompleted ? <Check className="w-6 h-6 stroke-[3]" /> : phaseNum}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{phase.title}</h4>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                              YOU ARE HERE
                            </span>
                          )}
                          {isCompleted && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                              COMPLETED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Timeline: {phase.duration || `Weeks ${pIdx * 3 + 1}-${pIdx * 3 + 3}`}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {tasks.length > 0 && (
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline-block bg-slate-100 dark:bg-[#0d131f] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#253349]">
                          {doneCount} / {tasks.length} Tasks Checked
                        </span>
                      )}
                      <button className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded">
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Phase Details (Expandable) */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-200 dark:border-[#233147] space-y-5">
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{phase.description}</p>

                      {/* Required Skills for Phase */}
                      {phase.skillsToLearn && phase.skillsToLearn.length > 0 && (
                        <div className="space-y-1.5">
                          <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                            <Code className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>Required Skills to Master</span>
                          </h5>
                          <div className="flex flex-wrap gap-1.5">
                            {phase.skillsToLearn.map((skill, sIdx) => (
                              <span key={sIdx} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] text-indigo-600 dark:text-indigo-300 font-semibold text-xs">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interactive Task Tree */}
                      {tasks.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>Actionable Task Checklist (Database Saved)</span>
                          </h5>
                          <div className="space-y-1.5">
                            {tasks.map((t, tIdx) => (
                              <button
                                key={t.id || tIdx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleTask(pIdx, tIdx);
                                }}
                                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-xs text-left transition border ${
                                  t.done 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold' 
                                    : 'bg-slate-50 dark:bg-[#0d131f] border-slate-200 dark:border-[#253349] text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#192436]'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className={`w-4 h-4 rounded flex items-center justify-center flex-none ${
                                    t.done ? 'bg-emerald-600 text-white font-bold' : 'border border-slate-400 dark:border-slate-600 bg-white dark:bg-[#0d131f]'
                                  }`}>
                                    {t.done && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                  <span className={t.done ? 'line-through opacity-80' : ''}>{t.text}</span>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                  t.done ? 'bg-emerald-600 dark:bg-emerald-800 text-white' : 'bg-slate-200 dark:bg-[#162030] text-slate-700 dark:text-slate-400'
                                }`}>
                                  {t.done ? 'DONE' : 'TO DO'}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hands-On Portfolio Projects */}
                      {phase.keyProjects && phase.keyProjects.length > 0 && (
                        <div className="space-y-1.5 p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200">
                          <h5 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center space-x-1.5">
                            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span>Key Practical Portfolio Project to Build</span>
                          </h5>
                          <p className="text-xs text-indigo-950 dark:text-indigo-200 font-bold">{phase.keyProjects.join(' • ')}</p>
                        </div>
                      )}

                      {/* Recommended Topics to Study */}
                      {phase.recommendedTopics && phase.recommendedTopics.length > 0 && (
                        <div className="space-y-1">
                          <h5 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recommended Study Topics</h5>
                          <div className="flex flex-wrap gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                            {phase.recommendedTopics.map((topic, topIdx) => (
                              <span key={topIdx} className="inline-flex items-center space-x-1 bg-slate-100 dark:bg-[#0d131f] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#253349]">
                                <span>• {topic}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tavily-Powered Study Resources Component */}
                      <StudyResourcesList resources={phase.resources} topics={phase.recommendedTopics} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Role AI Customizer Modal */}
      {isCustomizerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="pro-card max-w-lg w-full rounded-2xl p-6 space-y-6 bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-2xl relative text-slate-900 dark:text-white">
            <button 
              onClick={() => setIsCustomizerOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5 border-b border-slate-200 dark:border-[#233147] pb-4">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>AI Roadmap Generator</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Customize Target Career Role</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select or type any target role to generate a dynamic 4-phase learning trajectory saved to database.
              </p>
            </div>

            {/* Role Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Select Preset Target Role</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presetRoles.map((role, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTargetRoleInput(role);
                      handleGenerateCustomAIRoadmap(role);
                    }}
                    disabled={generating}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-[#253349] hover:border-indigo-500 bg-slate-50 dark:bg-[#0d131f] hover:bg-slate-100 dark:hover:bg-[#192436] text-slate-800 dark:text-slate-200 font-bold text-xs text-left transition flex items-center justify-between"
                  >
                    <span>{role}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Or Type Custom Career Role</label>
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  placeholder="e.g. Cybersecurity Specialist, DevOps Architect"
                  value={targetRoleInput}
                  onChange={(e) => setTargetRoleInput(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Timeline (Weeks)</label>
                <select 
                  value={timelineWeeksInput}
                  onChange={(e) => setTimelineWeeksInput(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus-ring"
                >
                  <option value={8}>8 Weeks (Intensive)</option>
                  <option value={12}>12 Weeks (Standard 3 Months)</option>
                  <option value={16}>16 Weeks (Comprehensive)</option>
                </select>
              </div>
            </div>

            <button 
              onClick={() => handleGenerateCustomAIRoadmap()}
              disabled={generating || !targetRoleInput.trim()}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating AI Roadmap & Saving to DB...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-100" />
                  <span>Generate & Save Roadmap to DB</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
