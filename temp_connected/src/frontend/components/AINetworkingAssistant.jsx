import React, { useState } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Copy, 
  Check, 
  UserPlus, 
  Target,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { aiAssistantApi } from '../services/api';
import AlumniProfileModal from './AlumniProfileModal';

// Helper function to render formatted inline text (bold, code, italic)
function renderInlineMarkdown(str) {
  if (!str) return null;
  const parts = str.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-extrabold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 font-mono text-[11px] border border-indigo-200/50 dark:border-indigo-800/50">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={idx} className="italic text-slate-700 dark:text-slate-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

function formatCopilotMessageContent(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const renderedElements = [];
  let currentListItems = [];

  const flushList = (keyPrefix) => {
    if (currentListItems.length > 0) {
      renderedElements.push(
        <ul key={`list_${keyPrefix}`} className="my-2 space-y-1.5 pl-0.5">
          {currentListItems.map((item, idx) => (
            <li key={idx} className="flex items-start space-x-2 text-[12px] leading-relaxed text-slate-700 dark:text-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-none mt-1.5 shadow-xs" />
              <span className="flex-1">{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      );
      currentListItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(index);
      renderedElements.push(<div key={`br_${index}`} className="h-1" />);
      return;
    }

    // Check for Headings: ### H3 or ## H2
    if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
      flushList(index);
      const title = trimmed.replace(/^#{2,3}\s+/, '');
      renderedElements.push(
        <div key={`h3_${index}`} className="mt-3.5 mb-2 pt-2.5 border-t border-slate-200/70 dark:border-slate-800/70 first:border-t-0 first:pt-0">
          <h4 className="font-extrabold text-[13px] tracking-tight text-indigo-600 dark:text-indigo-400 flex items-center space-x-1.5">
            <span>{renderInlineMarkdown(title)}</span>
          </h4>
        </div>
      );
      return;
    }

    // Check for Subheadings: #### H4
    if (trimmed.startsWith('#### ')) {
      flushList(index);
      const title = trimmed.replace(/^#{4}\s+/, '');
      renderedElements.push(
        <h5 key={`h4_${index}`} className="font-extrabold text-[12px] text-slate-900 dark:text-slate-100 mt-2.5 mb-1.5">
          {renderInlineMarkdown(title)}
        </h5>
      );
      return;
    }

    // Check for Bullet items: - or * or number dot like "1. "
    const listMatch = trimmed.match(/^(?:[-*]|\d+\.)\s+(.*)/);
    if (listMatch) {
      currentListItems.push(listMatch[1]);
      return;
    }

    // Normal paragraph line
    flushList(index);
    renderedElements.push(
      <p key={`p_${index}`} className="text-[12px] leading-relaxed text-slate-700 dark:text-slate-200 mb-1">
        {renderInlineMarkdown(trimmed)}
      </p>
    );
  });

  flushList('end');
  return <div className="space-y-1 text-xs">{renderedElements}</div>;
}

export default function AINetworkingAssistant({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'assistant',
      text: 'Hello! I am your ConnectEd Career Copilot. I can draft outreach notes to alumni, analyze your skill gaps, or recommend relevant mentors for your target career goal. How can I assist you today?',
      timestamp: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedAlumniForModal, setSelectedAlumniForModal] = useState(null);
  const [expandedMessages, setExpandedMessages] = useState({});

  if (!isOpen) return null;

  const quickPrompts = [
    { label: 'Draft Outreach to Google DeepMind Alum', icon: UserPlus, query: 'Draft a referral request to Dr. Sarah Chen at Google DeepMind' },
    { label: 'Analyze Top Skill Gap for AI Role', icon: Target, query: 'What is my top skill gap for Senior AI Engineer?' },
    { label: 'Recommend Top Alumni Mentors', icon: Sparkles, query: 'Who are my top alumni mentor matches?' },
  ];

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = {
      id: 'u_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    try {
      const botResponse = await aiAssistantApi.sendMessage(query);
      setMessages(prev => [...prev, botResponse]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: 'err_' + Date.now(),
        sender: 'assistant',
        text: 'Sorry, I ran into an error connecting to the AI service. Please try again.',
        timestamp: 'Now'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white dark:bg-[#162030] border-l border-slate-200 dark:border-[#233147] shadow-2xl flex flex-col justify-between transition-all duration-300">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-[#233147] flex items-center justify-between bg-slate-50 dark:bg-[#131c2e]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center">
              ConnectEd Career Copilot
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Mentorship & Outreach Guidance Assistant</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#192436] transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Action Prompt Chips */}
      <div className="px-4 py-2.5 bg-slate-100 dark:bg-[#0d131f] border-b border-slate-200 dark:border-[#233147] overflow-x-auto flex space-x-2 scrollbar-none">
        {quickPrompts.map((qp, idx) => {
          const Icon = qp.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSend(qp.query)}
              className="flex-none flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-[#162030] hover:bg-slate-200 dark:hover:bg-[#1f2d45] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#253349] text-[11px] font-bold shadow-sm transition"
            >
              <Icon className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>{qp.label}</span>
            </button>
          );
        })}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#0d131f]">
        {messages.map((msg) => {
          const isExpanded = !!expandedMessages[msg.id];
          const alumniList = Array.isArray(msg.suggestedAlumni) ? msg.suggestedAlumni : [];
          const visibleAlumni = isExpanded ? alumniList : alumniList.slice(0, 2);

          return (
            <div 
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center space-x-1 text-[10px] text-slate-500 dark:text-slate-400 mb-1 px-1 font-bold">
                <span>{msg.sender === 'user' ? 'You' : 'ConnectEd Copilot'}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>
              <div className={`relative max-w-[92%] p-4 rounded-2xl text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white font-semibold shadow-md'
                  : 'bg-white dark:bg-[#162030] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-[#233147] shadow-sm dark:shadow-md'
              }`}>
                {msg.sender === 'assistant' && (
                  <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-2.5 border border-indigo-500/20">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Granite 4.2 RAG Engine</span>
                  </div>
                )}

                {msg.sender === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                ) : (
                  formatCopilotMessageContent(msg.text)
                )}

                {/* Suggested Alumni Cards List (NLP / Gemini Match Result) */}
                {alumniList.length > 0 && (
                  <div className="mt-3 space-y-2 pt-2.5 border-t border-slate-200 dark:border-[#233147]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                        Suggested Alumni Matches ({alumniList.length})
                      </span>
                      {alumniList.length > 2 && (
                        <span className="text-[9px] font-bold text-slate-400">
                          Showing {visibleAlumni.length} of {alumniList.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {visibleAlumni.map((alum) => (
                        <div 
                          key={alum.id}
                          onClick={() => setSelectedAlumniForModal(alum)}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] flex flex-col space-y-2 cursor-pointer hover:border-indigo-400/60 transition shadow-xs group/alum"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                              <img 
                                src={alum.avatar || alum.avatarUrl} 
                                alt={alum.name} 
                                className="w-9 h-9 rounded-xl object-cover ring-1 ring-indigo-500/40 flex-none group-hover/alum:ring-indigo-500 transition"
                              />
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs truncate group-hover/alum:text-indigo-500 transition">
                                  {alum.name}
                                </h4>
                                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 truncate">
                                  {alum.title || alum.role} @ {alum.company}
                                </p>
                                <div className="flex items-center space-x-1.5 text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                                  <span className="text-amber-600 dark:text-amber-400 font-bold">⚡ {alum.impactScore || 850} Impact</span>
                                  <span>•</span>
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{alum.matchScore || 90}% Match</span>
                                </div>
                              </div>
                            </div>

                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAlumniForModal(alum);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] shadow-sm transition flex-none active:scale-95"
                            >
                              View Profile
                            </button>
                          </div>

                          {alum.matchReason && (
                            <div className="p-2 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 text-[10px] text-indigo-950 dark:text-indigo-200 font-medium leading-normal flex items-start space-x-1.5">
                              <Sparkles className="w-3 h-3 text-indigo-500 flex-none mt-0.5" />
                              <p className="line-clamp-2">
                                <span className="font-extrabold">Match Reason:</span> {alum.matchReason}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Expandable "See More Matches" Button */}
                    {alumniList.length > 2 && (
                      <button
                        onClick={() => setExpandedMessages(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                        className="w-full py-1.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-[11px] flex items-center justify-center space-x-1.5 transition shadow-xs mt-2"
                      >
                        <span>{isExpanded ? 'Show Less' : `See More Alumni Matches (+${alumniList.length - 2} more)`}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                )}

                {msg.sender === 'assistant' && (
                  <button 
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="mt-2.5 pt-2 border-t border-slate-200 dark:border-[#233147] w-full flex items-center justify-end text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold transition"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied to clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        <span>Copy outreach draft</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex items-center space-x-2 text-xs text-indigo-700 dark:text-indigo-300 bg-white dark:bg-[#162030] p-3 rounded-xl border border-slate-200 dark:border-[#233147] w-fit shadow-md font-bold">
            <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <span>Formulating career insight...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-3.5 border-t border-slate-200 dark:border-[#233147] bg-slate-50 dark:bg-[#131c2e]">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center space-x-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI for outreach notes or skill gap advice..."
            className="flex-1 bg-white dark:bg-[#0d131f] border border-slate-200 dark:border-[#253349] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus-ring"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Detailed Alumni Profile Deep-Dive Modal */}
      {selectedAlumniForModal && (
        <AlumniProfileModal
          alumni={selectedAlumniForModal}
          onClose={() => setSelectedAlumniForModal(null)}
        />
      )}
    </div>
  );
}
