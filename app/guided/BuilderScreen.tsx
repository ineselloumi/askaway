'use client';

import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { track } from '@/lib/guided/analytics';
import { builderReducer, builderView, initBuilder } from '@/lib/guided/builder';
import { asList, opt } from '@/lib/guided/compose';
import { FLOWS, variantKey } from '@/lib/guided/flows';
import { nextHint, qualityReadiness } from '@/lib/guided/quality';
import { readinessStep, type Readiness } from '@/lib/guided/readiness';
import type { AnswerValue, QuestionDef, Segment, TaskCategory } from '@/lib/guided/types';
import styles from './guided.module.css';
import { useQuality } from './useQuality';

export interface Attachment {
  name: string;
  text: string;
}

export interface BuiltPrompt {
  prompt: string;
  category: TaskCategory;
  variant: string;
  readiness: Readiness;
  /** True when the readiness came from the quality check rather than the answer count. */
  scored: boolean;
  edited: boolean;
  via: 'button' | 'link';
  attachment?: Attachment;
}

interface Props {
  category: TaskCategory;
  prefill?: { variant: string; text: string };
  onSubmit: (built: BuiltPrompt) => void;
}

const MAX_ATTACHMENT = 60_000;

export default function BuilderScreen({ category, prefill, onSubmit }: Props) {
  const { t } = useLocale();
  const [state, dispatch] = useReducer(builderReducer, undefined, () => initBuilder(category, prefill));
  const view = useMemo(() => builderView(state, t), [state, t]);
  const [nudged, setNudged] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [attachError, setAttachError] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const agentic = category === 'agentic';
  const flowKey = `guided.flows.${category}`;

  // Readiness: a fast model checks what the prompt actually says. Until its
  // first answer (or when it is unavailable) the fill counts answered questions.
  const typingRef = useRef(false);
  const checkedText = attachment ? `${view.sendText}\n\n[Attached file: ${attachment.name}]` : view.sendText;
  const met = useQuality(checkedText, category, typingRef.current);
  const readiness: Readiness = met ? qualityReadiness(category, met) : view.readiness;
  const hint = met ? nextHint(category, met) : null;

  // On the last step the cursor waits at the end of the prompt (screens 1d / 2c).
  // Skipped on touch screens, where it would open the keyboard over the page.
  const focusEnd = () => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  };
  useEffect(() => {
    if (!view.atLastStep) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches) focusEnd();
  }, [view.atLastStep]);

  // After a suggestion chip adds a starter, continue typing right after it.
  const focusAfterUpdate = useRef(false);
  useEffect(() => {
    if (!focusAfterUpdate.current) return;
    focusAfterUpdate.current = false;
    focusEnd();
  }, [view.editorText]);

  const prefixFor = (question: QuestionDef) => {
    if (question.id === 'q1') return `${flowKey}.q1`;
    const vid = view.variantId ?? FLOWS[category].q1.options[0].id;
    return `${variantKey(category, vid)}.questions.${question.id}`;
  };

  const answer = (question: QuestionDef, value: AnswerValue) => {
    typingRef.current = false;
    setNudged(false);
    track('question_answered', { category, question: question.id, option: value.optionId ?? 'typed' });
    dispatch({ type: question.multi ? 'toggle' : 'answer', questionId: question.id, value });
  };

  const submit = (via: 'button' | 'link') => {
    if (!view.sendText) {
      setNudged(true);
      editorRef.current?.focus();
      return;
    }
    onSubmit({
      prompt: view.sendText,
      category,
      variant: view.variantId ?? 'custom',
      readiness,
      scored: !!met,
      edited: state.promptEdited,
      via,
      attachment: attachment ?? undefined,
    });
  };

  const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      // Binary files (e.g. .xlsx) read as text contain NUL characters.
      if (!text.trim() || text.length > MAX_ATTACHMENT || text.includes('\u0000')) throw new Error('unsupported');
      setAttachment({ name: file.name, text });
      setAttachError(false);
    } catch {
      setAttachment(null);
      setAttachError(true);
    }
  };

  const activeQuestion = view.questions.find((q) => q.id === view.activeId);
  const title = prefill
    ? t('guided.builder.prefillTitle')
    : view.atLastStep
      ? t('guided.builder.lastTitle')
      : t(`${flowKey}.title`);
  const sub = prefill
    ? t('guided.builder.prefillSub')
    : view.atLastStep
      ? t('guided.builder.lastSub')
      : view.remaining === 1 && view.questions.length > 1
        ? t(`${flowKey}.subOne`)
        : t(`${flowKey}.sub`);
  const helper = nudged
    ? t('guided.builder.helperEmpty')
    : view.atLastStep
      ? hint
        ? t(`guided.builder.hints.${hint}`)
        : t('guided.builder.helperLast')
      : activeQuestion?.multi
        ? t('guided.builder.helperMulti')
        : t(`${flowKey}.helper`);

  const step = readinessStep(readiness);
  const suggestionBase = view.variantId ? `${variantKey(category, view.variantId)}.suggestions` : '';

  return (
    <div className={styles.builderScreen}>
      <div className={styles.questions}>
        <div className={styles.screenHead}>
          {agentic && <span className={styles.pill}>{t('guided.pill')}</span>}
          <h1 className={styles.screenTitle}>{title}</h1>
          <p className={styles.screenSub}>{sub}</p>
        </div>

        {view.questions.map((question) => {
          const values = asList(state.answers[question.id]);
          const active = question.id === view.activeId;
          const status = active ? 'active' : values.length ? 'answered' : 'upcoming';
          return (
            <QuestionBlock
              key={`${view.variantId ?? 'preview'}-${question.id}`}
              question={question}
              prefix={prefixFor(question)}
              status={status}
              values={values}
              onAnswer={(value) => answer(question, value)}
              onConfirm={() => dispatch({ type: 'confirm', questionId: question.id })}
              onReopen={() => dispatch({ type: 'reopen', questionId: question.id })}
            />
          );
        })}
      </div>

      <div className={styles.dock}>
        <div className={`${styles.promptCard} ${view.atLastStep ? styles.promptCardFocus : ''}`}>
          <PromptEditor
            ref={editorRef}
            text={view.editorText}
            segments={view.segments}
            ghost={view.ghost}
            label={t('guided.builder.promptLabel')}
            onChange={(text) => {
              typingRef.current = true;
              setNudged(false);
              dispatch({ type: 'edit', text });
            }}
            onSubmit={() => submit('button')}
          />

          {view.atLastStep && view.variant && (
            <div className={styles.suggestions}>
              {view.variant.suggestions.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={styles.suggestion}
                  onClick={() => {
                    typingRef.current = false;
                    dispatch({
                      type: 'append',
                      starter: t(`${suggestionBase}.${id}.starter`),
                      composedText: view.composedText,
                    });
                    track('suggestion_used', { category, suggestion: id });
                    focusAfterUpdate.current = true;
                  }}
                >
                  {t(`${suggestionBase}.${id}.label`)}
                </button>
              ))}
            </div>
          )}

          {view.atLastStep && view.variant?.attach && (
            <div className={styles.attachRow}>
              <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" className={styles.hiddenInput} onChange={onFile} />
              {attachment ? (
                <>
                  <span>{t('guided.builder.attached', { name: attachment.name })}</span>
                  <button type="button" className={styles.linkButton} onClick={() => setAttachment(null)}>
                    {t('guided.builder.removeAttachment')}
                  </button>
                </>
              ) : (
                <button type="button" className={`${styles.chip} ${styles.chipDashed}`} onClick={() => fileRef.current?.click()}>
                  + {t('guided.builder.attach')}
                </button>
              )}
              {attachError && <span role="alert">{t('guided.builder.attachError')}</span>}
            </div>
          )}

          <div className={styles.divider} />
          <div className={styles.promptFoot}>
            <span className={styles.helper} role={nudged ? 'alert' : undefined}>
              {helper}
            </span>
            <button
              type="button"
              className={`${styles.readiness} ${step.tone === 'empty' ? styles.readinessEmpty : ''} ${step.tone === 'done' ? styles.readinessDone : ''}`}
              onClick={() => submit('button')}
            >
              <span className={styles.readinessFill} style={{ width: `${step.tone === 'filling' ? step.fillPct : 0}%` }} />
              <span className={styles.readinessLabel}>{t(step.labelKey)}</span>
              <span className={styles.readinessArrow} aria-hidden="true">
                →
              </span>
            </button>
          </div>
        </div>
        <button type="button" className={`${styles.linkButton} ${styles.goNow}`} onClick={() => submit('link')}>
          {t('guided.builder.goNow')}
        </button>
      </div>
    </div>
  );
}

