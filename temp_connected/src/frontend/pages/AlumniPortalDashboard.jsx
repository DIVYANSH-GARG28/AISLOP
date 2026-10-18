import React, { useState } from 'react';
import { 
  Award, 
  Zap, 
  Users, 
  MessageSquare, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Plus,
  ShieldCheck,
  Send,
  Building2,
  TrendingUp
} from 'lucide-react';

export default function AlumniPortalDashboard({ user, onOpenAI }) {
  const [requests, setRequests] = useState([
    { id: 'req_1', studentName: 'Aarav Sharma', goal: 'Senior AI Engineer @ Google DeepMind', topic: 'System Architecture & Vector Search', date: '2 hours ago', status: 'PENDING' },
    { id: 'req_2', studentName: 'Ananya Verma', goal: 'Backend Engineer @ Stripe', topic: 'PostgreSQL Query Optimization', date: '1 day ago', status: 'PENDING' }
  ]);

  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('Google');
  const [jobPostedSuccess, setJobPostedSuccess] = useState(false);

  const handleAcceptRequest = (id) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'ACCEPTED' } : r));

    const saved = localStorage.getItem('connected_alumni_requests');
    if (saved) {
      try {
        const reqs = JSON.parse(saved);
        const updated = reqs.map(r => {
          if (r.id === id || r.alumniName === user?.name || r.alumniCompany === user?.company) {
            return {
              ...r,
              status: 'ACCEPTED',
              acceptedAt: 'Just now',
              messages: [
                ...(r.messages || []),
                {
                  id: 'm_accepted_' + Date.now(),
                  sender: 'alumni',
                  text: `Hi ${r.studentName || 'Student'}! I have ACCEPTED your mentorship request. I am happy to connect and answer your questions.`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              ]
            };
          }
          return r;
        });
        localStorage.setItem('connected_alumni_requests', JSON.stringify(updated));
      } catch (e) {}
    }
  };

  const handlePostReferral = (e) => {
    e.preventDefault();
    if (!jobTitle) return;
    setJobPostedSuccess(true);
    setTimeout(() => {
      setJobPostedSuccess(false);
      setJobTitle('');
    }, 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
      {/* 1. Alumni Header Banner */}
      <div className="pro-card p-6 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="relative flex-none w-16 h-16 sm:w-20 sm:h-20">
            <img 
              src={user?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250'} 
              alt={user?.name || 'Alumni Mentor'} 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-amber-500 shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-full text-xs shadow" title="Verified Alumni">
              <ShieldCheck className="w-3.5 h-3.5 stroke-[3]" />
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{user?.name || 'Priya Sharma'}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                ALUMNI MENTOR
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Senior Software Engineer @ Google • KCE Class of 2019
            </p>
            <div className="flex items-center space-x-2 text-xs font-bold pt-0.5">
              <span className="text-slate-500 dark:text-slate-400">Mentorship Status:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Active (34 Juniors Mentored)</span>
            </div>
          </div>
        </div>

        <button 
          onClick={onOpenAI}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-md flex-none"
        >
          <Sparkles className="w-4 h-4 text-indigo-100" />
          <span>AI Mentorship Copilot</span>
        </button>
      </div>

      {/* 2. Top Metric KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="pro-card p-4 rounded-2xl bg-white dark:bg-[#162030] border border-amber-300/60 dark:border-amber-800/60 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">Impact Score</span>
            <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">⚡ 985 Pts</div>
          <p className="text-[11px] text-slate-500 font-medium">Ranked #1 Alumni Mentor</p>
        </div>

        <div className="pro-card p-4 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Mentees Guided</span>
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">34 Students</div>
          <p className="text-[11px] text-slate-500 font-medium">System Design & AI Prep</p>
        </div>

        <div className="pro-card p-4 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pending Requests</span>
            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">2 Requests</div>
          <p className="text-[11px] text-slate-500 font-medium">Awaiting your response</p>
        </div>

        <div className="pro-card p-4 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Referrals Posted</span>
            <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">3 Openings</div>
          <p className="text-[11px] text-slate-500 font-medium">Google & Cloud Teams</p>
        </div>
      </div>

      {/* 3. Pending Mentorship Requests & Job Referral Posting */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Requests Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="pro-card p-6 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#233147] pb-3">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Student Mentorship Requests</span>
              </h2>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">+50 Impact Pts Per Acceptance</span>
            </div>

            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.id} className="p-4 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">{req.studentName}</span>
                    <span className="text-[10px] text-slate-400">{req.date}</span>
                  </div>
                  <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Goal: {req.goal}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">Topic: {req.topic}</div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-200/80 dark:border-[#233147]">
                    {req.status === 'ACCEPTED' ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accepted! +50 Impact Points Earned</span>
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleAcceptRequest(req.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept & Schedule Session (+50 Pts)</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Post Job Referral Opening */}
        <div className="space-y-4">
          <div className="pro-card p-6 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Post Job Referral Opening</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Share internal job openings at your company for verified KCE juniors.</p>

            {jobPostedSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                <span>Job Referral Posted Successfully!</span>
              </div>
            ) : (
              <form onSubmit={handlePostReferral} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Job Title</label>
                  <input 
                    type="text" 
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. AI Systems Engineer (New Grad 2026)"
                    className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus-ring font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Company</label>
                  <input 
                    type="text" 
                    value={jobCompany}
                    onChange={(e) => setJobCompany(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus-ring font-medium"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish Job Referral</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
