import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Bot, 
  Clock, 
  ArrowRight, 
  Users, 
  Award,
  Lock,
  Star
} from 'lucide-react';
import { userApi } from '../services/api';

export default function ConnectEdProModal({ isOpen, onClose, user, onProfileUpdated, onOpenRAG }) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [activePlan, setActivePlan] = useState(user?.isPro ? 'pro' : 'free');

  if (!isOpen) return null;

  const handleActivatePro = async () => {
    setIsUpgrading(true);
    try {
      const res = await userApi.updateProfile({ isPro: true });
      if (res.success) {
        setActivePlan('pro');
        if (onProfileUpdated) onProfileUpdated(res.user);
      }
    } catch (e) {
      console.error("Pro upgrade error:", e);
    } finally {
      setIsUpgrading(false);
    }
  };

  const proFeatures = [
    {
      icon: <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      title: "Resume RAG AI Co-pilot (via n8n)",
      desc: "Chat directly with your uploaded resume to generate tailored interview questions, STAR answers, and ATS gap critiques."
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      title: "Real-Time Job Radar & Warm Intros",
      desc: "Live job and internship tracker scored to your target role with 1-click alumni warm referral requests."
    },
    {
      icon: <Clock className="w-5 h-5 text-emerald-500" />,
      title: "12-Hour Priority Mentorship SLA",
      desc: "Guaranteed 12h response window from verified senior alumni mentors at Google, Amazon, and Microsoft."
    },
    {
      icon: <Users className="w-5 h-5 text-violet-500" />,
      title: "1-on-1 Mock Tech Interview Loops",
      desc: "Unlimited system design, live coding, and behavioral mock interviews with alumni in your target companies."
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-sky-500" />,
      title: "Authoritative Verified Student Seal",
      desc: "Verified university credential badge that fast-tracks your profile to the top of recruiter inboxes."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="pro-card max-w-3xl w-full rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-2xl p-6 sm:p-8 space-y-6 relative text-slate-900 dark:text-white my-6">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1f2d45] rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 border-b border-slate-200 dark:border-[#233147] pb-5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>ConnectEd Pro • Enterprise Career Accelerator</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Accelerate Your Career with ConnectEd Pro
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            Everything you need to land top-tier SDE and AI roles: Resume RAG AI Co-pilot, real-time jobs radar, and 12h priority alumni access.
          </p>
        </div>

        {/* Pro Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {proFeatures.map((f, idx) => (
            <div 
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] space-y-1.5"
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm">
                  {f.icon}
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">{f.title}</h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Pricing Tiers Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          
          {/* Starter Plan */}
          <div className="p-5 rounded-2xl bg-slate-50/60 dark:bg-[#0d131f]/60 border border-slate-200 dark:border-[#253349] space-y-4">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Campus Standard</span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">$0 <span className="text-xs font-normal text-slate-400">/ forever</span></div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Standard student mentorship & general directory access.</p>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 flex-none" />
                <span>Basic Alumni Discovery & Messaging</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 flex-none" />
                <span>Standard 48h Mentorship Response SLA</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 flex-none" />
                <span>Public Career Track Benchmarks</span>
              </li>
            </ul>

            <button 
              disabled
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-[#253349] text-slate-400 text-xs font-semibold cursor-not-allowed"
            >
              Current Campus Plan
            </button>
          </div>

          {/* Pro Plan Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-indigo-50/50 to-white dark:from-[#131c2e] dark:to-[#162030] border-2 border-indigo-600 dark:border-indigo-500 space-y-4 relative shadow-lg">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-sm">
              RECOMMENDED
            </div>

            <div>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">ConnectEd Pro</span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                $19 <span className="text-xs font-normal text-slate-400">/ month (or ₹799/mo)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">7-Day Free Trial. Instant Activation. Cancel anytime.</p>
            </div>

            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-200 font-medium">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-none" />
                <span><strong>Resume RAG AI Co-pilot</strong> via n8n</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-none" />
                <span><strong>12-Hour Priority SLA</strong> on Mentor Requests</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-none" />
                <span><strong>Real-Time Job Radar</strong> with 1-Click Referrals</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-none" />
                <span><strong>Unlimited 1-on-1 Mock Interviews</strong></span>
              </li>
            </ul>

            {activePlan === 'pro' || user?.isPro ? (
              <div className="space-y-2">
                <div className="w-full py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Pro Plan Active</span>
                </div>
                {onOpenRAG && (
                  <button
                    onClick={() => { onClose(); onOpenRAG(); }}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2"
                  >
                    <Bot className="w-4 h-4" />
                    <span>Launch Resume RAG Assistant</span>
                  </button>
                )}
              </div>
            ) : (
              <button 
                onClick={handleActivatePro}
                disabled={isUpgrading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
              >
                <span>{isUpgrading ? 'Activating Pro...' : 'Activate Pro Plan (7-Day Free Trial)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
