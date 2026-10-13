'use client';

import Link from 'next/link';
import styles from '../page.module.css';
import HomeQueryInput from './HomeQueryInput';
import TilesCarousel from './TilesCarousel';
import StoryCarousel from './StoryCarousel';
import { useLocale } from '@/contexts/LocaleContext';

const situationIds = {
  primary: ['explain', 'summarize', 'write', 'image', 'translate', 'decide'] as const,
};

const situationMeta: Record<string, { icon: string; href: string; color: string }> = {
  explain:   { icon: '💡', href: '/assist?situation=explain',   color: '#FEF9EC' },
  summarize: { icon: '📝', href: '/assist?situation=summarize', color: '#EBF4FF' },
  write:     { icon: '✍️', href: '/assist?situation=write',     color: '#F0EEFF' },
  image:     { icon: '🔍', href: '/assist?situation=image',     color: '#EDFBF3' },
  health:    { icon: '🩺', href: '/assist?situation=health',    color: '#FEF0F0' },
  decide:    { icon: '💬', href: '/assist?situation=other',     color: '#E8FAF8' },
  translate: { icon: '🌍', href: '/assist?situation=translate', color: '#EEF2FF' },
  trip:      { icon: '📍', href: '/assist?situation=trip',      color: '#FFF4EC' },
  recipe:    { icon: '🍳', href: '/assist?situation=recipe',    color: '#FFF0F3' },
};

// The original Ask Away home page. Shown only when the guided flow is switched off
// (NEXT_PUBLIC_GUIDED_FLOW=off).
export default function LegacyHome() {
  const { t } = useLocale();

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
        {/* Left spacer — keeps title centred */}
        <div className={styles.headerSpacer} />

        <h1 className={styles.title}>
          {t('home.title')} <span className={styles.titleTagline}>{t('home.tagline')}</span>
        </h1>

        {/* Right spacer — keeps title centred */}
        <div className={styles.headerSpacer} />
      </header>

      <div className={styles.content}>
        <p className={styles.sectionTitle}>{t('home.sectionStart')}</p>
        <TilesCarousel situations={buildSituations(situationIds.primary)} />

        <p className={styles.sectionTitle}>{t('home.sectionStories')}</p>
        <StoryCarousel />

        <p className={styles.sectionTitle}>{t('home.sectionType')}</p>
        <div className={styles.searchCard}>
          <HomeQueryInput />
        </div>
      </div>

      <footer className={styles.footer}>
        <Link href="/about" className={styles.footerLink}>{t('home.footerAbout')}</Link>
        <Link href="/terms"   className={styles.footerLink}>{t('home.footerTerms')}</Link>
        <Link href="/privacy" className={styles.footerLink}>{t('home.footerPrivacy')}</Link>
      </footer>
    </div>
  );
}
