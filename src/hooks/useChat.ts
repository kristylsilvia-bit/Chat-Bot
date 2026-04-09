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
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { ai, CHAT_MODEL, PRO_MODEL } from '../lib/gemini';
import { Message, Conversation } from '../types';
import { User } from 'firebase/auth';
import { ThinkingLevel } from '@google/genai';

export function useChat(user: User | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [useThinking, setUseThinking] = useState(false);

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
      createdAt: now,
      updatedAt: now
    };

    await setDoc(doc(db, 'conversations', convId), newConv);
    setCurrentConversationId(convId);
    return convId;
  };

  const sendMessage = async (content: string, attachments?: File[]) => {
    if (!user || (!content.trim() && (!attachments || attachments.length === 0))) return;

    let convId = currentConversationId;
    if (!convId) {
      convId = await createNewConversation(content || 'New Chat');
    }

    if (!convId) return;

    // Process attachments
    const processedAttachments: Message['attachments'] = [];
    if (attachments) {
      for (const file of attachments) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const base64 = await base64Promise;
        processedAttachments.push({
          type: file.type.startsWith('image/') ? 'image' : 'file',
          url: base64,
          name: file.name,
          mimeType: file.type
        });
      }
    }

    const userMessage: Message = {
      id: doc(collection(db, 'conversations', convId, 'messages')).id,
      role: 'user',
      content,
      timestamp: Date.now(),
      attachments: (processedAttachments || []).map(a => ({
        type: a.type,
        url: a.url,
        name: a.name || 'file',
        mimeType: a.mimeType || 'application/octet-stream'
      }))
    };

    // Save user message
    await setDoc(doc(db, 'conversations', convId, 'messages', userMessage.id), userMessage);
    await updateDoc(doc(db, 'conversations', convId), { updatedAt: Date.now() });

    setIsLoading(true);
    setIsStreaming(true);

    try {
      // Improved image generation detection
      const isImageRequest = 
        /(generate|create|draw|make|show|give).*(image|photo|picture|drawing|illustration|portrait)/i.test(content) ||
        /(image|photo|picture|drawing|illustration|portrait).*(of|for)/i.test(content) ||
        /dalle|text2im/i.test(content) ||
        (content.includes('{') && content.includes('prompt') && (content.includes('image') || content.includes('cow')));
      
      if (isImageRequest && !useThinking) {
        // Use image model
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: content }]
          },
          config: {
            systemInstruction: "You are an image generation assistant. When asked to generate an image, you MUST generate the image. Do not output JSON tool calls, code, or descriptions. Just output the image part. If you see a prompt in JSON format, extract the prompt and generate the image."
          }
        });

        const assistantMessageId = doc(collection(db, 'conversations', convId, 'messages')).id;
        let assistantContent = '';
        const assistantAttachments: Message['attachments'] = [];

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

        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: assistantContent || 'Here is the image you requested:',
          timestamp: Date.now(),
          attachments: assistantAttachments
        };

        await setDoc(doc(db, 'conversations', convId, 'messages', assistantMessageId), assistantMessage);
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
        setIsStreaming(false);
        return;
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

      const modelToUse = useThinking ? PRO_MODEL : CHAT_MODEL;
      
      const chat = ai.chats.create({
        model: modelToUse,
        history: history.slice(0, -1), // History excluding the last message
        config: {
          systemInstruction: "You are a helpful AI assistant. IMPORTANT: You CANNOT generate images directly by outputting JSON like dalle.text2im. If the user asks for an image, just acknowledge the request or describe what you would see. The system will handle the actual image generation if it detects the intent. NEVER output raw JSON tool calls.",
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

      // Create placeholder for assistant message
      const assistantPlaceholder: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      };
      
      // We don't save to Firestore yet, just update local state for streaming feel
      // Actually, it's better to save once at the end or update periodically
      // For now, let's accumulate and save at the end to avoid too many writes
      
      for await (const chunk of result) {
        const text = chunk.text;
        assistantContent += text;
        // Update local messages state for real-time feel
        setMessages(prev => {
          const exists = prev.find(m => m.id === assistantMessageId);
          if (exists) {
            return prev.map(m => m.id === assistantMessageId ? { ...m, content: assistantContent } : m);
          }
          return [...prev, { ...assistantPlaceholder, content: assistantContent }];
        });
      }

      // Save final assistant message to Firestore
      await setDoc(doc(db, 'conversations', convId, 'messages', assistantMessageId), {
        ...assistantPlaceholder,
        content: assistantContent,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const deleteConversation = async (id: string) => {
    if (!user) return;
    try {
      // Delete messages first (subcollection)
      const msgsQuery = query(collection(db, 'conversations', id, 'messages'));
      const msgsSnapshot = await getDocs(msgsQuery);
      // Note: In production, you'd use a batch or cloud function for large collections
      for (const d of msgsSnapshot.docs) {
        await setDoc(doc(db, 'conversations', id, 'messages', d.id), {}, { merge: false }); // This is a simplified delete for rules
        // Actually, let's just delete the conversation doc, the messages will be orphaned but inaccessible by rules
      }
      
      await setDoc(doc(db, 'conversations', id), { deleted: true }, { merge: true }); // Or just delete
      // For simplicity in this demo, we'll just delete the doc
      // But we need to handle it in the UI
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const removeConversation = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'conversations', id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
      }
    } catch (error) {
      console.error('Error removing conversation:', error);
    }
  };

  return {
    conversations,
    currentConversationId,
    setCurrentConversationId,
    messages,
    sendMessage,
    isLoading,
    isStreaming,
    useThinking,
    setUseThinking,
    createNewConversation: () => setCurrentConversationId(null),
    removeConversation
  };
}

