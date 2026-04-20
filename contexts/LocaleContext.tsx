'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import es from '@/messages/es.json';
import de from '@/messages/de.json';
import it from '@/messages/it.json';
import pt from '@/messages/pt.json';

export type Locale = 'en' | 'fr' | 'es' | 'de' | 'it' | 'pt';

const messages: Record<Locale, typeof en> = { en, fr, es, de, it, pt };

// Resolve a dot-path key like "assist.ui.send" through a nested object
function resolve(obj: Record<string, unknown>, path: string): string {
  const result = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
  return typeof result === 'string' ? result : path;
}

interface LocaleContextValue {
  locale: Locale;
  localeReady: boolean;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  localeReady: false,
  setLocale: () => {},
  t: (key) => key,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [localeReady, setLocaleReady] = useState(false);

  // Hydrate from ?lang= URL param (takes priority) or localStorage on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang') as Locale | null;
    if (urlLang && urlLang in messages) {
      setLocaleState(urlLang);
      localStorage.setItem('askaway-locale', urlLang);
    } else {
      const saved = localStorage.getItem('askaway-locale') as Locale | null;
      if (saved && saved in messages) setLocaleState(saved);
    }
    setLocaleReady(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('askaway-locale', l);
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    let str = resolve(messages[locale] as unknown as Record<string, unknown>, key);
    // Fallback to English if the key is missing in the current locale
    if (str === key) str = resolve(messages.en as unknown as Record<string, unknown>, key);
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, localeReady, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
