export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: {
    type: 'image' | 'file';
    url: string;
    name?: string;
    mimeType?: string;
  }[];
}

export interface Conversation {
  id: string;
  title: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
}
