import { useState, useRef, useEffect } from 'react';
import { 
  Paperclip, 
  Mic, 
  MicOff, 
  SendHorizontal, 
  X, 
  Image as ImageIcon, 
  FileText,
  Search,
  Code,
  Sparkles,
  Square,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { ModelId, ModelMetadata } from '../types';
import { MODELS } from '../hooks/useChat';

interface ComposerProps {
  onSend: (content: string, files: File[]) => void;
  isLoading: boolean;
  isStreaming: boolean;
  onStop: () => void;
  selectedModelId: ModelId;
  onModelChange: (id: ModelId) => void;
  useSearch: boolean;
  onSearchChange: (use: boolean) => void;
  useCodeExecution: boolean;
  onCodeChange: (use: boolean) => void;
  useThinking: boolean;
  onThinkingChange: (use: boolean) => void;
}

export function Composer({
  onSend,
  isLoading,
  isStreaming,
  onStop,
  selectedModelId,
  onModelChange,
  useSearch,
  onSearchChange,
  useCodeExecution,
  onCodeChange,
  useThinking,
  onThinkingChange
}: ComposerProps) {
  const [inputValue, setInputValue] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedModel = MODELS.find(m => m.id === selectedModelId) || MODELS[0];

  const handleSend = () => {
    if ((!inputValue.trim() && selectedFiles.length === 0) || isLoading) return;
    onSend(inputValue, selectedFiles);
    setInputValue('');
    setSelectedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(prev => prev + (prev ? ' ' : '') + transcript);
    };

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  return (
    <div className="p-4 md:pb-8">
      <div className="max-w-3xl mx-auto space-y-3">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button render={<div />} nativeButton={false} variant="ghost" size="sm" className="h-8 gap-2 hover:bg-input-bg">
                  <Sparkles className="w-4 h-4 text-accent-color" />
                  <span className="text-xs font-medium">{selectedModel.displayName}</span>
                  <ChevronDown className="w-3 h-3 text-[#676767]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-input-bg border-border-color">
                <DropdownMenuLabel className="text-[10px] text-[#676767] uppercase">Select Model</DropdownMenuLabel>
                {MODELS.map(model => (
                  <DropdownMenuItem 
                    key={model.id} 
                    onClick={() => onModelChange(model.id)}
                    className="flex flex-col items-start gap-0.5 cursor-pointer py-2"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium text-sm">{model.displayName}</span>
                      {selectedModelId === model.id && <Badge className="ml-auto h-4 text-[10px]">Active</Badge>}
                    </div>
                    <span className="text-[10px] text-[#676767]">{model.description}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-4 bg-border-color" />

            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onSearchChange(!useSearch)}
                className={cn("h-8 gap-1.5 px-2 hover:bg-input-bg", useSearch && "text-blue-400 bg-blue-500/10")}
              >
                <Search className="w-3.5 h-3.5" />
                <span className="text-[10px]">Search</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onCodeChange(!useCodeExecution)}
                className={cn("h-8 gap-1.5 px-2 hover:bg-input-bg", useCodeExecution && "text-green-400 bg-green-500/10")}
              >
                <Code className="w-3.5 h-3.5" />
                <span className="text-[10px]">Code</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onThinkingChange(!useThinking)}
                className={cn("h-8 gap-1.5 px-2 hover:bg-input-bg", useThinking && "text-purple-400 bg-purple-500/10")}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[10px]">Reasoning</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Input Container */}
        <div className="relative flex flex-col w-full bg-[#2f2f2f] rounded-2xl shadow-xl border border-[#3f3f3f] overflow-hidden">
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 pb-0">
              {selectedFiles.map((file, i) => (
                <div key={i} className="relative group bg-[#3f3f3f] border border-[#4f4f4f] rounded-lg p-2 flex items-center gap-2">
                  {file.type.startsWith('image/') ? (
                    <ImageIcon className="w-4 h-4 text-purple-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-400" />
                  )}
                  <span className="text-xs truncate max-w-[120px]">{file.name}</span>
                  <button 
                    onClick={() => removeFile(i)}
                    className="p-0.5 hover:bg-[#4f4f4f] rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end p-2 pl-4">
            <div className="flex items-center gap-1 pb-1.5 pr-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-[#3f3f3f] rounded-lg transition-colors text-[#676767] hover:text-[#ececec]"
                title="Upload file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                multiple 
              />
              <button 
                onClick={handleVoiceInput}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isListening ? "bg-red-500/20 text-red-400" : "hover:bg-[#3f3f3f] text-[#676767] hover:text-[#ececec]"
                )}
                title="Voice input"
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>

            <Textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Message ${selectedModel.displayName}`}
              className="flex-1 bg-transparent border-none focus-visible:ring-0 resize-none py-2 max-h-52 text-sm md:text-base text-white placeholder-[#676767] min-h-[44px]"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
            />

            <div className="pb-1.5 pl-2">
              {isStreaming ? (
                <Button 
                  size="icon"
                  variant="ghost"
                  onClick={onStop}
                  className="h-8 w-8 rounded-lg bg-white text-black hover:bg-[#d7d7d7]"
                >
                  <Square className="w-4 h-4 fill-current" />
                </Button>
              ) : (
                <Button 
                  size="icon"
                  disabled={(!inputValue.trim() && selectedFiles.length === 0) || isLoading}
                  onClick={handleSend}
                  className="h-8 w-8 rounded-lg bg-white text-black hover:bg-[#d7d7d7] disabled:opacity-50"
                >
                  <SendHorizontal className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        <p className="text-[10px] text-[#676767] text-center">
          ChatGPT can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
