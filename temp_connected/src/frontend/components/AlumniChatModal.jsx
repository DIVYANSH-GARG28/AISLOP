import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  ShieldCheck, 
  Briefcase, 
  Bot, 
  CheckCheck,
  Zap,
  User,
  Sparkles,
  MessageSquare
} from 'lucide-react';

export default function AlumniChatModal({ isOpen, onClose, alumni, initialMessage, user }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!alumni) return;

    // Load or initialize chat thread
    const threadKey = `chat_thread_${alumni.id || alumni.name}`;
    const saved = localStorage.getItem(threadKey);

    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        initThread(threadKey);
      }
    } else {
      initThread(threadKey);
    }
  }, [alumni, initialMessage]);

  const initThread = (threadKey) => {
    const openingMsg = {
      id: 'msg_1',
      sender: 'student',
      senderName: user?.name || 'Student',
      text: initialMessage || `Hi ${alumni?.name || 'Mentor'}, I noticed your background at ${alumni?.company || 'Tech Leader'} as a ${alumni?.title || 'Senior Engineer'}. I am working towards a ${user?.targetRole || 'Software Engineer'} role and would love your advice on preparing for technical interviews!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isInitialRequest: true
    };

    const initialResponses = [
      openingMsg,
      {
        id: 'msg_2',
        sender: 'alumni',
        senderName: alumni?.name || 'Alumni Mentor',
        text: `Hi ${user?.name || 'there'}! Thanks for reaching out. I saw your profile and your target horizon for ${user?.targetRole || 'Senior Engineer'} at ${user?.targetCompany || alumni?.company || 'Tech Enterprise'}. I'd be glad to share my career path from KCE and offer interview tips!`,
        timestamp: new Date(Date.now() + 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    setMessages(initialResponses);
    localStorage.setItem(threadKey, JSON.stringify(initialResponses));
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !alumni) return;

    const userMsg = {
      id: 'msg_' + Date.now(),
      sender: 'student',
      senderName: user?.name || 'Student',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInputText('');
    
    const threadKey = `chat_thread_${alumni.id || alumni.name}`;
    localStorage.setItem(threadKey, JSON.stringify(updated));

    // Simulate realistic alumni response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const responses = [
        `That's a great question about ${user?.targetRole || 'engineering'}. When I was preparing at KCE, focusing heavily on System Design and asynchronous architectures was key for passing ${alumni?.company || 'tier-1'} rounds.`,
        `I recommend scheduling a 1-on-1 mock interview with me in the Mentor Matching tab so we can practice system architecture and code review together!`,
        `Definitely! I can also review your resume and highlight your top project contributions before you submit referrals to ${user?.targetCompany || alumni?.company || 'tech companies'}.`
      ];

      const randomReply = responses[Math.floor(Math.random() * responses.length)];
      const alumMsg = {
        id: 'msg_' + (Date.now() + 1),
        sender: 'alumni',
        senderName: alumni?.name || 'Alumni Mentor',
        text: randomReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalThread = [...updated, alumMsg];
      setMessages(finalThread);
      localStorage.setItem(threadKey, JSON.stringify(finalThread));
    }, 1400);
  };

  if (!isOpen || !alumni) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] w-full max-w-2xl h-[620px] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-white">
        
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-200 dark:border-[#233147] bg-slate-50 dark:bg-[#111827] flex items-center justify-between flex-none">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img 
                src={alumni.avatar} 
                alt={alumni.name} 
                className="w-11 h-11 rounded-xl object-cover ring-2 ring-indigo-500/40"
              />
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-0.5 rounded-full text-[9px]">
                <ShieldCheck className="w-3 h-3 stroke-[3]" />
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">{alumni.name}</h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Verified KCE Alum
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center space-x-1">
                <Briefcase className="w-3 h-3 text-indigo-500" />
                <span>{alumni.title} @ {alumni.company}</span>
                <span>•</span>
                <span className="text-amber-500 font-bold">⚡ {alumni.impactScore || 850} Impact</span>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1f2d45] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Initial Request Banner */}
        <div className="px-4 py-2 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300 font-medium">
          <div className="flex items-center space-x-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Direct 1-on-1 Mentorship Thread Initialized via Outreach Request</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-600 text-white rounded-full">
            Active
          </span>
        </div>

        {/* Message Thread History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100/50 dark:bg-[#0d131f]">
          {messages.map((msg) => {
            const isStudent = msg.sender === 'student';
            return (
              <div 
                key={msg.id}
                className={`flex items-end space-x-2 ${isStudent ? 'justify-end' : 'justify-start'}`}
              >
                {!isStudent && (
                  <img 
                    src={alumni.avatar} 
                    alt={alumni.name} 
                    className="w-7 h-7 rounded-lg object-cover flex-none mb-1 ring-1 ring-slate-300 dark:ring-slate-700" 
                  />
                )}

                <div className={`max-w-[82%] sm:max-w-[75%] space-y-1 ${isStudent ? 'items-end' : 'items-start'}`}>
                  {msg.isInitialRequest && (
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-1">
                      📨 Initial Outreach Request Note
                    </div>
                  )}

                  <div 
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      isStudent 
                        ? 'bg-indigo-600 text-white rounded-br-none font-normal' 
                        : 'bg-white dark:bg-[#162030] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-[#233147] rounded-bl-none'
                    }`}
                  >
                    <p>{msg.text}</p>
                  </div>

                  <div className={`flex items-center space-x-1 text-[10px] text-slate-400 px-1 ${isStudent ? 'justify-end' : 'justify-start'}`}>
                    <span>{msg.timestamp}</span>
                    {isStudent && <CheckCheck className="w-3 h-3 text-indigo-300" />}
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
              <img src={alumni.avatar} alt={alumni.name} className="w-7 h-7 rounded-lg object-cover" />
              <div className="p-3 bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] rounded-2xl rounded-bl-none flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-[10px] ml-1 font-medium text-slate-400">{alumni.name} is typing...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-[#162030] border-t border-slate-200 dark:border-[#233147] flex items-center space-x-2">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${alumni.name}...`}
            className="flex-1 bg-slate-100 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus-ring"
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition active:scale-95"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
