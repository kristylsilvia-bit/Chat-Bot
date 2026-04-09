import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc, 
  updateDoc,
  getDocs,
  where,
  limit,
  deleteDoc,
  FirestoreError
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { ai, CHAT_MODEL, PRO_MODEL } from '../lib/gemini';
import { Message, Conversation, ModelId, ModelMetadata, Project, UserMemory, Attachment } from '../types';
import { User } from 'firebase/auth';
import { ThinkingLevel, Type } from '@google/genai';
import { useRef } from 'react';

export const MODELS: ModelMetadata[] = [
  {
    id: 'gemini-3-flash-preview',
    displayName: 'Gemini 3 Flash',
    description: 'Fast and efficient for general chat.',
    supportsTools: true,
    supportsImages: true,
    supportsVoice: true,
    supportsFileAnalysis: true,
    supportsResearch: false
  },
  {
    id: 'gemini-3.1-pro-preview',
    displayName: 'Gemini 3.1 Pro',
    description: 'Advanced reasoning and complex tasks.',
    supportsTools: true,
    supportsImages: true,
    supportsVoice: true,
    supportsFileAnalysis: true,
    supportsResearch: true
  },
  {
    id: 'gemini-2.5-flash-image',
    displayName: 'Gemini Image',
    description: 'Optimized for image generation.',
    supportsTools: false,
    supportsImages: true,
    supportsVoice: false,
    supportsFileAnalysis: false,
    supportsResearch: false
  }
];

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    providerInfo: any[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We don't necessarily want to crash the whole app, but we should log it clearly
}

