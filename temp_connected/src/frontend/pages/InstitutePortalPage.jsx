import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  Briefcase, 
  GraduationCap, 
  Users, 
  FileText, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { instituteApi } from '../services/api';

export default function InstitutePortalPage({ user, onOpenAI }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('input_email'); // 'input_email' | 'enter_otp' | 'verified'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(600); // 10 minutes
  const [demoHintOtp, setDemoHintOtp] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [portalData, setPortalData] = useState(null);
  const [portalTab, setPortalTab] = useState('drives'); // 'drives' | 'circulars' | 'batchmates'

  // Cooldown countdown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // OTP Expiry countdown timer
  useEffect(() => {
    let timer;
    if (step === 'enter_otp' && otpExpiry > 0) {
      timer = setInterval(() => setOtpExpiry(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpExpiry]);

  // Initial status check on mount
  useEffect(() => {
    async function checkStatus() {
      if (user?.id) {
        const status = await instituteApi.getStatus(null, user.id);
        if (status?.is_verified) {
          setVerificationData(status);
          setStep('verified');
          loadPortalData(user.id);
        }
      }
    }
    checkStatus();
  }, [user]);

  async function loadPortalData(userId) {
    try {
      const data = await instituteApi.getPortalData(userId);
      if (data.success && data.data) {
        setPortalData(data.data);
      }
    } catch (e) {
      console.warn("Could not load portal data:", e.message);
    }
  }

  // Domain analyzer helper
  const getDomainFeedback = (val) => {
    if (!val || !val.includes('@')) return null;
    const domain = val.split('@')[1]?.toLowerCase().trim();
    if (!domain) return null;

    const disallowed = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
    if (disallowed.includes(domain)) {
      return {
        valid: false,
        text: 'Personal email detected. Please enter your college email (@its.edu.in or @*.ac.in).'
      };
    }
    if (domain.endsWith('.edu.in') || domain.endsWith('.ac.in') || domain.endsWith('.edu') || domain.includes('its')) {
      return {
        valid: true,
        text: 'Authorized Educational Institution domain recognized.'
      };
    }
    return {
      valid: null,
      text: 'Checking domain compatibility...'
    };
  };

  const domainFeedback = getDomainFeedback(email);

  // 1. Request OTP
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your institutional email address.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await instituteApi.requestOtp(email, 'I.T.S Engineering College', user?.id);
      setSuccessMsg(`Verification OTP dispatched to ${res.data.email}. Valid for 10 minutes.`);
      setCooldown(res.data.cooldown_seconds || 60);
      setOtpExpiry(600);
      if (res.data._dev_hint_otp) {
        setDemoHintOtp(res.data._dev_hint_otp);
      }
      setStep('enter_otp');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send OTP. Please check your domain and try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Confirm OTP
  const handleConfirmOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp.trim() || otp.trim().length < 4) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await instituteApi.confirmOtp(email, otp, user?.id);
      setVerificationData(res.data);
      setStep('verified');
      setSuccessMsg('Institutional email successfully verified! Access granted.');
      await loadPortalData(user?.id);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Reset verification
  const handleResetVerification = async () => {
    if (window.confirm("Are you sure you want to change your verified institutional email?")) {
      await instituteApi.resetVerification(user?.id || 'student_101');
      setStep('input_email');
      setVerificationData(null);
      setPortalData(null);
      setEmail('');
      setOtp('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
      
      {/* 1. Header Banner */}
      <div className="pro-card p-6 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase tracking-wider flex items-center space-x-1">
              <Building2 className="w-3 h-3 text-blue-500" />
              <span>Campus & Institute Portal</span>
            </span>
            <span className="text-xs text-slate-400 font-bold">• Official Institutional Hub</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-3">
            <GraduationCap className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>I.T.S Engineering College — Exclusive Student Portal</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Access internal placement drives, campus circulars, verified departmental faculty, and exclusive institute alumni networks. Official <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-indigo-600 dark:text-indigo-400">@its.edu.in</code> verification required.
          </p>
        </div>

        {step === 'verified' && (
          <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 rounded-2xl">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300">Verified Member</div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">{verificationData?.institution_email || user?.email}</div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Verification Flow (When NOT verified) */}
      {step !== 'verified' ? (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="pro-card p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-xl text-center space-y-6">
            
            <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Institutional Verification Required
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                To prevent unverified access to on-campus placement drives and official student records, please verify your official organization email.
              </p>
            </div>

            {/* Error & Success Alerts */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-start space-x-2 text-left animate-in fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-none" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-start space-x-2 text-left animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-none" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Step A: Email Input */}
            {step === 'input_email' && (
              <form onSubmit={handleRequestOtp} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Official College Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. yourname@its.edu.in"
                      className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus-ring font-medium"
                      autoFocus
                    />
                  </div>
                  
                  {/* Real-time Domain Feedback */}
                  {domainFeedback && (
                    <div className={`mt-1.5 text-[11px] font-semibold flex items-center space-x-1 ${domainFeedback.valid === true ? 'text-emerald-600 dark:text-emerald-400' : domainFeedback.valid === false ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                      {domainFeedback.valid === true && <CheckCircle2 className="w-3 h-3 flex-none" />}
                      {domainFeedback.valid === false && <AlertCircle className="w-3 h-3 flex-none" />}
                      <span>{domainFeedback.text}</span>
                    </div>
                  )}
                </div>

                {/* Example Quick Fill for Evaluators */}
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                  <span>Authorized Domain: <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">@its.edu.in</code></span>
                  <button 
                    type="button" 
                    onClick={() => setEmail('divyansh.garg@its.edu.in')}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                  >
                    Quick Fill @its.edu.in
                  </button>
                </div>

                <button 
                  type="submit"
                  disabled={loading || cooldown > 0}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 active:scale-95"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Verification Code...</span>
                    </>
                  ) : cooldown > 0 ? (
                    <span>Wait {cooldown}s before resending</span>
                  ) : (
                    <>
                      <span>Send 6-Digit Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step B: OTP Input */}
            {step === 'enter_otp' && (
              <form onSubmit={handleConfirmOtp} className="space-y-4 text-left">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Enter 6-Digit Code
                    </label>
                    <div className="flex items-center space-x-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      <Clock className="w-3 h-3" />
                      <span>Expires in: {Math.floor(otpExpiry / 60)}:{(otpExpiry % 60).toString().padStart(2, '0')}</span>
                    </div>
                  </div>

                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input 
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 492018"
                      className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl pl-10 pr-3.5 py-2.5 text-sm tracking-widest text-slate-900 dark:text-slate-100 focus-ring font-mono font-bold"
                      autoFocus
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    A code was dispatched to <strong className="text-slate-700 dark:text-slate-200">{email}</strong> and forwarded via n8n automation.
                  </p>
                </div>

                {/* Developer Demo Helper */}
                {demoHintOtp && (
                  <div className="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                    <span>⚡ Demo Test Code: <strong className="font-mono text-xs">{demoHintOtp}</strong></span>
                    <button 
                      type="button" 
                      onClick={() => setOtp(demoHintOtp)}
                      className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold text-[10px]"
                    >
                      Auto-fill
                    </button>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <button 
                    type="submit"
                    disabled={loading || otp.length < 4}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 active:scale-95"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Validating OTP Code...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify & Unlock Institute Hub</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button 
                      type="button"
                      onClick={() => { setStep('input_email'); setOtp(''); }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[11px]"
                    >
                      Change Email Address
                    </button>

                    <button 
                      type="button"
                      disabled={cooldown > 0}
                      onClick={handleRequestOtp}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold text-[11px] disabled:opacity-50"
                    >
                      {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
                    </button>
                  </div>
                </div>
              </form>
            )}

          </div>
        </div>
      ) : (
        /* 3. Verified Portal View */
        <div className="space-y-6">
          
          {/* Top Tabs */}
          <div className="flex items-center space-x-3 border-b border-slate-200 dark:border-[#233147] pb-3 overflow-x-auto">
            <button 
              onClick={() => setPortalTab('drives')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 ${portalTab === 'drives' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-[#162030] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#202d42]'}`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Campus Placement Drives</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">3</span>
            </button>

            <button 
              onClick={() => setPortalTab('circulars')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 ${portalTab === 'circulars' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-[#162030] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#202d42]'}`}
            >
              <FileText className="w-4 h-4" />
              <span>Campus Circulars & Notices</span>
            </button>

            <button 
              onClick={() => setPortalTab('batchmates')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 ${portalTab === 'batchmates' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-[#162030] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#202d42]'}`}
            >
              <Users className="w-4 h-4" />
              <span>Verified Batchmates</span>
            </button>
          </div>

          {/* Tab Content A: Drives */}
          {portalTab === 'drives' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {(portalData?.drives || []).map((drive) => (
                <div key={drive.id} className="pro-card p-5 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-500/50 transition">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {drive.type}
                      </span>
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {drive.package}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {drive.company}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {drive.role}
                    </p>

                    <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                      <div><strong>Eligibility:</strong> {drive.eligibility}</div>
                      <div><strong>Deadline:</strong> {drive.deadline}</div>
                    </div>
                  </div>

                  <button className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition active:scale-95 flex items-center justify-center space-x-1.5">
                    <span>Submit Campus Application</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tab Content B: Circulars */}
          {portalTab === 'circulars' && (
            <div className="space-y-4">
              {(portalData?.circulars || []).map((notice) => (
                <div key={notice.id} className="pro-card p-5 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {notice.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">{notice.date}</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {notice.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {notice.summary}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Tab Content C: Batchmates */}
          {portalTab === 'batchmates' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(portalData?.batchmates || []).map((mate, idx) => (
                <div key={idx} className="pro-card p-4 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] flex items-center space-x-3.5 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-extrabold flex items-center justify-center text-sm">
                    {mate.name[0]}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">{mate.name}</h4>
                    <p className="text-[10px] text-slate-500">{mate.branch} • Class of {mate.year}</p>
                    <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400">{mate.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Account Footnote */}
          <div className="pt-6 border-t border-slate-200 dark:border-[#233147] flex items-center justify-between text-xs text-slate-400">
            <span>Verified with: <strong className="text-slate-700 dark:text-slate-300 font-mono">{verificationData?.institution_email || user?.email}</strong></span>
            <button 
              onClick={handleResetVerification}
              className="text-rose-500 hover:underline font-bold text-xs"
            >
              Re-verify with Different Email
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
