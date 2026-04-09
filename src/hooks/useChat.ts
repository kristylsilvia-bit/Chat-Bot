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

  const sendMessage = async (content: string) => {
    if (!user || !content.trim()) return;

    let convId = currentConversationId;
    if (!convId) {
      convId = await createNewConversation(content);
    }

    if (!convId) return;

    const userMessage: Message = {
      id: doc(collection(db, 'conversations', convId, 'messages')).id,
      role: 'user',
      content,
      timestamp: Date.now()
    };

    // Save user message
    await setDoc(doc(db, 'conversations', convId, 'messages', userMessage.id), userMessage);
    await updateDoc(doc(db, 'conversations', convId), { updatedAt: Date.now() });

    setIsLoading(true);
    setIsStreaming(true);

    try {
      // Prepare history for Gemini
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      // Add current message to history
      history.push({ role: 'user', parts: [{ text: content }] });

      const modelToUse = useThinking ? PRO_MODEL : CHAT_MODEL;
      
      const chat = ai.chats.create({
        model: modelToUse,
        history: history.slice(0, -1), // History excluding the last message
        config: useThinking ? {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH
          }
        } : undefined
      });

      const result = await chat.sendMessageStream({
        message: content
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

