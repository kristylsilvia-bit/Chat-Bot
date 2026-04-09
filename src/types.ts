export type ModelId = 
  | 'gemini-3-flash-preview' 
  | 'gemini-3.1-pro-preview' 
  | 'gemini-2.5-flash-image' 
  | 'gemini-3.1-flash-image-preview'
  | 'gemini-2.5-flash-preview-tts';

export interface ModelMetadata {
  id: ModelId;
  displayName: string;
  description: string;
  supportsTools: boolean;
  supportsImages: boolean;
  supportsVoice: boolean;
  supportsFileAnalysis: boolean;
  supportsResearch: boolean;
}

export interface Attachment {
  type: 'image' | 'file' | 'audio' | 'video' | 'pdf' | 'csv' | 'doc' | 'code';
  url: string;
  name: string;
  mimeType: string;
  size?: number;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source?: string;
}

export interface CodeExecutionResult {
  code: string;
  output: string;
  error?: string;
  artifacts?: {
    name: string;
    url: string;
    type: 'image' | 'file';
  }[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  thinking?: string;
  searchResults?: SearchResult[];
  codeExecution?: CodeExecutionResult;
  modelId?: ModelId;
  status?: 'streaming' | 'finalized' | 'error';
  isEdited?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  userId: string;
  projectId?: string;
  createdAt: number;
  updatedAt: number;
  modelId?: ModelId;
  summary?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  files?: Attachment[];
  instructions?: string;
}

export interface UserMemory {
  id: string;
  userId: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}
