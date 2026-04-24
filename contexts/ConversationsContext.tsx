'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';

// ─── Shared types ────────────────────────────────────────────────────────────

export type MessageType = 'assistant' | 'user';

export interface ChatMessage {
  id: string;
  type: MessageType;
  text: string;
  image?: string;
}

export interface Answer {
  question: string;
  answer: string;
}

export interface SavedConversation {
  id: string;
  title: string;
  situationType: string;
  locale: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  answers: Answer[];
  draft: string;
  showResult: boolean;
  questionNumber: number;
  currentQuestion: { question: string; suggestions: string[] } | null;
  followUpSuggestions: string[];
}

// ─── Context interface ────────────────────────────────────────────────────────

interface ConversationsContextValue {
  conversations: SavedConversation[];
  activeConversationId: string | null;
  pendingLoad: SavedConversation | null;
  clearPendingLoad: () => void;
  saveConversation: (conv: Omit<SavedConversation, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateConversation: (id: string, updates: Partial<SavedConversation>) => void;
  requestLoadConversation: (id: string) => void;
  setActiveConversationId: (id: string | null) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function convToRow(conv: SavedConversation, userId: string) {
  return {
    id: conv.id,
    user_id: userId,
    title: conv.title,
    situation_type: conv.situationType,
    locale: conv.locale,
    messages: conv.messages,
    answers: conv.answers,
    draft: conv.draft,
    show_result: conv.showResult,
    question_number: conv.questionNumber,
    current_question: conv.currentQuestion,
    follow_up_suggestions: conv.followUpSuggestions,
    created_at: new Date(conv.createdAt).toISOString(),
    updated_at: new Date(conv.updatedAt).toISOString(),
  };
}

function rowToConv(row: Record<string, unknown>): SavedConversation {
  return {
    id: row.id as string,
    title: row.title as string,
    situationType: row.situation_type as string,
    locale: row.locale as string,
    createdAt: new Date(row.created_at as string).getTime(),
    updatedAt: new Date(row.updated_at as string).getTime(),
    messages: (row.messages as ChatMessage[]) ?? [],
    answers: (row.answers as Answer[]) ?? [],
    draft: (row.draft as string) ?? '',
    showResult: (row.show_result as boolean) ?? false,
    questionNumber: (row.question_number as number) ?? 1,
    currentQuestion: (row.current_question as SavedConversation['currentQuestion']) ?? null,
    followUpSuggestions: (row.follow_up_suggestions as string[]) ?? [],
  };
}

// ─── Provider ────────────────────────────────────────────────────────────────

const ConversationsContext = createContext<ConversationsContextValue | null>(null);

export function ConversationsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [pendingLoad, setPendingLoad] = useState<SavedConversation | null>(null);
  const supabase = createClient();

  // ── Load conversations from Supabase whenever user is ready ──────────────

  useEffect(() => {
    // Wait until auth is resolved and we have a user (anonymous or real)
    if (authLoading || !user) return;

    const fetchConversations = async () => {
      // Recovery: if the user has a real account, check sessionStorage for any
      // conversations that were saved before anonymous auth was introduced and
      // migrate them into Supabase so nothing is lost.
      if (!user.is_anonymous) {
        try {
          const stored = sessionStorage.getItem('askaway_conversations');
          if (stored) {
            const legacy: SavedConversation[] = JSON.parse(stored);
            if (legacy.length > 0) {
              await supabase
                .from('conversations')
                .upsert(legacy.map(c => convToRow(c, user.id)), { onConflict: 'id' });
              sessionStorage.removeItem('askaway_conversations');
            }
          }
        } catch { /* degrade silently */ }
      }

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (!error && data) {
        setConversations(data.map(rowToConv));
      }
    };

    fetchConversations();
  }, [user?.id, authLoading]);

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const saveConversation = useCallback(
    (conv: Omit<SavedConversation, 'id' | 'createdAt' | 'updatedAt'>): string => {
      const id = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const now = Date.now();
      const newConv: SavedConversation = { ...conv, id, createdAt: now, updatedAt: now };
      setConversations(prev => [newConv, ...prev]);

      if (user) {
        supabase.from('conversations').insert(convToRow(newConv, user.id)).then();
      }

      return id;
    },
    [user]
  );

  const updateConversation = useCallback(
    (id: string, updates: Partial<SavedConversation>) => {
      setConversations(prev =>
        prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c)
      );

      if (user) {
        const updatedAt = new Date().toISOString();
        const dbUpdates: Record<string, unknown> = { updated_at: updatedAt };
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.messages !== undefined) dbUpdates.messages = updates.messages;
        if (updates.answers !== undefined) dbUpdates.answers = updates.answers;
        if (updates.draft !== undefined) dbUpdates.draft = updates.draft;
        if (updates.showResult !== undefined) dbUpdates.show_result = updates.showResult;
        if (updates.questionNumber !== undefined) dbUpdates.question_number = updates.questionNumber;
        if (updates.currentQuestion !== undefined) dbUpdates.current_question = updates.currentQuestion;
        if (updates.followUpSuggestions !== undefined) dbUpdates.follow_up_suggestions = updates.followUpSuggestions;
        supabase.from('conversations').update(dbUpdates).eq('id', id).then();
      }
    },
    [user]
  );

  const requestLoadConversation = useCallback((id: string) => {
    setConversations(prev => {
      const conv = prev.find(c => c.id === id);
      if (conv) setPendingLoad(conv);
      return prev;
    });
    setActiveConversationId(id);
  }, []);

  const clearPendingLoad = useCallback(() => setPendingLoad(null), []);

  return (
    <ConversationsContext.Provider
      value={{
        conversations,
        activeConversationId,
        pendingLoad,
        clearPendingLoad,
        saveConversation,
        updateConversation,
        requestLoadConversation,
        setActiveConversationId,
      }}
    >
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversations() {
  const ctx = useContext(ConversationsContext);
  if (!ctx) throw new Error('useConversations must be used within a ConversationsProvider');
  return ctx;
}
