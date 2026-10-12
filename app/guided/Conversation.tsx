'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { agentSteps, type AgentRun } from '@/lib/guided/agentRun';
import { quotePrompt, type GuidedProgress } from '@/lib/guided/graduation';
import { parseAnswer } from '@/lib/guided/parseAnswer';
import type { Translate } from '@/lib/guided/types';
import styles from './guided.module.css';
import type { ConversationMeta, ThreadItem } from './types';

const MAX_IMAGES = 5;

interface Props {
  items: ThreadItem[];
  busy: null | 'reading' | 'thinking';
  run: AgentRun | null;
  meta: ConversationMeta;
  progress: GuidedProgress;
  showGraduation: boolean;
  onSend: (text: string, images: string[]) => void;
  onRetry: () => void;
  onAllow: () => void;
  onDecline: () => void;
  onStartJob: () => void;
  onPause: () => void;
  onResume: () => void;
  onCheckIn: (answer: string) => void;
  onDismissGraduation: () => void;
  onBringBack: () => void;
}

export default function Conversation(props: Props) {
  const { items, busy, run, meta, progress, showGraduation } = props;
  const { t } = useLocale();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [items.length, busy, run?.status, run?.currentStep, run?.searches.length]);

  const working = !!run && ['running', 'paused', 'blocked', 'error'].includes(run.status);
  // While the very first job is under way, the ask shrinks to one line (screens 2e / 2f).
  const compact = working && items.length === 1 && !!items[0].guided;
  const answered = items.some((item) => item.role === 'assistant');
  const declined = run?.status === 'scoping';

  let placeholder = t('guided.chat.placeholderPlain');
  if (busy) placeholder = t('guided.chat.placeholderWaiting');
  else if (run?.status === 'awaiting-permission' || declined) placeholder = t('guided.agent.permission.changeAsk');
  else if (run?.status === 'blocked') placeholder = t('guided.agent.checkIn.placeholder');
  else if (working) placeholder = t(run?.kind === 'data' ? 'guided.agent.working.placeholderData' : 'guided.agent.working.placeholder');
  else if (answered) {
    placeholder = meta.agentic
      ? t('guided.chat.placeholderAgentic')
      : meta.category === 'write'
        ? t('guided.chat.placeholderWrite')
        : meta.category === 'understand'
          ? t('guided.chat.placeholderUnderstand')
          : t('guided.chat.placeholderGeneral');
  }

  return (
    <div className={styles.chat}>
      <div className={styles.thread}>
        {items.length === 0 &&
          (showGraduation ? (
            <Graduation progress={progress} onDismiss={props.onDismissGraduation} onBringBack={props.onBringBack} />
          ) : (
            <div className={styles.center}>
              <h1 className={styles.plainTitle}>{t('guided.chat.plainTitle')}</h1>
              <button type="button" className={`${styles.linkButton} ${styles.bringBack}`} onClick={props.onBringBack}>
                {t('guided.graduation.bringBackPlain')}
              </button>
            </div>
          ))}

        {items.map((item, index) => {
          if (item.role === 'notice') {
            return (
              <p key={item.id} className={styles.notice} role="status">
                {item.text}
                {item.retry && index === items.length - 1 && (
                  <button type="button" className={styles.ghostPill} onClick={props.onRetry}>
                    {t('guided.chat.retry')}
                  </button>
                )}
              </p>
            );
          }
          if (item.role === 'assistant') return <Answer key={item.id} item={item} agentic={meta.agentic} />;
          if (item.guided && index === 0) {
            return compact ? (
              <div key={item.id} className={styles.miniAsk}>
                <span className={styles.eyebrow}>{t('guided.chat.yourAsk')}</span>
                <span className={styles.miniAskText}>{item.text}</span>
              </div>
            ) : (
              <AskCard key={item.id} item={item} answered={answered} />
            );
          }
          return (
            <div key={item.id} className={styles.userMsg}>
              {item.images && item.images.length > 0 && (
                <div className={styles.userImages}>
                  {item.images.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt={t('guided.chat.photoAlt')} />
                  ))}
                </div>
              )}
              {item.text}
            </div>
          );
        })}

        {busy && (
          <div role="status">
            <p className={styles.status}>{t(busy === 'reading' ? 'guided.chat.reading' : 'guided.chat.thinking')}</p>
            <div className={styles.shimmer} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        {run?.status === 'awaiting-permission' && <Permission run={run} onAllow={props.onAllow} onDecline={props.onDecline} />}

        {declined && (
          <p className={styles.notice} role="status">
            {t('guided.agent.permission.declined')}
            <button type="button" className={styles.ghostPill} onClick={props.onStartJob}>
              {t('guided.agent.permission.askAgain')}
            </button>
          </p>
        )}

        {run && (run.status === 'running' || run.status === 'paused' || run.status === 'error') && (
          <Working run={run} onPause={props.onPause} onResume={props.onResume} />
        )}

        {run?.status === 'blocked' && run.blockingQuestion && (
          <div>
            <p className={styles.small} style={{ marginBottom: 12 }}>
              {t('guided.agent.checkIn.status')}
            </p>
            <div className={styles.checkIn} role="group" aria-label={run.blockingQuestion.label}>
              <p className={styles.cardTitleSerif}>{run.blockingQuestion.headline}</p>
              <p className={styles.checkInDetail}>{run.blockingQuestion.detail}</p>
              <p className={`${styles.qLabel} ${styles.qLabelActive}`}>{run.blockingQuestion.label}</p>
              <div className={styles.chips}>
                {run.blockingQuestion.options.map((option) => (
                  <button key={option} type="button" className={styles.chip} onClick={() => props.onCheckIn(option)}>
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <p className={styles.small} style={{ marginTop: 14 }}>
              {t('guided.agent.checkIn.note')}
            </p>
          </div>
        )}

        <div className={styles.spacer} ref={endRef} />
      </div>

      <div className={styles.chatDock}>
        <ChatInput
          placeholder={placeholder}
          disabled={!!busy || run?.status === 'error'}
          allowImages={!meta.agentic && !run}
          emphasized={items.length === 0}
          onSend={props.onSend}
        />
        <p className={styles.disclaimer}>{t('guided.chat.disclaimer')}</p>
      </div>
    </div>
  );
}

// ── Ask card ─────────────────────────────────────────────────────────────────

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable: leave the button as is.
    }
  };
  return { copied, copy };
}