// ── Question block ───────────────────────────────────────────────────────────

interface QuestionProps {
  question: QuestionDef;
  prefix: string;
  status: 'active' | 'answered' | 'upcoming';
  values: AnswerValue[];
  onAnswer: (value: AnswerValue) => void;
  onConfirm: () => void;
  onReopen: () => void;
}

function QuestionBlock({ question, prefix, status, values, onAnswer, onConfirm, onReopen }: QuestionProps) {
  const { t } = useLocale();
  // `typing` is null, 'custom' (the dashed chip), or the id of an option being made more specific.
  const [typing, setTyping] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const optionValue = (id: string): AnswerValue => ({
    optionId: id,
    label: t(`${prefix}.options.${id}.label`),
    fragment: t(`${prefix}.options.${id}.fragment`),
  });

  const commitTyped = () => {
    const text = draft.trim().replace(/[.\s]+$/, '');
    if (typing && typing !== 'custom') {
      // Refining a chip: empty keeps the general wording.
      onAnswer(text ? { optionId: typing, label: text.charAt(0).toUpperCase() + text.slice(1), fragment: text } : optionValue(typing));
    } else if (text) {
      onAnswer({ label: text.charAt(0).toUpperCase() + text.slice(1), fragment: text });
    } else {
      return;
    }
    setTyping(null);
    setDraft('');
  };

  const label = (
    <p className={`${styles.qLabel} ${status === 'active' ? styles.qLabelActive : ''}`}>{t(`${prefix}.label`)}</p>
  );

  if (status === 'answered') {
    return (
      <div className={styles.question}>
        {label}
        <div className={styles.chips}>
          <button type="button" className={styles.chip} onClick={onReopen} title={t('guided.builder.change')}>
            {values.map((v) => v.label).join(' · ')} ✓
          </button>
        </div>
      </div>
    );
  }

  if (status === 'upcoming') {
    return (
      <div className={styles.question} aria-hidden="true">
        {label}
        <div className={styles.chips}>
          {question.options.map((option) => (
            <span key={option.id} className={`${styles.chip} ${styles.chipUpcoming}`}>
              {t(`${prefix}.options.${option.id}.label`)}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const isSelected = (id: string) => values.some((v) => v.optionId === id);
  const typedValues = values.filter((v) => !v.optionId);
  const placeholder =
    typing && typing !== 'custom'
      ? t(`${prefix}.options.${typing}.refine`)
      : opt(t, `${prefix}.typePlaceholder`) || t('guided.builder.typePlaceholder');

  return (
    <div className={styles.question}>
      {label}
      <div className={styles.chips} role="group" aria-label={t(`${prefix}.label`)}>
        {question.options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={isSelected(option.id) || typing === option.id}
            className={`${styles.chip} ${isSelected(option.id) || typing === option.id ? styles.chipSelected : ''}`}
            onClick={() => {
              if (option.refine && !question.multi) {
                setTyping(option.id);
                setDraft('');
              } else {
                setTyping(null);
                onAnswer(optionValue(option.id));
              }
            }}
          >
            {t(`${prefix}.options.${option.id}.label`)}
          </button>
        ))}

        {question.multi &&
          typedValues.map((value) => (
            <button key={value.label} type="button" aria-pressed className={`${styles.chip} ${styles.chipSelected}`} onClick={() => onAnswer(value)}>
              {value.label}
            </button>
          ))}

        {typing ? (
          <span className={styles.typeRow}>
            <input
              autoFocus
              className={styles.typeInput}
              value={draft}
              placeholder={placeholder}
              aria-label={placeholder}
              maxLength={160}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitTyped();
                }
                if (e.key === 'Escape') setTyping(null);
              }}
            />
            <button type="button" className={styles.typeAdd} onClick={commitTyped}>
              {typing !== 'custom' && !draft.trim() ? t('guided.builder.skip') : t('guided.builder.add')}
            </button>
          </span>
        ) : (
          question.custom && (
            <button type="button" className={`${styles.chip} ${styles.chipDashed}`} onClick={() => setTyping('custom')}>
              {t(question.multi ? 'guided.builder.addYourOwn' : 'guided.builder.typeInstead')}
            </button>
          )
        )}

        {question.multi && values.length > 0 && !typing && (
          <button type="button" className={`${styles.chip} ${styles.chipDone}`} onClick={onConfirm}>
            {t('guided.builder.doneMulti')}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Prompt editor ────────────────────────────────────────────────────────────

interface EditorProps {
  ref: React.Ref<HTMLTextAreaElement>;
  text: string;
  segments: Segment[];
  ghost: string;
  label: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
}

/**
 * A real textarea (so the user can type over the prompt at any time) laid over
 * a mirror that draws what a textarea cannot: the underlines under
 * answer-derived fragments and the muted hint after the text.
 */
function PromptEditor({ ref, text, segments, ghost, label, onChange, onSubmit }: EditorProps) {
  const composedLength = segments.reduce((n, s) => n + s.text.length, 0);
  return (
    <div className={styles.editor}>
      <div className={styles.mirror} aria-hidden="true">
        {segments.length > 0 ? (
          <>
            {segments.map((segment, i) => (
              <span key={i} className={segment.kind === 'answer' ? styles.frag : undefined}>
                {segment.text}
              </span>
            ))}
            {text.slice(composedLength)}
          </>
        ) : (
          text
        )}
        <span className={styles.ghost}>{ghost}</span>
        {'​'}
      </div>
      <textarea
        ref={ref}
        className={styles.editorInput}
        value={text}
        aria-label={label}
        spellCheck
        maxLength={20000}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
    </div>
  );
}
