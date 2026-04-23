'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './StoryCarousel.module.css';
import { useLocale } from '@/contexts/LocaleContext';

interface Story {
  id: string;
  name: string;
  href: string;
  gradient: string;
  image?: string;
  emoji: string;
}

const STORIES: Story[] = [
  {
    id: 'maria',
    name: 'Maria',
    href: '/stories/maria',
    gradient: 'linear-gradient(145deg, #667eea 0%, #f093fb 100%)',
    emoji: '🗼',
    image: '/stories/maria.png?v=4',
  },
  {
    id: 'tom',
    name: 'Tom',
    href: '/stories/tom',
    gradient: 'linear-gradient(145deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    emoji: '🔐',
    image: '/stories/tom.png?v=4',
  },
  {
    id: 'hannah',
    name: 'Hannah',
    href: '/stories/hannah',
    gradient: 'linear-gradient(145deg, #11998e 0%, #38ef7d 100%)',
    emoji: '😴',
    image: '/stories/hannah.png?v=4',
  },
  {
    id: 'juan',
    name: 'Juan',
    href: '/stories/juan',
    gradient: 'linear-gradient(145deg, #4facfe 0%, #00f2fe 100%)',
    emoji: '🩺',
    image: '/stories/juan.png?v=4',
  },
  {
    id: 'nicolas',
    name: 'Nicolas',
    href: '/stories/nicolas',
    gradient: 'linear-gradient(145deg, #f7971e 0%, #ffd200 100%)',
    emoji: '🍝',
    image: '/stories/nicolas.png?v=4',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function StoryCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const { t, locale } = useLocale();

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
    const cardWidth = (el.querySelector('a') as HTMLElement)?.offsetWidth ?? 260;
    el.scrollBy({ left: dir === 'right' ? cardWidth + 16 : -(cardWidth + 16), behavior: 'smooth' });
  };

  return (
    <div className={styles.wrapper}>
      <div ref={scrollRef} className={styles.track}>
        {STORIES.map((story) => (
          <Link key={story.id} href={`${story.href}?lang=${locale}`} className={styles.card}>
            {/* Image zone */}
            <div
              className={styles.imageZone}
              style={story.image ? {} : { background: story.gradient }}
            >
              {story.image ? (
                <img
                  src={story.image}
                  alt={t(`stories.${story.id}.story`)}
                  className={styles.storyImage}
                />
              ) : (
                <span className={styles.placeholderEmoji} aria-hidden="true">
                  {story.emoji}
                </span>
              )}
            </div>

            {/* Text zone */}
            <div className={styles.textZone}>
              <span className={styles.label}>{t(`stories.${story.id}.label`)}</span>
              <p className={styles.story}>{t(`stories.${story.id}.story`)}</p>
              <span className={styles.cta}>
                {t(`stories.${story.id}.cta`)}
                <svg className={styles.ctaArrow} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {canScrollLeft && (
        <button
          className={`${styles.arrow} ${styles.arrowLeft}`}
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
          className={`${styles.arrow} ${styles.arrowRight}`}
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
