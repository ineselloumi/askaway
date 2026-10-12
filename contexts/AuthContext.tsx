'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient, supabaseConfigured } from '@/lib/supabase/client';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signingIn: boolean;
  signInError: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState(false);
  const signInPending = useRef(false);
  const supabase = createClient();

  useEffect(() => {
    // No Supabase project configured: run signed-out, without saved history.
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }

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
    if (signInPending.current) return;
    signInPending.current = true;
    setSigningIn(true);
    setSignInError(false);

    try {
      const credentials = {
        provider: 'google' as const,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      };
      // Preserve guest conversations by linking whenever the project supports it.
      let result = user?.is_anonymous
        ? await supabase.auth.linkIdentity(credentials)
        : await supabase.auth.signInWithOAuth(credentials);

      // A project may allow anonymous users while disabling manual linking.
      // Regular sign-in remains available, but does not migrate guest history.
      if (result.error?.code === 'manual_linking_disabled') {
        result = await supabase.auth.signInWithOAuth(credentials);
      }
      if (result.error) throw result.error;
      if (!result.data.url) throw new Error('Missing Google sign-in URL');
      window.location.assign(result.data.url);
    } catch (error) {
      console.error('[Auth] Google sign-in failed:', error);
      setSignInError(true);
    } finally {
      signInPending.current = false;
      setSigningIn(false);
    }
  };

  const signOut = async () => {
    // Sign out then immediately create a fresh anonymous session
    await supabase.auth.signOut();
    const { data } = await supabase.auth.signInAnonymously();
    setUser(data.user ?? null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signingIn, signInError, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
