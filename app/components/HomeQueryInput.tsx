'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../page.module.css';

export default function HomeQueryInput() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/assist?situation=other&query=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className={styles.homeQueryBox}>
      <textarea
        className={styles.homeQueryTextarea}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type any question here..."
        rows={2}
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
        aria-label="Ask this question"
      >
        Ask →
      </button>
    </div>
  );
}
