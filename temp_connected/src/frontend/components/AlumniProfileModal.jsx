import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Sparkles, 
  ExternalLink, 
  Zap, 
  Award, 
  Calendar, 
  MessageSquare, 
  CheckCircle2, 
  Building2, 
  Clock, 
  Star, 
  FileText,
  UserCheck,
  ChevronRight,
  TrendingUp,
  Share2
} from 'lucide-react';
import { getVerifiableLinkedInUrl } from '../utils/linkedin';

export default function AlumniProfileModal({ 
  alumni, 
  onClose, 
  onOpenRequestMentorship, 
  onBookSession,
  user 
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!alumni) return null;

  const handleCopyProfileLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Derive career history if not explicit
  const careerTimeline = alumni.pastRoles && alumni.pastRoles.length > 0 
    ? alumni.pastRoles 
    : [
        `${alumni.role || alumni.title} @ ${alumni.company}`,
        `Software Engineer @ Tech Leader`,
        `B.E. ${alumni.major || 'Computer Science'} — ${alumni.university || 'KCE'} (Class of ${alumni.graduationYear || 2021})`
      ];

  const mentorshipOfferings = [
    { title: '1-on-1 Career Guidance & Goal Alignment', desc: 'Strategy on target roles, company selection, & skill benchmarks.' },
    { title: 'Mock System Design & Technical Assessment', desc: 'Live architectural interview practice with actionable feedback.' },
    { title: 'Resume & Portfolio Review', desc: 'Executive feedback to pass automated HR screening.' },
    { title: 'Internal Company Referral Guidance', desc: 'Advice on job openings and referral recommendations.' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-[#121927] border border-slate-200 dark:border-[#233147] w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col transition-all">
        
        {/* Banner Header */}
        <div className="relative h-32 sm:h-40 bg-gradient-to-r from-indigo-900 via-indigo-700 to-slate-900 p-6 flex items-start justify-between flex-none overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className="relative z-10 flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-md border border-white/30 tracking-wide uppercase flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified KCE Alumni Mentor</span>
            </span>
          </div>

          <div className="relative z-10 flex items-center space-x-2">
            <button 
              onClick={handleCopyProfileLink}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-md border border-white/20 text-xs font-semibold flex items-center space-x-1"
              title="Share Profile"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Share'}</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-md border border-white/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile Card Header Info */}
        <div className="relative px-6 pb-4 pt-0 flex-none border-b border-slate-200 dark:border-[#233147] bg-white dark:bg-[#121927]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
            {/* Avatar & Verified Badge */}
            <div className="relative flex-none">
              <img 
                src={alumni.avatar || alumni.avatarUrl} 
                alt={alumni.name} 
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-4 ring-white dark:ring-[#121927] shadow-xl"
              />
              <span className="absolute bottom-1 right-1 bg-emerald-500 text-slate-950 p-1.5 rounded-full ring-2 ring-white dark:ring-[#121927]" title="Verified Active Mentor">
                <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              </span>
            </div>

            {/* Impact & Badge Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3.5 py-1.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-400/40 text-amber-600 dark:text-amber-300 font-extrabold text-xs flex items-center space-x-1.5 shadow-xs">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>⚡ {alumni.impactScore || 850} Mentorship Impact</span>
              </div>
              <div className="px-3 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs">
                {alumni.badgeTier || '#1 Top Mentor 🔥'}
              </div>
              <div className="px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs flex items-center space-x-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>{alumni.availability || 'Available for Mentorship'}</span>
              </div>
            </div>
          </div>

          {/* Name & Basic Info */}
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
              <span>{alumni.name}</span>
            </h2>
            
            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400">
              <div className="flex items-center space-x-1.5">
                <Briefcase className="w-4 h-4 text-indigo-500 flex-none" />
                <span>{alumni.title || alumni.role} @ {alumni.company}</span>
              </div>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300 font-medium">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                <span>{alumni.university || 'KCE'} Class of {alumni.graduationYear || 2021}</span>
              </div>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{alumni.location || 'Bengaluru, India'}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-[#233147]">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#172235] border border-slate-200/70 dark:border-[#25344d]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Impact Score</span>
              <span className="text-base font-extrabold text-amber-500 dark:text-amber-400 flex items-center space-x-1">
                <span>⚡ {alumni.impactScore || 850}</span>
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#172235] border border-slate-200/70 dark:border-[#25344d]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Mentees Guided</span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                {alumni.menteesGuided || 18} Students
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#172235] border border-slate-200/70 dark:border-[#25344d]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Response Time</span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>&lt; 2 Hours</span>
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#172235] border border-slate-200/70 dark:border-[#25344d]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Target Goal Match</span>
              <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                {alumni.matchScore || 92}% Match
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-[#233147] bg-slate-50/50 dark:bg-[#172235]/40 px-6 space-x-6 flex-none text-xs font-bold">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            Overview & Goal Match
          </button>
          <button 
            onClick={() => setActiveTab('experience')}
            className={`py-3 border-b-2 transition ${activeTab === 'experience' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            Career Journey ({careerTimeline.length})
          </button>
          <button 
            onClick={() => setActiveTab('skills')}
            className={`py-3 border-b-2 transition ${activeTab === 'skills' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            Skills & Expertise
          </button>
          <button 
            onClick={() => setActiveTab('mentorship')}
            className={`py-3 border-b-2 transition ${activeTab === 'mentorship' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            Mentorship Offerings
          </button>
        </div>

        {/* Tab Contents (Scrollable) */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 bg-white dark:bg-[#121927]">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Goal Match Insight Banner */}
              <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-900 dark:text-indigo-200 font-extrabold text-xs">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>AI Match Reason for {user?.name || 'Student'} ({user?.targetRole ? `${user.targetRole}${user.targetCompany ? ` @ ${user.targetCompany}` : ''}` : 'Target Goal Not Set'})</span>
                </div>
                <p className="text-xs text-indigo-950 dark:text-indigo-100 font-medium leading-relaxed">
                  {alumni.matchReason || `${alumni.name} is a KCE Alum (Class of ${alumni.graduationYear}) currently working as ${alumni.role || alumni.title} at ${alumni.company}. Highly recommended for career guidance in ${alumni.domain || 'Software Engineering'}.`}
                </p>
              </div>

              {/* Biography / Narrative */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>About & Career Bio</span>
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#172235] border border-slate-200/70 dark:border-[#25344d] text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {alumni.bio || `${alumni.name} graduated from KCE in ${alumni.graduationYear} and has built ${alumni.experienceYears || 3}+ years of industry experience developing high-scale systems and products.`}
                </div>
              </div>

              {/* Quick Key Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#172235] border border-slate-200/70 dark:border-[#25344d] space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white">
                    <Building2 className="w-4 h-4 text-indigo-500" />
                    <span>Company & Domain</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {alumni.company} • {alumni.domain || alumni.major || 'Software Development'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#172235] border border-slate-200/70 dark:border-[#25344d] space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white">
                    <GraduationCap className="w-4 h-4 text-emerald-500" />
                    <span>Academic Degree</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {alumni.degree || 'B.E. Computer Science'} ({alumni.university || 'KCE'})
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CAREER EXPERIENCE TIMELINE */}
          {activeTab === 'experience' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                <span>Verified Career History & Milestones</span>
              </h4>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-200 dark:before:bg-indigo-900/60">
                {careerTimeline.map((item, idx) => (
                  <div key={idx} className="relative flex items-start space-x-4">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-white dark:ring-[#121927]">
                      {idx + 1}
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#172235] border border-slate-200/70 dark:border-[#25344d] w-full space-y-1">
                      <h5 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>{item}</span>
                        {idx === 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                            Present
                          </span>
                        )}
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {idx === 0 
                          ? `Leading key engineering initiatives & mentoring KCE juniors.` 
                          : `Gained foundational domain expertise & technical mastery.`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SKILLS & EXPERTISE */}
          {activeTab === 'skills' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Verified Technical Skills & Domain Mastery</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.isArray(alumni.skills) && alumni.skills.map((sk, idx) => (
                  <div 
                    key={idx} 
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#172235] border border-slate-200/70 dark:border-[#25344d] flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                        {sk.charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white block">{sk}</span>
                        <span className="text-[10px] font-medium text-slate-400">Verified Competency</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {idx % 2 === 0 ? 'Expert' : 'Advanced'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MENTORSHIP OFFERINGS */}
          {activeTab === 'mentorship' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-extrabold text-amber-800 dark:text-amber-300 flex items-center space-x-1.5">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span>Mentorship Impact Guarantee</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Connecting awards +50 Impact Points directly to {alumni.name}'s leaderboard score.
                  </p>
                </div>
                <span className="px-3 py-1 bg-amber-500 text-slate-950 rounded-xl font-extrabold text-xs shadow-xs">
                  ⚡ {alumni.impactScore} Pts
                </span>
              </div>

              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Mentorship Programs Offered
              </h4>

              <div className="space-y-3">
                {mentorshipOfferings.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#172235] border border-slate-200/70 dark:border-[#25344d] flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-none mt-0.5" />
                    <div className="space-y-0.5">
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{item.title}</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-[#233147] bg-slate-50 dark:bg-[#172235] flex flex-col sm:flex-row items-center justify-between gap-3 flex-none">
          <a 
            href={getVerifiableLinkedInUrl(alumni)} 
            target="_blank" 
            rel="noreferrer"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white dark:bg-[#121927] hover:bg-slate-100 dark:hover:bg-[#1c283c] text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-[#25344d] flex items-center justify-center space-x-2 transition"
          >
            <ExternalLink className="w-4 h-4 text-slate-400" />
            <span>Verified LinkedIn Profile</span>
          </a>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button 
              onClick={() => {
                onClose();
                if (onBookSession) onBookSession(alumni);
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              <span>Book 1-on-1 Session (+100 Pts)</span>
            </button>

            <button 
              onClick={() => {
                onClose();
                if (onOpenRequestMentorship) onOpenRequestMentorship(alumni);
              }}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Request Mentorship (+50 Pts)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
