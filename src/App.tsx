/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  Bot, 
  ChevronRight,
  LayoutDashboard,
  PanelRight,
  History,
  Search,
  X
} from 'lucide-react';
import { cn } from './lib/utils';
import { auth, signIn, logOut, onAuthStateChanged, User } from './lib/firebase';
import { useChat } from './hooks/useChat';
import { ChatMessage } from './components/ChatMessage';
import { AuthForm } from './components/AuthForm';
import { Sidebar } from './components/Sidebar';
import { Composer } from './components/Composer';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { 
    conversations, 
    currentConversationId, 
    setCurrentConversationId, 
    messages, 
    projects,
    currentProjectId,
    setCurrentProjectId,
    memory,
    sendMessage, 
    isLoading,
    isStreaming,
    useThinking,
    setUseThinking,
    selectedModelId,
    setSelectedModelId,
    useSearch,
    setUseSearch,
    useCodeExecution,
    setUseCodeExecution,
    stopGeneration,
    regenerateMessage,
    editMessage,
    createNewConversation,
    removeConversation
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

  if (isAuthLoading) {
    return (
      <div className="h-screen w-full bg-[#212121] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onGoogleSignIn={signIn} />;
  }

  return (
    <TooltipProvider>
      <div 
        className="flex h-screen w-full bg-chat-bg text-white overflow-hidden font-sans"
        data-theme={currentTheme}
      >
        <Toaster position="top-center" />

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

        <Sidebar 
          user={user}
          conversations={conversations}
          currentConversationId={currentConversationId}
          setCurrentConversationId={setCurrentConversationId}
          projects={projects}
          currentProjectId={currentProjectId}
          setCurrentProjectId={setCurrentProjectId}
          memory={memory}
          onNewChat={createNewConversation}
          onRemoveConversation={removeConversation}
          onLogOut={logOut}
          currentTheme={currentTheme}
          onThemeChange={setCurrentTheme}
          isMobile={isMobile}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative min-w-0 bg-chat-bg">
          {/* Header */}
          <header className="h-14 flex items-center px-4 justify-between border-b border-border-color">
            <div className="flex items-center gap-2">
              {!isSidebarOpen && (
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 hover:bg-input-bg rounded-lg transition-colors"
                >
                  <History className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center gap-2 font-semibold text-lg ml-2">
                <Bot className="w-6 h-6 text-accent-color" />
                <span>ChatGPT</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCanvasOpen(!isCanvasOpen)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isCanvasOpen ? "bg-accent-color/20 text-accent-color" : "hover:bg-input-bg text-[#676767]"
                )}
                title="Toggle Canvas"
              >
                <PanelRight className="w-5 h-5" />
              </button>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            {/* Chat Area */}
            <div className={cn(
              "flex-1 flex flex-col min-w-0 transition-all duration-300",
              isCanvasOpen && "border-r border-border-color"
            )}>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
                      <div className="w-12 h-12 rounded-full border border-border-color flex items-center justify-center mb-2">
                        <Bot className="w-6 h-6 text-accent-color" />
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
                            onClick={() => sendMessage(text)}
                            className="p-4 rounded-xl border border-border-color hover:bg-input-bg text-left text-sm transition-all group relative"
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
                        <ChatMessage 
                          key={msg.id} 
                          message={msg} 
                          onRegenerate={regenerateMessage}
                          onEdit={editMessage}
                        />
                      ))}
                      {isLoading && !isStreaming && (
                        <div className="flex gap-4 md:gap-6 animate-pulse">
                          <div className="w-8 h-8 rounded-full border border-border-color bg-sidebar-bg flex items-center justify-center shrink-0 mt-1">
                            <Bot className="w-5 h-5 text-[#676767]" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-input-bg rounded w-1/4"></div>
                            <div className="h-4 bg-input-bg rounded w-3/4"></div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </div>

              {/* Composer */}
              <Composer 
                onSend={sendMessage}
                isLoading={isLoading}
                isStreaming={isStreaming}
                onStop={stopGeneration}
                selectedModelId={selectedModelId}
                onModelChange={setSelectedModelId}
                useSearch={useSearch}
                onSearchChange={setUseSearch}
                useCodeExecution={useCodeExecution}
                onCodeChange={setUseCodeExecution}
                useThinking={useThinking}
                onThinkingChange={setUseThinking}
              />
            </div>

            {/* Canvas Area */}
            <AnimatePresence>
              {isCanvasOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: isMobile ? '100%' : '40%', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className={cn(
                    "bg-sidebar-bg flex flex-col shrink-0 overflow-hidden",
                    isMobile && "fixed inset-0 z-[70]"
                  )}
                >
                  <div className="h-14 flex items-center px-4 justify-between border-b border-border-color">
                    <div className="flex items-center gap-2 font-medium text-sm">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Canvas</span>
                    </div>
                    <button onClick={() => setIsCanvasOpen(false)} className="p-2 hover:bg-input-bg rounded-lg">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 flex items-center justify-center text-[#676767] text-sm p-8 text-center">
                    <div>
                      <Bot className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>The Canvas is a shared work surface for documents, code, and more.</p>
                      <p className="mt-2 text-xs">Ask me to write code or a document to see it here.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
        `}</style>
      </div>
    </TooltipProvider>
  );
}


