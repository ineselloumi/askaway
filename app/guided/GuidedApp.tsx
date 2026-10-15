'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useConversations, type ChatMessage, type SavedConversation } from '@/contexts/ConversationsContext';
import { useLocale } from '@/contexts/LocaleContext';
import { agentReducer, askWithNotes, createRun, type AgentAction, type AgentRun, type CheckIn } from '@/lib/guided/agentRun';
import { track, trackPromptSent } from '@/lib/guided/analytics';
import { FLOWS, IDEAS } from '@/lib/guided/flows';
import {
  bringBackGuided,
  dismissGraduation,
  initialProgress,
  loadProgress,
  recordCompletedPrompt,
  saveProgress,
  startMode,
  type GuidedProgress,
} from '@/lib/guided/graduation';
import type { TaskCategory } from '@/lib/guided/types';
import BuilderScreen, { type BuiltPrompt } from './BuilderScreen';
import Conversation from './Conversation';
import { guidedSans, guidedSerif } from './fonts';
import styles from './guided.module.css';
import { PLAIN_META, type ConversationMeta, type ThreadItem } from './types';

type View =
  | { name: 'setup' }
  | { name: 'builder'; category: TaskCategory; prefill?: { variant: string; text: string; idea?: string }; key: number }
  | { name: 'chat' };

const CATEGORIES: TaskCategory[] = ['write', 'understand', 'agentic'];

let counter = 0;
const newId = () => `msg-${Date.now()}-${++counter}`;

