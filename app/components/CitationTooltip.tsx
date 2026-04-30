'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './CitationTooltip.module.css';

export interface CitationSource {
  id: number;
  url: string;
  domain: string;
  title: string;
  excerpt: string;
}

interface Props {
  text: string;
  source: CitationSource;
}

export default function CitationTooltip({ text, source }: Props) {
  const [visible, setVisible] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  // Close on outside click (mobile tap-away)
  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [visible]);

  return (
    <span
      ref={wrapperRef}
      className={styles.wrapper}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={() => setVisible(v => !v)}
    >
      <mark className={styles.highlight}>{text}</mark>
      {visible && (
        <span className={styles.tooltip} role="tooltip" onClick={e => e.stopPropagation()}>
          <span className={styles.domain}>{source.domain}</span>
          <span className={styles.excerpt}>{source.excerpt}</span>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.cta}
            onClick={e => e.stopPropagation()}
          >
            Go to site →
          </a>
        </span>
      )}
    </span>
  );
}
