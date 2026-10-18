import React, { useState } from 'react';
import { 
  GraduationCap, 
  Target, 
  Compass, 
  Users, 
  Briefcase, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  UserCheck,
  Building2,
  ArrowUpRight,
  MapPin,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';
import EnterprisePitchSlide from '../components/EnterprisePitchSlide';

export default function LandingPage({ onOpenAuth, onQuickDemo }) {
  const [activePreviewTab, setActivePreviewTab] = useState('jobs');

  const livePreviewData = {
    jobs: {
      title: 'Real-Time Job & Internship Radar',
      subtitle: 'Verified internal alumni referrals with guaranteed 48-hour response SLA.',
      items: [
        {
          company: 'Google DeepMind',
          role: 'AI Research & Systems Intern',
          type: 'Summer 2026',
          stipend: '₹1.50L / mo',
          referrer: 'Priya Sharma (Sr SWE @ Google)',
          matchScore: 96,
          skills: ['PyTorch', 'Distributed Systems', 'Python']
        },
        {
          company: 'Stripe',
          role: 'Infrastructure Software Engineer',
          type: 'New Grad 2026',
          stipend: '₹38 - 44 LPA',
          referrer: 'Marcus Vance (Principal Arch)',
          matchScore: 92,
          skills: ['Go', 'System Design', 'Kubernetes']
        }
      ]
    },
    matching: {
      title: 'Explainable Mentor Matching',
      subtitle: 'Transparent algorithmic fit scores derived from real tech stack overlap, not resume buzzwords.',
      items: [
        {
          name: 'Priya Sharma',
          role: 'Senior SWE @ Google DeepMind',
          college: 'Class of 2019 • Ex-KCE',
          matchScore: 96,
          reason: 'Direct match for your Python & Distributed ML goals. Conducts 1-on-1 mock system design.'
        },
        {
          name: 'Marcus Vance',
          role: 'Principal Architect @ Stripe',
          college: 'Class of 2017',
          matchScore: 92,
          reason: 'Matches your Distributed Systems and Go benchmarks. Active internal referral champion.'
        }
      ]
    },
    roadmap: {
      title: 'Month-by-Month Career Roadmap',
      subtitle: 'A structured milestone trajectory from campus foundational algorithms to production readiness.',
      milestones: [
        { month: 'Month 01', title: 'Data Structures & Scalable Architecture', status: 'Completed', score: '92%' },
        { month: 'Month 02', title: 'Distributed Systems & Inference Latency', status: 'In Progress', score: '78%' },
        { month: 'Month 03', title: 'Alumni Mock Interviews & Referrals', status: 'Upcoming', score: 'Next' }
      ]
    },
    institute: {
      title: 'Verified Institutional Network',
      subtitle: 'Campus-gated email authentication (@its.edu.in) unlocking exclusive on-campus drives & batchmates.',
      stats: [
        { label: 'Campus Placement Drives', value: '14 Active' },
        { label: 'Average CTC Unlocked', value: '₹16.8 LPA' },
        { label: 'Verified Alumni Mentors', value: '42 Leaders' },
        { label: 'Domain Authentication', value: '@its.edu.in' }
      ]
    }
  };

  const valuePillars = [
    {
      icon: Briefcase,
      title: 'Direct Alumni Referrals',
      description: 'Skip the anonymous black hole of career portals. Request internal referrals from verified alumni at Google, Stripe, OpenAI, and Microsoft.'
    },
    {
      icon: Users,
      title: 'Explainable Mentor Fit',
      description: 'See the exact mathematical reason you match with a mentor—computed from shared coursework, college background, and verified technical skills.'
    },
    {
      icon: Compass,
      title: 'Actionable Career Roadmaps',
      description: 'A connected month-by-month trajectory guiding you from foundational skills through portfolio projects to interview readiness.'
    }
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Senior Software Engineer',
      company: 'Google DeepMind',
      college: 'ITS Engineering Network • Class of 2019',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
      quote: 'ConnectEd eliminates cold LinkedIn spam. When I receive a mentorship request here, I know the student has completed real technical benchmarks.'
    },
    {
      name: 'Marcus Vance',
      role: 'Principal Software Architect',
      company: 'Stripe',
      college: 'Alumni Network • Class of 2017',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      quote: 'The skill gap visualization helps students focus on real distributed systems skills rather than generic resume buzzwords.'
    }
  ];

  return (
    <div className="space-y-16 sm:space-y-24 py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto animate-enter">
      
      {/* 1. Hero Section (Apple Product Elegance) */}
      <section className="text-center space-y-6 pt-8 sm:pt-16 max-w-4xl mx-auto">
        
        {/* Subtle Pill Eyebrow */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-xs font-mono font-medium text-slate-800 dark:text-slate-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>CAMPUS CAREER INTELLIGENCE & ALUMNI NETWORK</span>
        </div>

        {/* Display Typography */}
        <h1 className="text-4xl sm:text-6xl font-display font-semibold text-slate-950 dark:text-white tracking-tight leading-[1.12]">
          Your campus trajectory, <i className="font-normal italic text-slate-700 dark:text-slate-300">unblocked.</i>
        </h1>

        {/* Crisp Subhead */}
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          ConnectEd maps your real skill gaps against company standards, links you with verified alumni at <span className="font-semibold text-slate-900 dark:text-white">Google DeepMind, Stripe & OpenAI</span>, and unlocks direct internal job referrals.
        </p>

        {/* Minimal Tactile CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onOpenAuth('register')}
            className="px-6 py-3 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 font-semibold text-xs sm:text-sm shadow-sm transition active:scale-98 flex items-center space-x-2"
          >
            <span>Get Started — Free for Students</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={onQuickDemo}
            className="px-6 py-3 rounded-xl bg-white dark:bg-[#151924] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm border border-black/[0.08] dark:border-white/[0.08] shadow-2xs transition active:scale-98 flex items-center space-x-2"
          >
            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Explore Demo Account (Alex Chen)</span>
          </button>
        </div>

        {/* Trust Badges */}
        <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium border-t border-black/[0.05] dark:border-white/[0.06] max-w-2xl mx-auto">
          <span className="flex items-center"><ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-500" /> Domain-Verified Students</span>
          <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5 text-indigo-500" /> 48h Response SLA Guarantee</span>
          <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-1.5 text-indigo-500" /> Direct Internal Referrals</span>
        </div>
      </section>

      {/* 2. Interactive Product Preview Deck (Apple Showcase Style) */}
      <section className="space-y-4">
        {/* Interactive Segmented Tabs */}
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] shadow-2xs">
            {[
              { id: 'jobs', label: 'Live Jobs Radar', badge: '18 Live' },
              { id: 'matching', label: 'Mentor Matching', badge: '96% Fit' },
              { id: 'roadmap', label: 'Career Roadmap', badge: 'Monthly' },
              { id: 'institute', label: 'Institute Hub', badge: 'Verified' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActivePreviewTab(tab.id)}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 ${
                  activePreviewTab === tab.id
                    ? 'bg-white dark:bg-[#151924] text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                    activePreviewTab === tab.id
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold'
                      : 'bg-black/[0.04] dark:bg-white/[0.06] text-slate-500'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview Canvas */}
        <div className="apple-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.06] pb-4">
            <div>
              <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                {livePreviewData[activePreviewTab].title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {livePreviewData[activePreviewTab].subtitle}
              </p>
            </div>
            
            <button
              onClick={onQuickDemo}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs hover:bg-indigo-600 dark:hover:bg-indigo-400 transition flex items-center space-x-1.5"
            >
              <span>Launch Live View</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dynamic Preview Content */}
          {activePreviewTab === 'jobs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-enter">
              {livePreviewData.jobs.items.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{item.company}</span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display">{item.role}</h4>
                      <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">{item.type} • {item.stipend}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {item.matchScore}% Match
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-black/[0.04] dark:border-white/[0.04] text-[11px]">
                    <span className="text-slate-500">Referrer: <b>{item.referrer}</b></span>
                    <button onClick={onQuickDemo} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center">
                      <span>Request</span>
                      <ChevronRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activePreviewTab === 'matching' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-enter">
              {livePreviewData.matching.items.map((m, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{m.name}</h4>
                      <p className="text-[11px] text-slate-500">{m.role} • {m.college}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      {m.matchScore}% Fit
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    💡 <i>{m.reason}</i>
                  </p>
                </div>
              ))}
            </div>
          )}

          {activePreviewTab === 'roadmap' && (
            <div className="space-y-3 animate-enter">
              {livePreviewData.roadmap.milestones.map((ms, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{ms.month}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{ms.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-500">{ms.status}</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{ms.score}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activePreviewTab === 'institute' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-enter">
              {livePreviewData.institute.stats.map((st, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] text-center space-y-1">
                  <span className="text-[11px] text-slate-500 font-mono">{st.label}</span>
                  <div className="text-lg font-bold font-display text-slate-900 dark:text-white">{st.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Live Jobs & Placement Radar Section */}
      <section id="live-jobs-radar" className="space-y-6 scroll-mt-12">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.06] pb-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Priority Campus Opportunities</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-slate-900 dark:text-white">
              Featured Live Openings
            </h2>
          </div>
          <button
            onClick={onQuickDemo}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
          >
            <span>Explore all 18 openings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              company: 'Google DeepMind',
              role: 'AI Systems Intern',
              stipend: '₹1,50,000 / mo',
              location: 'Bangalore (Hybrid)',
              referrer: 'Priya Sharma (Sr SWE)',
              badge: 'Closing in 4 days'
            },
            {
              company: 'Stripe',
              role: 'Backend SDE (New Grad)',
              stipend: '₹38 - 44 LPA',
              location: 'Bangalore / Remote',
              referrer: 'Marcus Vance (Principal)',
              badge: 'Rolling'
            },
            {
              company: 'Microsoft',
              role: 'Cloud SDE Intern',
              stipend: '₹1,25,000 / mo',
              location: 'Noida (Campus Drive)',
              referrer: 'Amitabh Sen (Director)',
              badge: '@its.edu.in Exclusive'
            }
          ].map((op, idx) => (
            <div key={idx} className="apple-card p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-slate-900 dark:text-white">{op.company}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {op.badge}
                  </span>
                </div>
                <h3 className="font-bold text-base font-display text-slate-900 dark:text-white">{op.role}</h3>
                <div className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">{op.stipend}</div>
                <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{op.location}</span>
                </p>
              </div>

              <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 truncate max-w-[150px]">Referred by {op.referrer}</span>
                <button
                  onClick={onQuickDemo}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
                >
                  <span>Refer Me</span>
                  <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Enterprise Architecture & Pitch Slide (16:9 Canvas) */}
      <section id="enterprise-pitch-deck" className="space-y-4 scroll-mt-12">
        <div className="text-center space-y-1">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
            Institutional Infrastructure
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-slate-900 dark:text-white">
            Enterprise Architecture & Market Thesis
          </h2>
        </div>
        <EnterprisePitchSlide onExploreSolution={onQuickDemo} />
      </section>

      {/* 5. Minimalist 3-Pillar Value Grid */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Why ConnectEd
          </h2>
          <h3 className="text-2xl sm:text-3xl font-display font-semibold text-slate-900 dark:text-white">
            Built for Real Placement Outcomes
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {valuePillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div key={idx} className="apple-card p-6 space-y-3.5">
                <div className="w-10 h-10 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-slate-900 dark:text-white">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base font-display text-slate-900 dark:text-white">{pillar.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{pillar.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Testimonials */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
            Verified Testimonials
          </h2>
          <h3 className="text-2xl sm:text-3xl font-display font-semibold text-slate-900 dark:text-white">
            Trusted by Alumni Leaders
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((item, idx) => (
            <div key={idx} className="apple-card p-6 space-y-4">
              <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                "{item.quote}"
              </p>
              <div className="flex items-center space-x-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
                <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full object-cover border border-black/[0.08]" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">{item.name}</h4>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">{item.role} • {item.company}</p>
                  <p className="text-[10px] text-slate-400">{item.college}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Clean Action Banner */}
      <section className="apple-card p-8 sm:p-12 text-center space-y-6 bg-slate-950 text-white dark:bg-white dark:text-slate-950">
        <div className="space-y-2 max-w-xl mx-auto">
          <h3 className="text-2xl sm:text-4xl font-display font-semibold tracking-tight">
            Ready to unlock your campus career trajectory?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-600">
            Join verified batchmates and alumni mentors. Free for all verified @its.edu.in students.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onOpenAuth('register')}
            className="px-6 py-3 rounded-xl bg-white text-slate-950 dark:bg-slate-950 dark:text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-98"
          >
            Create Free Student Account
          </button>
          <button
            onClick={onQuickDemo}
            className="px-6 py-3 rounded-xl border border-white/20 dark:border-black/20 text-white dark:text-slate-950 font-semibold text-xs sm:text-sm transition hover:bg-white/10 dark:hover:bg-black/5"
          >
            Explore Live Demo
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-8 border-t border-black/[0.06] dark:border-white/[0.06] text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <GraduationCap className="w-4 h-4 text-slate-900 dark:text-white" />
          <span className="font-bold text-slate-900 dark:text-white">ConnectEd Platform</span>
        </div>
        <p>© 2026 ConnectEd Institutional Platform. Verified for ITS Engineering Network.</p>
      </footer>
    </div>
  );
}
