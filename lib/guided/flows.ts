import type { FlowDef, QuestionDef, TaskCategory, VariantDef } from './types';

// Structure only. Every label, prompt fragment and clause template lives in
// messages/guided/<locale>.json under `flows.<category>…` so each language can
// phrase the composed prompt naturally.

const o = (...ids: string[]) => ids.map((id) => ({ id }));
const refine = (...ids: string[]) => ids.map((id) => ({ id, refine: true }));

const MUST: QuestionDef = {
  id: 'must',
  multi: true,
  custom: true,
  options: o('budget', 'reviewed', 'easy', 'commit'),
};

export const FLOWS: Record<TaskCategory, FlowDef> = {
  write: {
    category: 'write',
    q1: { id: 'q1', custom: true, options: o('message', 'essay', 'summary') },
    variants: {
      message: {
        questions: [{ id: 'who', custom: true, options: o('colleague', 'landlord', 'friend') }],
        suggestions: ['deadline', 'reach', 'tone'],
      },
      essay: {
        questions: [{ id: 'who', custom: true, options: o('teacher', 'class', 'general') }],
        suggestions: ['length', 'points', 'tone'],
      },
      summary: {
        questions: [{ id: 'who', custom: true, options: o('manager', 'team', 'me') }],
        suggestions: ['length', 'focus', 'tone'],
      },
      custom: {
        questions: [{ id: 'who', custom: true, options: o('work', 'friend', 'company') }],
        suggestions: ['length', 'points', 'tone'],
      },
    },
  },
  understand: {
    category: 'understand',
    q1: { id: 'q1', custom: true, options: o('explain', 'summary', 'translate') },
    variants: {
      explain: {
        questions: [{ id: 'how', custom: true, options: o('plain', 'steps', 'example') }],
        suggestions: ['know', 'why', 'length'],
      },
      summary: {
        questions: [{ id: 'how', custom: true, options: o('bullets', 'paragraph', 'sentence') }],
        suggestions: ['focus', 'reader', 'skip'],
      },
      translate: {
        questions: [{ id: 'lang', custom: true, options: o('english', 'spanish', 'french') }],
        suggestions: ['tone', 'reader', 'keep'],
      },
      custom: {
        questions: [],
        suggestions: ['know', 'why', 'length'],
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
          { id: 'what', custom: true, options: refine('tools', 'places', 'suppliers') },
          MUST,
        ],
        suggestions: ['handback', 'now', 'when'],
      },
      deck: {
        web: true,
        questions: [
          { id: 'for', custom: true, options: o('work', 'class', 'pitch') },
          { id: 'include', multi: true, custom: true, options: o('story', 'numbers', 'notes', 'short') },
        ],
        suggestions: ['audience', 'length', 'when'],
      },
      sheet: {
        attach: true,
        questions: [
          { id: 'what', custom: true, options: o('sales', 'budget', 'survey') },
          { id: 'want', multi: true, custom: true, options: o('takeaways', 'unusual', 'trends', 'share') },
        ],
        suggestions: ['columns', 'decide', 'when'],
      },
      custom: {
        web: true,
        questions: [MUST],
        suggestions: ['handback', 'now', 'when'],
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
  { id: 'austin', category: 'agentic', variant: 'custom' },
  { id: 'emails', category: 'understand', variant: 'custom' },
  { id: 'birthday', category: 'write', variant: 'message' },
  { id: 'paris', category: 'agentic', variant: 'custom' },
  { id: 'flights', category: 'agentic', variant: 'research' },
  { id: 'deck', category: 'agentic', variant: 'deck' },
  { id: 'sheet', category: 'agentic', variant: 'sheet' },
  { id: 'translate', category: 'understand', variant: 'translate' },
];
