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

  // Conversations queued before auth resolved — kept in state so changes trigger a re-run
  const [pendingSaves, setPendingSaves] = useState<SavedConversation[]>([]);

  // ── Initial load from Supabase when user is ready ─────────────────────────

  useEffect(() => {
    if (authLoading || !user) return;

    const initialLoad = async () => {
      // Legacy sessionStorage recovery (pre-anonymous-auth sessions)
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

      if (!error && data) setConversations(data.map(rowToConv));
    };

    initialLoad();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  // ── Flush pending saves the moment both user and pending items are available

  useEffect(() => {
    if (!user || authLoading || pendingSaves.length === 0) return;

    const toFlush = pendingSaves;
    setPendingSaves([]); // clear queue immediately to avoid double-flush

    supabase
      .from('conversations')
      .upsert(toFlush.map(c => convToRow(c, user.id)), { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.error('[Supabase] flush failed:', error);
        else console.log('[Supabase] flushed', toFlush.length, 'queued conversation(s)');
      });
  // pendingSaves.length as dep: re-runs whenever a new item is queued
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading, pendingSaves.length]);

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const saveConversation = useCallback(
    (conv: Omit<SavedConversation, 'id' | 'createdAt' | 'updatedAt'>): string => {
      const id = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const now = Date.now();
      const newConv: SavedConversation = { ...conv, id, createdAt: now, updatedAt: now };
      setConversations(prev => [newConv, ...prev]);

      if (user) {
        supabase.from('conversations').insert(convToRow(newConv, user.id))
          .then(({ error }) => {
            if (error) console.error('[Supabase] insert failed:', error);
            else console.log('[Supabase] insert ok:', newConv.id);
          });
      } else {
        // Auth not ready yet — queue in state so the flush effect re-runs
        console.warn('[Supabase] no user yet, queuing save for:', newConv.id);
        setPendingSaves(prev => [...prev, newConv]);
      }

      return id;
    },
    [user]
  );

  const updateConversation = useCallback(
    (id: string, updates: Partial<SavedConversation>) => {
      setConversations(prev => {
        const next = prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c);

        if (user) {
          const updatedConv = next.find(c => c.id === id);
          if (updatedConv) {
            supabase
              .from('conversations')
              .upsert(convToRow(updatedConv, user.id), { onConflict: 'id' })
              .then(({ error }) => {
                if (error) console.error('[Supabase] upsert failed:', error);
              });
          }
        }
        // If no user yet, the pending save will carry the full conversation
        // and the flush will upsert it when auth resolves.

        return next;
      });
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
