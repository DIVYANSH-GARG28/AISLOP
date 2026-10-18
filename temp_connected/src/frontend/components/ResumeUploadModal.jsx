import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ArrowRight,
  UserCheck,
  Briefcase,
  GraduationCap,
  Plus,
  Trash2,
  User
} from 'lucide-react';
import { resumeApi, userApi } from '../services/api';

export default function ResumeUploadModal({ isOpen, onClose, onApplyExtractedSkills }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Editable fields in results view
  const [candidateName, setCandidateName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [graduationYear, setGraduationYear] = useState(2026);
  const [degree, setDegree] = useState('B.Tech');
  const [major, setMajor] = useState('Computer Science & Engineering');
  const [skillsList, setSkillsList] = useState([]);
  const [newSkillInput, setNewSkillInput] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      
      // Read text cleanly if plaintext or markdown
      if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = (event) => setResumeText(event.target.result);
        reader.readAsText(file);
      } else {
        // PDF or DOCX: set clear indicator for server parsing
        setResumeText(`[Document Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]\nClick 'Analyze & Match Profile' to parse complete PDF/DOCX structure.`);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile && !resumeText.trim()) {
      setError("Please select a resume file (PDF, DOCX, TXT) or paste your resume text.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await resumeApi.parseAndMatchResume(selectedFile, resumeText);
      if (result) {
        setAnalysisResult(result);
        setCandidateName(result.name || '');
        setTargetRole(result.targetRole || 'Full Stack Software Engineer');
        setGraduationYear(Number(result.graduationYear) || 2026);
        setDegree(result.degree || 'B.Tech');
        setMajor(result.major || 'Computer Science & Engineering');
        setSkillsList(Array.isArray(result.skills) ? result.skills : []);

        if (result.resumeText) {
          localStorage.setItem('connected_resume_text', result.resumeText);
        }
      } else {
        setError("Failed to analyze resume. Please try again.");
      }
    } catch (err) {
      console.error("Resume analysis error:", err);
      setError("An error occurred while analyzing your resume. Please verify the file and retry.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddSkill = (e) => {
    if (e) e.preventDefault();
    const raw = newSkillInput.trim();
    if (!raw) return;
    const items = raw.split(/[,;\n\t]+/).map(s => s.trim()).filter(Boolean);
    if (items.length > 0) {
      setSkillsList(prev => Array.from(new Set([...prev, ...items])));
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsList(prev => prev.filter(s => s !== skillToRemove));
  };

  const handleApplySkills = async () => {
    if (!analysisResult) return;
    setIsSaving(true);
    try {
      const updatePayload = {
        name: candidateName.trim() || undefined,
        skills: skillsList,
        skillsList: skillsList,
        targetRole: targetRole,
        degree: degree,
        major: major,
        graduationYear: Number(graduationYear) || 2026,
        bio: analysisResult.summary,
        resumeText: analysisResult.resumeText || resumeText
      };

      await userApi.updateProfile(updatePayload);
      setSavedSuccess(true);

      // Notify parent listener (ProfileEditPage or Dashboard)
      if (onApplyExtractedSkills) {
        onApplyExtractedSkills(skillsList, {
          ...analysisResult,
          name: candidateName,
          targetRole,
          degree,
          major,
          graduationYear,
          skills: skillsList
        });
      }

      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Save error:", err);
      setIsSaving(false);
      onClose();
    }
  };

  const yearOptions = [2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-enter">
      <div className="editorial-card max-w-2xl w-full p-6 sm:p-8 space-y-6 bg-white dark:bg-[#181A20] border-2 border-black dark:border-white shadow-[6px_6px_0px_0px_#000000] dark:shadow-[6px_6px_0px_0px_#E2F952] relative my-8 text-black dark:text-white">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 border-2 border-black dark:border-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 border-b-2 border-black dark:border-white pb-4">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 bg-[#E2F952] text-black border border-black rounded shadow-[1px_1px_0px_0px_#000]">
              AI PARSER 2.0
            </span>
            <span className="font-mono text-[10px] font-bold text-slate-500">
              [PYPDF + NLP TAXONOMY]
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold text-black dark:text-white tracking-tight pt-1">
            Resume Extraction & Profile Synchronizer
          </h2>
          <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
            Upload your PDF, DOCX, or text resume. ConnectEd extracts candidate credentials, technical skills, and matches verified alumni mentors.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 rounded-xl text-xs font-mono text-rose-800 dark:text-rose-200 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-none" />
            <span>{error}</span>
          </div>
        )}

        {savedSuccess && (
          <div className="p-3 bg-[#E2F952] border-2 border-black rounded-xl text-xs font-mono font-bold text-black flex items-center space-x-2 shadow-[2px_2px_0px_0px_#000] animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-black flex-none stroke-[2.5]" />
            <span>Profile successfully updated in database and synchronized!</span>
          </div>
        )}

        {!analysisResult ? (
          <div className="space-y-5">
            {/* File Dropzone */}
            <div className="relative border-2 border-dashed border-black dark:border-white hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-2xl p-6 text-center space-y-3 bg-[#FBF9F5] dark:bg-[#111215] transition">
              <input 
                type="file" 
                accept=".pdf,.docx,.doc,.txt,.md"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
              <div className="w-12 h-12 rounded-xl bg-[#E2F952] border-2 border-black mx-auto flex items-center justify-center text-black shadow-[2px_2px_0px_0px_#000]">
                <UploadCloud className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <p className="font-mono text-xs font-extrabold text-black dark:text-white">
                  {selectedFile ? selectedFile.name : "Click or Drop Resume (PDF, DOCX, TXT)"}
                </p>
                <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  Full multi-pass extraction with 250+ skill taxonomy & python-docx engine
                </p>
              </div>
            </div>

            {/* Resume Text Input / Paste Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-mono text-xs font-bold text-black dark:text-white uppercase">
                  Resume Text / Paste Directly:
                </label>
                <span className="font-mono text-[10px] text-slate-500">Optional (Or drop file above)</span>
              </div>
              <textarea 
                rows={5}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste resume content here if you prefer direct text parsing (Name, Education, Skills, Projects)..."
                className="w-full bg-[#FBF9F5] dark:bg-[#111215] border-2 border-black dark:border-white rounded-xl p-3 text-xs font-mono text-black dark:text-white focus:outline-none shadow-[2px_2px_0px_0px_#000] placeholder-slate-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border-2 border-black dark:border-white text-black dark:text-white font-mono font-bold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-5 py-2.5 rounded-xl bg-[#E2F952] hover:bg-[#d8f042] text-black font-mono font-extrabold text-xs border-2 border-black shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition flex items-center space-x-2 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Analyzing Document...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-black stroke-[2.5]" />
                    <span>Analyze & Extract Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Results View with Interactive Review & Skill Editor */
          <div className="space-y-6">
            
            {/* Extracted Profile Form Card */}
            <div className="p-5 rounded-2xl bg-[#FBF9F5] dark:bg-[#111215] border-2 border-black dark:border-white space-y-4 shadow-[3px_3px_0px_0px_#000000] dark:shadow-[3px_3px_0px_0px_#E2F952]">
              <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-3">
                <span className="font-mono text-xs font-bold text-black dark:text-white uppercase tracking-wider flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-black dark:text-[#E2F952] stroke-[2.5]" />
                  Extracted Profile Credentials
                </span>
                <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-[#E2F952] text-black border border-black shadow-[1px_1px_0px_0px_#000]">
                  {analysisResult.readinessScore}% READINESS
                </span>
              </div>

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                
                {/* Candidate Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    Candidate Name:
                  </label>
                  <input 
                    type="text" 
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Candidate Name"
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#181A20] border-2 border-black dark:border-white text-xs font-bold text-black dark:text-white focus:outline-none"
                  />
                </div>

                {/* Target Role */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    Target Role:
                  </label>
                  <input 
                    type="text" 
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#181A20] border-2 border-black dark:border-white text-xs font-bold text-black dark:text-white focus:outline-none"
                  />
                </div>

                {/* Degree & Major */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    Degree & Major:
                  </label>
                  <div className="flex space-x-1">
                    <input 
                      type="text" 
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      className="w-20 p-2 rounded-lg bg-white dark:bg-[#181A20] border-2 border-black dark:border-white text-xs font-bold text-black dark:text-white focus:outline-none"
                    />
                    <input 
                      type="text" 
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      className="flex-1 p-2 rounded-lg bg-white dark:bg-[#181A20] border-2 border-black dark:border-white text-xs font-bold text-black dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Graduation Year (+4 from 2026 supported up to 2032) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                    Graduation Year:
                  </label>
                  <select 
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(Number(e.target.value))}
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#181A20] border-2 border-black dark:border-white text-xs font-bold text-black dark:text-white focus:outline-none"
                  >
                    {yearOptions.map(y => (
                      <option key={y} value={y}>Class of {y}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Interactive Skills Chips with Add / Remove */}
              <div className="space-y-2 pt-2 border-t border-black/10 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] font-bold uppercase text-black dark:text-white">
                    Extracted Technical Skills ({skillsList.length}):
                  </label>
                  <span className="font-mono text-[10px] text-slate-500">Click × to remove</span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                  {skillsList.map((skill, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#181A20] border-2 border-black dark:border-white font-mono text-[11px] font-bold text-black dark:text-white shadow-[1px_1px_0px_0px_#000]"
                    >
                      <span>{skill}</span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-rose-600 ml-1 text-slate-400"
                        title="Remove Skill"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add Multiple Skills Input */}
                <div className="flex items-center space-x-2 pt-1">
                  <input 
                    type="text" 
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddSkill(e); }}
                    placeholder="Add skills (e.g. Next.js, Docker, PyTorch - comma separated)..."
                    className="flex-1 p-2 rounded-lg bg-white dark:bg-[#181A20] border-2 border-black dark:border-white text-xs font-mono text-black dark:text-white focus:outline-none"
                  />
                  <button 
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3 py-2 rounded-lg bg-[#E2F952] text-black font-mono font-bold text-xs border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Bio Summary */}
              <div className="space-y-1 pt-1 font-mono text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Extracted Bio Summary:</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans text-xs bg-white dark:bg-[#181A20] p-2.5 rounded-lg border border-black/20 dark:border-white/20">
                  {analysisResult.summary}
                </p>
              </div>
            </div>

            {/* Ranked Alumni Mentors */}
            <div className="space-y-2.5">
              <h3 className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center">
                <UserCheck className="w-4 h-4 mr-1.5 text-black dark:text-[#E2F952] stroke-[2.5]" />
                Top Matched Alumni for Your Skills
              </h3>

              <div className="space-y-2">
                {analysisResult.matches && analysisResult.matches.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#FBF9F5] dark:bg-[#111215] border-2 border-black dark:border-white flex items-start justify-between gap-3 shadow-[2px_2px_0px_0px_#000]">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-display font-bold text-black dark:text-white text-xs">{m.name}</h4>
                        <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#E2F952] text-black border border-black">
                          {m.matchScore || 92}% Match
                        </span>
                      </div>
                      <p className="font-mono text-xs font-bold text-black dark:text-white">{m.role} @ {m.company}</p>
                      <p className="font-mono text-[10px] text-slate-600 dark:text-slate-400">{m.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t-2 border-black dark:border-white flex items-center justify-between">
              <button
                onClick={() => setAnalysisResult(null)}
                className="font-mono text-xs text-black dark:text-white hover:underline font-bold"
              >
                ← Upload Different Resume
              </button>

              <button
                onClick={handleApplySkills}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-[#E2F952] hover:bg-[#d8f042] text-black font-mono font-extrabold text-xs border-2 border-black shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Synchronizing Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Apply & Save Profile Changes</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
