import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  Zap,
  Cpu,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  Info,
  MapPin,
  Car,
} from 'lucide-react';
import { api } from '../api.ts';
import { User } from '../types.ts';
import { auth, db } from '../firebase.ts';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  model?: string;
}

interface GeminiChatbotProps {
  currentUser: User | null;
  isOpen?: boolean;
  onClose?: () => void;
}

const ROLES = [
  {
    id: 'corridor_copilot',
    name: 'Dhaka Corridor Copilot',
    description: 'Expert in Dhaka rush-hour corridors, routes & Tesla pooling',
    instruction:
      'You are the Dhaka Tesla Transit Copilot for "Dhaka Tesla Pool" in Dhaka, Bangladesh. ' +
      'Your role is to assist commuters with corridor pooling (Banani, Gulshan 1 & 2, Mohakhali, Uttara, Mirpur, Dhanmondi, Farmgate), ' +
      'explain the transparent fare formula (passengerFare = baseFare + distanceCharge - 25% poolDiscount), ' +
      'explain strict 3-seat maximum vehicle capacity on Tesla "Bullet", Dhaka rush-hour traffic navigation, ' +
      'and pickup/dropoff points. Always be helpful, concise, courteous, and knowledgeable about Dhaka roads and Tesla electric transit.',
  },
  {
    id: 'traffic_navigator',
    name: 'Traffic & Route Optimizer',
    description: 'Real-time navigation advice for Airport Road, Kemal Ataturk & flyovers',
    instruction:
      'You are the Dhaka Traffic & Route Specialist for Dhaka Tesla Pool. ' +
      'Analyze traffic bottlenecks across Kemal Ataturk, Mohakhali flyover, Bijoy Sarani, and Gulshan Avenue. ' +
      'Provide realistic detour alternatives, estimated commute times, and optimal Tesla pickup points in Dhaka.',
  },
  {
    id: 'fare_policy',
    name: 'Fare & Policy Specialist',
    description: 'Explains Poisha integer calculations, zero-surge pricing & safety',
    instruction:
      'You are the Fare & Policy Specialist for Dhaka Tesla Pool. ' +
      'Explain that Dhaka Tesla Pool has ZERO surge pricing. Base fare is ৳60.00 (6,000 Poisha), distance rate is ৳25.00/km (2,500 Poisha/km), ' +
      'and shared passengers automatically receive a 25% pool discount. Explain the finite state machine transitions and cancellation policies.',
  },
];

