'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import styles from './page.module.css';

export default function AboutPage() {
  const { t, locale, localeReady } = useLocale();
  const router = useRouter();

  // Sync ?lang= in URL once locale is ready
  useEffect(() => {
    if (!localeReady) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('lang') !== locale) {
      params.set('lang', locale);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [locale, localeReady, router]);

  const principles = [
    { icon: t('about.principles.p1icon'), title: t('about.principles.p1title'), description: t('about.principles.p1desc') },
    { icon: t('about.principles.p2icon'), title: t('about.principles.p2title'), description: t('about.principles.p2desc') },
    { icon: t('about.principles.p3icon'), title: t('about.principles.p3title'), description: t('about.principles.p3desc') },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href={`/?lang=${locale}`} className={styles.backButton}>
            {t('about.backButton')}
          </Link>
        </div>
      </header>

      <div className={styles.content}>
        <h1 className={styles.title}>{t('about.pageTitle')}</h1>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('about.whatIsIt.title')}</h2>
          <p className={styles.paragraph}>{t('about.whatIsIt.p1')}</p>
          <p className={styles.paragraph}>{t('about.whatIsIt.p2')}</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('about.principles.title')}</h2>
          <p className={styles.paragraph}>{t('about.principles.intro')}</p>
          <ul className={styles.list}>
            {principles.map((principle, index) => (
              <li key={index} className={styles.listItem}>
                <span className={styles.listIcon} aria-hidden="true">
                  {principle.icon}
                </span>
                <div className={styles.listContent}>
                  <h3 className={styles.listTitle}>{principle.title}</h3>
                  <p className={styles.listDescription}>{principle.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('about.privacy.title')}</h2>
          <p className={styles.paragraph}>{t('about.privacy.p1')}</p>
          <p className={styles.paragraph}>{t('about.privacy.p2')}</p>
        </section>

        <div className={styles.cta}>
          <h2 className={styles.ctaTitle}>{t('about.cta.title')}</h2>
          <Link href={`/?lang=${locale}`} className={styles.ctaButton}>
            {t('about.cta.button')}
          </Link>
        </div>
      </div>
    </div>
  );
}
