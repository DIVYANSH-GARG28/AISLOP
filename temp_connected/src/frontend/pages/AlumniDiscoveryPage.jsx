import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  Users, 
  Building2, 
  MapPin, 
  X,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  Award,
  Send,
  Briefcase,
  Zap,
  TrendingUp,
  Flame,
  ArrowUpDown
} from 'lucide-react';
import { alumniApi, userApi } from '../services/api';
import AlumniProfileModal from '../components/AlumniProfileModal';
import { getVerifiableLinkedInUrl } from '../utils/linkedin';

export default function AlumniDiscoveryPage({ user: propUser, onOpenAI, setActiveTab, onStartChatWithAlumni, onAddNotification }) {
  const [alumni, setAlumni] = useState([]);
  const [user, setUser] = useState(propUser || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [selectedAvailability, setSelectedAvailability] = useState('All');
  const [sortBy, setSortBy] = useState('impactScore'); // 'impactScore' or 'matchScore'
  const [selectedAlumniModal, setSelectedAlumniModal] = useState(null);
  const [detailedAlumniModal, setDetailedAlumniModal] = useState(null);
  const [customNote, setCustomNote] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [updatedScoreNotification, setUpdatedScoreNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propUser) {
      setUser(propUser);
      loadData(sortBy);
    }
  }, [propUser?.name, propUser?.targetRole, JSON.stringify(propUser?.skills || propUser?.skillsList || [])]);

  useEffect(() => {
    loadData(sortBy);
  }, [sortBy]);

  async function loadData(sortOption = sortBy) {
    setLoading(true);
    try {
      const [alumniData, userData] = await Promise.all([
        alumniApi.getAlumni(sortOption),
        propUser ? Promise.resolve(propUser) : userApi.getCurrentUser()
      ]);
      setAlumni(alumniData || []);
      setUser(userData);
    } catch (e) {
      console.error("AlumniDiscoveryPage load error:", e);
    } finally {
      setLoading(false);
    }
  }

  const topCompaniesInDb = Array.from(new Set((alumni || []).map(a => a.company).filter(Boolean)));
  const featuredCompanies = ['Google', 'Bosch', 'Purple Slate', 'Tata Communications', 'Capgemini', 'PwC India', 'Razorpay', 'Ultramain Systems India'];
  const companies = ['All', ...Array.from(new Set([...featuredCompanies, ...topCompaniesInDb])).slice(0, 10)];

  const synonymMap = {
    'ai': ['machine', 'learning', 'deep', 'nlp', 'python', 'pytorch', 'tensorflow', 'data', 'model'],
    'ml': ['machine', 'learning', 'python', 'data', 'algorithm', 'model'],
    'backend': ['java', 'spring', 'boot', 'python', 'node', 'express', 'fastapi', 'microservices', 'sql', 'postgres', 'postgresql', 'api'],
    'frontend': ['react', 'javascript', 'typescript', 'ui', 'ux', 'web', 'tailwind', 'next'],
    'fullstack': ['react', 'node', 'java', 'python', 'sql', 'full', 'stack', 'web'],
    'cloud': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'devops', 'infrastructure'],
    'devops': ['aws', 'docker', 'kubernetes', 'ci/cd', 'terraform', 'security', 'jenkins'],
    'data': ['sql', 'python', 'spark', 'analytics', 'database', 'engineer', 'pandas'],
    'testing': ['qa', 'test', 'automation', 'selenium', 'quality'],
    'mobile': ['android', 'kotlin', 'ios', 'flutter', 'react', 'native'],
    'embedded': ['c++', 'c', 'microcontroller', 'iot', 'robotics', 'firmware', 'hardware'],
    'civil': ['structural', 'autocad', 'design', 'construction', 'infrastructure'],
  };

  const rawSearchTerms = (searchTerm || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
  const expandedTerms = new Set(rawSearchTerms);
  rawSearchTerms.forEach(t => {
    if (synonymMap[t]) {
      synonymMap[t].forEach(s => expandedTerms.add(s));
    }
  });

  let filteredAlumni = (alumni || []).filter(a => {
    const nameStr = (a.name || '').toLowerCase();
    const companyStr = (a.company || '').toLowerCase();
    const titleStr = (a.title || '').toLowerCase();
    const bioStr = (a.bio || '').toLowerCase();
    const skillsList = (Array.isArray(a.skills) ? a.skills : []).map(s => String(s).toLowerCase());
    
    let matchesSearch = true;
    if (rawSearchTerms.length > 0) {
      matchesSearch = Array.from(expandedTerms).some(term => 
        nameStr.includes(term) ||
        companyStr.includes(term) ||
        titleStr.includes(term) ||
        bioStr.includes(term) ||
        skillsList.some(s => s.includes(term))
      );
    }

    const matchesCompany = selectedCompany === 'All' || a.company === selectedCompany;
    const matchesAvailability = selectedAvailability === 'All' || a.availability === selectedAvailability;

    return matchesSearch && matchesCompany && matchesAvailability;
  });

  // Guarantee Candidate Retrieval: If strict query returns 0 candidates, return all available alumni ("we need people")
  if (filteredAlumni.length === 0 && (alumni || []).length > 0) {
    filteredAlumni = (alumni || []).slice(0, 12);
  }

  const handleOpenConnectModal = (alum) => {
    setSelectedAlumniModal(alum);
    const userName = user?.name || '';
    const userRole = user?.targetRole ? user.targetRole : 'my target role';
    const userCompany = user?.targetCompany ? user.targetCompany : 'top companies';
    const defaultNote = `Hi ${alum.name.split(' ')[0]},\n\nI am currently a student at KCE targeting a role as ${userRole} at ${userCompany}. I saw your background as a ${alum.title} at ${alum.company} (KCE Class of ${alum.graduationYear}) and would love to connect for 15 minutes of guidance on system design & interview prep.\n\nBest regards,\n${userName}`;
    setCustomNote(defaultNote);
  };

  const handleSendRequest = async () => {
    if (!selectedAlumniModal) return;
    
    const targetAlumni = selectedAlumniModal;
    const sentNote = customNote;

    // Increment Alumni Mentorship Impact Score by 50 points
    const updatedAlum = await alumniApi.incrementImpactScore(targetAlumni.id, 50);
    
    setRequestSent(true);
    setUpdatedScoreNotification({
      name: targetAlumni.name,
      newScore: updatedAlum?.impactScore || (targetAlumni.impactScore + 50),
      pointsAdded: 50
    });

    if (onAddNotification) {
      onAddNotification({
        title: `Chat Initialized: ${targetAlumni.name}`,
        message: `Outreach request sent to ${targetAlumni.name}. 1-on-1 direct conversation initialized.`,
        alumni: targetAlumni
      });
    }

    if (onStartChatWithAlumni) {
      onStartChatWithAlumni(targetAlumni, sentNote);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
      {/* Top Banner Header */}
      <div className="pro-card p-6 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase tracking-wider">
              Verified Mentorship Network
            </span>
            <span className="text-xs text-slate-400 font-bold">• Ranked by Mentorship Impact</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Alumni Discovery & Impact Leaderboard</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Alumni are ranked by their <strong className="text-amber-600 dark:text-amber-400 font-bold">Mentorship Impact Score™</strong> (earned through active guidance, student Q&A, & mock interviews).
          </p>
        </div>

        <button 
          onClick={onOpenAI}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-md flex-none active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-indigo-100" />
          <span>Draft Outreach Note with AI</span>
        </button>
      </div>

      {/* Search, Filter, & Mentorship Impact Sorting Bar */}
      <div className="pro-card p-4 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, skill, company, role..."
              className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus-ring font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Sort Selector: Mentorship Impact Score vs Goal Match */}
            <div className="flex items-center space-x-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 focus-ring"
              >
                <option value="impactScore">⚡ Mentorship Impact Score (Top Mentors)</option>
                <option value="matchScore">🎯 Career Goal Match %</option>
              </select>
            </div>

            {/* Availability Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap">Availability:</span>
              <select
                value={selectedAvailability}
                onChange={(e) => setSelectedAvailability(e.target.value)}
                className="bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus-ring font-semibold"
              >
                <option value="All">All Statuses</option>
                <option value="Available for Mentorship">Available for Mentorship</option>
                <option value="Referral Only">Referral Only</option>
                <option value="Mentorship & Referral">Mentorship & Referral</option>
              </select>
            </div>
          </div>
        </div>

        {/* Company Quick Filter Pills */}
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-[#233147] overflow-x-auto pb-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">Target Company:</span>
          {companies.map(comp => (
            <button
              key={comp}
              onClick={() => setSelectedCompany(comp)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCompany === comp
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-[#0d131f] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#192436] border border-slate-200 dark:border-[#253349]'
              }`}
            >
              {comp}
            </button>
          ))}
        </div>
      </div>

      {/* Alumni Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-white dark:bg-[#162030] rounded-2xl border border-slate-200 dark:border-[#233147]"></div>
          ))}
        </div>
      ) : filteredAlumni.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#162030] rounded-2xl border border-slate-200 dark:border-[#233147] p-8 space-y-3">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Alumni Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Try clearing search filters or searching for specific skills like "System Design" or "Python".</p>
          <button 
            onClick={() => { setSearchTerm(''); setSelectedCompany('All'); setSelectedAvailability('All'); }}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAlumni.map((alum, index) => (
            <div 
              key={alum.id} 
              className="pro-card p-6 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm hover:border-indigo-500/50 transition duration-200 flex flex-col justify-between space-y-4 relative overflow-hidden"
            >
              {/* Top Leaderboard Badge for #1 */}
              {index === 0 && sortBy === 'impactScore' && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-md flex items-center space-x-1">
                  <Flame className="w-3.5 h-3.5 fill-slate-950" />
                  <span>#1 Ranked Alumni Mentor</span>
                </div>
              )}

              <div className="space-y-4 pt-1">
                {/* Header Row: Impact Score Badge & Match Score Pill */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {/* Mentorship Impact Score Badge */}
                  <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 dark:bg-amber-950/90 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-xs" title="Mentorship Impact Score increases with student interactions">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span>{alum.impactScore || 850} Impact Score</span>
                    <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-normal">({alum.menteesGuided || 15} Mentees)</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {alum.matchScore}% Match
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#0d131f] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#253349]">
                      {alum.badgeTier || 'Active Mentor ✨'}
                    </span>
                  </div>
                </div>

                {/* Profile Details (Click to open detailed modal) */}
                <div 
                  onClick={() => setDetailedAlumniModal(alum)}
                  className="flex items-start space-x-4 cursor-pointer group/profile transition"
                >
                  <div className="relative flex-none">
                    <img 
                      src={alum.avatar} 
                      alt={alum.name} 
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/40 shadow-sm group-hover/profile:ring-indigo-500 transition"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-full text-[10px]" title="Verified KCE Alum">
                      <ShieldCheck className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate flex items-center space-x-1.5 group-hover/profile:text-indigo-500 dark:group-hover/profile:text-indigo-400 transition">
                      <span>{alum.name}</span>
                    </h3>
                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-500 flex-none" />
                      <span className="truncate">{alum.title} @ {alum.company}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                      <span>KCE Class of {alum.graduationYear}</span>
                      <span>•</span>
                      <span className="flex items-center"><MapPin className="w-3 h-3 mr-0.5 text-slate-400" />{alum.location}</span>
                    </div>
                  </div>
                </div>

                {/* Match Insight & Impact Highlight */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200/80 dark:border-[#253349] text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center justify-between">
                  <div>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">Match Insight:</span> {alum.matchReason}
                  </div>
                  <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 whitespace-nowrap ml-2">
                    +{alum.impactScore || 850} Impact
                  </span>
                </div>

                {/* Bio Excerpt */}
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed font-normal">
                  {alum.bio}
                </p>

                {/* Skill Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {alum.skills.map((sk, idx) => (
                    <span 
                      key={idx} 
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-[#192436] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#253349]"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t border-slate-100 dark:border-[#233147] flex items-center justify-between gap-2.5 flex-wrap sm:flex-nowrap">
                <div className="flex items-center space-x-2 flex-1 sm:flex-none">
                  <button 
                    onClick={() => setDetailedAlumniModal(alum)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#192436] hover:bg-slate-200 dark:hover:bg-[#23324b] text-slate-800 dark:text-slate-200 font-extrabold text-xs border border-slate-200 dark:border-[#253349] flex items-center space-x-1.5 transition active:scale-95 justify-center flex-1 sm:flex-none"
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    <span>View Profile</span>
                  </button>
                  <a
                    href={getVerifiableLinkedInUrl(alum)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-[#192436] hover:bg-slate-200 dark:hover:bg-[#23324b] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#253349] transition flex items-center justify-center"
                    title="Verified LinkedIn Search & Profile"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <button 
                  onClick={() => handleOpenConnectModal(alum)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5 active:scale-95 flex-1 sm:flex-none justify-center"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Request Mentorship</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Alumni Profile Deep-Dive Modal */}
      {detailedAlumniModal && (
        <AlumniProfileModal
          alumni={detailedAlumniModal}
          onClose={() => setDetailedAlumniModal(null)}
          onOpenRequestMentorship={(alum) => handleOpenConnectModal(alum)}
          user={user}
        />
      )}

      {/* Mentorship Request Modal */}
      {selectedAlumniModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#233147] pb-3">
              <div className="flex items-center space-x-3">
                <img 
                  src={selectedAlumniModal.avatar} 
                  alt={selectedAlumniModal.name} 
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/40"
                />
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Connect with {selectedAlumniModal.name}</h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center space-x-1.5">
                    <span>{selectedAlumniModal.title} @ {selectedAlumniModal.company}</span>
                    <span>•</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">⚡ {selectedAlumniModal.impactScore} Impact</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAlumniModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {requestSent ? (
              <div className="py-8 text-center space-y-4 animate-in zoom-in-95">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Mentorship Request Sent!</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    {selectedAlumniModal.name} has received your outreach note via ConnectEd & Email.
                  </p>
                </div>

                {/* Score Increment Notification Badge */}
                {updatedScoreNotification && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center justify-center space-x-2 animate-bounce">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span>🎉 +50 Mentorship Impact Score awarded to {updatedScoreNotification.name}! (New Score: {updatedScoreNotification.newScore})</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300 font-medium flex items-center justify-between">
                  <div>
                    <strong>AI Note Suggestion:</strong> Pre-filled with your target goal details for {user?.targetRole} at {user?.targetCompany}.
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-500 text-slate-950 rounded whitespace-nowrap ml-2">
                    +50 Impact Pts
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Outreach Message</label>
                  <textarea
                    rows={6}
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus-ring font-mono leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button 
                    onClick={() => setSelectedAlumniModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1f2d45]"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSendRequest}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center space-x-1.5 transition active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Request & Award Impact Score</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
