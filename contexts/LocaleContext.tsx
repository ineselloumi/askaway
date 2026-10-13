'use client';

import { createContext, useCallback, useContext, ReactNode } from 'react';
import en from '@/messages/en.json';
import guidedEn from '@/messages/guided/en.json';

// Ask Away is English only. All copy still lives in the message files and is
// read through `t`, so strings stay in one place.
// Strings for the guided flow are mounted under the `guided.` prefix.
const messages: Record<string, unknown> = { ...en, guided: guidedEn };

// Resolve a dot-path key like "assist.ui.send" through a nested object
function resolve(obj: Record<string, unknown>, path: string): string {
  const result = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
  return typeof result === 'string' ? result : path;
}

function translate(key: string, vars?: Record<string, string | number>): string {
  let str = resolve(messages, key);
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, String(v));
    });
  }
  return str;
}

interface LocaleContextValue {
  locale: 'en';
  /** Always true; kept so existing callers that waited on locale detection still work. */
  localeReady: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue>({ locale: 'en', localeReady: true, t: translate });

export function LocaleProvider({ children }: { children: ReactNode }) {
  const t = useCallback(translate, []);
  return <LocaleContext.Provider value={{ locale: 'en', localeReady: true, t }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
