'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { stories } from '../storyData';
import { storyLocalizedMessages } from '../storyLocalizedMessages';
import { useLocale } from '@/contexts/LocaleContext';
import ConversationSidebar from '@/app/assist/components/ConversationSidebar';
import styles from './page.module.css';

// ─── FAQ data (mirrors assist/page.tsx) ───────────────────────────────────────

const situationFaqItems: Record<string, string[]> = {
  write:     ['rewrite-concise', 'email-formal', 'birthday-note', 'rewrite-assertive'],
  explain:   ['bitcoin', 'longevity', 'epstein', 'interest-rates'],
  summarize: ['article-insights', 'summarize-email', 'book-learnings', 'news-summary'],
  translate: ['translate-spanish', 'french-basics', 'translate-en-de', 'thank-you-japanese'],
  health:    ['improve-sleep', 'cold-remedies', 'insulin-foods', 'understand-symptom'],
  image:     ['irs-letter', 'receipts', 'device-usage', 'blood-test'],
  trip:      ['chicago-restaurants', 'paris-trip', 'honeymoon', 'date-night'],
  decide:    ['savings', 'switch-jobs', 'mattress', 'trip-destinations'],
  recipe:    ['soup-winter', 'lasagna', 'low-sugar-breakfast', 'air-fryer'],
  other:     ['bitcoin', 'longevity', 'epstein', 'interest-rates'],
};

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}

