import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot, User, Loader2, ChevronDown } from 'lucide-react';
import api from '../../lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { label: '👥 Total Employees', prompt: 'How many total employees are there in the system?' },
  { label: '🏢 Department Summary', prompt: 'Give me a breakdown of employees by department.' },
  { label: '💰 Salary Overview', prompt: 'What is the average salary and salary distribution across departments?' },
  { label: '📋 Pending Leaves', prompt: 'Are there any pending leave requests? Show me the details.' },
  { label: '📊 Quick Stats', prompt: 'Give me a quick summary of all key HR metrics.' },
  { label: '🆕 Recent Hires', prompt: 'Who are the most recently joined employees?' },
];

function formatMessage(text: string): string {
  // Convert **bold** to <strong>
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Convert *italic* to <em>
  formatted = formatted.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  // Convert bullet points
  formatted = formatted.replace(/^[-•]\s+/gm, '• ');
  // Convert numbered lists
  formatted = formatted.replace(/^\d+\.\s+/gm, (match) => `<span class="text-blue-500 font-semibold">${match}</span>`);
  // Convert newlines to <br>
  formatted = formatted.replace(/\n/g, '<br/>');
  return formatted;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build history from previous messages (exclude the current one)
      const history = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.post<any>('/chat', {
        message: text.trim(),
        history,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: (res as any).reply || res.data?.reply || 'Sorry, I could not generate a response.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        id="chatbot-fab"
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-lg hover:shadow-xl group ${
          isOpen
            ? 'bg-white/60 backdrop-blur-xl border border-white/60 rotate-0'
            : 'bg-gradient-to-br from-blue-500 to-purple-600 border border-white/20 chatbot-fab-pulse'
        }`}
      >
        <div className={`transition-all duration-300 ${isOpen ? 'rotate-90 scale-100' : 'rotate-0 scale-100'}`}>
          {isOpen ? (
            <X className="w-6 h-6 text-gray-700" />
          ) : (
            <MessageCircle className="w-6 h-6 text-white" />
          )}
        </div>
        {!isOpen && messages.length === 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-90 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-white/50 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col h-[560px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-xl px-5 py-4 flex items-center gap-3 border-b border-white/10">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-sm tracking-wide">HR Assistant</h3>
              <p className="text-white/70 text-xs font-medium">Powered by Gemini AI</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
              <span className="text-white/70 text-xs font-medium">Live</span>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-3 chatbot-scrollbar"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fadeIn">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mb-4 border border-white/60 shadow-sm">
                  <Bot className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-gray-800 font-bold text-base mb-1">Hi there! 👋</h4>
                <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                  I'm your AI-powered HR assistant. Ask me anything about employees, leaves, payroll, or get quick insights.
                </p>
                <div className="w-full space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick Actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_PROMPTS.map((qp, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickPrompt(qp.prompt)}
                        className="bg-white/50 hover:bg-white/80 border border-white/60 rounded-xl px-3 py-2.5 text-xs font-medium text-gray-700 hover:text-blue-700 transition-all duration-200 text-left hover:shadow-sm hover:border-blue-200/50 active:scale-[0.97]"
                      >
                        {qp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 animate-slideUp ${
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-sm'
                    : 'bg-white/80 border border-white/60 shadow-sm'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-tr-md shadow-sm'
                    : 'bg-white/70 border border-white/60 text-gray-800 rounded-tl-md shadow-sm'
                }`}>
                  <div
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                    className="chatbot-message-content"
                  />
                  <p className={`text-[10px] mt-1.5 ${
                    msg.role === 'user' ? 'text-white/50' : 'text-gray-400'
                  }`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 animate-slideUp">
                <div className="w-7 h-7 rounded-xl bg-white/80 border border-white/60 shadow-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="bg-white/70 border border-white/60 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="chatbot-typing-dot" />
                    <div className="chatbot-typing-dot" style={{ animationDelay: '0.2s' }} />
                    <div className="chatbot-typing-dot" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom button */}
          {showScrollBtn && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-[76px] left-1/2 -translate-x-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm border border-white/60 rounded-full shadow-md flex items-center justify-center hover:bg-white transition-all z-10"
            >
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
          )}

          {/* Quick prompts bar (when conversation has started) */}
          {messages.length > 0 && !isLoading && (
            <div className="px-3 py-2 border-t border-white/30 bg-white/20 overflow-x-auto flex gap-1.5 chatbot-scrollbar-x">
              {QUICK_PROMPTS.slice(0, 4).map((qp, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickPrompt(qp.prompt)}
                  className="whitespace-nowrap bg-white/40 hover:bg-white/70 border border-white/50 rounded-full px-3 py-1 text-[11px] font-medium text-gray-600 hover:text-blue-700 transition-all flex-shrink-0 active:scale-95"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-white/30 bg-white/30 backdrop-blur-sm">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about employees, leaves, payroll..."
                disabled={isLoading}
                className="flex-1 bg-white/50 border border-white/60 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white/70 focus:border-blue-300 focus:ring-2 focus:ring-blue-300/20 outline-none transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-sm hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-90 hover:scale-[1.05]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
