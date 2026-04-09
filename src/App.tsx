/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  MessageSquare, 
  Menu, 
  X, 
  User as UserIcon, 
  LogOut, 
  Settings, 
  ChevronRight,
  SendHorizontal,
  Bot,
  LogIn,
  Trash2
} from 'lucide-react';
import { cn } from './lib/utils';
import { auth, signIn, logOut, onAuthStateChanged, User } from './lib/firebase';
import { useChat } from './hooks/useChat';
import { ChatMessage } from './components/ChatMessage';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { 
    conversations, 
    currentConversationId, 
    setCurrentConversationId, 
    messages, 
    sendMessage, 
    isLoading,
    isStreaming,
    createNewConversation 
  } = useChat(user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const content = inputValue;
    setInputValue('');
    await sendMessage(content);
  };

  if (isAuthLoading) {
    return (
      <div className="h-screen w-full bg-[#212121] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full bg-[#212121] flex flex-col items-center justify-center p-4 text-white">
        <div className="w-16 h-16 rounded-full border border-[#2f2f2f] flex items-center justify-center mb-6">
          <Bot className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Welcome to Gemini Chat</h1>
        <p className="text-[#676767] mb-8 text-center max-w-md">
          Log in with your Google account to start chatting and save your history.
        </p>
        <button 
          onClick={signIn}
          className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#d7d7d7] transition-colors"
        >
          <LogIn className="w-5 h-5" />
          Continue with Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#212121] text-white overflow-hidden font-sans">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isSidebarOpen ? (isMobile ? '280px' : '260px') : '0px',
          x: isMobile && !isSidebarOpen ? -280 : 0
        }}
        className={cn(
          "bg-[#171717] h-full flex flex-col z-50 overflow-hidden shrink-0",
          isMobile && "fixed left-0 top-0"
        )}
      >
        <div className="p-3 flex flex-col h-full">
          <button 
            onClick={() => {
              createNewConversation();
              if (isMobile) setIsSidebarOpen(false);
            }}
            className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-[#2f2f2f] transition-colors mb-2 group"
          >
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
              <Plus className="w-5 h-5 text-black" />
            </div>
            <span className="font-medium text-sm">New chat</span>
          </button>

          <div className="flex-1 overflow-y-auto space-y-1 py-2 custom-scrollbar">
            <div className="px-3 py-2 text-xs font-semibold text-[#676767] uppercase tracking-wider">
              Recent
            </div>
            {conversations.map((conv) => (
              <div key={conv.id} className="group relative">
                <button 
                  onClick={() => {
                    setCurrentConversationId(conv.id);
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full p-3 rounded-lg transition-colors text-sm truncate pr-10",
                    currentConversationId === conv.id ? "bg-[#2f2f2f] text-white" : "hover:bg-[#2f2f2f] text-[#ececec]"
                  )}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="truncate flex-1 text-left">{conv.title}</span>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this conversation?')) {
                      // @ts-ignore
                      removeConversation(conv.id);
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-[#3f3f3f] opacity-0 group-hover:opacity-100 transition-opacity text-[#676767] hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#2f2f2f]">
            <button 
              onClick={logOut}
              className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-[#2f2f2f] transition-colors text-sm text-red-400"
            >
              <LogOut className="w-5 h-5" />
              <span>Log out</span>
            </button>
            <div className="flex items-center gap-3 w-full p-3 rounded-lg text-sm">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-[10px] font-bold">
                  {user.displayName?.charAt(0) || user.email?.charAt(0)}
                </div>
              )}
              <span className="truncate">{user.displayName || user.email}</span>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-[#212121]">
        {/* Header */}
        <header className="h-14 flex items-center px-4 justify-between md:justify-start gap-4">
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-[#2f2f2f] rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2 font-semibold text-lg">
            <span>ChatGPT</span>
            <span className="text-[#676767]">Gemini</span>
          </div>
          <div className="flex-1" />
          <button 
            onClick={() => createNewConversation()}
            className="p-2 hover:bg-[#2f2f2f] rounded-lg transition-colors md:hidden"
          >
            <Plus className="w-5 h-5" />
          </button>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
                <div className="w-12 h-12 rounded-full border border-[#2f2f2f] flex items-center justify-center mb-2">
                  <Bot className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-semibold">How can I help you today?</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mt-8">
                  {[
                    'Write a thank you note', 
                    'Plan a trip to Japan', 
                    'Explain quantum physics', 
                    'Help me debug React'
                  ].map((text) => (
                    <button 
                      key={text} 
                      onClick={() => {
                        setInputValue(text);
                        // We don't auto-send to let user edit if they want, 
                        // but ChatGPT usually sends immediately on these.
                        // For better UX, let's send immediately.
                        sendMessage(text);
                      }}
                      className="p-4 rounded-xl border border-[#2f2f2f] hover:bg-[#2f2f2f] text-left text-sm transition-all group relative"
                    >
                      <span className="text-[#ececec]">{text}</span>
                      <ChevronRight className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                {isLoading && !isStreaming && (
                  <div className="flex gap-4 md:gap-6 animate-pulse">
                    <div className="w-8 h-8 rounded-full border border-[#2f2f2f] bg-[#212121] flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-5 h-5 text-[#676767]" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#2f2f2f] rounded w-1/4"></div>
                      <div className="h-4 bg-[#2f2f2f] rounded w-3/4"></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:pb-8">
          <div className="max-w-3xl mx-auto relative">
            <div className="relative flex items-end w-full bg-[#2f2f2f] rounded-2xl p-2 pl-4 shadow-xl border border-[#3f3f3f]">
              <textarea
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message ChatGPT"
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 max-h-52 text-sm md:text-base text-white placeholder-[#676767]"
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
              <button 
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="p-2 bg-white text-black rounded-xl hover:bg-[#d7d7d7] transition-colors disabled:opacity-50 disabled:hover:bg-white ml-2 shrink-0"
              >
                <SendHorizontal className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[10px] md:text-xs text-[#676767] text-center mt-3">
              ChatGPT can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f3f;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4f4f4f;
        }
        textarea:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
}


