import React, { useState } from 'react';
import { 
  Briefcase, 
  Search, 
  MapPin, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Building2, 
  ArrowUpRight, 
  DollarSign, 
  Send, 
  Filter, 
  ShieldCheck, 
  Users, 
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { mentorshipApi } from '../services/api';
import { getVerifiableLinkedInUrl } from '../utils/linkedin';

const LIVE_OPPORTUNITIES = [
  {
    id: 'job-1',
    company: 'Google DeepMind',
    logo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120',
    role: 'AI Research & Systems Intern',
    type: 'Summer 2026 Internship',
    category: 'internship',
    stipend: '₹1,50,000 / mo',
    location: 'Bangalore, India (Hybrid)',
    deadline: 'Closing in 4 days',
    urgent: true,
    skills: ['Python', 'PyTorch', 'Distributed Systems', 'Transformers'],
    description: 'Work with the DeepMind Gemini infrastructure team on model serving optimization, distributed tensor sharding, and latency reduction pipelines.',
    referrer: {
      alumniId: 'alum_1',
      id: 'alum_1',
      name: 'Priya Sharma',
      role: 'Senior Software Engineer @ Google',
      college: 'KCE Alumni • Class of 2019',
      institutionalId: 'KCE-ALUM-2019-001',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
      linkedin: 'https://www.linkedin.com/search/results/people/?keywords=Priya%20Sharma%20Google',
      matchScore: 96,
      slaHours: 24
    }
  },
  {
    id: 'job-2',
    company: 'Bosch Global Software',
    logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    role: 'Automotive Embedded Systems Engineer',
    type: 'New Grad Full-Time',
    category: 'fulltime',
    stipend: '₹18 - 24 LPA',
    location: 'Bengaluru, India (Hybrid)',
    deadline: 'Rolling Applications',
    urgent: false,
    skills: ['CAPL', 'CANoe', 'ECU Testing', 'AUTOSAR', 'Python'],
    description: 'Validate automotive ECU software for electric powertrain systems, diagnostics protocols, and real-time embedded safety loops.',
    referrer: {
      alumniId: 'alum-93',
      id: 'alum-93',
      name: 'Parthiban Velmurugan',
      company: 'Bosch',
      role: 'Senior Test Engineer @ Bosch',
      college: 'KCE Alumni • Class of 2021',
      institutionalId: 'KCE-ALUM-2021-093',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      linkedin: 'https://www.linkedin.com/search/results/people/?keywords=Parthiban%20Velmurugan%20Bosch',
      matchScore: 92,
      slaHours: 48
    }
  },
  {
    id: 'job-3',
    company: 'Purple Slate',
    logo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120',
    role: 'Python & FastAPI Backend Developer',
    type: 'Full-Time Engineering',
    category: 'fulltime',
    stipend: '₹14 - 18 LPA',
    location: 'India / Remote',
    deadline: '6 Slots Remaining',
    urgent: true,
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'GitHub Actions'],
    description: 'Build high-throughput backend APIs for AI-powered enterprise solutions with automated continuous integration and scalable microservices.',
    referrer: {
      alumniId: 'alum-94',
      id: 'alum-94',
      name: 'Lavanya Murugavel',
      company: 'Purple Slate',
      role: 'Python Developer @ Purple Slate',
      college: 'KCE Alumni • Class of 2022',
      institutionalId: 'KCE-ALUM-2022-094',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
      linkedin: 'https://www.linkedin.com/search/results/people/?keywords=Lavanya%20Murugavel%20Purple%20Slate',
      matchScore: 94,
      slaHours: 24
    }
  },
  {
    id: 'job-4',
    company: 'Microsoft',
    logo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=120',
    role: 'Cloud Architect & SDE Intern',
    type: 'Campus Fast-Track Drive',
    category: 'oncampus',
    stipend: '₹1,25,000 / mo',
    location: 'Hyderabad / Noida (Hybrid)',
    deadline: 'Exclusive to Verified Students',
    urgent: false,
    skills: ['Azure', 'Cloud Architecture', 'Distributed Systems', 'Python', 'Docker'],
    description: 'Enterprise cloud scalability, fault-tolerant microservices, and high-performance serverless backend deployments across Azure regions.',
    referrer: {
      alumniId: 'alumni_002',
      id: 'alumni_002',
      name: 'Aravind Nair',
      company: 'Microsoft',
      role: 'Principal Cloud Architect @ Microsoft',
      college: 'KCE Alumni • Class of 2018',
      institutionalId: 'KCE-ALUM-2018-002',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      linkedin: 'https://www.linkedin.com/search/results/people/?keywords=Aravind%20Nair%20Microsoft',
      matchScore: 95,
      slaHours: 24
    }
  },
  {
    id: 'job-5',
    company: 'Minion Labs',
    logo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    role: 'IoT & Product Engineer',
    type: 'Core Engineering Role',
    category: 'fulltime',
    stipend: '₹12 - 16 LPA',
    location: 'Coimbatore, India (On-Site)',
    deadline: 'Closing in 3 days',
    urgent: true,
    skills: ['React Native', 'Firebase', 'Arduino', 'Raspberry Pi', 'Product Design'],
    description: 'Develop next-generation smart home IoT monitoring solutions, embedded firmware sensor interfaces, and cross-platform mobile telemetry apps.',
    referrer: {
      alumniId: 'alum-91',
      id: 'alum-91',
      name: 'Anandakumar Rajasekaran',
      company: 'Minion Labs',
      role: 'Product Engineer @ Minion Labs',
      college: 'KCE Alumni • Class of 2021',
      institutionalId: 'KCE-ALUM-2021-091',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
      linkedin: 'https://www.linkedin.com/search/results/people/?keywords=Anandakumar%20Rajasekaran%20Minion%20Labs',
      matchScore: 90,
      slaHours: 24
    }
  },
  {
    id: 'job-6',
    company: 'Ultramain Systems India',
    logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    role: 'Aviation Software Engineer',
    type: 'Enterprise Backend Role',
    category: 'fulltime',
    stipend: '₹10 - 14 LPA',
    location: 'India / Remote',
    deadline: 'Closing in 7 days',
    urgent: false,
    skills: ['Java', 'Oracle DB', 'SOAP Web Services', 'SQL', 'Aviation MRO Systems'],
    description: 'Engineer and optimize critical aviation MRO (Maintenance, Repair, and Overhaul) software solutions for commercial airline fleets worldwide.',
    referrer: {
      alumniId: 'alum-92',
      id: 'alum-92',
      name: 'Visalakshi Krishnamoorthi',
      company: 'Ultramain Systems',
      role: 'Software Engineer @ Ultramain Systems',
      college: 'KCE Alumni • Class of 2021',
      institutionalId: 'KCE-ALUM-2021-092',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      linkedin: 'https://www.linkedin.com/search/results/people/?keywords=Visalakshi%20Krishnamoorthi%20Ultramain%20Systems',
      matchScore: 88,
      slaHours: 48
    }
  }
];

