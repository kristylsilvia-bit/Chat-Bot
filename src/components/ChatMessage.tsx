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
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.attachments.map((att, i) => (
              <div key={i} className="relative group">
                {att.type === 'image' ? (
                  <img 
                    src={att.url} 
                    alt={att.name || 'Attachment'} 
                    className="max-w-sm max-h-96 rounded-lg border border-[#2f2f2f] object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-[#2f2f2f] bg-[#2f2f2f]/50 text-xs">
                    <div className="w-8 h-8 rounded bg-[#3f3f3f] flex items-center justify-center">
                      <Bot className="w-4 h-4 text-[#676767]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium truncate max-w-[150px]">{att.name}</span>
                      <span className="text-[#676767] uppercase">{att.mimeType?.split('/')[1]}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