function AskCard({ item, answered }: { item: ThreadItem; answered: boolean }) {
  const { t } = useLocale();
  const { copied, copy } = useCopy(item.text);
  return (
    <div className={styles.askCard}>
      <div className={styles.askHead}>
        <span className={styles.eyebrow}>{t('guided.chat.askEyebrow')}</span>
        {item.agentic && <span className={styles.pill}>{t('guided.pill')}</span>}
      </div>
      <div className={styles.askText}>{item.text}</div>
      {item.attachment && <span className={styles.fileChip}>{t('guided.chat.attachment', { name: item.attachment.name })}</span>}
      {answered && (
        <div className={styles.askFoot}>
          <button type="button" className={styles.primarySmall} onClick={copy}>
            {t(copied ? 'guided.chat.copied' : 'guided.chat.copy')}
          </button>
          <span className={styles.nudge}>{t(item.agentic ? 'guided.chat.nudgeAgentic' : 'guided.chat.nudge')}</span>
        </div>
      )}
    </div>
  );
}

// ── Answer ───────────────────────────────────────────────────────────────────

function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
  );
}

/** Paragraphs, "-" bullets and **bold**: the only formatting answers are asked to use. */
function Rich({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).filter((block) => block.trim());
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        const bullets = lines.filter((line) => /^\s*[-*•]\s+/.test(line));
        if (bullets.length === lines.length) {
          return (
            <ul key={i}>
              {lines.map((line, j) => (
                <li key={j}>{inline(line.replace(/^\s*[-*•]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }
        // A heading line followed by bullets (e.g. "Slide 1: Title").
        if (bullets.length > 0 && bullets.length === lines.length - 1 && !/^\s*[-*•]\s+/.test(lines[0])) {
          return (
            <div key={i} style={{ marginTop: i ? '0.75em' : 0 }}>
              <p>
                <strong>{inline(lines[0].replace(/^#+\s*/, '').replace(/\*\*/g, ''))}</strong>
              </p>
              <ul>
                {lines.slice(1).map((line, j) => (
                  <li key={j}>{inline(line.replace(/^\s*[-*•]\s+/, ''))}</li>
                ))}
              </ul>
            </div>
          );
        }
        return (
          <p key={i}>
            {lines.map((line, j) => (
              <span key={j}>
                {/^#+\s/.test(line) ? <strong>{line.replace(/^#+\s*/, '')}</strong> : inline(line)}
                {j < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </>
  );
}

function duration(ms: number, t: Translate) {
  const seconds = Math.max(1, Math.round(ms / 1000));
  return seconds < 60 ? t('guided.agent.seconds', { n: seconds }) : t('guided.agent.minutes', { n: Math.round(seconds / 60) });
}

function Answer({ item, agentic }: { item: ThreadItem; agentic: boolean }) {
  const { t } = useLocale();
  const parsed = parseAnswer(item.text);
  const { copied, copy } = useCopy(parsed.body);

  let badge = '';
  if (item.receipt && item.model) {
    badge =
      item.receipt.pages > 0
        ? t('guided.agent.receipt', { model: item.model, pages: item.receipt.pages, time: duration(item.receipt.ms, t) })
        : t('guided.agent.receiptNoPages', { model: item.model, time: duration(item.receipt.ms, t) });
  } else if (item.model) {
    badge = t('guided.chat.badge', { model: item.model, reason: t(`guided.chat.reasons.${item.reason ?? 'general'}`) });
  }

  return (
    <div className={styles.answer}>
      {parsed.lead && <p className={styles.lead}>{parsed.lead}</p>}
      <div className={styles.rail}>
        <Rich text={parsed.body} />
      </div>
      {parsed.rows.length > 0 && (
        <div className={styles.rows}>
          {parsed.rows.map((row) => (
            <div key={row.name} className={`${styles.row} ${row.out ? styles.rowOut : ''}`}>
              <span className={styles.rowName}>{row.name}</span>
              <span className={styles.rowFacts}>{row.facts}</span>
            </div>
          ))}
        </div>
      )}
      <div className={styles.answerMeta}>
        {badge && <span className={styles.badge}>{badge}</span>}
        {!agentic && (
          <button type="button" className={styles.linkButton} onClick={copy}>
            {t(copied ? 'guided.chat.copied' : 'guided.chat.copyAnswer')}
          </button>
        )}
      </div>
      {item.sources && item.sources.length > 0 && (
        <p className={styles.sources}>
          {t('guided.chat.sources')}
          {item.sources.map((source) => {
            if (!/^https?:\/\//i.test(source.url)) return null;
            let host = source.url;
            try {
              host = new URL(source.url).hostname.replace(/^www\./, '');
            } catch {
              // Keep the raw value.
            }
            return (
              <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer nofollow" title={source.title}>
                {host}
              </a>
            );
          })}
        </p>
      )}
    </div>
  );
}

// ── Agent: permission, progress ──────────────────────────────────────────────

function Permission({ run, onAllow, onDecline }: { run: AgentRun; onAllow: () => void; onDecline: () => void }) {
  const { t } = useLocale();
  const will = run.kind === 'web' ? ['willWeb', 'willSave'] : ['willData', 'willSave'];
  return (
    <div className={styles.permission} role="group" aria-label={t('guided.agent.permission.title')}>
      <p className={styles.cardTitleSerif}>{t('guided.agent.permission.title')}</p>
      <p className={styles.permissionSub}>{t('guided.agent.permission.sub')}</p>
      <Notes run={run} />
      <ul className={styles.permList}>
        {will.map((key) => (
          <li key={key}>
            <span className={`${styles.disc} ${styles.discDone}`} aria-hidden="true">
              ✓
            </span>
            {t(`guided.agent.permission.${key}`)}
          </li>
        ))}
      </ul>
      <div className={styles.divider} style={{ marginBottom: 14 }} />
      <ul className={`${styles.permList} ${styles.permWont}`}>
        {['wontSignIn', 'wontSend'].map((key) => (
          <li key={key}>
            <span className={`${styles.disc} ${styles.discNo}`} aria-hidden="true">
              ×
            </span>
            {t(`guided.agent.permission.${key}`)}
          </li>
        ))}
      </ul>
      <div className={styles.permActions}>
        <button type="button" className={styles.primary} onClick={onAllow}>
          {t('guided.agent.permission.allow')} <span aria-hidden="true">→</span>
        </button>
        <button type="button" className={styles.linkButton} onClick={onDecline}>
          {t('guided.agent.permission.notNow')}
        </button>
      </div>
    </div>
  );
}

function Notes({ run }: { run: AgentRun }) {
  const { t } = useLocale();
  if (!run.notes.length) return null;
  return (
    <ul className={styles.notes}>
      {run.notes.map((note, i) => (
        <li key={i}>{t('guided.agent.working.noted', { note })}</li>
      ))}
    </ul>
  );
}

function Working({ run, onPause, onResume }: { run: AgentRun; onPause: () => void; onResume: () => void }) {
  const { t } = useLocale();
  const steps = agentSteps(run);
  const lastSearch = run.searches[run.searches.length - 1];

  const label = (phase: string, state: string) => {
    const base = `guided.agent.steps.${phase}`;
    if (phase === 'search') {
      if (state === 'current' && lastSearch) return t(`${base}.currentDetail`, { query: lastSearch });
      if (state === 'done') return run.searches.length > 1 ? t(`${base}.done`, { n: run.searches.length }) : t(`${base}.doneOne`);
    }
    if (phase === 'read') {
      if (state === 'current' && run.pagesRead > 0) return t(`${base}.currentDetail`, { n: run.pagesRead });
      if (state === 'done') return run.pagesRead > 0 ? t(`${base}.done`, { n: run.pagesRead }) : t(`${base}.doneNone`);
    }
    return t(`${base}.${state}`);
  };

  return (
    <div>
      <div className={styles.workHead}>
        <h2 className={styles.workTitle}>
          {run.status === 'paused'
            ? t('guided.agent.working.paused')
            : t(run.kind === 'data' ? 'guided.agent.working.titleData' : 'guided.agent.working.title')}
        </h2>
        {run.status === 'running' && <span className={styles.small}>{t('guided.agent.working.eta')}</span>}
      </div>

      {run.status === 'error' ? (
        <p className={styles.notice} role="alert">
          {t(run.error === 'busy' ? 'guided.chat.errorBusy' : run.error === 'declined' ? 'guided.chat.declined' : 'guided.agent.working.failed')}
        </p>
      ) : (
        <ol className={styles.steps} aria-live="polite">
          {steps.map((step) => {
            const state = run.status === 'paused' && step.state === 'current' ? 'pending' : step.state;
            return (
              <li
                key={step.phase}
                className={`${styles.step} ${state === 'done' ? styles.stepDone : ''} ${state === 'current' ? styles.stepCurrent : ''}`}
              >
                <span
                  aria-hidden="true"
                  className={`${styles.disc} ${state === 'done' ? styles.discDone : state === 'current' ? styles.discCurrent : styles.discPending}`}
                >
                  {state === 'done' ? '✓' : ''}
                </span>
                {label(step.phase, state)}
              </li>
            );
          })}
        </ol>
      )}

      <Notes run={run} />

      <div className={styles.workActions}>
        {run.status === 'running' && (
          <>
            <button type="button" className={styles.ghostPill} onClick={onPause}>
              {t('guided.agent.working.pause')}
            </button>
            <span className={styles.small}>{t('guided.agent.working.keepOpen')}</span>
          </>
        )}
        {run.status === 'paused' && (
          <>
            <button type="button" className={styles.ghostPill} onClick={onResume}>
              {t('guided.agent.working.resume')}
            </button>
            <span className={styles.small}>{t('guided.agent.working.pausedNote')}</span>
          </>
        )}
        {run.status === 'error' && (
          <button type="button" className={styles.ghostPill} onClick={onResume}>
            {t('guided.agent.working.retry')}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Graduation (screen 1h) ───────────────────────────────────────────────────

function Graduation({ progress, onDismiss, onBringBack }: { progress: GuidedProgress; onDismiss: () => void; onBringBack: () => void }) {
  const { t } = useLocale();
  return (
    <div className={styles.center}>
      <div className={styles.gradCard} role="dialog" aria-labelledby="graduation-title">
        <div className={styles.gradHead}>
          <h1 id="graduation-title" className={styles.gradTitle}>
            {t('guided.graduation.title')}
          </h1>
          <button type="button" className={styles.gradClose} onClick={onDismiss} aria-label={t('guided.graduation.close')}>
            ×
          </button>
        </div>
        <p className={styles.gradBody}>{t('guided.graduation.body')}</p>
        <div className={styles.gradQuotes}>
          {progress.recentPrompts.map((prompt, i) => (
            <div key={i} className={styles.gradQuote}>
              “{quotePrompt(prompt)}”
            </div>
          ))}
        </div>
        <div className={styles.divider} style={{ marginBottom: 17 }} />
        <div className={styles.gradFoot}>
          <p>{t('guided.graduation.footer')}</p>
          <button type="button" className={styles.primarySmall} onClick={onDismiss}>
            {t('guided.graduation.gotIt')}
          </button>
        </div>
      </div>
      <button type="button" className={`${styles.linkButton} ${styles.bringBack}`} onClick={onBringBack}>
        {t('guided.graduation.bringBack')}
      </button>
    </div>
  );
}

// ── Chat input ───────────────────────────────────────────────────────────────

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onloadend = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('not an image'));
      img.onload = () => {
        const MAX_DIM = 1200;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface InputProps {
  placeholder: string;
  disabled: boolean;
  allowImages: boolean;
  emphasized: boolean;
  onSend: (text: string, images: string[]) => void;
}

function ChatInput({ placeholder, disabled, allowImages, emphasized, onSend }: InputProps) {
  const { t } = useLocale();
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    el.style.overflowY = el.scrollHeight > 160 ? 'auto' : 'hidden';
  }, [text]);

  const canSend = !disabled && (text.trim().length > 0 || images.length > 0);
  const send = () => {
    if (!canSend) return;
    onSend(text.trim(), allowImages ? images : []);
    setText('');
    setImages([]);
    setError('');
  };

  const addImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;
    if (images.length + files.length > MAX_IMAGES) {
      setError(t('guided.chat.photoLimit', { max: MAX_IMAGES }));
      return;
    }
    try {
      const added = await Promise.all(files.map(compressImage));
      setImages((current) => [...current, ...added]);
      setError('');
    } catch {
      setError(t('guided.chat.error'));
    }
  };

  return (
    <div
      className={`${styles.inputCard} ${disabled ? styles.inputDisabled : ''}`}
      style={emphasized ? { borderColor: '#b3b1a8', padding: '15.3px 17px 11.9px' } : undefined}
    >
      {error && (
        <p className={styles.inputError} role="alert">
          {error}
        </p>
      )}
      {images.length > 0 && (
        <div className={styles.thumbs}>
          {images.map((src, i) => (
            <div key={i} className={styles.thumb}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={t('guided.chat.photoAlt')} />
              <button
                type="button"
                className={styles.thumbRemove}
                aria-label={t('guided.chat.removePhoto')}
                onClick={() => setImages((current) => current.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <textarea
        ref={areaRef}
        className={styles.inputText}
        rows={1}
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={20000}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
          }
        }}
      />
      <div className={styles.inputRow}>
        <input ref={fileRef} type="file" accept="image/*" multiple className={styles.hiddenInput} onChange={addImages} />
        <button
          type="button"
          className={styles.plus}
          disabled={disabled || !allowImages}
          aria-label={t('guided.chat.addPhoto')}
          title={t('guided.chat.addPhoto')}
          onClick={() => fileRef.current?.click()}
        >
          +
        </button>
        <button type="button" className={styles.send} disabled={!canSend} aria-label={t('guided.chat.send')} onClick={send}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 12V2M7 2L2.5 6.5M7 2l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
