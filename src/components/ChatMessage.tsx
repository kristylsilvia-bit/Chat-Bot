import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={cn(
      "flex gap-4 md:gap-6",
      isAssistant ? "bg-transparent" : "bg-transparent"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
        isAssistant ? "border border-[#2f2f2f] bg-[#212121]" : "bg-[#2f2f2f]"
      )}>
        {isAssistant ? (
          <Bot className="w-5 h-5 text-[#ececec]" />
        ) : (
          <User className="w-5 h-5 text-[#ececec]" />
        )}
      </div>
      
      <div className="flex-1 min-w-0 space-y-2">
        <div className="font-semibold text-sm text-[#ececec]">
          {isAssistant ? 'ChatGPT' : 'You'}
        </div>
        <div className="prose prose-invert max-w-none text-[#ececec] text-sm md:text-base leading-relaxed">
          <ReactMarkdown>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