function renderAssistantContent(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = (key: string) => {
    if (bulletBuffer.length === 0) return;
    elements.push(
      <ul key={`ul-${key}`} className={styles.bulletList}>
        {bulletBuffer.map((b, i) => (
          <li key={i}>{renderInline(b)}</li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  };

  lines.forEach((line, i) => {
    if (line.startsWith('## ')) {
      flushBullets(String(i));
      elements.push(<p key={i} className={styles.heading2}>{renderInline(line.slice(3))}</p>);
      return;
    }
    if (line.startsWith('### ')) {
      flushBullets(String(i));
      elements.push(<p key={i} className={styles.heading3}>{renderInline(line.slice(4))}</p>);
      return;
    }
    if (line.startsWith('* ')) {
      bulletBuffer.push(line.slice(2));
      return;
    }
    if (line.startsWith('🎟️')) {
      flushBullets(String(i));
      elements.push(<p key={i} className={styles.callout}>{line}</p>);
      return;
    }
    if (line.trim() === '') {
      flushBullets(String(i));
      return;
    }
    flushBullets(String(i));
    elements.push(<p key={i} className={styles.paragraph}>{renderInline(line)}</p>);
  });

  flushBullets('end');
  return elements;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const story = stories[id];
  const { t, locale } = useLocale();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [faqSidebarVisible, setFaqSidebarVisible] = useState(false);
  const [faqDrawerOpen, setFaqDrawerOpen] = useState(false);

  if (!story) {
    return (
      <div className={styles.page}>
        <p style={{ textAlign: 'center', padding: '4rem' }}>Story not found.</p>
      </div>
    );
  }

  const localized = storyLocalizedMessages[locale]?.[id];
  const displayMessages = localized
    ? story.messages.map(msg => ({
        ...msg,
        content: msg.role === 'user' ? localized.user : localized.assistant,
      }))
    : story.messages;

  const faqItemIds = situationFaqItems[story.situation] ?? [];
  const showFaqPanel = faqItemIds.length > 0;
  const hasMessages = displayMessages.length > 0;

  const handleIdeasClick = () => {
    if (window.innerWidth <= 1024) {
      setFaqDrawerOpen(true);
    } else {
      setFaqSidebarVisible(v => !v);
    }
  };

  const handleFaqClick = (faqId: string) => {
    const displayText = t(`assist.faqItems.${faqId}`);
    setFaqDrawerOpen(false);
    router.push(`/assist?situation=${story.situation}&query=${encodeURIComponent(displayText)}&lang=${locale}`);
  };

  const handleNewConversation = () => {
    router.push(`/assist?situation=other&lang=${locale}`);
  };

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <button
              className={styles.sidebarToggle}
              onClick={() => setSidebarOpen(v => !v)}
              aria-label="Open conversation history"
            >
              <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.sidebarToggleIcon}>
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
            <Link href={`/?lang=${locale}`} className={styles.backButton}>{t('assist.ui.startOver')}</Link>
          </div>

          <Link href="/" className={styles.headerLogo}>ask away</Link>

          <div className={styles.headerRight}>
            {showFaqPanel && (
              <button
                className={`${styles.faqDrawerToggle} ${faqSidebarVisible ? styles.faqDrawerToggleActive : ''}`}
                onClick={handleIdeasClick}
                aria-label={t('assist.ui.toggleIdeas')}
              >
                {t('assist.ui.ideas')}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── 3-column layout ── */}
      <div className={`${styles.mainLayout} ${showFaqPanel && faqSidebarVisible ? styles.mainLayoutWithFaq : ''}`}>

        {/* Left: conversation sidebar */}
        <ConversationSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewConversation={handleNewConversation}
        />

        {/* Centre: chat + sticky CTA */}
        <div className={styles.chatColumn}>
          <div className={styles.chatContainer}>
            <div className={styles.chatInner}>

              {/* Banner */}
              <div className={styles.banner}>
                <p className={styles.bannerText}>{t(`stories.${id}.subtitle`)}</p>
              </div>

              {/* Messages */}
              {!hasMessages ? (
                <p className={styles.emptyState}>This conversation is coming soon.</p>
              ) : (
                displayMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`${styles.messageRow} ${msg.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant}`}
                  >
                    <span className={`${styles.senderLabel} ${msg.role === 'user' ? styles.senderLabelUser : styles.senderLabelAssistant}`}>
                      {msg.role === 'user' ? story.person : 'ask away'}
                    </span>
                    <div className={`${styles.bubble} ${msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant}`}>
                      {msg.role === 'assistant'
                        ? renderAssistantContent(msg.content)
                        : <p className={styles.paragraph}>{msg.content}</p>
                      }
                    </div>
                  </div>
                ))
              )}

            </div>
          </div>

          {/* CTA — sticky to the bottom of the centre column only */}
          <div className={styles.ctaBar}>
            <p className={styles.ctaText}>{t('stories.ui.ctaQuestion')}</p>
            <Link
              href={`/assist?situation=${story.situation}${
                displayMessages[0]?.role === 'user'
                  ? `&prefill=${encodeURIComponent(displayMessages[0].content)}`
                  : ''
              }&lang=${locale}`}
              className={styles.ctaButton}
            >
              {t('stories.ui.ctaButton')}
            </Link>
          </div>
        </div>

        {/* Right: FAQ / Ideas panel */}
        {showFaqPanel && (
          <>
            {faqDrawerOpen && (
              <div
                className={styles.faqOverlay}
                onClick={() => setFaqDrawerOpen(false)}
                aria-hidden="true"
              />
            )}
            <aside
              className={`${styles.faqPanel} ${faqDrawerOpen ? styles.faqPanelOpen : ''} ${!faqSidebarVisible ? styles.faqPanelHidden : ''}`}
              aria-label={t('assist.ui.howToUseTitle')}
            >
              <div className={styles.faqPanelInner}>
                {/* Mobile drawer handle */}
                <div className={styles.faqDrawerHeader}>
                  <div className={styles.faqDrawerHandle} />
                  <button
                    className={styles.faqDrawerClose}
                    onClick={() => setFaqDrawerOpen(false)}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className={styles.howToUse}>
                  <h2 className={styles.faqTitle}>{t('assist.ui.howToUseTitle')}</h2>
                  <ul className={styles.howToUseList}>
                    <li><strong>{t('assist.tips.1bold')}</strong> {t('assist.tips.1body')}</li>
                    <li><strong>{t('assist.tips.2bold')}</strong> {t('assist.tips.2body')}</li>
                    <li><strong>{t('assist.tips.3bold')}</strong> {t('assist.tips.3body')}</li>
                  </ul>
                </div>

                <h2 className={styles.faqTitle}>{t('assist.ui.exampleQuestionsTitle')}</h2>
                <p className={styles.faqDescription}>{t('assist.ui.exampleQuestionsDesc')}</p>
                <div className={styles.faqList}>
                  {faqItemIds.map((faqId) => (
                    <button
                      key={faqId}
                      className={styles.faqItem}
                      onClick={() => handleFaqClick(faqId)}
                    >
                      <span className={styles.faqIcon} aria-hidden="true">
                        <svg className={styles.faqIconSvg} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M8 10.5H16M8 14H13M20 11.5C20 15.6421 16.4183 19 12 19C10.8462 19 9.74944 18.7708 8.7585 18.3572L5 19.5L6.06779 16.2597C5.39703 14.9488 5 13.4724 5 11.5C5 7.35786 8.58172 4 13 4C17.4183 4 20 7.35786 20 11.5Z"
                            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span className={styles.faqQuestion}>{t(`assist.faqItems.${faqId}`)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </>
        )}
      </div>

    </div>
  );
}
