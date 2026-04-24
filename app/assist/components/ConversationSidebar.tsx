'use client';

import { useConversations, SavedConversation } from '@/contexts/ConversationsContext';
import { useLocale } from '@/contexts/LocaleContext';
import styles from './ConversationSidebar.module.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(
  ts: number,
  locale: string,
  t: (key: string) => string,
): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return t('assist.ui.justNow');
  if (min < 60) return t('assist.ui.minutesAgo').replace('{n}', String(min));
  const h = Math.floor(min / 60);
  if (h < 24) return t('assist.ui.hoursAgo').replace('{n}', String(h));
  return new Date(ts).toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  /** Controls the mobile drawer (open/closed). On desktop the sidebar is always visible. */
  open: boolean;
  onClose: () => void;
  onNewConversation: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ConversationSidebar({ open, onClose, onNewConversation }: Props) {
  const { conversations, activeConversationId, requestLoadConversation } = useConversations();
  const { t, locale } = useLocale();

  const handleSelect = (conv: SavedConversation) => {
    requestLoadConversation(conv.id);
    onClose(); // close drawer on mobile after selecting
  };

  const handleNewConversation = () => {
    onNewConversation();
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className={styles.overlay}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}
        aria-label="Conversation history"
      >
        {/* Header */}
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarTitle}>{t('assist.ui.sidebarTitle')}</span>
          {/* Close button — only visible on mobile */}
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* New conversation button */}
        <div className={styles.newConvWrapper}>
          <button className={styles.newConvButton} onClick={handleNewConversation}>
            <svg className={styles.newConvIcon} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {t('assist.ui.newConversation')}
          </button>
        </div>

        {/* Conversation list */}
        <nav className={styles.convList} aria-label="Past conversations">
          {conversations.length === 0 ? (
            <p className={styles.emptyState}>
              {t('assist.ui.sidebarEmpty')}
            </p>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                className={`${styles.convItem} ${conv.id === activeConversationId ? styles.convItemActive : ''}`}
                onClick={() => handleSelect(conv)}
                title={conv.title}
              >
                <span className={styles.convTitle}>{conv.title}</span>
                <span className={styles.convMeta}>{relativeTime(conv.updatedAt, locale, t)}</span>
              </button>
            ))
          )}
        </nav>

        {/* Footnote */}
        <p className={styles.sidebarFootnote}>{t('assist.ui.sidebarFootnote')}</p>
      </aside>
    </>
  );
}