export default function GuidedApp() {
  const { t, locale } = useLocale();
  const { saveConversation, updateConversation, setActiveConversationId, pendingLoad, clearPendingLoad } = useConversations();

  const [progress, setProgress] = useState<GuidedProgress>(initialProgress);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>({ name: 'setup' });
  const [showGraduation, setShowGraduation] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [items, setItemsState] = useState<ThreadItem[]>([]);
  const [busy, setBusy] = useState<null | 'reading' | 'thinking'>(null);
  const [run, setRunState] = useState<AgentRun | null>(null);
  const [meta, setMetaState] = useState<ConversationMeta>(PLAIN_META);

  // Refs mirror state for the async request handlers, which outlive a render.
  const itemsRef = useRef<ThreadItem[]>([]);
  const runRef = useRef<AgentRun | null>(null);
  const metaRef = useRef<ConversationMeta>(PLAIN_META);
  const progressRef = useRef<GuidedProgress>(initialProgress);
  const abortRef = useRef<AbortController | null>(null);
  const resumeRef = useRef<unknown>(null);
  const conversationIdRef = useRef<string | null>(null);
  const builderKey = useRef(0);

  const setItems = (next: ThreadItem[]) => {
    itemsRef.current = next;
    setItemsState(next);
  };
  const pushItem = (item: Omit<ThreadItem, 'id'>) => setItems([...itemsRef.current, { ...item, id: newId() }]);
  const setMeta = (next: ConversationMeta) => {
    metaRef.current = next;
    setMetaState(next);
  };
  const setRun = (next: AgentRun | null) => {
    runRef.current = next;
    setRunState(next);
  };
  const dispatchRun = (action: AgentAction): AgentRun | null => {
    if (!runRef.current) return null;
    const next = agentReducer(runRef.current, action);
    setRun(next);
    return next;
  };
  const updateProgress = (next: GuidedProgress) => {
    progressRef.current = next;
    setProgress(next);
    saveProgress(next);
  };

  // ── Graduation bookkeeping ────────────────────────────────────────────────

  /** A guided prompt counts once its answer has arrived. */
  const countGuidedPrompt = () => {
    const prompt = metaRef.current.guidedPrompt;
    if (!prompt) return;
    setMeta({ ...metaRef.current, guidedPrompt: null });
    const next = recordCompletedPrompt(progressRef.current, prompt);
    updateProgress(next);
    track('prompt_completed', { category: metaRef.current.category, total: next.promptsCompleted });
  };

  // ── Plain conversation ────────────────────────────────────────────────────

  const askChat = async (first: boolean) => {
    setBusy(first ? 'reading' : 'thinking');
    const controller = new AbortController();
    abortRef.current = controller;
    const turns = itemsRef.current
      .filter((item) => item.role !== 'notice')
      .map((item) => ({ role: item.role, content: item.text, images: item.images, attachment: item.attachment }));
    const previous = [...itemsRef.current].reverse().find((item) => item.role === 'assistant')?.tier;
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: turns, category: metaRef.current.category, previous }),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (controller.signal.aborted) return;
      if (data.declined) {
        pushItem({ role: 'notice', text: t('guided.chat.declined') });
      } else if (!response.ok || !data.text) {
        pushItem({ role: 'notice', text: t(response.status === 429 ? 'guided.chat.errorBusy' : 'guided.chat.error'), retry: true });
      } else {
        pushItem({ role: 'assistant', text: data.text, model: data.model, reason: data.reason, tier: data.tier });
        track('answer_routed', { tier: data.tier, reason: data.reason, routed: data.routed });
        countGuidedPrompt();
      }
    } catch {
      if (controller.signal.aborted) return;
      pushItem({ role: 'notice', text: t('guided.chat.error'), retry: true });
    } finally {
      if (abortRef.current === controller) setBusy(null);
    }
  };

  const retryChat = () => {
    setItems(itemsRef.current.filter((item) => !item.retry));
    void askChat(itemsRef.current.filter((item) => item.role === 'assistant').length === 0);
  };

  // ── Agent run ─────────────────────────────────────────────────────────────

  const failRun = (code: string) => dispatchRun({ type: 'fail', message: code, at: Date.now() });

  const launch = async (payload: Record<string, unknown>) => {
    const controller = new AbortController();
    abortRef.current = controller;
    let settled = false;
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, kind: metaRef.current.kind, job: metaRef.current.job }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        failRun(response.status === 429 ? 'busy' : 'server');
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim() || controller.signal.aborted) continue;
          let event: Record<string, unknown>;
          try {
            event = JSON.parse(line);
          } catch {
            continue;
          }
          switch (event.type) {
            case 'phase':
              dispatchRun({ type: 'phase', phase: event.phase as never });
              break;
            case 'search':
              dispatchRun({ type: 'search', query: String(event.query ?? '') });
              break;
            case 'pages':
              dispatchRun({ type: 'pages', count: Number(event.count) || 0 });
              break;
            case 'checkin':
              settled = true;
              resumeRef.current = event.resume;
              dispatchRun({ type: 'check-in', question: event.question as CheckIn, at: Date.now() });
              track('agent_check_in');
              break;
            case 'done': {
              settled = true;
              const finished = dispatchRun({
                type: 'done',
                result: String(event.text ?? ''),
                model: String(event.model ?? ''),
                sources: Array.isArray(event.sources) ? (event.sources as never) : [],
                at: Date.now(),
              });
              if (finished?.status === 'done') {
                pushItem({
                  role: 'assistant',
                  text: finished.result ?? '',
                  model: finished.model ?? undefined,
                  // Pages it opened in full, or failing that the pages it quoted from.
                  receipt: { pages: Math.max(finished.pagesRead, finished.sources.length), ms: finished.durationMs },
                  sources: finished.sources,
                });
                track('agent_done', { pages: finished.pagesRead, seconds: Math.round(finished.durationMs / 1000) });
                setRun(null);
                countGuidedPrompt();
              }
              break;
            }
            case 'error':
              settled = true;
              failRun(String(event.code ?? 'server'));
              break;
          }
        }
      }
      if (!settled && !controller.signal.aborted) failRun('server');
    } catch {
      if (!controller.signal.aborted) failRun('server');
    }
  };

  /** Everything said before the current ask, as plain text turns for the agent. */
  const historyBeforeLastAsk = () => {
    const turns = itemsRef.current.filter((item) => item.role !== 'notice');
    return turns.slice(0, -1).map((item) => ({ role: item.role, content: item.text }));
  };

  const launchFresh = () => {
    const current = runRef.current;
    if (!current) return;
    const ask = itemsRef.current.filter((item) => item.role === 'user').pop();
    void launch({ ask: askWithNotes(current), attachment: ask?.attachment, history: historyBeforeLastAsk() });
  };

  // Jobs start as soon as the prompt is sent: there is no permission step.
  // The user can still pause a job, or change the prompt mid-run.
  const startJob = () => {
    dispatchRun({ type: 'request-permission' });
    if (dispatchRun({ type: 'allow', at: Date.now() })?.status === 'running') launchFresh();
  };

  const beginJob = (ask: string) => {
    setRun(createRun(ask, metaRef.current.kind));
    startJob();
  };

  const pauseJob = () => {
    abortRef.current?.abort();
    dispatchRun({ type: 'pause', at: Date.now() });
  };

  const resumeJob = () => {
    if (dispatchRun({ type: 'resume', at: Date.now() })?.status === 'running') launchFresh();
  };

  const answerCheckIn = (answer: string) => {
    const current = runRef.current;
    const resume = resumeRef.current as { messages?: unknown } | null;
    if (!current?.blockingQuestion || !resume?.messages) return;
    const toolUseId = current.blockingQuestion.toolUseId;
    dispatchRun({ type: 'answer-check-in', at: Date.now() });
    resumeRef.current = null;
    void launch({ resume: { messages: resume.messages, toolUseId, answer } });
  };

  // ── Sending ───────────────────────────────────────────────────────────────

  const send = (text: string, images: string[]) => {
    const current = runRef.current;
    if (current) {
      if (!text) return;
      if (current.status === 'blocked') return answerCheckIn(text);
      if (current.status === 'running') {
        // A change of instructions mid-run: fold it in and start the job again.
        abortRef.current?.abort();
        dispatchRun({ type: 'note', text });
        dispatchRun({ type: 'pause', at: Date.now() });
        return resumeJob();
      }
      dispatchRun({ type: 'note', text });
      if (current.status === 'scoping') startJob();
      return;
    }
    if (busy) return;

    const first = itemsRef.current.length === 0;
    if (first) setShowGraduation(false);
    pushItem({ role: 'user', text, images: images.length ? images : undefined });
    trackPromptSent({ category: metaRef.current.category, guided: false, first });
    if (metaRef.current.agentic) beginJob(text);
    else void askChat(first);
  };

  const submitBuilt = (built: BuiltPrompt) => {
    const agentic = built.category === 'agentic';
    const variant = FLOWS[built.category].variants[built.variant];
    setMeta({
      category: built.category,
      agentic,
      job: built.variant,
      kind: agentic && variant?.attach ? 'data' : 'web',
      granted: false,
      guidedPrompt: built.prompt,
    });
    setItems([{ id: newId(), role: 'user', text: built.prompt, guided: true, agentic, attachment: built.attachment }]);
    setView({ name: 'chat' });
    trackPromptSent({
      category: built.category,
      variant: built.variant,
      guided: true,
      readiness: built.readiness,
      scored: built.scored,
      edited: built.edited,
      via: built.via,
    });
    if (agentic) beginJob(built.prompt);
    else void askChat(true);
  };

  // ── Navigation ────────────────────────────────────────────────────────────

  const resetConversation = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    resumeRef.current = null;
    conversationIdRef.current = null;
    setActiveConversationId(null);
    setItems([]);
    setRun(null);
    setBusy(null);
    setMeta(PLAIN_META);
  };

  /** A new chat opens on the setup, the one-time recap, or the plain input. */
  const newChat = useCallback(() => {
    resetConversation();
    const mode = startMode(progressRef.current);
    setShowGraduation(mode === 'graduation');
    if (mode === 'graduation') track('graduation_shown');
    setView(mode === 'setup' ? { name: 'setup' } : { name: 'chat' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openBuilder = (category: TaskCategory, prefill?: { variant: string; text: string; idea?: string }) => {
    track('category_picked', { category, prefilled: !!prefill });
    setView({ name: 'builder', category, prefill, key: ++builderKey.current });
  };

  const justType = () => {
    track('just_type');
    setShowGraduation(false);
    setView({ name: 'chat' });
  };

  const dismissRecap = () => {
    track('graduation_dismissed');
    updateProgress(dismissGraduation(progressRef.current));
    setShowGraduation(false);
  };

  const bringBack = () => {
    track('guided_brought_back');
    updateProgress(bringBackGuided(progressRef.current));
    setShowGraduation(false);
    resetConversation();
    setView({ name: 'setup' });
  };

  // ── First load: stored progress and deep links ────────────────────────────

  useEffect(() => {
    if (ready) return;
    const stored = loadProgress();
    progressRef.current = stored;
    setProgress(stored);
    setReady(true);

    const params = new URLSearchParams(window.location.search);
    const query = params.get('q')?.trim();
    const start = params.get('start');
    if (query || start) window.history.replaceState(null, '', window.location.pathname);

    if (query) {
      setView({ name: 'chat' });
      send(query.slice(0, 20000), []);
    } else if (start && (CATEGORIES as string[]).includes(start)) {
      openBuilder(start as TaskCategory);
    } else if (start === 'chat') {
      setView({ name: 'chat' });
    } else {
      newChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── History: save as the conversation grows, restore from the drawer ──────

  useEffect(() => {
    const saved = items.filter((item) => item.role !== 'notice');
    if (!saved.some((item) => item.role === 'user')) return;
    const timer = setTimeout(() => {
      const messages: ChatMessage[] = saved.map(({ id, role, text, ...rest }) => ({
        id,
        type: role === 'user' ? 'user' : 'assistant',
        text,
        meta: rest,
      }));
      if (conversationIdRef.current) {
        updateConversation(conversationIdRef.current, { messages });
        return;
      }
      const firstText = saved.find((item) => item.role === 'user')?.text.trim() || 'Photo';
      const id = saveConversation({
        title: firstText.length > 52 ? `${firstText.slice(0, 52)}…` : firstText,
        situationType: metaRef.current.category,
        locale,
        messages,
        answers: [],
        draft: '',
        showResult: false,
        questionNumber: 0,
        currentQuestion: null,
        followUpSuggestions: [],
        queryCategories: [],
      });
      conversationIdRef.current = id;
      setActiveConversationId(id);
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'title', messages: [{ role: 'user', content: firstText.slice(0, 2000) }] }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.title && conversationIdRef.current === id) updateConversation(id, { title: data.title });
        })
        .catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => {
    if (!pendingLoad) return;
    const conversation: SavedConversation = pendingLoad;
    clearPendingLoad();
    resetConversation();

    const restored: ThreadItem[] = conversation.messages
      .filter((message) => message.text || message.image)
      .map((message) => ({
        ...(message.meta as Partial<ThreadItem> | undefined),
        id: message.id,
        role: message.type === 'user' ? 'user' : 'assistant',
        text: message.text,
        // Conversations from the original Ask Away stored one image per message.
        ...(message.image ? { images: [message.image] } : {}),
      }));
    if (conversation.showResult && conversation.draft) {
      restored.push({ id: newId(), role: 'assistant', text: conversation.draft.replace(/\[\[(.+?)\]\]\{(?:source_)?\d+\}/g, '$1') });
    }
    const category = (CATEGORIES as string[]).includes(conversation.situationType)
      ? (conversation.situationType as TaskCategory)
      : 'chat';
    const firstAsk = restored.find((item) => item.role === 'user');
    setMeta({
      ...PLAIN_META,
      category,
      agentic: category === 'agentic',
      kind: firstAsk?.attachment ? 'data' : 'web',
    });
    conversationIdRef.current = conversation.id;
    setActiveConversationId(conversation.id);
    setItems(restored);
    setShowGraduation(false);
    setView({ name: 'chat' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingLoad]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={`${styles.root} ${guidedSerif.variable} ${guidedSans.variable}`}>
      <header className={styles.topbar}>
        <div className={styles.topLeft}>
          <button type="button" className={styles.iconButton} onClick={() => setDrawerOpen(true)} aria-label={t('guided.nav.history')} title={t('guided.nav.history')}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
          <button type="button" className={styles.wordmark} onClick={newChat}>
            {t('guided.nav.home')}
          </button>
        </div>
        <div className={styles.topRight}>
          {view.name !== 'setup' && (
            <button type="button" className={styles.topPill} onClick={newChat}>
              + <span className={styles.topPillLabel}>{t('guided.nav.newChat')}</span>
            </button>
          )}
        </div>
      </header>

      <HistoryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className={styles.main}>
        {!ready ? null : view.name === 'setup' ? (
          <Setup onPick={openBuilder} onJustType={justType} />
        ) : (
          <div className={styles.frame}>
            {view.name === 'builder' ? (
              <BuilderScreen key={view.key} category={view.category} prefill={view.prefill} onSubmit={submitBuilt} />
            ) : (
              <Conversation
                items={items}
                busy={busy}
                run={run}
                meta={meta}
                progress={progress}
                showGraduation={showGraduation}
                onSend={send}
                onRetry={retryChat}
                onPause={pauseJob}
                onResume={resumeJob}
                onCheckIn={answerCheckIn}
                onDismissGraduation={dismissRecap}
                onBringBack={bringBack}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Setup (screens 1a / 1b) ──────────────────────────────────────────────────

interface SetupProps {
  onPick: (category: TaskCategory, prefill?: { variant: string; text: string; idea?: string }) => void;
  onJustType: () => void;
}

function Setup({ onPick, onJustType }: SetupProps) {
  const { t } = useLocale();
  const [picked, setPicked] = useState<TaskCategory | null>(null);

  const pick = (category: TaskCategory) => {
    if (picked) return;
    setPicked(category);
    // Let the selected state register (screen 1b) before moving on.
    setTimeout(() => onPick(category), 160);
  };

  const ideas = (hidden: boolean) => (
    <div className={styles.marqueeGroup} aria-hidden={hidden || undefined}>
      {IDEAS.map((idea) => (
        <button
          key={idea.id}
          type="button"
          className={styles.idea}
          tabIndex={hidden ? -1 : undefined}
          onClick={() => {
            track('idea_picked', { idea: idea.id });
            onPick(idea.category, { variant: idea.variant, text: t(`guided.setup.ideas.${idea.id}.prompt`), idea: idea.id });
          }}
        >
          {t(`guided.setup.ideas.${idea.id}.label`)}
        </button>
      ))}
    </div>
  );

  return (
    <div className={styles.setup}>
      <div className={styles.setupTop}>
        <h1 className={styles.setupTitle}>{t('guided.setup.title')}</h1>
        <p className={styles.setupSub}>{t('guided.setup.sub')}</p>
        <div className={styles.cards}>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={picked === category}
              className={`${styles.card} ${category === 'agentic' ? styles.cardDark : ''} ${picked === category ? styles.cardSelected : ''}`}
              onClick={() => pick(category)}
            >
              <span className={styles.cardTitle}>{t(`guided.setup.cards.${category}.title`)}</span>
              <span className={styles.cardDesc}>{t(`guided.setup.cards.${category}.desc`)}</span>
              {category === 'agentic' && <span className={styles.cardPill}>{t('guided.pill')}</span>}
            </button>
          ))}
        </div>
        <button type="button" className={`${styles.linkButton} ${styles.justType}`} onClick={onJustType}>
          {t('guided.setup.justType')}
        </button>
      </div>

      <div className={styles.strip}>
        <p className={styles.stripLabel}>{t('guided.setup.strip')}</p>
        <div className={styles.marquee}>
          {ideas(false)}
          {ideas(true)}
        </div>
      </div>
      <nav className={styles.legal} aria-label="Legal">
        <Link href="/about">{t('guided.nav.about')}</Link>
        <Link href="/terms">{t('guided.nav.terms')}</Link>
        <Link href="/privacy">{t('guided.nav.privacy')}</Link>
      </nav>
    </div>
  );
}

// ── History drawer ───────────────────────────────────────────────────────────

function HistoryDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, locale } = useLocale();
  const { conversations, activeConversationId, requestLoadConversation } = useConversations();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const when = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60_000);
    if (minutes < 1) return t('assist.ui.justNow');
    if (minutes < 60) return t('assist.ui.minutesAgo').replace('{n}', String(minutes));
    if (minutes < 24 * 60) return t('assist.ui.hoursAgo').replace('{n}', String(Math.floor(minutes / 60)));
    return new Date(timestamp).toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {open && <div className={styles.drawerOverlay} onClick={onClose} aria-hidden="true" />}
      <aside className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`} aria-label={t('guided.history.title')} aria-hidden={!open}>
        <div className={styles.drawerHead}>
          {t('guided.history.title')}
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label={t('guided.nav.close')}>
            ×
          </button>
        </div>
        <nav className={styles.drawerList}>
          {conversations.length === 0 && <p className={styles.drawerEmpty}>{t('guided.history.empty')}</p>}
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              className={`${styles.drawerItem} ${conversation.id === activeConversationId ? styles.drawerItemActive : ''}`}
              title={conversation.title}
              onClick={() => {
                requestLoadConversation(conversation.id);
                onClose();
              }}
            >
              <span className={styles.drawerTitle}>{conversation.title}</span>
              <span className={styles.drawerMeta}>{when(conversation.updatedAt)}</span>
            </button>
          ))}
        </nav>
        <div className={styles.drawerFoot}>
          <div className={styles.drawerLinks}>
            <Link href="/about">{t('guided.nav.about')}</Link>
            <Link href="/terms">{t('guided.nav.terms')}</Link>
            <Link href="/privacy">{t('guided.nav.privacy')}</Link>
          </div>
        </div>
      </aside>
    </>
  );
}
