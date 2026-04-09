'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';
import HomeQueryInput from './components/HomeQueryInput';
import TilesCarousel from './components/TilesCarousel';
import { useLocale, type Locale } from '@/contexts/LocaleContext';

const situationIds = {
  primary: ['explain', 'summarize', 'write', 'image'] as const,
  more:    ['health', 'decide', 'translate', 'trip', 'recipe'] as const,
};

const situationMeta: Record<string, { icon: string; href: string; color: string }> = {
  explain:   { icon: '💡', href: '/assist?situation=explain',   color: '#FEF9EC' },
  summarize: { icon: '📝', href: '/assist?situation=summarize', color: '#EBF4FF' },
  write:     { icon: '✍️', href: '/assist?situation=write',     color: '#F0EEFF' },
  image:     { icon: '🖼️', href: '/assist?situation=image',     color: '#EDFBF3' },
  health:    { icon: '🩺', href: '/assist?situation=health',    color: '#FEF0F0' },
  decide:    { icon: '⚖️', href: '/assist?situation=decide',    color: '#E8FAF8' },
  translate: { icon: '🌍', href: '/assist?situation=translate', color: '#EEF2FF' },
  trip:      { icon: '📍', href: '/assist?situation=trip',      color: '#FFF4EC' },
  recipe:    { icon: '🍳', href: '/assist?situation=recipe',    color: '#FFF0F3' },
};

const LOCALES: { code: Locale; flag: string; nativeName: string }[] = [
  { code: 'en', flag: '🇬🇧', nativeName: 'English' },
  { code: 'fr', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'es', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'de', flag: '🇩🇪', nativeName: 'Deutsch' },
];

export default function Home() {
  const { t, locale, setLocale } = useLocale();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const buildSituations = (ids: readonly string[]) =>
    ids.map((id) => ({
      id,
      ...situationMeta[id],
      title: t(`situations.${id}.title`),
      description: t(`situations.${id}.description`),
    }));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {t('home.title')} <span className={styles.titleTagline}>{t('home.tagline')}</span>
        </h1>
        <div className={styles.langDropdown} ref={dropdownRef}>
          <button
            className={styles.langDropdownTrigger}
            onClick={() => setDropdownOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
          >
            <span>{LOCALES.find((l) => l.code === locale)?.flag}</span>
            <span className={styles.langDropdownTriggerName}>
              {LOCALES.find((l) => l.code === locale)?.nativeName}
            </span>
            <span className={styles.langDropdownCaret}>{dropdownOpen ? '▲' : '▼'}</span>
          </button>

          {dropdownOpen && (
            <ul className={styles.langDropdownMenu} role="listbox">
              {LOCALES.map(({ code, flag, nativeName }) => (
                <li
                  key={code}
                  role="option"
                  aria-selected={locale === code}
                  className={`${styles.langDropdownItem} ${locale === code ? styles.langDropdownItemActive : ''}`}
                  onClick={() => { setLocale(code); setDropdownOpen(false); }}
                >
                  <span className={styles.langDropdownFlag}>{flag}</span>
                  <span className={styles.langDropdownName}>{nativeName.toUpperCase()}</span>
                  {locale === code && <span className={styles.langDropdownCheck}>✓</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      <div className={styles.content}>
        <p className={styles.sectionTitle}>{t('home.sectionStart')}</p>
        <TilesCarousel situations={buildSituations(situationIds.primary)} />

        <p className={styles.sectionTitle}>{t('home.sectionIdeas')}</p>
        <TilesCarousel situations={buildSituations(situationIds.more)} />

        <p className={styles.sectionTitle}>{t('home.sectionType')}</p>
        <div className={styles.searchCard}>
          <HomeQueryInput />
        </div>
      </div>

      <footer className={styles.footer}>
        <Link href="/about"   className={styles.footerLink}>{t('home.footerAbout')}</Link>
        <Link href="/terms"   className={styles.footerLink}>{t('home.footerTerms')}</Link>
        <Link href="/privacy" className={styles.footerLink}>{t('home.footerPrivacy')}</Link>
      </footer>
    </div>
  );
}
