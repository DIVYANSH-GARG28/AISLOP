import React, { useEffect, useState } from 'react';
import { 
  UserCheck, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  X, 
  Video,
  Zap,
  Search,
  Gift,
  Award,
  Clock,
  ShieldCheck,
  Briefcase,
  ExternalLink,
  MessageSquare,
  ChevronRight,
  Filter,
  Check,
  Building2
} from 'lucide-react';
import { alumniApi, mentorshipApi } from '../services/api';
import AlumniProfileModal from '../components/AlumniProfileModal';
import { getVerifiableLinkedInUrl } from '../utils/linkedin';

export default function MentorMatchingPage({ user: propUser, onOpenAI, onStartChatWithAlumni, onAddNotification }) {
  const [mentors, setMentors] = useState([]);
  const [filteredMentors, setFilteredMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [bookingType, setBookingType] = useState('mentorship'); // 'mentorship' | 'referral'
  const [detailedAlumniModal, setDetailedAlumniModal] = useState(null);
  const [sessionTopic, setSessionTopic] = useState('Mock Technical Architecture Interview');
  const [sessionDate, setSessionDate] = useState('2026-09-12');
  const [sessionTime, setSessionTime] = useState('16:00');
  const [customNote, setCustomNote] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // 'all' | 'mentorship' | 'referral' | 'both'
  const [companyFilter, setCompanyFilter] = useState('all');

  async function loadData() {
    const userSkills = propUser?.skillsList || (Array.isArray(propUser?.skills) ? propUser.skills : []);
    const recs = await mentorshipApi.getRecommendations({
      studentId: propUser?.id || 'student1',
      targetRole: propUser?.targetRole || '',
      targetCompany: propUser?.targetCompany || '',
      skills: userSkills
    });
    const finalMentors = Array.isArray(recs) && recs.length > 0 ? recs : await alumniApi.getAlumni('impactScore');
    setMentors(finalMentors);
    setFilteredMentors(finalMentors);
  }

  useEffect(() => {
    loadData();
  }, [
    propUser?.targetRole,
    propUser?.targetCompany,
    Array.isArray(propUser?.skills) ? propUser.skills.map(s => typeof s === 'object' ? s.name : s).join(',') : '',
    Array.isArray(propUser?.skillsList) ? propUser.skillsList.join(',') : ''
  ]);

  useEffect(() => {
    let result = mentors;

    // Availability Filter
    if (availabilityFilter === 'mentorship') {
      result = result.filter(m => (m.availability || '').toLowerCase().includes('mentorship') && !(m.availability || '').toLowerCase().includes('referral'));
    } else if (availabilityFilter === 'referral') {
      result = result.filter(m => (m.availability || '').toLowerCase().includes('referral') && !(m.availability || '').toLowerCase().includes('mentorship'));
    } else if (availabilityFilter === 'both') {
      result = result.filter(m => (m.availability || '').toLowerCase().includes('referral') && (m.availability || '').toLowerCase().includes('mentorship'));
    }

    // Company Filter
    if (companyFilter !== 'all') {
      result = result.filter(m => (m.company || '').toLowerCase().includes(companyFilter.toLowerCase()));
    }

    // Search Term Filter with NLP Term Expansion
    if (searchTerm.trim()) {
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

      const rawTerms = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
      const expandedTerms = new Set(rawTerms);
      rawTerms.forEach(t => {
        if (synonymMap[t]) {
          synonymMap[t].forEach(s => expandedTerms.add(s));
        }
      });

      const matched = result.filter(m => {
        const nameStr = (m.name || '').toLowerCase();
        const companyStr = (m.company || '').toLowerCase();
        const titleStr = (m.title || '').toLowerCase();
        const bioStr = (m.bio || '').toLowerCase();
        const skillsList = (m.skills || []).map(s => String(s).toLowerCase());

        return Array.from(expandedTerms).some(term =>
          nameStr.includes(term) ||
          companyStr.includes(term) ||
          titleStr.includes(term) ||
          bioStr.includes(term) ||
          skillsList.some(s => s.includes(term))
        );
      });

      // Guaranteed Candidate Retrieval: If query produces 0 candidates, fallback to all available mentors ("we need people")
      result = matched.length > 0 ? matched : mentors.slice(0, 10);
    }

    setFilteredMentors(result);
  }, [searchTerm, availabilityFilter, companyFilter, mentors]);

  const handleOpenBookingModal = (mentor, type = 'mentorship') => {
    setSelectedMentor(mentor);
    setBookingType(type);
    const userName = propUser?.name || '';
    const userRole = propUser?.targetRole ? propUser.targetRole : 'my target role';
    if (type === 'referral') {
      setSessionTopic('Job Referral Request');
      setCustomNote(`Hi ${mentor.name.split(' ')[0]},\n\nI am currently preparing for ${userRole} roles at ${mentor.company}. Given your background as ${mentor.title}, I would appreciate the opportunity for a career referral.\n\nBest regards,\n${userName}`);
    } else {
      setSessionTopic('Mock Technical Architecture Interview');
      setCustomNote(`Hi ${mentor.name.split(' ')[0]},\n\nI would love to book a 1-on-1 mentorship session regarding ${userRole} interview preparation and resume feedback.\n\nBest regards,\n${userName}`);
    }
  };

  const handleBookSession = async (e) => {
    if (e) e.preventDefault();
    if (selectedMentor) {
      await alumniApi.incrementImpactScore(selectedMentor.id, bookingType === 'referral' ? 120 : 100);
      
      const titleText = bookingType === 'referral' 
        ? `Referral Request Sent: ${selectedMentor.name}`
        : `Session Confirmed: ${selectedMentor.name}`;

      const messageText = bookingType === 'referral'
        ? `Your job referral request has been sent to ${selectedMentor.name} (${selectedMentor.company}).`
        : `1-on-1 Mentorship session confirmed with ${selectedMentor.name} on ${sessionDate} at ${sessionTime}!`;

      if (onAddNotification) {
        onAddNotification({
          title: titleText,
          message: messageText,
          alumni: selectedMentor
        });
      }

      if (onStartChatWithAlumni) {
        onStartChatWithAlumni(
          selectedMentor, 
          customNote || `Hi ${selectedMentor.name}, I just initiated a ${bookingType === 'referral' ? 'job referral request' : '1-on-1 mentorship booking'} on ${sessionDate} at ${sessionTime} regarding "${sessionTopic}". Looking forward to connecting!`
        );
      }
    }
    setBookingConfirmed(true);
    setTimeout(async () => {
      setBookingConfirmed(false);
      setSelectedMentor(null);
      await loadData();
    }, 2200);
  };

  // Helper to render status badge
  const renderAvailabilityBadge = (avail = 'Available for Mentorship') => {
    const isMentorship = avail.toLowerCase().includes('mentorship');
    const isReferral = avail.toLowerCase().includes('referral');

    if (isMentorship && isReferral) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center space-x-1 shadow-xs">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span>Mentorship & Referral</span>
        </span>
      );
    } else if (isReferral) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center space-x-1 shadow-xs">
          <Gift className="w-3 h-3 text-purple-500" />
          <span>Referral Only</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1 shadow-xs">
        <UserCheck className="w-3 h-3 text-emerald-500" />
        <span>Available for Mentorship</span>
      </span>
    );
  };

  // Extract unique companies for filter dropdown
  const companiesList = Array.from(new Set(mentors.map(m => m.company).filter(Boolean))).slice(0, 10);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl w-full mx-auto">
      
      {/* 1. Header Banner */}
      <div className="pro-card p-6 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 uppercase tracking-wider flex items-center space-x-1">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-400" />
              <span>Verified KCE Alumni Network</span>
            </span>
            <span className="text-xs text-slate-400 font-bold">• 1-on-1 Career Sessions & Job Referrals</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-3">
            <UserCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>AI Mentor Matching & Career Session Booking</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Connect directly with alumni mentors for mock interviews, resume feedback, and direct job referrals at top tech companies. Filter by availability status.
          </p>
        </div>

        <button 
          onClick={onOpenAI}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 transition shadow-md self-start md:self-auto flex-none active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-indigo-200" />
          <span>AI Session Topic Assistant</span>
        </button>
      </div>

      {/* 2. Availability Filter Bar & Search */}
      <div className="pro-card p-4 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm space-y-4">
        
        {/* Availability Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 mr-1 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Availability:</span>
            </span>

            {[
              { id: 'all', label: 'All Mentors', count: mentors.length },
              { id: 'mentorship', label: 'Mentorship Only', count: mentors.filter(m => (m.availability || '').toLowerCase().includes('mentorship') && !(m.availability || '').toLowerCase().includes('referral')).length },
              { id: 'referral', label: 'Referral Only', count: mentors.filter(m => (m.availability || '').toLowerCase().includes('referral') && !(m.availability || '').toLowerCase().includes('mentorship')).length },
              { id: 'both', label: 'Mentorship & Referral', count: mentors.filter(m => (m.availability || '').toLowerCase().includes('referral') && (m.availability || '').toLowerCase().includes('mentorship')).length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAvailabilityFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  availabilityFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-[#0d131f] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#192436] border border-slate-200 dark:border-[#253349]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${availabilityFilter === tab.id ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-[#1f2d45] text-slate-500 dark:text-slate-400'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Company Dropdown */}
          <div className="flex items-center space-x-2">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold focus-ring"
            >
              <option value="all">All Target Companies</option>
              {companiesList.map(comp => (
                <option key={comp} value={comp}>{comp}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search mentors by name, role, company (Google, Amazon, Stripe) or skills..."
            className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus-ring"
          />
        </div>
      </div>

      {/* 3. Mentors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredMentors.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 space-y-3 bg-white dark:bg-[#162030] rounded-2xl border border-slate-200 dark:border-[#233147] p-8">
            <UserCheck className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 stroke-1" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">No Mentors Match Filter Criteria</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Try resetting availability filters or search terms to explore available KCE alumni mentors.</p>
            <button 
              onClick={() => { setAvailabilityFilter('all'); setCompanyFilter('all'); setSearchTerm(''); }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredMentors.map((m) => {
            const availText = m.availability || 'Available for Mentorship';
            const allowsMentorship = availText.toLowerCase().includes('mentorship');
            const allowsReferral = availText.toLowerCase().includes('referral');

            return (
              <div 
                key={m.id} 
                className="pro-card pro-card-hover p-6 rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-sm dark:shadow-md flex flex-col justify-between space-y-5 transition-all"
              >
                {/* Header & Status */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Avatar & Info */}
                    <div className="flex items-start space-x-3.5">
                      <div className="relative flex-none">
                        <img 
                          src={m.avatar} 
                          alt={m.name} 
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/40 shadow-sm" 
                        />
                        <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-0.5 rounded-full text-[9px] shadow" title="Verified KCE Alum">
                          <ShieldCheck className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">{m.name}</h3>
                          <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">• KCE '{(m.graduationYear || 2021).toString().slice(-2)}</span>
                        </div>
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1">
                          <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{m.title} @ {m.company}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {m.degree || 'B.E. Computer Science'} • {m.location || 'India'}
                        </p>
                      </div>
                    </div>

                    {/* Mentorship Impact Badge */}
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center space-x-1 flex-none shadow-xs">
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-400" />
                      <span>{m.impactScore || 850} Impact</span>
                    </span>
                  </div>

                  {/* Availability Badge Row */}
                  <div className="flex items-center justify-between pt-1">
                    {renderAvailabilityBadge(availText)}
                    <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Responds in &lt; 2 hrs</span>
                    </span>
                  </div>

                  {/* Similarity Score & Context Banner */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] space-y-2">
                    <div className="flex items-center justify-between text-xs font-extrabold">
                      <span className="text-slate-600 dark:text-slate-300 flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>AI Target Role Alignment</span>
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-black">{m.matchScore || 88}% Match</span>
                    </div>

                    {m.matchReason && (
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-white dark:bg-[#162030] p-2 rounded-lg border border-slate-200/80 dark:border-[#253349]">
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400">💡 Match Reason:</span> {m.matchReason}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-[#162030] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#253349] font-bold">
                        ✓ KCE Alum
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-[#162030] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#253349] font-bold">
                        ✓ {m.menteesGuided || 15}+ Mentees Guided
                      </span>
                      {m.company && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-[#162030] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#253349] font-bold">
                          ✓ {m.company} Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Skills List */}
                  <div className="flex flex-wrap gap-1.5">
                    {(m.skills || ['Python', 'System Design', 'React']).slice(0, 4).map((sk, idx) => (
                      <span key={idx} className="text-[10px] px-2.5 py-0.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/50 font-bold">
                        {sk}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic line-clamp-2">
                    "{m.bio || 'KCE alumnus guiding students on tech placements, mock technical interviews, and system architecture.'}"
                  </p>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-4 border-t border-slate-200 dark:border-[#233147] flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setDetailedAlumniModal(m)}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#192436] hover:bg-slate-200 dark:hover:bg-[#23324b] text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-[#253349] transition active:scale-95"
                    >
                      View Dossier
                    </button>
                    <a
                      href={getVerifiableLinkedInUrl(m)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-[#192436] hover:bg-slate-200 dark:hover:bg-[#23324b] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#253349] transition"
                      title="Verified LinkedIn Profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="flex items-center space-x-2">
                    {allowsReferral && (
                      <button 
                        onClick={() => handleOpenBookingModal(m, 'referral')}
                        className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm transition flex items-center space-x-1.5 active:scale-95"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>Request Referral</span>
                      </button>
                    )}

                    {allowsMentorship && (
                      <button 
                        onClick={() => handleOpenBookingModal(m, 'mentorship')}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5 active:scale-95"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book 1-on-1 Session</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Detailed Alumni Profile Modal */}
      {detailedAlumniModal && (
        <AlumniProfileModal
          alumni={detailedAlumniModal}
          onClose={() => setDetailedAlumniModal(null)}
          onBookSession={(alum) => handleOpenBookingModal(alum, 'mentorship')}
        />
      )}

      {/* 5. Booking / Referral Request Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="pro-card max-w-lg w-full rounded-2xl p-6 space-y-5 bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-2xl relative text-slate-900 dark:text-white animate-in zoom-in-95">
            <button 
              onClick={() => setSelectedMentor(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3.5 border-b border-slate-200 dark:border-[#233147] pb-4">
              <img src={selectedMentor.avatar} alt={selectedMentor.name} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/40" />
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {bookingType === 'referral' ? 'Request Career Job Referral' : 'Schedule 1-on-1 Mentorship'}
                </h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">With {selectedMentor.name} ({selectedMentor.title} @ {selectedMentor.company})</p>
              </div>
            </div>

            {bookingConfirmed ? (
              <div className="p-6 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-2 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600 dark:text-emerald-400" />
                <h4 className="font-extrabold text-base">Request Successfully Sent!</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 max-w-xs mx-auto">
                  {bookingType === 'referral' 
                    ? `Your job referral request has been sent to ${selectedMentor.name}.` 
                    : `Calendar invite & 1-on-1 mentorship request sent to ${selectedMentor.name}.`}
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookSession} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {bookingType === 'referral' ? 'Referral Target Position' : 'Session Topic'}
                  </label>
                  <select 
                    value={sessionTopic}
                    onChange={(e) => setSessionTopic(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus-ring font-medium"
                  >
                    {bookingType === 'referral' ? (
                      <>
                        <option>Job Referral Request — {selectedMentor.company}</option>
                        <option>Internal Employee Candidate Recommendation</option>
                        <option>Resume Screening & Referral Evaluation</option>
                      </>
                    ) : (
                      <>
                        <option>Mock Technical Architecture Interview</option>
                        <option>Resume & Portfolio Review</option>
                        <option>Career Transition & Target Role Strategy</option>
                        <option>System Design & Distributed Caching Prep</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Preferred Date</label>
                    <input 
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus-ring font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Preferred Time</label>
                    <input 
                      type="time"
                      value={sessionTime}
                      onChange={(e) => setSessionTime(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus-ring font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Personalized Message</label>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center space-x-1 cursor-pointer hover:underline" onClick={() => setCustomNote(`Hi ${selectedMentor.name.split(' ')[0]},\n\nI am currently a student at KCE targeting a role as ${propUser?.targetRole || 'Software Engineer'} at ${selectedMentor.company}. I would appreciate your guidance on interview preparation.\n\nBest regards,\n${propUser?.name || 'Alex'}`)}>
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-fill Note</span>
                    </span>
                  </div>
                  <textarea 
                    rows={4}
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="Introduce yourself and explain your target goals..."
                    className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus-ring font-normal leading-relaxed"
                  />
                </div>

                <button 
                  type="submit"
                  className={`w-full py-3 rounded-xl font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center space-x-2 text-white ${bookingType === 'referral' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                >
                  <SendIcon className="w-4 h-4" />
                  <span>{bookingType === 'referral' ? 'Submit Job Referral Request' : 'Confirm & Reserve Mentorship Session'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SendIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
    </svg>
  );
}
