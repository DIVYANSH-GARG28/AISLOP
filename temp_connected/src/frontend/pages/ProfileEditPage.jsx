import React, { useEffect, useState } from 'react';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Code, 
  Globe, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Sparkles, 
  X, 
  Plus, 
  Github, 
  Linkedin, 
  Users, 
  Award,
  Database,
  ArrowRight
} from 'lucide-react';
import { userApi } from '../services/api';
import ResumeUploadModal from '../components/ResumeUploadModal';

export default function ProfileEditPage({ user, onProfileUpdated, onOpenAI }) {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [autofillSuccess, setAutofillSuccess] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [major, setMajor] = useState('');
  const [graduationYear, setGraduationYear] = useState(2026);
  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('Artificial Intelligence & Cloud Systems');
  const [workModel, setWorkModel] = useState('Hybrid / Flexible');
  const [gpa, setGpa] = useState('3.8');
  const [yearsOfExperience, setYearsOfExperience] = useState(3);
  const [certifications, setCertifications] = useState('');
  const [featuredProject, setFeaturedProject] = useState('');
  const [experienceHistory, setExperienceHistory] = useState('');
  
  // Skills State
  const [skills, setSkills] = useState([]);
  const [newSkillInput, setNewSkillInput] = useState('');

  // Social Links
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  // Alumni Mentorship State
  const [isMentor, setIsMentor] = useState(false);
  const [mentorBio, setMentorBio] = useState('');
  const [maxMentees, setMaxMentees] = useState(3);

  useEffect(() => {
    if (user) {
      const isDemoAlex = user.id === 'user_101' || user.email === 'alex.johnson@kce.edu';
      setName(user.name || '');
      setHeadline(user.headline || (isDemoAlex ? 'Software Engineer & AI Systems Developer' : ''));
      setSpecialization(user.specialization || (isDemoAlex ? 'Distributed Systems, Machine Learning & Cloud Architectures' : ''));
      setAvatarUrl(user.avatar || user.avatarUrl || '');
      setBio(user.bio || (isDemoAlex ? 'Passionate engineer interested in building scalable software, high-throughput backend services & AI pipelines.' : ''));
      setMajor(user.major || (isDemoAlex ? 'Computer Science & Engineering' : ''));
      setGraduationYear(user.graduationYear || 2026);
      setTargetRole(user.targetRole || (isDemoAlex ? 'Senior AI Engineer' : ''));
      setTargetCompany(user.targetCompany || (isDemoAlex ? 'Google DeepMind' : ''));
      setTargetIndustry(user.targetIndustry || (isDemoAlex ? 'Artificial Intelligence & Enterprise Cloud' : ''));
      setWorkModel(user.workModel || (isDemoAlex ? 'Hybrid / Flexible' : ''));
      setGpa(user.gpa || (isDemoAlex ? '3.8' : ''));
      setYearsOfExperience(user.yearsOfExperience !== undefined ? user.yearsOfExperience : (isDemoAlex ? 3 : 0));
      setCertifications(user.certifications || (isDemoAlex ? 'AWS Solutions Architect Associate • TensorFlow Certified Developer' : ''));
      setFeaturedProject(user.featuredProject || (isDemoAlex ? 'Distributed Vector Search & Embedding Engine (C++ & Python)' : ''));
      setExperienceHistory(user.experienceHistory || (isDemoAlex ? 'SWE Intern @ TechCorp (Summer 2025) - Built Real-time Data Streaming Pipeline' : ''));
      setSkills(user.skillsList || (Array.isArray(user.skills) ? user.skills.map(s => typeof s === 'string' ? s : s.name) : (isDemoAlex ? ['Python', 'React', 'SQL', 'System Design', 'Docker'] : [])));
      setGithubUrl(user.githubUrl || (isDemoAlex ? 'https://github.com/alexjohnson' : ''));
      setLinkedinUrl(user.linkedinUrl || (isDemoAlex ? 'https://linkedin.com/in/alexjohnson' : ''));
      setPortfolioUrl(user.portfolioUrl || (isDemoAlex ? 'https://alexjohnson.dev' : ''));
      setIsMentor(user.isMentor || false);
      setMentorBio(user.mentorBio || (isDemoAlex ? 'Glad to guide students on backend architecture, system design, and AI model deployment.' : ''));
      setMaxMentees(user.maxMentees || 3);
    }
  }, [user]);

  const isAlumni = user?.role === 'alumni' || user?.role === 'ALUMNI';

  const handleAddSkill = (skillToAdd) => {
    const raw = (skillToAdd !== undefined ? skillToAdd : newSkillInput).trim();
    if (!raw) return;
    const items = raw.split(/[,;\n\t]+/).map(s => s.trim()).filter(Boolean);
    if (items.length > 0) {
      setSkills(prev => Array.from(new Set([...prev, ...items])));
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    const payload = {
      name,
      headline,
      specialization,
      avatarUrl,
      bio,
      major,
      graduationYear: Number(graduationYear),
      targetRole,
      targetCompany,
      targetIndustry,
      workModel,
      gpa,
      yearsOfExperience: Number(yearsOfExperience),
      certifications,
      featuredProject,
      experienceHistory,
      skills,
      githubUrl,
      linkedinUrl,
      portfolioUrl,
      isMentor,
      mentorBio,
      maxMentees: Number(maxMentees)
    };

    const res = await userApi.updateProfile(payload);
    setSaving(false);

    if (res.success) {
      setSaveSuccess(true);
      if (onProfileUpdated) onProfileUpdated(res.user);
      setTimeout(() => setSaveSuccess(false), 3500);
    }
  };

  const handleApplyExtractedSkills = async (extractedSkills, parsedResult) => {
    let newSkills = skills;
    if (Array.isArray(extractedSkills) && extractedSkills.length > 0) {
      newSkills = Array.from(new Set([...skills, ...extractedSkills]));
      setSkills(newSkills);
    }
    let updatedRole = targetRole;
    let updatedBio = bio;
    let updatedMajor = major;
    let updatedYear = graduationYear;

    let updatedName = name;
    if (parsedResult) {
      if (parsedResult.name) {
        updatedName = parsedResult.name;
        setName(parsedResult.name);
      }
      if (parsedResult.summary) {
        updatedBio = parsedResult.summary;
        setBio(parsedResult.summary);
      }
      if (parsedResult.targetRole) {
        updatedRole = parsedResult.targetRole;
        setTargetRole(parsedResult.targetRole);
      }
      if (parsedResult.major) {
        updatedMajor = parsedResult.major;
        setMajor(parsedResult.major);
      }
      if (parsedResult.graduationYear) {
        updatedYear = Number(parsedResult.graduationYear);
        setGraduationYear(updatedYear);
      }
    }

    try {
      const res = await userApi.updateProfile({
        name: updatedName,
        skills: newSkills,
        targetRole: updatedRole,
        major: updatedMajor,
        graduationYear: updatedYear,
        bio: updatedBio
      });
      if (res.success && onProfileUpdated) {
        onProfileUpdated(res.user);
      }
    } catch (e) {
      console.warn("Auto-persist error in ProfileEditPage:", e);
    }

    setAutofillSuccess(true);
    setTimeout(() => setAutofillSuccess(false), 4000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* AI Resume Upload Modal */}
      <ResumeUploadModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        onApplyExtractedSkills={handleApplyExtractedSkills}
      />

      {/* Header Banner */}
      <div className="pro-card p-6 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] text-slate-900 dark:text-white shadow-sm dark:shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="relative">
              <img 
                src={avatarUrl} 
                alt={name} 
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-indigo-500 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-slate-950 rounded-full text-xs" title="Verified Session">
                <ShieldCheck className="w-4 h-4 stroke-[3]" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{name || 'Your Profile'}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isAlumni ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
                }`}>
                  {isAlumni ? 'ALUMNI' : 'STUDENT'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {major ? `${major} • ` : ''}KCE (Class of {graduationYear || 2026})
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                Target: {targetRole ? `${targetRole}${targetCompany ? ` @ ${targetCompany}` : ''}` : 'Not Configured'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsResumeModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-md transition flex items-center space-x-2 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>⚡ Autofill via AI Resume Parser</span>
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center space-x-2 active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving to Database...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {autofillSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Resume parsed! Technical skills & profile information automatically applied to form.</span>
            </div>
            <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded font-bold">AI AUTOFILL COMPLETE</span>
          </div>
        )}

        {saveSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Profile details & skills successfully updated in PostgreSQL database!</span>
            </div>
            <span className="text-[10px] bg-emerald-800 text-white px-2 py-0.5 rounded font-bold">POSTGRES SYNCED</span>
          </div>
        )}
      </div>

      {/* Main Grid: Form Left, Live Card Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column (2 Spans) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Navigation Tabs */}
          <div className="flex space-x-1 p-1 rounded-xl bg-slate-200 dark:bg-[#131c2e] border border-slate-300 dark:border-[#233147] text-xs font-bold">
            {[
              { id: 'general', label: 'General Info', icon: User },
              { id: 'career', label: 'Academic & Career', icon: GraduationCap },
              { id: 'skills', label: 'Skills & Tags', icon: Code },
              { id: 'links', label: 'Social & Links', icon: Globe },
              ...(isAlumni ? [{ id: 'mentorship', label: 'Mentorship Settings', icon: Users }] : [])
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition ${
                    active 
                      ? 'bg-indigo-600 text-white font-bold shadow-sm' 
                      : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-300 dark:hover:bg-[#192436]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Box */}
          <div className="pro-card p-6 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] space-y-6">

            {/* TAB 1: GENERAL INFO */}
            {activeTab === 'general' && (
              <div className="space-y-5">
                <div className="border-b border-slate-200 dark:border-[#233147] pb-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                    <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Personal Profile & Executive Branding</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Configure basic profile information and professional headline.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold">Full Name</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus-ring font-medium"
                      placeholder="e.g. Alex Johnson"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold">Professional Headline</label>
                    <input 
                      type="text" 
                      value={headline} 
                      onChange={(e) => setHeadline(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus-ring font-medium"
                      placeholder="e.g. Software Engineer & AI Systems Developer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold">Primary Specialization Focus</label>
                    <input 
                      type="text" 
                      value={specialization} 
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus-ring font-medium"
                      placeholder="e.g. Distributed Systems, Machine Learning & Cloud Architectures"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold">Avatar Image Direct URL</label>
                    <input 
                      type="text" 
                      value={avatarUrl} 
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus-ring font-mono text-[11px]"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                </div>

                {/* Bio / Summary */}
                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-700 dark:text-slate-300 font-bold">Executive Professional Summary / Bio</label>
                  <textarea 
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus-ring leading-relaxed font-medium"
                    placeholder="Brief summary of your technical background, research focus, and career ambitions..."
                  />
                </div>
              </div>
            )}

            {/* TAB 2: ACADEMIC & CAREER */}
            {activeTab === 'career' && (
              <div className="space-y-5">
                <div className="border-b border-slate-200 dark:border-[#233147] pb-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Academic Background & Career Goals</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Configure target role, focus enterprise, and academic records to power AI matching.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold">Degree / Major</label>
                    <input 
                      type="text" 
                      value={major} 
                      onChange={(e) => setMajor(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus-ring font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold">Graduation Year</label>
                    <select 
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus-ring font-medium"
                    >
                      {[2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold">Target Career Role</label>
                    <input 
                      type="text" 
                      value={targetRole} 
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus-ring font-medium"
                      placeholder="e.g. Senior AI Engineer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold">Target Enterprise / Company</label>
                    <input 
                      type="text" 
                      value={targetCompany} 
                      onChange={(e) => setTargetCompany(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus-ring font-medium"
                      placeholder="e.g. Google DeepMind"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold">Target Industry Sector</label>
                    <input 
                      type="text" 
                      value={targetIndustry} 
                      onChange={(e) => setTargetIndustry(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus-ring font-medium"
                      placeholder="e.g. Artificial Intelligence & Cloud Systems"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold">Preferred Work Model</label>
                    <select 
                      value={workModel}
                      onChange={(e) => setWorkModel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus-ring font-medium"
                    >
                      <option value="Hybrid / Flexible">Hybrid / Flexible</option>
                      <option value="Remote First">Remote First</option>
                      <option value="On-Site Enterprise">On-Site Enterprise</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SKILLS & PORTFOLIO */}
            {activeTab === 'skills' && (
              <div className="space-y-5">
                <div className="border-b border-slate-200 dark:border-[#233147] pb-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                    <Code className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Technical Stack, Certifications & Portfolio</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Manage your custom skill tags, certifications, and featured project highlights.</p>
                </div>

                {/* Current Active Skill Badges */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Active Technical Skills ({skills.length})</label>
                  <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] min-h-[70px]">
                    {skills.map((skill, idx) => (
                      <span 
                        key={idx} 
                        className="px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                      >
                        <span>{skill}</span>
                        <button 
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-rose-500 rounded transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Add Custom Skill Tag Input (Supports Multiple Comma-Separated Skills) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Add Technical Skills (Single or Multiple Comma-Separated)
                    </label>
                    <span className="text-[11px] text-slate-400">Press Enter or Comma to add</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      value={newSkillInput} 
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => { 
                        if (e.key === 'Enter' || e.key === ',') { 
                          e.preventDefault(); 
                          handleAddSkill(); 
                        } 
                      }}
                      placeholder="e.g. Python, React, PostgreSQL, Docker, PyTorch (paste or type multiple)..."
                      className="flex-1 bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus-ring font-medium"
                    />
                    <button 
                      type="button"
                      onClick={() => handleAddSkill()}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center space-x-1 shadow-md active:scale-95 flex-none"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Skills</span>
                    </button>
                  </div>

                  {/* Popular Quick-Add Skill Chips */}
                  <div className="pt-1.5 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Add Popular Tech:</span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {[
                        'Python', 'React', 'TypeScript', 'Node.js', 'FastAPI', 
                        'PostgreSQL', 'Docker', 'AWS', 'PyTorch', 'MongoDB', 
                        'System Design', 'Kubernetes', 'Redis', 'GraphQL', 'Next.js'
                      ].map(tech => {
                        const isAdded = skills.includes(tech);
                        return (
                          <button
                            key={tech}
                            type="button"
                            disabled={isAdded}
                            onClick={() => handleAddSkill(tech)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                              isAdded 
                                ? 'bg-slate-100 dark:bg-[#1a2436] text-slate-400 border-slate-200 dark:border-[#24334a] cursor-not-allowed'
                                : 'bg-slate-50 dark:bg-[#0d131f] hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border-slate-200 dark:border-[#253349] hover:border-indigo-300'
                            }`}
                          >
                            {isAdded ? `✓ ${tech}` : `+ ${tech}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Certifications & Honors */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs text-slate-700 dark:text-slate-300 font-bold">Certifications, Badges & Honors</label>
                  <input 
                    type="text" 
                    value={certifications} 
                    onChange={(e) => setCertifications(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus-ring font-medium"
                    placeholder="e.g. AWS Solutions Architect, TensorFlow Certified, LeetCode Guardian"
                  />
                </div>

                {/* Featured Portfolio Project */}
                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-700 dark:text-slate-300 font-bold">Featured Portfolio Project</label>
                  <input 
                    type="text" 
                    value={featuredProject} 
                    onChange={(e) => setFeaturedProject(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus-ring font-medium"
                    placeholder="e.g. High-Throughput Distributed Vector Search Engine (C++ / Python)"
                  />
                </div>

                {/* Work / Research Experience Summary */}
                <div className="space-y-1.5">
                  <label className="block text-xs text-slate-700 dark:text-slate-300 font-bold">Work / Internship Experience Highlight</label>
                  <textarea 
                    rows={2}
                    value={experienceHistory} 
                    onChange={(e) => setExperienceHistory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus-ring font-medium"
                    placeholder="e.g. Software Engineering Intern @ TechCorp - Engineered real-time data ingestion pipeline handling 10k req/sec"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: SOCIAL & LINKS */}
            {activeTab === 'links' && (
              <div className="space-y-5">
                <div className="border-b border-slate-200 dark:border-[#233147] pb-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Social Media & Professional Profiles</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Share your GitHub, LinkedIn, and personal portfolio links.</p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold flex items-center space-x-2">
                      <Github className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span>GitHub Profile URL</span>
                    </label>
                    <input 
                      type="text" 
                      value={githubUrl} 
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus-ring font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold flex items-center space-x-2">
                      <Linkedin className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span>LinkedIn Profile URL</span>
                    </label>
                    <input 
                      type="text" 
                      value={linkedinUrl} 
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus-ring font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Portfolio / Personal Website</span>
                    </label>
                    <input 
                      type="text" 
                      value={portfolioUrl} 
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus-ring font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: ALUMNI MENTORSHIP */}
            {activeTab === 'mentorship' && isAlumni && (
              <div className="space-y-5">
                <div className="border-b border-slate-200 dark:border-[#233147] pb-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                    <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Alumni Mentorship Network Settings</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Configure your availability to mentor KCE students.</p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100">Available for Student Mentorship</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Allow KCE students to request 1-on-1 career guidance sessions.</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={isMentor}
                      onChange={(e) => setIsMentor(e.target.checked)}
                      className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold">Mentorship Bio / Focus Areas</label>
                    <textarea 
                      rows={3}
                      value={mentorBio}
                      onChange={(e) => setMentorBio(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl p-3 text-slate-900 dark:text-slate-100 focus-ring"
                      placeholder="Describe what topics you can mentor students on (e.g. System Design, Resume Reviews, Referrals)..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-700 dark:text-slate-300 font-bold">Maximum Mentee Capacity</label>
                    <input 
                      type="number"
                      min={1}
                      max={20}
                      value={maxMentees}
                      onChange={(e) => setMaxMentees(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100 focus-ring"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Real-Time Card Preview */}
        <div className="space-y-6">
          <div className="pro-card p-6 rounded-2xl border-2 border-indigo-500/40 dark:border-indigo-600/40 bg-white dark:bg-[#162030] space-y-5 shadow-md relative">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#233147] pb-3">
              <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Real-Time Profile Preview</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded font-bold">
                LIVE
              </span>
            </div>

            <div className="flex items-start space-x-4">
              <img 
                src={avatarUrl} 
                alt={name} 
                className="w-14 h-14 rounded-xl object-cover ring-2 ring-indigo-500 flex-none"
              />
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{name || 'Your Name'}</h3>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {headline || (targetRole ? `${targetRole}${targetCompany ? ` @ ${targetCompany}` : ''}` : 'Target Goal Not Set')}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{major ? `${major} • ` : ''}KCE (Class of {graduationYear || 2026})</p>
              </div>
            </div>

            {specialization && (
              <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold text-indigo-900 dark:text-indigo-300">
                Specialization: {specialization}
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Executive Summary</span>
              <p className="text-slate-700 dark:text-slate-300 text-[11px] italic leading-relaxed">
                {bio ? `"${bio}"` : 'No executive summary added yet.'}
              </p>
            </div>

            {certifications && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Certifications & Honors</span>
                <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200">{certifications}</p>
              </div>
            )}

            {featuredProject && (
              <div className="space-y-1 p-2.5 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349]">
                <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Featured Project</span>
                <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">{featuredProject}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Skills ({skills.length})</span>
              <div className="flex flex-wrap gap-1">
                {skills.slice(0, 6).map((sk, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-semibold">
                    {sk}
                  </span>
                ))}
                {skills.length > 6 && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#0d131f] text-slate-600 dark:text-slate-400 text-[10px] font-semibold border border-slate-200 dark:border-[#233147]">
                    +{skills.length - 6} more
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-[#233147] flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                {githubUrl && <Github className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
                {linkedinUrl && <Linkedin className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Database Synced</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
