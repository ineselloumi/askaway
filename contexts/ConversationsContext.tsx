'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ─── Shared types ────────────────────────────────────────────────────────────
// These are re-exported so assist/page.tsx can import from one place.

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
  // Chat state — everything needed to restore the UI exactly
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
  /** Set when user clicks a conversation in the sidebar. The assist page
   *  watches this and restores state, then calls clearPendingLoad(). */
  pendingLoad: SavedConversation | null;
  clearPendingLoad: () => void;
  /** Create a new conversation entry. Returns the generated id. */
  saveConversation: (conv: Omit<SavedConversation, 'id' | 'createdAt' | 'updatedAt'>) => string;
  /** Patch an existing conversation by id. */
  updateConversation: (id: string, updates: Partial<SavedConversation>) => void;
  /** Called from the sidebar when a user picks a past conversation. */
  requestLoadConversation: (id: string) => void;
  setActiveConversationId: (id: string | null) => void;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'askaway_conversations';

// ─── Provider ────────────────────────────────────────────────────────────────

const ConversationsContext = createContext<ConversationsContextValue | null>(null);

export function ConversationsProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [pendingLoad, setPendingLoad] = useState<SavedConversation | null>(null);

  // Hydrate from sessionStorage once on mount (tab-scoped persistence)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) setConversations(JSON.parse(stored));
    } catch {
      // sessionStorage unavailable — degrade silently
    }
  }, []);

  // Persist to sessionStorage whenever conversations change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {
      // Storage full or unavailable — degrade silently
    }
  }, [conversations]);

  const saveConversation = useCallback(
    (conv: Omit<SavedConversation, 'id' | 'createdAt' | 'updatedAt'>): string => {
      const id = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const now = Date.now();
      const newConv: SavedConversation = { ...conv, id, createdAt: now, updatedAt: now };
      setConversations(prev => [newConv, ...prev]);
      return id;
    },
    []
  );

  const updateConversation = useCallback(
    (id: string, updates: Partial<SavedConversation>) => {
      setConversations(prev =>
        prev.map(c =>
          c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
        )
      );
    },
    []
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

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useConversations() {
  const ctx = useContext(ConversationsContext);
  if (!ctx) throw new Error('useConversations must be used within a ConversationsProvider');
  return ctx;
}
