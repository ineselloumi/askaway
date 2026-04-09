'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from '@/contexts/LocaleContext';

export default function AssistError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    console.error('Assist page error:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center',
      gap: '1.5rem',
    }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{t('error.title')}</h1>
      <p style={{ color: '#666', maxWidth: '360px' }}>{t('error.message')}</p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={reset}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#6C63FF',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          {t('error.retry')}
        </button>
        <Link
          href="/"
          style={{
            padding: '0.75rem 1.5rem',
            background: 'transparent',
            color: '#6C63FF',
            border: '1px solid #6C63FF',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '1rem',
          }}
        >
          {t('error.home')}
        </Link>
      </div>
    </div>
  );
}
