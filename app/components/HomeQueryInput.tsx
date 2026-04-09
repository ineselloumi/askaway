'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/contexts/LocaleContext';
import styles from '../page.module.css';

export default function HomeQueryInput() {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { t, locale } = useLocale();

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/assist?situation=other&query=${encodeURIComponent(trimmed)}&locale=${locale}`);
  };

  return (
    <div className={styles.homeQueryBox}>
      <textarea
        className={styles.homeQueryTextarea}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('homeInput.placeholder')}
        rows={1}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <button
        className={styles.homeQueryButton}
        onClick={handleSubmit}
        disabled={!query.trim()}
        aria-label={t('homeInput.buttonLabel')}
      >
        {t('homeInput.buttonText')}
      </button>
    </div>
  );
}