export function useChat(user: User | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [memory, setMemory] = useState<UserMemory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<ModelId>('gemini-3-flash-preview');
  const [useSearch, setUseSearch] = useState(false);
  const [useCodeExecution, setUseCodeExecution] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load projects
  useEffect(() => {
    if (!user) {
      setProjects([]);
      return;
    }

    const q = query(
      collection(db, 'projects'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Project[];
      setProjects(projs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    return () => unsubscribe();
  }, [user]);

  // Load memory
  useEffect(() => {
    if (!user) {
      setMemory([]);
      return;
    }

    const q = query(
      collection(db, 'memory'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mems = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as UserMemory[];
      setMemory(mems);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'memory');
    });

    return () => unsubscribe();
  }, [user]);

  // Load conversations
  useEffect(() => {
    if (!user) {
      setConversations([]);
      return;
    }

    const q = query(
      collection(db, 'conversations'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Conversation[];
      setConversations(convs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'conversations');
    });

    return () => unsubscribe();
  }, [user]);

  // Load messages for current conversation
  useEffect(() => {
    if (!currentConversationId || !user) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'conversations', currentConversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Message[];
      setMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `conversations/${currentConversationId}/messages`);
    });

    return () => unsubscribe();
  }, [currentConversationId, user]);

  const createNewConversation = async (firstMessage: string) => {
    if (!user) return null;

    const convId = doc(collection(db, 'conversations')).id;
    const now = Date.now();
    
    const newConv: Conversation = {
      id: convId,
      title: firstMessage.slice(0, 40) + (firstMessage.length > 40 ? '...' : ''),
      userId: user.uid,
      projectId: currentProjectId || undefined,
      createdAt: now,
      updatedAt: now,
      modelId: selectedModelId
    };

    try {
      await setDoc(doc(db, 'conversations', convId), newConv);
      setCurrentConversationId(convId);
      return convId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `conversations/${convId}`);
      return null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string, attachments?: File[]) => {
    if (!user || (!content.trim() && (!attachments || attachments.length === 0))) return;

    stopGeneration();
    abortControllerRef.current = new AbortController();

    let convId = currentConversationId;
    if (!convId) {
      convId = await createNewConversation(content || 'New Chat');
    }

    if (!convId) return;

    // Process attachments
    const processedAttachments: Attachment[] = [];
    if (attachments) {
      for (const file of attachments) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const base64 = await base64Promise;
        processedAttachments.push({
          type: file.type.startsWith('image/') ? 'image' : 
                file.type === 'application/pdf' ? 'pdf' :
                file.type === 'text/csv' ? 'csv' : 'file',
          url: base64,
          name: file.name,
          mimeType: file.type,
          size: file.size
        });
      }
    }

    const userMessage: Message = {
      id: doc(collection(db, 'conversations', convId, 'messages')).id,
      role: 'user',
      content,
      timestamp: Date.now(),
      attachments: processedAttachments,
      modelId: selectedModelId
    };

    // Save user message
    try {
      await setDoc(doc(db, 'conversations', convId, 'messages', userMessage.id), userMessage);
      await updateDoc(doc(db, 'conversations', convId), { updatedAt: Date.now() });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `conversations/${convId}/messages/${userMessage.id}`);
    }

    setIsLoading(true);
    setIsStreaming(true);

    try {
      // Improved image generation detection
      const isImageRequest = selectedModelId === 'gemini-2.5-flash-image' || 
        /(generate|create|draw|make|show|give).*(image|photo|picture|drawing|illustration|portrait)/i.test(content);
      
      if (isImageRequest && !useThinking) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [{ text: content }]
            }
          });

          const assistantMessageId = doc(collection(db, 'conversations', convId, 'messages')).id;
          let assistantContent = '';
          const assistantAttachments: Attachment[] = [];

          if (response.candidates && response.candidates[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                assistantAttachments.push({
                  type: 'image',
                  url: `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`,
                  name: 'generated-image.png',
                  mimeType: part.inlineData.mimeType || 'image/png'
                });
              } else if (part.text) {
                assistantContent += part.text;
              }
            }
          }

          const assistantMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: assistantContent || 'Here is the image you requested:',
            timestamp: Date.now(),
            attachments: assistantAttachments,
            modelId: 'gemini-2.5-flash-image',
            status: 'finalized'
          };

          await setDoc(doc(db, 'conversations', convId, 'messages', assistantMessageId), assistantMessage);
          setIsLoading(false);
          setIsStreaming(false);
          return;
        } catch (imgError: any) {
          console.error('Image generation error:', imgError);
          // Handle error...
        }
      }

      // Prepare history for Gemini
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [
          { text: m.content },
          ...(m.attachments?.map(a => ({
            inlineData: {
              data: a.url.split(',')[1],
              mimeType: a.mimeType || 'image/jpeg'
            }
          })) || [])
        ]
      }));

      // Add current message to history
      history.push({ role: 'user', parts: [{ text: content }] });

      const modelToUse = useThinking ? PRO_MODEL : selectedModelId;
      
      const chat = ai.chats.create({
        model: modelToUse,
        history: history.slice(0, -1),
        config: {
          systemInstruction: `You are a helpful AI assistant. 
          User Facts: ${memory.map(m => m.content).join(', ')}
          Current Project: ${projects.find(p => p.id === currentProjectId)?.name || 'None'}
          ${projects.find(p => p.id === currentProjectId)?.instructions || ''}`,
          tools: [
            ...(useSearch ? [{ googleSearch: {} }] : []),
            ...(useCodeExecution ? [{ codeExecution: {} }] : [])
          ],
          ...(useThinking ? {
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.HIGH
            }
          } : {})
        }
      });

      const result = await chat.sendMessageStream({
        message: [
          { text: content },
          ...(processedAttachments.map(a => ({
            inlineData: {
              data: a.url.split(',')[1],
              mimeType: a.mimeType || 'image/jpeg'
            }
          })))
        ]
      });

      const assistantMessageId = doc(collection(db, 'conversations', convId, 'messages')).id;
      let assistantContent = '';
      let assistantThinking = '';

      const assistantPlaceholder: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        status: 'streaming',
        modelId: selectedModelId
      };
      
      for await (const chunk of result) {
        if (abortControllerRef.current?.signal.aborted) break;

        const text = chunk.text;
        assistantContent += text;
        
        // Update local messages state
        setMessages(prev => {
          const exists = prev.find(m => m.id === assistantMessageId);
          if (exists) {
            return prev.map(m => m.id === assistantMessageId ? { ...m, content: assistantContent } : m);
          }
          return [...prev, { ...assistantPlaceholder, content: assistantContent }];
        });
      }

      // Save final assistant message
      await setDoc(doc(db, 'conversations', convId, 'messages', assistantMessageId), {
        ...assistantPlaceholder,
        content: assistantContent,
        status: 'finalized',
        timestamp: Date.now()
      });

      // Auto-generate title if it's the first message
      if (messages.length === 0) {
        const titleResponse = await ai.models.generateContent({
          model: CHAT_MODEL,
          contents: `Generate a short, 3-5 word title for this chat: "${content}"`
        });
        const newTitle = titleResponse.text?.replace(/"/g, '').trim() || content.slice(0, 30);
        await updateDoc(doc(db, 'conversations', convId), { title: newTitle });
      }

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const regenerateMessage = async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const previousMessages = messages.slice(0, messageIndex);
    const lastUserMessage = previousMessages.reverse().find(m => m.role === 'user');
    
    if (lastUserMessage) {
      // Delete the message being regenerated and everything after it
      for (let i = messageIndex; i < messages.length; i++) {
        await deleteDoc(doc(db, 'conversations', currentConversationId!, 'messages', messages[i].id));
      }
      await sendMessage(lastUserMessage.content, []); // Re-send
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    // Update the message
    await updateDoc(doc(db, 'conversations', currentConversationId!, 'messages', messageId), {
      content: newContent,
      isEdited: true,
      updatedAt: Date.now()
    });

    // Delete all subsequent messages
    for (let i = messageIndex + 1; i < messages.length; i++) {
      await deleteDoc(doc(db, 'conversations', currentConversationId!, 'messages', messages[i].id));
    }

    // Re-trigger response
    await sendMessage(newContent, []);
  };

  const removeConversation = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'conversations', id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `conversations/${id}`);
    }
  };

  return {
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
    createNewConversation: () => setCurrentConversationId(null),
    removeConversation
  };
}

