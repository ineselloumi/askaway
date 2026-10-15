'use client';

import Link from 'next/link';
import { useLocale } from '@/contexts/LocaleContext';
import { BRAND } from '@/lib/brand';
import { guidedSans, guidedSerif } from '../guided/fonts';
import styles from './page.module.css';

const SECTIONS = ['experiment', 'how', 'who'];

export default function AboutPage() {
  const { t } = useLocale();

  return (
    <div className={`${styles.page} ${guidedSerif.variable} ${guidedSans.variable}`}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.backButton}>
            {t('about.backButton')}
          </Link>
        </div>
      </header>

      <div className={styles.content}>
        <h1 className={styles.title}>{t('about.pageTitle')}</h1>
        <p className={styles.intro}>{t('about.intro')}</p>

        {SECTIONS.map((id) => (
          <p key={id} className={styles.paragraph}>
            <strong className={styles.lead}>{t(`about.sections.${id}.lead`)}</strong> {t(`about.sections.${id}.body`, { provider: BRAND.provider })}
          </p>
        ))}

        <p className={styles.paragraph}>
          {t('about.contact.text')} <a href={`mailto:${t('about.contact.email')}`}>{t('about.contact.email')}</a>
        </p>

        <div className={styles.cta}>
          <h2 className={styles.ctaTitle}>{t('about.cta.title')}</h2>
          <Link href="/" className={styles.ctaButton}>
            {t('about.cta.button')}
          </Link>
        </div>
      </div>
    </div>
  );
}
