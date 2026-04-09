import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Copy, Check, RotateCcw, Pencil, Share2, ChevronDown, ChevronUp, Search, Code, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { Message } from '../types';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ChatMessageProps {
  message: Message;
  onRegenerate?: (id: string) => void;
  onEdit?: (id: string, content: string) => void;
}

export function ChatMessage({ message, onRegenerate, onEdit }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleEditSubmit = () => {
    if (onEdit && editValue !== message.content) {
      onEdit(message.id, editValue);
    }
    setIsEditing(false);
  };

  return (
    <div className={cn(
      "flex gap-4 md:gap-6 group/message",
      isAssistant ? "bg-transparent" : "bg-transparent"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
        isAssistant ? "border border-border-color bg-sidebar-bg" : "bg-input-bg"
      )}>
        {isAssistant ? (
          <Bot className="w-5 h-5 text-[#ececec]" />
        ) : (
          <User className="w-5 h-5 text-[#ececec]" />
        )}
      </div>
      
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-sm text-[#ececec]">
            {isAssistant ? 'ChatGPT' : 'You'}
            {message.isEdited && <span className="ml-2 text-[10px] text-[#676767] font-normal">(edited)</span>}
          </div>
        </div>

        {/* Thinking Block */}
        {message.thinking && (
          <Collapsible
            open={isThinkingOpen}
            onOpenChange={setIsThinkingOpen}
            className="bg-input-bg/30 border border-border-color rounded-lg overflow-hidden"
          >
            <CollapsibleTrigger>
              <Button render={<div />} variant="ghost" size="sm" className="w-full justify-start gap-2 h-8 text-[11px] text-[#676767] hover:bg-input-bg/50">
                {isThinkingOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                <span>Thought for {message.thinking.length > 100 ? 'a few seconds' : 'a moment'}</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 py-2 text-xs text-[#676767] italic border-t border-border-color/50 whitespace-pre-wrap">
              {message.thinking}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Search Results */}
        {message.searchResults && message.searchResults.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.searchResults.map((result, i) => (
              <a 
                key={i} 
                href={result.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-colors max-w-[200px]"
              >
                <Search className="w-3 h-3 text-blue-400 shrink-0" />
                <span className="text-[10px] text-blue-300 truncate">{result.title}</span>
              </a>
            ))}
          </div>
        )}

        {/* Content */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full bg-input-bg border border-accent-color rounded-lg p-3 text-sm focus:outline-none min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleEditSubmit}>Save & Submit</Button>
            </div>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none text-[#ececec] text-sm md:text-base leading-relaxed">
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Code Execution */}
        {message.codeExecution && (
          <div className="bg-sidebar-bg border border-border-color rounded-lg overflow-hidden mt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-input-bg/50 border-b border-border-color text-[10px] font-mono text-[#676767]">
              <Code className="w-3 h-3" />
              <span>Python Output</span>
            </div>
            <pre className="p-3 text-xs font-mono text-green-400 overflow-x-auto">
              {message.codeExecution.output}
            </pre>
          </div>
        )}
        
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.attachments.map((att, i) => (
              <div key={i} className="relative group">
                {att.type === 'image' ? (
                  <img 
                    src={att.url} 
                    alt={att.name || 'Attachment'} 
                    className="max-w-sm max-h-96 rounded-lg border border-border-color object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-border-color bg-input-bg/50 text-xs">
                    <div className="w-8 h-8 rounded bg-input-bg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-[#676767]" />
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

        {/* Actions */}
        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover/message:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={copyToClipboard}
            className="h-7 w-7 text-[#676767] hover:text-[#ececec] hover:bg-input-bg"
            title="Copy"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
          
          {!isAssistant && onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
              className="h-7 w-7 text-[#676767] hover:text-[#ececec] hover:bg-input-bg"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}

          {isAssistant && onRegenerate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRegenerate(message.id)}
              className="h-7 w-7 text-[#676767] hover:text-[#ececec] hover:bg-input-bg"
              title="Regenerate"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#676767] hover:text-[#ececec] hover:bg-input-bg"
            title="Share"
          >
            <Share2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
