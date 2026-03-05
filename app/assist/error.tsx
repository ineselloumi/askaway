'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AssistError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
      <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Something went wrong</h1>
      <p style={{ color: '#666', maxWidth: '360px' }}>
        The page took too long to load. Please try again.
      </p>
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
          Try again
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
          Go home
        </Link>
      </div>
    </div>
  );
}
