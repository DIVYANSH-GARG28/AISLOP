import React, { useState } from 'react';
import { X, CheckCircle2, User, Lock, Mail, GraduationCap, Building2 } from 'lucide-react';
import { authApi } from '../services/api';

export default function AuthModal({ isOpen, onClose, defaultTab = 'login', onAuthSuccess }) {
  const [tab, setTab] = useState(defaultTab); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register state
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('KCE');
  const [major, setMajor] = useState('Computer Science');
  const [graduationYear, setGraduationYear] = useState('2026');
  const [role, setRole] = useState('student');
  const [targetRole, setTargetRole] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e, demoKey = null) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login({ email, password, demoKey });
      if (res.success) {
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setError('Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.register({
        name,
        email,
        password,
        university,
        major,
        graduationYear,
        role,
        targetRole
      });
      if (res.success) {
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="pro-card max-w-md w-full rounded-2xl p-6 space-y-5 bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-2xl relative text-slate-900 dark:text-white">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header & Tabs */}
        <div className="space-y-3 border-b border-slate-200 dark:border-[#233147] pb-3">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              CE
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">ConnectEd Account</h3>
          </div>

          <div className="flex bg-slate-100 dark:bg-[#0d131f] p-1 rounded-lg">
            <button
              onClick={() => { setTab('login'); setError(''); }}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${
                tab === 'login' ? 'bg-white dark:bg-[#162030] text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('register'); setError(''); }}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${
                tab === 'register' ? 'bg-white dark:bg-[#162030] text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300 font-medium">
            {error}
          </div>
        )}

        {/* Sign In Form */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.johnson@kce.edu"
                  className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus-ring"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus-ring"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            {/* Quick Demo Login Presets */}
            <div className="pt-3 border-t border-slate-200 dark:border-[#233147] space-y-2">
              <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Quick Demo Role Login</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={(e) => handleLogin(e, 'alex')}
                  className="p-2 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-xs text-left transition"
                >
                  <div className="font-extrabold text-indigo-700 dark:text-indigo-300">Student</div>
                  <div className="text-[10px] text-slate-500 truncate">Alex Johnson</div>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleLogin(e, 'priya')}
                  className="p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-xs text-left transition"
                >
                  <div className="font-extrabold text-amber-700 dark:text-amber-300">Alumni</div>
                  <div className="text-[10px] text-slate-500 truncate">Priya Sharma</div>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleLogin(e, 'admin')}
                  className="p-2 rounded-xl bg-purple-50/50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 text-xs text-left transition"
                >
                  <div className="font-extrabold text-purple-700 dark:text-purple-300">Admin</div>
                  <div className="text-[10px] text-slate-500 truncate">Dr. Sarah Chen</div>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rujitha"
                className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rujitha@kce.edu"
                className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">University / Institution</label>
                <input 
                  type="text" 
                  value="KCE"
                  readOnly
                  className="w-full bg-slate-100 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Graduation Year</label>
                <input 
                  type="text" 
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus-ring"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Major / Degree</label>
                <input 
                  type="text" 
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Role</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus-ring"
                >
                  <option value="student">Student</option>
                  <option value="alumni">Alumni</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Career Goal</label>
              <input 
                type="text" 
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password *</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus-ring"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
