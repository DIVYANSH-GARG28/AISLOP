import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Briefcase, 
  UserCheck, 
  Sparkles, 
  Search, 
  Lock, 
  Unlock,
  AlertCircle,
  ChevronRight,
  User
} from 'lucide-react';
import { alumniApi } from '../services/api';

export default function AlumniMessagingCenter({ user, onOpenAI, initialAlumni, initialNote, onAddNotification }) {
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'accepted' | 'pending'
  const [searchTerm, setSearchTerm] = useState('');
  const chatEndRef = useRef(null);

  // Load requests from localStorage on mount or when initialAlumni changes
  useEffect(() => {
    loadRequests();
  }, [initialAlumni, initialNote]);

  const loadRequests = async () => {
    const saved = localStorage.getItem('connected_alumni_requests');
    let currentReqs = [];
    if (saved) {
      try {
        currentReqs = JSON.parse(saved);
      } catch (e) {
        currentReqs = [];
      }
    }

    // Start with empty request list if no requests saved yet
    if (currentReqs.length === 0) {
      currentReqs = [];
      localStorage.setItem('connected_alumni_requests', JSON.stringify(currentReqs));
    }

    // If navigated from Alumni Discovery with initialAlumni
    if (initialAlumni) {
      let existing = currentReqs.find(r => r.alumniId === initialAlumni.id || r.alumniName === initialAlumni.name);
      if (!existing) {
        const newReq = {
          id: 'req_' + Date.now(),
          alumniId: initialAlumni.id || `alum_${Date.now()}`,
          alumniName: initialAlumni.name,
          alumniAvatar: initialAlumni.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
          alumniTitle: initialAlumni.title || 'Senior Engineer',
          alumniCompany: initialAlumni.company || 'Tech Enterprise',
          status: 'PENDING', // Must be accepted by alumni first!
          sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          outreachNote: initialNote || `Hi ${initialAlumni.name}, I would love to connect for mentorship regarding ${user?.targetRole || 'Software Engineering'} roles.`,
          messages: [
            {
              id: 'm1',
              sender: 'student',
              text: initialNote || `Hi ${initialAlumni.name}, I would love to connect for mentorship regarding ${user?.targetRole || 'Software Engineering'} roles.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]
        };
        currentReqs = [newReq, ...currentReqs];
        localStorage.setItem('connected_alumni_requests', JSON.stringify(currentReqs));
        setSelectedRequestId(newReq.id);
      } else {
        setSelectedRequestId(existing.id);
      }
    } else if (!selectedRequestId && currentReqs.length > 0) {
      setSelectedRequestId(currentReqs[0].id);
    }

    setRequests(currentReqs);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedRequestId, requests, isTyping]);

  const activeRequest = requests.find(r => r.id === selectedRequestId) || requests[0];

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeRequest || activeRequest.status !== 'ACCEPTED') return;

    const userMsg = {
      id: 'm_' + Date.now(),
      sender: 'student',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedRequests = requests.map(r => {
      if (r.id === activeRequest.id) {
        return {
          ...r,
          messages: [...(r.messages || []), userMsg]
        };
      }
      return r;
    });

    setRequests(updatedRequests);
    setInputText('');
    localStorage.setItem('connected_alumni_requests', JSON.stringify(updatedRequests));

    // Simulate alumni reply after 1.2s
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const alumReplies = [
        `That's a great question about preparing for ${user?.targetRole || 'tech'} roles. In my experience at ${activeRequest.alumniCompany}, hands-on experience with scalable architecture and database performance makes candidates stand out!`,
        `I recommend focusing on core algorithm fundamentals and preparing 2 solid end-to-end projects on GitHub. I'd be happy to review your resume draft!`,
        `Feel free to send over your specific questions regarding mock technical interviews or target company benchmarks. I'm happy to help a fellow KCE student!`
      ];

      const replyMsg = {
        id: 'm_reply_' + Date.now(),
        sender: 'alumni',
        text: alumReplies[Math.floor(Math.random() * alumReplies.length)],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalRequests = updatedRequests.map(r => {
        if (r.id === activeRequest.id) {
          return {
            ...r,
            messages: [...(r.messages || []), replyMsg]
          };
        }
        return r;
      });

      setRequests(finalRequests);
      localStorage.setItem('connected_alumni_requests', JSON.stringify(finalRequests));
    }, 1200);
  };

  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.alumniName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.alumniCompany.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterTab === 'accepted') return matchesSearch && r.status === 'ACCEPTED';
    if (filterTab === 'pending') return matchesSearch && r.status === 'PENDING';
    return matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto h-[calc(100vh-5rem)] flex flex-col">
      {/* Header Banner */}
      <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#162030] p-6 rounded-2xl border border-slate-200 dark:border-[#233147] shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
            <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Alumni Outreach & 1-on-1 Messaging Center</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Send mentorship requests to verified alumni. 1-on-1 direct chat unlocks once the alumni accepts your request.
          </p>
        </div>

        <button 
          onClick={onOpenAI}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 transition shadow-md self-start md:self-auto"
        >
          <Sparkles className="w-4 h-4 text-indigo-200" />
          <span>AI Outreach Assistant</span>
        </button>
      </div>

      {/* Main Messaging Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Left Column (Requests & Contacts Sidebar) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] rounded-2xl shadow-sm flex flex-col overflow-hidden">
          
          {/* Search & Filter */}
          <div className="p-4 border-b border-slate-200 dark:border-[#233147] space-y-3 flex-none">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search alumni or company..."
                className="w-full bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus-ring"
              />
            </div>

            <div className="flex bg-slate-100 dark:bg-[#0d131f] p-1 rounded-xl text-xs font-semibold">
              <button 
                onClick={() => setFilterTab('all')}
                className={`flex-1 py-1 rounded-lg text-[11px] transition ${filterTab === 'all' ? 'bg-white dark:bg-[#162030] text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500'}`}
              >
                All ({requests.length})
              </button>
              <button 
                onClick={() => setFilterTab('accepted')}
                className={`flex-1 py-1 rounded-lg text-[11px] transition ${filterTab === 'accepted' ? 'bg-white dark:bg-[#162030] text-emerald-600 dark:text-emerald-400 shadow-xs font-bold' : 'text-slate-500'}`}
              >
                Connected ({requests.filter(r => r.status === 'ACCEPTED').length})
              </button>
              <button 
                onClick={() => setFilterTab('pending')}
                className={`flex-1 py-1 rounded-lg text-[11px] transition ${filterTab === 'pending' ? 'bg-white dark:bg-[#162030] text-amber-600 dark:text-amber-400 shadow-xs font-bold' : 'text-slate-500'}`}
              >
                Pending ({requests.filter(r => r.status === 'PENDING').length})
              </button>
            </div>
          </div>

          {/* Request List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredRequests.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <UserCheck className="w-8 h-8 mx-auto stroke-1" />
                <p className="text-xs font-medium">No mentorship requests match your search.</p>
              </div>
            ) : (
              filteredRequests.map((req) => {
                const isSelected = req.id === selectedRequestId;
                const isAccepted = req.status === 'ACCEPTED';
                return (
                  <div 
                    key={req.id}
                    onClick={() => setSelectedRequestId(req.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between space-x-3 ${
                      isSelected 
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 shadow-xs' 
                        : 'bg-slate-50/50 dark:bg-[#0d131f]/50 border-slate-200/60 dark:border-[#233147] hover:bg-slate-100 dark:hover:bg-[#192436]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="relative flex-none">
                        <img 
                          src={req.alumniAvatar} 
                          alt={req.alumniName} 
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/30" 
                        />
                        {isAccepted ? (
                          <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-0.5 rounded-full text-[8px]" title="Accepted">
                            <ShieldCheck className="w-3 h-3 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full text-[8px]" title="Pending Acceptance">
                            <Clock className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{req.alumniName}</h4>
                          <span className="text-[10px] text-slate-400 flex-none">{req.sentAt}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{req.alumniTitle} @ {req.alumniCompany}</p>
                        
                        <div className="pt-0.5 flex items-center space-x-1.5">
                          {isAccepted ? (
                            <span className="px-2 py-0.2 rounded text-[9px] font-extrabold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              ✅ Connected & Chat Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.2 rounded text-[9px] font-extrabold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              ⌛ Pending Approval
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Area (Selected Chat or Request Status View) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-0">
          
          {!activeRequest ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 stroke-1" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Select a Mentorship Request</h3>
              <p className="text-xs text-slate-500 max-w-sm">Choose an outreach request from the left sidebar to view request status or continue 1-on-1 conversations.</p>
            </div>
          ) : (
            <>
              {/* Chat / Request Header */}
              <div className="p-4 border-b border-slate-200 dark:border-[#233147] bg-slate-50 dark:bg-[#111827] flex items-center justify-between flex-none">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img 
                      src={activeRequest.alumniAvatar} 
                      alt={activeRequest.alumniName} 
                      className="w-11 h-11 rounded-xl object-cover ring-2 ring-indigo-500/40" 
                    />
                    <span className={`absolute -bottom-1 -right-1 p-0.5 rounded-full text-[9px] ${activeRequest.status === 'ACCEPTED' ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'}`}>
                      <ShieldCheck className="w-3 h-3 stroke-[3]" />
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{activeRequest.alumniName}</h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        KCE Alum
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center space-x-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{activeRequest.alumniTitle} @ {activeRequest.alumniCompany}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {activeRequest.status === 'ACCEPTED' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1">
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Chat Unlocked</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center space-x-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Request Pending</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Status Banner */}
              {activeRequest.status === 'PENDING' ? (
                <div className="p-4 bg-amber-50/80 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center space-x-2.5 text-amber-800 dark:text-amber-300 font-medium">
                    <AlertCircle className="w-5 h-5 flex-none text-amber-600 dark:text-amber-400" />
                    <div>
                      <strong>Mentorship Request Pending Alumni Acceptance:</strong> Direct 1-on-1 chat will unlock automatically as soon as {activeRequest.alumniName} approves your connection request.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Mentorship Request Accepted by {activeRequest.alumniName}! Direct 1-on-1 messaging is active.</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Accepted {activeRequest.acceptedAt || 'Recently'}</span>
                </div>
              )}

              {/* Chat Thread Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100/50 dark:bg-[#0d131f]">
                {(activeRequest.messages || []).map((msg) => {
                  const isStudent = msg.sender === 'student';
                  return (
                    <div 
                      key={msg.id}
                      className={`flex items-end space-x-2 ${isStudent ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isStudent && (
                        <img 
                          src={activeRequest.alumniAvatar} 
                          alt={activeRequest.alumniName} 
                          className="w-7 h-7 rounded-lg object-cover flex-none mb-1 ring-1 ring-slate-300 dark:ring-slate-700" 
                        />
                      )}

                      <div className={`max-w-[82%] sm:max-w-[75%] space-y-1 ${isStudent ? 'items-end' : 'items-start'}`}>
                        <div 
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                            isStudent 
                              ? 'bg-indigo-600 text-white rounded-br-none font-normal' 
                              : 'bg-white dark:bg-[#162030] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-[#233147] rounded-bl-none'
                          }`}
                        >
                          <p>{msg.text}</p>
                        </div>
                        <div className={`text-[10px] text-slate-400 px-1 ${isStudent ? 'text-right' : 'text-left'}`}>
                          {msg.timestamp}
                        </div>
                      </div>

                      {isStudent && (
                        <img 
                          src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'} 
                          alt={user?.name || 'User'} 
                          className="w-7 h-7 rounded-lg object-cover flex-none mb-1 ring-1 ring-indigo-500" 
                        />
                      )}
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex items-center space-x-2 text-slate-400 text-xs">
                    <img src={activeRequest.alumniAvatar} alt={activeRequest.alumniName} className="w-7 h-7 rounded-lg object-cover" />
                    <div className="p-3 bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] rounded-2xl rounded-bl-none flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      <span className="text-[10px] ml-1 font-medium text-slate-400">{activeRequest.alumniName} is typing...</span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Message Input Box (Disabled if PENDING) */}
              <form 
                onSubmit={handleSendMessage} 
                className="p-4 bg-white dark:bg-[#162030] border-t border-slate-200 dark:border-[#233147] flex items-center space-x-3"
              >
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={activeRequest.status !== 'ACCEPTED'}
                  placeholder={activeRequest.status === 'ACCEPTED' ? `Message ${activeRequest.alumniName}...` : 'Chat locked until request is accepted by alumni...'}
                  className="flex-1 bg-slate-100 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim() || activeRequest.status !== 'ACCEPTED'}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition active:scale-95 flex-none"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