const QUICK_PROMPTS = [
  'How does the 25% pool discount work?',
  'What is the quickest route from Banani to Mohakhali during rush hour?',
  'Why is Tesla Bullet limited to exactly 3 passengers?',
  'Where are the best pickup spots around Gulshan 2 circle?',
];

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  currentUser,
  isOpen: controlledIsOpen,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome_1',
      role: 'model',
      content:
        '👋 Welcome to **Dhaka Tesla Transit Copilot**! I am powered by Gemini to help you navigate Dhaka corridors, find Tesla pools, and explain our zero-surge 25% pooled fares. How can I assist your commute today?',
      timestamp: new Date(),
      model: 'gemini-3.5-flash',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const actualIsOpen = controlledIsOpen !== undefined ? controlledIsOpen : isOpen;

  // Scroll to bottom when messages update
  useEffect(() => {
    if (actualIsOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, actualIsOpen, isMinimized]);

  // Load chat history from Firestore if user is authenticated with Firebase
  useEffect(() => {
    const loadFirebaseHistory = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, 'users', auth.currentUser.uid, 'chat_messages'),
          orderBy('timestamp', 'asc'),
          limit(20)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const loaded: Message[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              role: data.role,
              content: data.content,
              timestamp: new Date(data.timestamp),
              model: data.model,
            };
          });
          setMessages(loaded);
        }
      } catch (err) {
        // Fall back gracefully to local state
        console.warn('Could not load Firestore chat history:', err);
      }
    };

    loadFirebaseHistory();
  }, [currentUser]);

  const handleSend = async (contentToSend?: string) => {
    const text = (contentToSend || input).trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Save user message to Firestore if authenticated
    if (auth.currentUser) {
      try {
        await addDoc(collection(db, 'users', auth.currentUser.uid, 'chat_messages'), {
          id: userMessage.id,
          userId: auth.currentUser.uid,
          role: 'user',
          content: userMessage.content,
          model: selectedModel,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Firestore message save error:', e);
      }
    }

    try {
      // Send conversation history to backend Gemini API
      const conversationHistory = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.sendGeminiChat(
        conversationHistory,
        selectedModel,
        selectedRole.instruction
      );

      const assistantMessage: Message = {
        id: `model_${Date.now()}`,
        role: 'model',
        content: res.reply,
        timestamp: new Date(),
        model: res.model,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message to Firestore if authenticated
      if (auth.currentUser) {
        try {
          await addDoc(collection(db, 'users', auth.currentUser.uid, 'chat_messages'), {
            id: assistantMessage.id,
            userId: auth.currentUser.uid,
            role: 'model',
            content: assistantMessage.content,
            model: res.model,
            timestamp: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Firestore assistant message save error:', e);
        }
      }
    } catch (err: any) {
      let rawMsg = err.message || 'Unable to reach Gemini Copilot.';
      try {
        if (typeof rawMsg === 'string' && rawMsg.trim().startsWith('{')) {
          const parsed = JSON.parse(rawMsg);
          if (parsed?.error?.message) {
            rawMsg = parsed.error.message;
          }
        }
      } catch {
        // use rawMsg
      }

      const errorMessage: Message = {
        id: `err_${Date.now()}`,
        role: 'model',
        content: rawMsg.includes('high demand') || rawMsg.includes('503')
          ? '⚠️ The AI model is experiencing a momentary spike in demand on Google servers. Please click below to retry or switch to "gemini-3.1-flash-lite (Fast)".'
          : `⚠️ ${rawMsg}`,
        timestamp: new Date(),
        model: selectedModel,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'model',
        content: 'Conversation history cleared. How can I assist with your Dhaka Tesla commute?',
        timestamp: new Date(),
        model: selectedModel,
      },
    ]);
  };

  const closeChat = () => {
    if (onClose) onClose();
    else setIsOpen(false);
  };

  return (
    <>
      {/* Floating Trigger Button (when closed) */}
      {!actualIsOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-4 py-3 rounded-full shadow-2xl shadow-emerald-500/30 flex items-center gap-2.5 transition-transform hover:scale-105 active:scale-95 group border border-emerald-300/40"
          title="Open Gemini Transit Copilot"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-slate-950" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-300 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-300 rounded-full" />
          </div>
          <span className="text-xs font-mono font-bold tracking-tight">AI Copilot</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-950/20 font-mono uppercase">
            Gemini
          </span>
        </button>
      )}

      {/* Main Chat Drawer / Modal */}
      {actualIsOpen && (
        <div
          className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[94vw] sm:w-[440px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
            isMinimized ? 'h-16' : 'h-[620px] max-h-[88vh]'
          }`}
        >
          {/* Header */}
          <div className="p-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white truncate">Tesla Transit Copilot</h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    LIVE
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">{selectedRole.name}</p>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={closeChat}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Close Copilot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Role & Model Selector Bar */}
              <div className="px-3.5 py-2 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                {/* Role Dropdown */}
                <div className="flex items-center gap-1 text-slate-300">
                  <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                  <select
                    value={selectedRole.id}
                    onChange={(e) => {
                      const r = ROLES.find((item) => item.id === e.target.value);
                      if (r) setSelectedRole(r);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    {ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model Selector (gemini-3.5-flash, gemini-3.1-flash-lite, gemini-3.1-pro-preview) */}
                <div className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-cyan-400 shrink-0" />
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  >
                    <option value="gemini-3.5-flash">gemini-3.5-flash (General)</option>
                    <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
                    <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex)</option>
                  </select>
                </div>
              </div>

              {/* Scrollable Messages Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 font-sans">
                {messages.map((m) => {
                  const isUser = m.role === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono px-1">
                        <span>{isUser ? currentUser?.name || 'You' : 'Transit Copilot'}</span>
                        <span>•</span>
                        <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {!isUser && m.model && (
                          <span className="text-cyan-400 text-[9px] bg-cyan-950/60 px-1 py-0.2 rounded border border-cyan-800/40">
                            {m.model}
                          </span>
                        )}
                      </div>

                      <div
                        className={`group relative max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                          isUser
                            ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none shadow-md shadow-emerald-500/10'
                            : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{m.content}</div>

                        {/* Copy Message Button */}
                        {!isUser && (
                          <button
                            onClick={() => handleCopy(m.id, m.content)}
                            className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-slate-800 border border-slate-700 rounded text-slate-300 hover:text-white transition-opacity text-[10px] flex items-center gap-0.5"
                            title="Copy reply"
                          >
                            {copiedId === m.id ? (
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-2.5 h-2.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex items-start space-y-1">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-3 text-xs text-slate-400 flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
                      <span className="font-mono text-[11px]">Computing route & fare telemetry...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="px-3 py-1.5 bg-slate-950/40 border-t border-slate-800/60 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
                <span className="text-[10px] text-slate-500 font-mono shrink-0">Quick Ask:</span>
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    disabled={loading}
                    className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full text-[10px] font-mono shrink-0 whitespace-nowrap transition-colors border border-slate-700/60"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={handleClearHistory}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors"
                  title="Clear chat thread"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask about Dhaka traffic, pooling or fare..."
                  disabled={loading}
                  className="flex-1 bg-slate-900 border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                />

                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className="p-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-600 font-bold rounded-xl transition-colors shrink-0 shadow-md shadow-emerald-500/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
