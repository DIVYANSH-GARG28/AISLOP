import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  FileText, 
  Copy, 
  Check, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  Briefcase
} from 'lucide-react';
import { resumeApi } from '../services/api';

export default function ResumeRAGModal({ isOpen, onClose, user, onOpenResumeUpload }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [customApiKey, setCustomApiKey] = useState(
    typeof localStorage !== 'undefined' ? (localStorage.getItem('connected_gemini_api_key') || '') : ''
  );
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [keyInput, setKeyInput] = useState(
    typeof localStorage !== 'undefined' ? (localStorage.getItem('connected_gemini_api_key') || '') : ''
  );
  const messagesEndRef = useRef(null);

  const initialResumeText = typeof localStorage !== 'undefined' 
    ? localStorage.getItem('connected_resume_text') || user?.bio || ''
    : user?.bio || '';

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `### 👋 Welcome to your Pro Resume RAG Co-pilot\n\nI have indexed your resume and active skills targeting **${user?.targetRole || 'Software Engineer'}**.\n\nYou can ask me anything about your background, including:\n- **Technical Interview Questions** tailored to your projects\n- **Resume Gap & ATS Keyword Analysis**\n- **STAR Method Answers** for behavioral rounds\n- **Personalized Alumni Outreach Pitches**\n\nClick one of the suggested prompts below or type your custom question!`,
      source: 'live_ai_model',
      model: customApiKey ? 'Google Gemini 1.5 Flash' : 'Hybrid AI / Contextual RAG'
    }
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    const trimmed = keyInput.trim();
    setCustomApiKey(trimmed);
    if (typeof localStorage !== 'undefined') {
      if (trimmed) {
        localStorage.setItem('connected_gemini_api_key', trimmed);
      } else {
        localStorage.removeItem('connected_gemini_api_key');
      }
    }
    setShowKeyConfig(false);
  };

  const quickPrompts = [
    "🎯 What technical questions will interviewers ask me based on my projects?",
    "🔍 What are the missing skills or ATS gaps for my target role?",
    "📝 Draft an alumni referral outreach message based on my resume",
    "💡 How should I explain my top project using the STAR method?"
  ];

  const handleSend = async (questionToSend) => {
    const q = (questionToSend || query).trim();
    if (!q || loading) return;

    const userMsg = {
      id: 'user_' + Date.now(),
      role: 'user',
      text: q
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await resumeApi.askResumeRAG({
        query: q,
        studentId: user?.id,
        resumeText: initialResumeText,
        targetRole: user?.targetRole || 'Software Engineer',
        studentName: user?.name || 'Student',
        apiKey: customApiKey || undefined
      });

      const assistantMsg = {
        id: 'bot_' + Date.now(),
        role: 'assistant',
        text: res?.answer || "I processed your resume context, but did not receive a detailed response. Please refine your query.",
        source: res?.source || 'local_rag_engine',
        model: res?.model || (customApiKey ? 'Google Gemini 1.5 Flash' : 'Contextual AI RAG')
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error("RAG Query Error:", err);
      setMessages(prev => [
        ...prev,
        {
          id: 'bot_' + Date.now(),
          role: 'assistant',
          text: "⚠️ An error occurred while communicating with the AI RAG engine. Please verify your connection.",
          source: 'error'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="pro-card max-w-3xl w-full h-[85vh] max-h-[750px] rounded-2xl bg-white dark:bg-[#162030] border border-slate-200 dark:border-[#233147] shadow-2xl flex flex-col relative overflow-hidden text-slate-900 dark:text-white my-4">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#233147] bg-slate-50/80 dark:bg-[#131c2e] flex items-center justify-between flex-none">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#E2F952] border-2 border-black text-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
              <Bot className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight">
                  Resume RAG AI Co-pilot
                </h3>
                <span className="px-2 py-0.5 rounded font-mono font-extrabold text-[10px] uppercase tracking-wider bg-[#E2F952] text-black border border-black shadow-[1px_1px_0px_0px_#000]">
                  {customApiKey ? '⚡ GEMINI 1.5 FLASH' : '🧠 HYBRID AI / RAG'}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Grounded in Resume • Google Gemini & n8n Automation Engine</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="px-2.5 py-1.5 rounded-xl border-2 border-black dark:border-white/80 hover:bg-neutral-100 dark:hover:bg-[#1f2d45] text-xs font-mono font-bold text-slate-800 dark:text-slate-200 transition shadow-[1.5px_1.5px_0px_0px_#000] flex items-center space-x-1"
              title="Configure Gemini API Key"
            >
              <Sparkles className="w-3.5 h-3.5 text-black dark:text-[#E2F952]" />
              <span className="hidden sm:inline">{customApiKey ? 'Gemini Active' : 'Set Gemini Key'}</span>
            </button>

            {onOpenResumeUpload && (
              <button
                onClick={() => { onClose(); onOpenResumeUpload(); }}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border-2 border-black dark:border-white/80 hover:bg-slate-100 dark:hover:bg-[#1f2d45] text-xs font-mono font-bold text-slate-800 dark:text-slate-200 transition shadow-[1.5px_1.5px_0px_0px_#000]"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Upload Resume</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1f2d45] rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* API Key Configuration Drawer */}
        {showKeyConfig && (
          <div className="p-3 bg-amber-50 dark:bg-[#111927] border-b-2 border-black dark:border-white/20 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs font-mono animate-enter">
            <div className="flex-1 w-full space-y-1">
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase block">
                Google Gemini API Key (Optional — Real Live LLM):
              </span>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy... (Paste Gemini key, or leave blank to use intelligent Local RAG Engine)"
                className="w-full p-2 rounded-lg bg-white dark:bg-[#181A20] border-2 border-black dark:border-white text-xs font-mono text-black dark:text-white focus:outline-none"
              />
            </div>
            <div className="flex items-center space-x-2 self-end sm:self-auto pt-2 sm:pt-4">
              <button
                onClick={handleSaveApiKey}
                className="px-3 py-2 rounded-lg bg-[#E2F952] text-black font-mono font-bold text-xs border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
              >
                Save Key
              </button>
              {customApiKey && (
                <button
                  onClick={() => { setKeyInput(''); setCustomApiKey(''); localStorage.removeItem('connected_gemini_api_key'); }}
                  className="px-2.5 py-2 rounded-lg border-2 border-black text-rose-600 font-mono font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div 
              key={msg.id || idx}
              className={`flex items-start space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-none text-xs font-bold ${
                msg.role === 'user'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 relative group ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none font-medium'
                  : 'bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#233147] text-slate-800 dark:text-slate-200 rounded-tl-none font-normal'
              }`}>
                <div className="whitespace-pre-wrap space-y-1">
                  {msg.text.split('\n').map((line, lIdx) => {
                    if (line.startsWith('### ')) {
                      return <h4 key={lIdx} className="font-bold text-sm text-slate-900 dark:text-white pt-1">{line.replace('### ', '')}</h4>;
                    }
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <p key={lIdx} className="font-bold text-slate-900 dark:text-white">{line.replace(/\*\*/g, '')}</p>;
                    }
                    return <p key={lIdx}>{line}</p>;
                  })}
                </div>

                {msg.role === 'assistant' && (
                  <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 dark:border-[#233147]/60 text-[10px] text-slate-400">
                    <span className="flex items-center space-x-1 font-mono font-semibold">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>{msg.source === 'live_ai_model' ? '✨ Live Google Gemini 1.5' : msg.source === 'n8n_rag_pipeline' ? '⚡ n8n Webhook RAG' : '🧠 Contextual AI RAG'}</span>
                    </span>
                    <button
                      onClick={() => handleCopy(msg.text, idx)}
                      className="inline-flex items-center space-x-1 hover:text-slate-600 dark:hover:text-slate-200 transition font-mono"
                    >
                      {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 flex items-center justify-center flex-none">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#233147] text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2 font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                <span>Retrieving resume chunks and generating tailored answer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 bg-slate-50/50 dark:bg-[#101726] border-t border-slate-200/60 dark:border-[#233147]/60 flex items-center space-x-1.5 overflow-x-auto scrollbar-none flex-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-none">Ideas:</span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white dark:bg-[#162030] hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-[#253349] hover:border-indigo-300 flex-none transition disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-[#233147] bg-white dark:bg-[#162030] flex-none">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center space-x-2"
          >
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about your resume, interview questions, or projects..."
              className="flex-1 bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus-ring font-medium"
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5 disabled:opacity-40 active:scale-95 flex-none"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
