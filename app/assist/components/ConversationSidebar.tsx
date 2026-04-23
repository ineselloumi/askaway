'use client';

import { useConversations, SavedConversation } from '@/contexts/ConversationsContext';
import styles from './ConversationSidebar.module.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
          <span className={styles.sidebarTitle}>Conversations</span>
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
            New conversation
          </button>
        </div>

        {/* Conversation list */}
        <nav className={styles.convList} aria-label="Past conversations">
          {conversations.length === 0 ? (
            <p className={styles.emptyState}>
              Your conversations will appear here once you start chatting.
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
                <span className={styles.convMeta}>{relativeTime(conv.updatedAt)}</span>
              </button>
            ))
          )}
        </nav>

        {/* Phase 2: sign-up prompt will go here */}
      </aside>
    </>
  );
}
