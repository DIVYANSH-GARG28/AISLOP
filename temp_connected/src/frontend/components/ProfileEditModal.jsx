import React, { useState } from 'react';
import { 
  X, 
  User, 
  Briefcase, 
  GraduationCap, 
  Code, 
  Link as LinkIcon, 
  Save, 
  Plus, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Award,
  Globe,
  Github,
  Linkedin,
  Users
} from 'lucide-react';
import { userApi } from '../services/api';
import ResumeUploadModal from './ResumeUploadModal';

export default function ProfileEditModal({ isOpen, onClose, user, onProfileUpdated }) {
  if (!isOpen || !user) return null;

  const isAlumni = user.role === 'alumni' || user.role === 'ALUMNI';
  const [activeTab, setActiveTab] = useState('general');
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [autofillSuccess, setAutofillSuccess] = useState(false);

  // Form State
  const [name, setName] = useState(user.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb');
  const [bio, setBio] = useState(user.bio || 'Aspiring Software Engineer passionate about backend systems, distributed databases, and cloud engineering.');
  
  // Student Specific
  const [major, setMajor] = useState(user.major || 'Computer Science & Engineering');
  const [graduationYear, setGraduationYear] = useState(user.graduationYear || 2026);
  const [targetRole, setTargetRole] = useState(user.targetRole || 'Software Engineer');
  const [targetCompany, setTargetCompany] = useState(user.targetCompany || 'Google');
  const [gpa, setGpa] = useState(user.gpa || 3.8);

  // Alumni Specific
  const [company, setCompany] = useState(user.company || 'Google');
  const [role, setRole] = useState(user.role || user.title || 'Senior Software Engineer');
  const [yearsOfExperience, setYearsOfExperience] = useState(user.yearsOfExperience || 5);
  const [isMentor, setIsMentor] = useState(user.isMentor !== undefined ? user.isMentor : true);
  const [mentorBio, setMentorBio] = useState(user.mentorBio || 'Glad to mentor students interested in backend development, system design, and career growth.');
  const [maxMentees, setMaxMentees] = useState(user.maxMentees || 3);

  // Skills List
  const initialSkills = user.skillsList || (Array.isArray(user.skills) ? user.skills.map(s => typeof s === 'string' ? s : s.name) : ['Java', 'React', 'Node.js', 'PostgreSQL', 'System Design']);
  const [skills, setSkills] = useState(initialSkills);
  const [newSkillInput, setNewSkillInput] = useState('');

  // Social Links
  const [githubUrl, setGithubUrl] = useState(user.githubUrl || 'https://github.com/aaravsharma');
  const [linkedinUrl, setLinkedinUrl] = useState(user.linkedinUrl || 'https://linkedin.com/in/aaravsharma');
  const [portfolioUrl, setPortfolioUrl] = useState(user.portfolioUrl || 'https://aaravsharma.dev');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const suggestedSkillTags = [
    'React', 'Python', 'Node.js', 'System Design', 'PostgreSQL', 
    'Docker', 'AWS', 'Machine Learning', 'GraphQL', 'TypeScript', 'C++', 'Java'
  ];

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const updatedPayload = {
      name,
      avatarUrl,
      bio,
      skills,
      githubUrl,
      linkedinUrl,
      portfolioUrl,
      ...(isAlumni ? {
        company,
        role,
        graduationYear: Number(graduationYear),
        yearsOfExperience: Number(yearsOfExperience),
        isMentor,
        mentorBio,
        maxMentees: Number(maxMentees)
      } : {
        major,
        graduationYear: Number(graduationYear),
        targetRole,
        targetCompany,
        gpa: Number(gpa)
      })
    };

    const res = await userApi.updateProfile(updatedPayload);
    setSaving(false);

    if (res.success) {
      setSaveSuccess(true);
      if (onProfileUpdated) {
        onProfileUpdated(res.user);
      }
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
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
      console.warn("Auto-persist error in ProfileEditModal:", e);
    }

    setAutofillSuccess(true);
    setTimeout(() => setAutofillSuccess(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {/* AI Resume Upload Modal */}
      <ResumeUploadModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        onApplyExtractedSkills={handleApplyExtractedSkills}
      />

      <div className="pro-card max-w-2xl w-full rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-2xl overflow-hidden my-8 relative flex flex-col max-h-[90vh] text-slate-900 dark:text-white">
        
        {/* Header Preview Banner */}
        <div className="p-6 bg-slate-900 dark:bg-[#131c2e] text-white relative flex-none border-b border-slate-800 dark:border-[#233147] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 dark:hover:bg-[#192436] rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="relative group">
              <img 
                src={avatarUrl} 
                alt={name} 
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-indigo-500 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                {isAlumni ? 'Alumni' : 'Student'}
              </span>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-extrabold text-white">{name || 'Your Profile'}</h2>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-300">
                {isAlumni ? `${role} @ ${company}` : `${major} • Class of ${graduationYear}`}
              </p>
              <p className="text-[11px] text-indigo-400 font-semibold">
                {isAlumni ? 'Verified Mentor & ConnectEd Alumni' : `Target: ${targetRole} @ ${targetCompany}`}
              </p>
            </div>
          </div>

          <div className="pr-8">
            <button
              type="button"
              onClick={() => setIsResumeModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-md transition flex items-center space-x-1.5 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>⚡ Autofill via Resume</span>
            </button>
          </div>
        </div>

        {autofillSuccess && (
          <div className="p-3 bg-indigo-950 border-b border-indigo-800 text-indigo-200 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Resume parsed! Technical skills & profile information applied to form.</span>
            </div>
            <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded font-bold">AUTOFILL COMPLETE</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-[#233147] bg-slate-50 dark:bg-[#0d131f] px-6 gap-2 flex-none overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#162030]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>General Info</span>
          </button>

          <button
            onClick={() => setActiveTab('academic')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'academic'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#162030]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isAlumni ? <Briefcase className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
            <span>{isAlumni ? 'Company & Role' : 'Academic & Goals'}</span>
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'skills'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#162030]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Skills & Bio ({skills.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('links')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'links'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-[#162030]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Links & Mentorship</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: GENERAL INFO */}
          {activeTab === 'general' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus-ring font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Avatar Image URL</label>
                <input 
                  type="url" 
                  value={avatarUrl} 
                  onChange={(e) => setAvatarUrl(e.target.value)} 
                  placeholder="https://images.unsplash.com/photo-..." 
                  className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus-ring font-mono text-[11px]"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Paste any direct image link to update your avatar photo live.</p>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Professional Bio / Overview</label>
                <textarea 
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Summarize your background, career interests, and technical focus..."
                  className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus-ring font-medium"
                />
              </div>
            </div>
          )}

          {/* TAB 2: ACADEMIC & GOALS / ALUMNI COMPANY */}
          {activeTab === 'academic' && (
            <div className="space-y-4 text-xs">
              {!isAlumni ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Major / Degree Field</label>
                      <input 
                        type="text" 
                        value={major} 
                        onChange={(e) => setMajor(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus-ring font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Graduation Year</label>
                      <input 
                        type="number" 
                        value={graduationYear} 
                        onChange={(e) => setGraduationYear(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus-ring font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Target Career Role</label>
                      <input 
                        type="text" 
                        value={targetRole} 
                        onChange={(e) => setTargetRole(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus-ring font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Target Focus Company</label>
                      <input 
                        type="text" 
                        value={targetCompany} 
                        onChange={(e) => setTargetCompany(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus-ring font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Cumulative GPA (Optional)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="4.0" 
                      value={gpa} 
                      onChange={(e) => setGpa(e.target.value)} 
                      className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus-ring font-medium"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Current Company</label>
                      <input 
                        type="text" 
                        value={company} 
                        onChange={(e) => setCompany(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus-ring font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Current Job Title / Role</label>
                      <input 
                        type="text" 
                        value={role} 
                        onChange={(e) => setRole(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus-ring font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Graduation Year</label>
                      <input 
                        type="number" 
                        value={graduationYear} 
                        onChange={(e) => setGraduationYear(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus-ring font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Years of Experience</label>
                      <input 
                        type="number" 
                        value={yearsOfExperience} 
                        onChange={(e) => setYearsOfExperience(e.target.value)} 
                        className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus-ring font-medium"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: SKILLS MANAGER */}
          {activeTab === 'skills' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">Current Possessed Skills ({skills.length})</label>
                
                {/* Active Skill Pills */}
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl min-h-[60px]">
                  {skills.map((skill, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center space-x-1.5 text-xs shadow-2xs"
                    >
                      <span>{skill}</span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-indigo-400 hover:text-indigo-900 dark:hover:text-white font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {skills.length === 0 && (
                    <span className="text-slate-400 dark:text-slate-500 italic text-xs">No skills added yet. Click preset tags below or type custom skill.</span>
                  )}
                </div>
              </div>

              {/* Add Custom Skill Box */}
              <div className="flex items-center space-x-2">
                <input 
                  type="text"
                  placeholder="Type or paste skills (e.g. Python, React, Docker, AWS)..."
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  className="flex-1 bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus-ring font-medium text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center space-x-1 shadow-sm flex-none active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Skills</span>
                </button>
              </div>

              {/* Quick Add Presets */}
              <div className="space-y-1.5 pt-2">
                <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Popular Skill Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedSkillTags.map((tag, idx) => {
                    const isAdded = skills.includes(tag);
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => isAdded ? handleRemoveSkill(tag) : handleAddSkill(tag)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                          isAdded 
                            ? 'bg-slate-200 dark:bg-[#253349] text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600' 
                            : 'bg-white dark:bg-[#162030] hover:bg-slate-100 dark:hover:bg-[#192436] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-[#253349]'
                        }`}
                      >
                        {isAdded ? `✓ ${tag}` : `+ ${tag}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LINKS & MENTORSHIP */}
          {activeTab === 'links' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center space-x-1.5">
                  <Github className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                  <span>GitHub Profile URL</span>
                </label>
                <input 
                  type="url" 
                  value={githubUrl} 
                  onChange={(e) => setGithubUrl(e.target.value)} 
                  placeholder="https://github.com/username"
                  className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus-ring font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center space-x-1.5">
                  <Linkedin className="w-4 h-4 text-blue-500" />
                  <span>LinkedIn Profile URL</span>
                </label>
                <input 
                  type="url" 
                  value={linkedinUrl} 
                  onChange={(e) => setLinkedinUrl(e.target.value)} 
                  placeholder="https://linkedin.com/in/username"
                  className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus-ring font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center space-x-1.5">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  <span>Portfolio / Personal Website</span>
                </label>
                <input 
                  type="url" 
                  value={portfolioUrl} 
                  onChange={(e) => setPortfolioUrl(e.target.value)} 
                  placeholder="https://yourname.dev"
                  className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus-ring font-mono text-[11px]"
                />
              </div>

              {/* Alumni Mentorship Settings */}
              {isAlumni && (
                <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">Available to Mentor Students</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Enable to show your profile in Student Mentor Matching searches.</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={isMentor}
                      onChange={(e) => setIsMentor(e.target.checked)}
                      className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  {isMentor && (
                    <>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Mentor Philosophy / Bio</label>
                        <textarea 
                          rows={2}
                          value={mentorBio}
                          onChange={(e) => setMentorBio(e.target.value)}
                          className="w-full bg-white dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg p-2 text-slate-900 dark:text-slate-100 focus-ring text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Max Active Mentees Capacity</label>
                        <input 
                          type="number" 
                          min="1" 
                          max="20"
                          value={maxMentees}
                          onChange={(e) => setMaxMentees(e.target.value)}
                          className="w-full bg-white dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-lg p-2 text-slate-900 dark:text-slate-100 focus-ring text-xs"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Modal Actions Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-[#233147] flex items-center justify-end space-x-3 flex-none">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-[#253349] hover:bg-slate-100 dark:hover:bg-[#192436] text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center space-x-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving to Database...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white stroke-[3]" />
                  <span>Saved to Database!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span>Save Profile to Database</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
