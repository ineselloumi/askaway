'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const initAuth = async () => {
      // 1. Check localStorage first (instant, no network call) — handles returning users
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        setUser(sessionData.session.user);
        setLoading(false);
        return;
      }

      // 2. No cached session — verify with server (catches expired/invalid tokens)
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        setUser(userData.user);
        setLoading(false);
        return;
      }

      // 3. Truly new visitor — sign in anonymously so conversations are persisted from the start
      const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) {
        // Anonymous auth not available (e.g. disabled in Supabase dashboard)
        // App still works — conversations just won't be saved until user signs in with Google
        console.warn('[Auth] Anonymous sign-in unavailable:', anonError.message);
      } else {
        setUser(anonData.user ?? null);
      }
      setLoading(false);
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    // If anonymous, upgrade by linking Google identity (preserves user_id + data)
    if (user?.is_anonymous) {
      await supabase.auth.linkIdentity({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    } else {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    }
  };

  const signOut = async () => {
    // Sign out then immediately create a fresh anonymous session
    await supabase.auth.signOut();
    const { data } = await supabase.auth.signInAnonymously();
    setUser(data.user ?? null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
