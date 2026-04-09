import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Palette, 
  LogOut, 
  FolderPlus, 
  Brain,
  ChevronRight,
  Search,
  Settings
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Conversation, Project, UserMemory } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  user: User;
  conversations: Conversation[];
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
  projects: Project[];
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  memory: UserMemory[];
  onNewChat: () => void;
  onRemoveConversation: (id: string) => void;
  onLogOut: () => void;
  currentTheme: string;
  onThemeChange: (theme: string) => void;
  isMobile: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const THEMES = [
  { id: 'default', name: 'Dark', color: '#212121' },
  { id: 'midnight', name: 'Midnight', color: '#0f172a' },
  { id: 'emerald', name: 'Emerald', color: '#064e3b' },
  { id: 'sunset', name: 'Sunset', color: '#451a03' },
];

export function Sidebar({
  user,
  conversations,
  currentConversationId,
  setCurrentConversationId,
  projects,
  currentProjectId,
  setCurrentProjectId,
  memory,
  onNewChat,
  onRemoveConversation,
  onLogOut,
  currentTheme,
  onThemeChange,
  isMobile,
  isOpen,
  setIsOpen
}: SidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: isOpen ? (isMobile ? '280px' : '260px') : '0px',
        x: isMobile && !isOpen ? -280 : 0
      }}
      className={cn(
        "bg-sidebar-bg h-full flex flex-col z-50 overflow-hidden shrink-0 border-r border-border-color",
        isMobile && "fixed left-0 top-0"
      )}
    >
      <div className="p-3 flex flex-col h-full">
        <Button 
          variant="ghost"
          onClick={() => {
            onNewChat();
            if (isMobile) setIsOpen(false);
          }}
          className="flex items-center justify-start gap-3 w-full p-3 h-auto rounded-lg hover:bg-input-bg transition-colors mb-2 group"
        >
          <div className="w-7 h-7 rounded-full bg-accent-color flex items-center justify-center">
            <Plus className="w-5 h-5 text-chat-bg" />
          </div>
          <span className="font-medium text-sm">New chat</span>
        </Button>

        <ScrollArea className="flex-1 -mx-3 px-3">
          <div className="space-y-6 py-2">
            {/* Projects Section */}
            <div>
              <div className="px-3 py-2 flex items-center justify-between text-xs font-semibold text-[#676767] uppercase tracking-wider">
                <span>Projects</span>
                <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-input-bg">
                  <FolderPlus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setCurrentProjectId(null)}
                  className={cn(
                    "flex items-center gap-3 w-full p-2 rounded-lg transition-colors text-sm",
                    currentProjectId === null ? "bg-input-bg text-white" : "hover:bg-input-bg text-[#ececec]"
                  )}
                >
                  <Search className="w-4 h-4 shrink-0" />
                  <span className="truncate flex-1 text-left">All Chats</span>
                </button>
                {projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => setCurrentProjectId(project.id)}
                    className={cn(
                      "flex items-center gap-3 w-full p-2 rounded-lg transition-colors text-sm",
                      currentProjectId === project.id ? "bg-input-bg text-white" : "hover:bg-input-bg text-[#ececec]"
                    )}
                  >
                    <div className="w-4 h-4 rounded bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400">
                      {project.name.charAt(0)}
                    </div>
                    <span className="truncate flex-1 text-left">{project.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* History Section */}
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-[#676767] uppercase tracking-wider">
                History
              </div>
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div key={conv.id} className="group relative">
                    <button 
                      onClick={() => {
                        setCurrentConversationId(conv.id);
                        if (isMobile) setIsOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 w-full p-2 rounded-lg transition-colors text-sm truncate pr-10",
                        currentConversationId === conv.id ? "bg-input-bg text-white" : "hover:bg-input-bg text-[#ececec]"
                      )}
                    >
                      <MessageSquare className="w-4 h-4 shrink-0" />
                      <span className="truncate flex-1 text-left">{conv.title}</span>
                    </button>
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveConversation(conv.id);
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-[#676767] hover:text-red-400 hover:bg-transparent"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Memory Section */}
            <div>
              <div className="px-3 py-2 flex items-center justify-between text-xs font-semibold text-[#676767] uppercase tracking-wider">
                <span>Memory</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1 border-accent-color/50 text-accent-color">
                  {memory.length}
                </Badge>
              </div>
              <div className="px-3 text-[11px] text-[#676767] italic">
                {memory.length > 0 ? `${memory.length} facts remembered` : 'No memories yet'}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="pt-2 border-t border-border-color space-y-1">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button render={<div />} variant="ghost" className="w-full justify-start gap-3 p-3 h-auto hover:bg-input-bg">
                <Palette className="w-5 h-5 text-[#ececec]" />
                <span className="text-sm text-[#ececec]">Theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-input-bg border-border-color">
              {THEMES.map(t => (
                <DropdownMenuItem 
                  key={t.id} 
                  onClick={() => onThemeChange(t.id)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color }} />
                  <span>{t.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button render={<div />} variant="ghost" className="w-full justify-start gap-3 p-3 h-auto hover:bg-input-bg">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-[10px] font-bold">
                    {user.displayName?.charAt(0) || user.email?.charAt(0)}
                  </div>
                )}
                <span className="truncate text-sm text-[#ececec]">{user.displayName || user.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-input-bg border-border-color">
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <Brain className="w-4 h-4" />
                <span>Manage Memory</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border-color" />
              <DropdownMenuItem 
                onClick={onLogOut}
                className="flex items-center gap-2 cursor-pointer text-red-400 focus:text-red-400"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.aside>
  );
}