export default function LiveJobsRadarPage({ user, onOpenAI }) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReferralJob, setActiveReferralJob] = useState(null);
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Filter opportunities
  const filteredJobs = LIVE_OPPORTUNITIES.filter(job => {
    const matchesFilter = 
      selectedFilter === 'all' ? true :
      selectedFilter === 'internship' ? job.category === 'internship' :
      selectedFilter === 'fulltime' ? job.category === 'fulltime' :
      selectedFilter === 'oncampus' ? job.category === 'oncampus' :
      selectedFilter === 'urgent' ? job.urgent : true;

    const matchesSearch = 
      job.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const handleOpenReferralModal = (job) => {
    setActiveReferralJob(job);
    setCustomNote(
      `Hi ${job.referrer.name.split(' ')[0]},\n\nI noticed the ${job.role} opening at ${job.company}. My background in ${job.skills.slice(0, 3).join(', ')} directly matches the team's requirements. Would you be open to reviewing my profile for an internal referral?`
    );
  };

  const handleSendReferralRequest = async () => {
    if (!activeReferralJob) return;
    setIsSubmitting(true);

    try {
      // Connect to authoritative mentorship API
      await mentorshipApi.createRequest({
        alumniId: activeReferralJob.referrer.alumniId || activeReferralJob.referrer.id || activeReferralJob.referrer.name.toLowerCase().replace(/\s+/g, '_'),
        studentName: user?.name || 'Alex Chen',
        studentEmail: user?.email || 'alex.chen@kce.edu',
        topic: `Job Referral Request: ${activeReferralJob.role} at ${activeReferralJob.company}`,
        message: customNote,
        skills: activeReferralJob.skills
      });

      setToastMessage({
        type: 'success',
        title: 'Referral Request Dispatched!',
        detail: `Sent to ${activeReferralJob.referrer.name}. You will receive a Telegram & email update within ${activeReferralJob.referrer.slaHours} hours.`
      });
      setActiveReferralJob(null);
    } catch (e) {
      setToastMessage({
        type: 'error',
        title: 'Dispatch Failed',
        detail: e.message || 'Unable to submit referral request. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMessage(null), 6000);
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-enter">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-enter max-w-md bg-white dark:bg-[#181A20] border-2 border-black dark:border-white rounded-2xl p-4 shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#E2F952] flex items-start space-x-3">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-black dark:text-[#E2F952] flex-none mt-0.5 stroke-[2.5]" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 flex-none mt-0.5 stroke-[2.5]" />
          )}
          <div className="flex-1 text-xs">
            <h4 className="font-display font-bold text-black dark:text-white">{toastMessage.title}</h4>
            <p className="font-mono text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">{toastMessage.detail}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-black dark:text-white hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner - Editorial Masthead */}
      <div className="editorial-card p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black dark:border-white pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E2F952] border border-black animate-pulse" />
            <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              SECTOR 02 // REAL-TIME OPPORTUNITY RADAR
            </span>
            <span className="font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#E2F952] text-black border border-black shadow-[1px_1px_0px_0px_#000]">
              LIVE
            </span>
          </div>

          <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
            [CYCLE: SPRING 2026 // SEMESTER 6 PRIORITY]
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-black dark:text-white tracking-tight leading-[1.05]">
            Direct Alumni Referrals & <i className="font-serif">Campus Opportunities</i>
          </h1>
          <p className="font-mono text-xs sm:text-sm text-slate-700 dark:text-slate-300 max-w-3xl leading-relaxed">
            Bypass standard applicant queues. ConnectEd matches you with verified alumni who can submit your profile directly into the internal referral pipeline at top tech companies.
          </p>
        </div>

        {/* Telemetry Stats Bar - Swiss Grid 4-Card System */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-[#FBF9F5] dark:bg-[#111215] border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#E2F952]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Roles</span>
            <div className="text-xl font-display font-bold text-black dark:text-white mt-0.5">18 Positions</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FBF9F5] dark:bg-[#111215] border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#E2F952]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Stipend</span>
            <div className="text-xl font-display font-bold text-black dark:text-white mt-0.5">₹1.45L / mo</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FBF9F5] dark:bg-[#111215] border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#E2F952]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Referral Rate</span>
            <div className="text-xl font-display font-bold text-black dark:text-[#E2F952] mt-0.5">94% Response</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FBF9F5] dark:bg-[#111215] border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#E2F952]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">SLA Protected</span>
            <div className="text-xl font-display font-bold text-black dark:text-white mt-0.5">24 - 48 Hours</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-black dark:text-white absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, role, or skill (e.g. PyTorch, Go)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#181A20] border-2 border-black dark:border-white text-xs font-mono font-medium text-black dark:text-white placeholder-slate-400 focus:outline-none shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#E2F952] transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Openings' },
            { id: 'internship', label: 'Internships' },
            { id: 'fulltime', label: 'New Grad Full-Time' },
            { id: 'oncampus', label: 'On-Campus @ ITS' },
            { id: 'urgent', label: 'Closing Soon' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition ${
                selectedFilter === f.id
                  ? 'bg-[#E2F952] text-black font-extrabold border-2 border-black shadow-[2px_2px_0px_0px_#000000]'
                  : 'bg-white dark:bg-[#181A20] text-black dark:text-white border-2 border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Opportunities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredJobs.map((job) => (
          <div 
            key={job.id} 
            className="editorial-card p-6 flex flex-col justify-between space-y-4 group transition"
          >
            {/* Top row: Role, Company & Badges */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-black dark:text-white">
                      {job.company}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white border border-black/20 dark:border-white/20">
                      {job.type}
                    </span>
                    {job.urgent && (
                      <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#E2F952] text-black border border-black">
                        {job.deadline}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-black dark:text-white font-display pt-0.5">
                    {job.role}
                  </h3>
                </div>

                <div className="text-right flex-none">
                  <div className="text-sm font-mono font-extrabold text-black dark:text-white">
                    {job.stipend}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center justify-end space-x-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    <span>{job.location}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                {job.description}
              </p>

              {/* Skills tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {job.skills.map((skill, sIdx) => (
                  <span 
                    key={sIdx}
                    className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-black/20 dark:border-white/20 text-[11px] font-mono text-black dark:text-white"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Referrer Banner & Direct CTA */}
            <div className="pt-3 border-t-2 border-black/10 dark:border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5 min-w-0">
                <img 
                  src={job.referrer.avatar} 
                  alt={job.referrer.name} 
                  className="w-10 h-10 rounded-xl object-cover border-2 border-black dark:border-white flex-none"
                />
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-black dark:text-white truncate">
                    <span>{job.referrer.name}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-black dark:text-[#E2F952] flex-none" />
                    {job.referrer.institutionalId && (
                      <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white border border-black/40 flex-none">
                        {job.referrer.institutionalId}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      {job.referrer.role}
                    </p>
                    {job.referrer.linkedin && (
                      <a
                        href={getVerifiableLinkedInUrl(job.referrer)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-[#E2F952] transition flex-none"
                        title="View Verified Alumni LinkedIn"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenReferralModal(job)}
                className="px-3.5 py-2 rounded-xl bg-[#E2F952] hover:bg-[#d8f042] text-black font-mono font-extrabold text-xs border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition flex items-center space-x-1.5 flex-none"
              >
                <span>Request Referral</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 1-Click Referral Request Modal */}
      {activeReferralJob && (
        <div className="fixed inset-0 z-50 p-4 bg-black/60 flex items-center justify-center animate-enter">
          <div className="w-full max-w-lg bg-white dark:bg-[#181A20] rounded-2xl border-2 border-black dark:border-white p-6 sm:p-7 shadow-[6px_6px_0px_0px_#000000] dark:shadow-[6px_6px_0px_0px_#E2F952] space-y-5">
            <div className="flex items-start justify-between border-b-2 border-black dark:border-white pb-3">
              <div>
                <span className="font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 bg-[#E2F952] text-black border border-black rounded">
                  REFERRAL DIRECTIVE
                </span>
                <h3 className="text-xl font-bold font-display text-black dark:text-white mt-1">
                  Request Internal Referral
                </h3>
              </div>
              <button 
                onClick={() => setActiveReferralJob(null)}
                className="p-1.5 rounded-lg border-2 border-black dark:border-white text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Job & Alumni Summary */}
            <div className="p-4 rounded-xl bg-[#FBF9F5] dark:bg-[#111215] border-2 border-black dark:border-white flex items-center space-x-3.5">
              <img 
                src={activeReferralJob.referrer.avatar} 
                alt={activeReferralJob.referrer.name}
                className="w-11 h-11 rounded-xl object-cover border-2 border-black dark:border-white flex-none"
              />
              <div className="min-w-0 flex-1 text-xs">
                <div className="font-bold text-black dark:text-white font-display text-sm">
                  {activeReferralJob.role}
                </div>
                <div className="font-mono text-slate-600 dark:text-slate-400">
                  {activeReferralJob.company} • Referrer: {activeReferralJob.referrer.name}
                </div>
                <div className="flex items-center space-x-2 mt-1 font-mono text-[10px]">
                  <span className="font-bold text-black dark:text-[#E2F952]">
                    ★ {activeReferralJob.referrer.matchScore}% Match
                  </span>
                  <span>•</span>
                  <span className="text-slate-500">
                    {activeReferralJob.referrer.slaHours}h SLA Protected
                  </span>
                </div>
              </div>
            </div>

            {/* Note Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-black dark:text-white uppercase">
                Introduction & Referral Context
              </label>
              <textarea 
                rows={5}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full p-3 rounded-xl bg-white dark:bg-[#111215] border-2 border-black dark:border-white text-xs font-mono text-black dark:text-white focus:outline-none shadow-[2px_2px_0px_0px_#000] leading-relaxed"
              />
              <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                [SYSTEM: Verified student credentials & ATS scores will be attached.]
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveReferralJob(null)}
                className="px-4 py-2.5 rounded-xl border-2 border-black dark:border-white text-xs font-mono font-bold text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSendReferralRequest}
                className="px-5 py-2.5 rounded-xl bg-[#E2F952] hover:bg-[#d8f042] text-black text-xs font-mono font-extrabold border-2 border-black shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition flex items-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Dispatching...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Referral Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
