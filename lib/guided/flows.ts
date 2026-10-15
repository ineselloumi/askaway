import type { FlowDef, QuestionDef, TaskCategory, VariantDef } from './types';

// Structure only. Every label, prompt fragment and clause template lives in
// messages/guided/<locale>.json under `flows.<category>…` so each language can
// phrase the composed prompt naturally.

const o = (...ids: string[]) => ids.map((id) => ({ id }));

/** The subject of the job, typed straight into the prompt after its lead-in. */
const TOPIC: QuestionDef = { id: 'topic', blank: true, options: [] };

const MUST: QuestionDef = {
  id: 'must',
  multi: true,
  custom: true,
  options: o('budget', 'enterprise', 'integrates', 'commit'),
};

export const FLOWS: Record<TaskCategory, FlowDef> = {
  write: {
    category: 'write',
    q1: { id: 'q1', custom: true, options: o('email', 'report', 'summary', 'plan') },
    variants: {
      email: {
        questions: [{ id: 'who', custom: true, options: o('manager', 'customer', 'colleague') }],
        suggestions: ['deadline', 'ask', 'tone'],
      },
      report: {
        questions: [{ id: 'who', custom: true, options: o('leadership', 'team', 'client') }],
        suggestions: ['length', 'points', 'data'],
      },
      summary: {
        questions: [{ id: 'who', custom: true, options: o('manager', 'team', 'stakeholders') }],
        suggestions: ['length', 'focus', 'decisions'],
      },
      plan: {
        questions: [{ id: 'who', custom: true, options: o('manager', 'team', 'client') }],
        suggestions: ['goal', 'timeline', 'methods'],
      },
      custom: {
        questions: [{ id: 'who', custom: true, options: o('manager', 'team', 'client') }],
        suggestions: ['length', 'points', 'tone'],
      },
    },
  },
  understand: {
    category: 'understand',
    q1: { id: 'q1', custom: true, options: o('explain', 'summary', 'translate') },
    variants: {
      explain: {
        questions: [{ id: 'how', custom: true, options: o('plain', 'steps', 'implications') }],
        suggestions: ['role', 'purpose', 'answerLength'],
      },
      summary: {
        questions: [{ id: 'how', custom: true, options: o('takeaways', 'executive', 'actions') }],
        suggestions: ['focus', 'reader', 'skip'],
      },
      translate: {
        questions: [{ id: 'lang', custom: true, options: o('english', 'spanish', 'mandarin') }],
        suggestions: ['register', 'reader', 'keep'],
      },
      custom: {
        questions: [],
        suggestions: ['role', 'purpose', 'answerLength'],
      },
    },
  },
  agentic: {
    category: 'agentic',
    q1: { id: 'q1', custom: true, options: o('research', 'deck', 'sheet') },
    variants: {
      research: {
        web: true,
        questions: [
          { id: 'what', custom: true, options: o('tools', 'partners', 'suppliers') },
          TOPIC,
          MUST,
        ],
        suggestions: ['handback', 'current', 'when'],
      },
      deck: {
        web: true,
        questions: [
          TOPIC,
          { id: 'for', custom: true, options: o('leadership', 'pitch', 'team') },
          { id: 'include', multi: true, custom: true, options: o('story', 'metrics', 'recs', 'short') },
        ],
        suggestions: ['audience', 'presentLength', 'when'],
      },
      sheet: {
        attach: true,
        questions: [
          { id: 'what', custom: true, options: o('sales', 'forecast', 'feedback') },
          TOPIC,
          { id: 'want', multi: true, custom: true, options: o('insights', 'risks', 'trends', 'share') },
        ],
        suggestions: ['columns', 'decide', 'when'],
      },
      custom: {
        web: true,
        questions: [MUST],
        suggestions: ['handback', 'current', 'when'],
      },
    },
  },
};

/** The variant chosen by the q1 answer. Typed answers use `custom`. Null until q1 is answered. */
export function variantId(category: TaskCategory, q1OptionId: string | undefined | null, answered: boolean): string | null {
  if (!answered) return null;
  const flow = FLOWS[category];
  return q1OptionId && flow.variants[q1OptionId] ? q1OptionId : 'custom';
}

export function getVariant(category: TaskCategory, id: string | null): VariantDef | null {
  return id ? FLOWS[category].variants[id] ?? null : null;
}

/** Message-key prefix for a variant's strings. */
export const variantKey = (category: TaskCategory, id: string) => `guided.flows.${category}.variants.${id}`;

/**
 * The marquee ideas on the setup screen. Each one drops the user into the
 * matching flow with a starter prompt already in the builder.
 */
export const IDEAS: { id: string; category: TaskCategory; variant: string }[] = [
  { id: 'followup', category: 'write', variant: 'email' },
  { id: 'status', category: 'write', variant: 'email' },
  { id: 'competitors', category: 'agentic', variant: 'research' },
  { id: 'deck', category: 'agentic', variant: 'deck' },
  { id: 'sheet', category: 'agentic', variant: 'sheet' },
  { id: 'contract', category: 'understand', variant: 'explain' },
  { id: 'notes', category: 'understand', variant: 'summary' },
  { id: 'plan', category: 'write', variant: 'plan' },
];
