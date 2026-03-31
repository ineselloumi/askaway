'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../page.module.css';

interface Situation {
  id: string;
  icon: string;
  title: string;
  description: string;
  href: string;
  color: string;
}

export default function TilesCarousel({ situations }: { situations: Situation[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  useEffect(() => {
    requestAnimationFrame(checkScroll);
    const el = scrollRef.current;
    el?.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector('a')?.offsetWidth ?? 200;
    el.scrollBy({ left: dir === 'right' ? cardWidth + 16 : -(cardWidth + 16), behavior: 'smooth' });
  };

  return (
    <div className={styles.carouselWrapper}>
      <div ref={scrollRef} className={styles.carouselTrack}>
        {situations.map((situation) => (
          <Link
            key={situation.id}
            href={situation.href}
            className={styles.tile}
            style={{ '--tile-color': situation.color } as React.CSSProperties}
          >
            <span className={styles.tileIconWrapper} aria-hidden="true">
              <span className={styles.tileIcon}>{situation.icon}</span>
            </span>
            <h2 className={styles.tileTitle}>{situation.title}</h2>
            <p className={styles.tileDescription}>{situation.description}</p>
          </Link>
        ))}
      </div>

      {canScrollLeft && (
        <button
          className={`${styles.carouselArrow} ${styles.carouselArrowLeft}`}
          onClick={() => scroll('left')}
          aria-label="Scroll left"
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <path d="M8 2L2 8L8 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      {canScrollRight && (
        <button
          className={`${styles.carouselArrow} ${styles.carouselArrowRight}`}
          onClick={() => scroll('right')}
          aria-label="Scroll right"
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <path d="M2 2L8 8L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );
}
