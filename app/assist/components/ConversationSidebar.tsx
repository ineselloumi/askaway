'use client';

import { useConversations, SavedConversation } from '@/contexts/ConversationsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import styles from './ConversationSidebar.module.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(ts: number, locale: string, t: (key: string) => string): string {
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
  open: boolean;
  onClose: () => void;
  onNewConversation: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ConversationSidebar({ open, onClose, onNewConversation }: Props) {
  const { conversations, activeConversationId, requestLoadConversation } = useConversations();
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const { t, locale } = useLocale();

  // Anonymous users are treated as "guests" for UI purposes
  const isGuest = !authLoading && (!user || user.is_anonymous === true);
  const hasConversations = conversations.length > 0;

  const handleSelect = (conv: SavedConversation) => {
    requestLoadConversation(conv.id);
    onClose();
  };

  const handleNewConversation = () => {
    onNewConversation();
    onClose();
  };

  return (
    <>
      {open && <div className={styles.overlay} onClick={onClose} aria-hidden="true" />}

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`} aria-label="Conversation history">

        {/* Header */}
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarTitle}>{t('assist.ui.sidebarTitle')}</span>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close sidebar">✕</button>
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

        {/* Scrollable middle: list + optional Case B CTA right below */}
        <div className={styles.middleSection}>
          <nav className={styles.convList} aria-label="Past conversations">

            {/* Case A — guest, no conversations yet */}
            {isGuest && !hasConversations && (
              <p className={styles.emptyState}>{t('assist.ui.sidebarEmpty')}</p>
            )}

            {/* Conversation items */}
            {hasConversations && conversations.map(conv => (
              <button
                key={conv.id}
                className={`${styles.convItem} ${conv.id === activeConversationId ? styles.convItemActive : ''}`}
                onClick={() => handleSelect(conv)}
                title={conv.title}
              >
                <span className={styles.convTitle}>{conv.title}</span>
                <span className={styles.convMeta}>{relativeTime(conv.updatedAt, locale, t)}</span>
              </button>
            ))}
          </nav>

          {/* Case B — guest with conversations: sign-up nudge right below list */}
          {isGuest && hasConversations && (
            <div className={styles.authSection}>
              <p className={styles.signInText}>{t('assist.ui.signUpNudge')}</p>
              <button className={styles.signInButton} onClick={signInWithGoogle}>
                <GoogleIcon />
                {t('assist.ui.signInGoogle')}
              </button>
            </div>
          )}
        </div>

        {/* Case C — logged in with real account: pinned user row */}
        {!authLoading && user && !user.is_anonymous && (
          <div className={styles.userSection}>
            <div className={styles.userRow}>
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="" className={styles.userAvatar} referrerPolicy="no-referrer" />
              ) : (
                <div className={styles.userAvatarFallback}>
                  {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
                </div>
              )}
              <div className={styles.userInfo}>
                <span className={styles.userName}>
                  {user.user_metadata?.full_name || user.email}
                </span>
                <button className={styles.signOutButton} onClick={signOut}>
                  {t('assist.ui.signOut')}
                </button>
              </div>
            </div>
          </div>
        )}

      </aside>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg className={styles.googleIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
