import type { Readiness } from './readiness';
import type { TaskCategory } from './types';

// Quality-driven readiness: instead of counting answered questions, a fast
// model reads the prompt and answers four yes/no checks. The fill is the
// number of checks met, and the first unmet check becomes the helper hint.

export type CheckId =
  | 'task'
  | 'audience'
  | 'subject'
  | 'preference'
  | 'manner'
  | 'context'
  | 'constraints'
  | 'handback';

export interface CheckDef {
  id: CheckId;
  /** The yes/no question put to the model. */
  question: string;
  yes: string;
  no: string;
}

const TASK: CheckDef = {
  id: 'task',
  question: 'Does the request say what should be produced or done?',
  yes: 'It names a concrete output or action, such as a message, an explanation, a summary or a comparison',
  no: 'It is unclear what the person wants',
};

/** Four checks per task type, in the order their hints are offered. */
export const CHECKS: Record<TaskCategory | 'chat', CheckDef[]> = {
  write: [
    TASK,
    {
      id: 'subject',
      question: 'Does the request say what the piece of writing should be about or what it should say?',
      yes: 'It states the topic, the news to share, or the points the writing should make',
      no: 'It names a kind of writing or a recipient but not what it should say',
    },
    {
      id: 'audience',
      question: 'Does the request say who the writing is for?',
      yes: 'It names a reader or recipient, such as a colleague, a landlord, a teacher or the person themselves',
      no: 'No reader or recipient is mentioned',
    },
    {
      id: 'preference',
      question: 'Does the request give at least one preference for how the writing should come out?',
      yes: 'It states a tone, a length, a format, a deadline or points that must be included',
      no: 'It gives no preference about tone, length, format or content',
    },
  ],
  understand: [
    TASK,
    {
      id: 'subject',
      question: 'Does the request include or clearly describe the material or topic to work on?',
      yes: 'It contains the text, link or data, or names the specific topic or question',
      no: 'It only refers to "this" or "it" without including or describing the material',
    },
    {
      id: 'manner',
      question: 'Does the request say how the answer should be delivered?',
      yes: 'It asks for plain words, steps, an example, a length, a format or a target language',
      no: 'It says nothing about style, length, format or language',
    },
    {
      id: 'context',
      question: 'Does the request give background about the person or their purpose?',
      yes: 'It says who it is for, what they already know, or why they are asking',
      no: 'It gives no background about the person or their reason for asking',
    },
  ],
  agentic: [
    TASK,
    {
      id: 'subject',
      question: 'Does the request say specifically what the job is about?',
      yes: 'It names the specific things to research, the topic of the deck, or the data to analyse',
      no: 'It is generic, such as "compare options", without saying which things or what topic',
    },
    {
      id: 'constraints',
      question: 'Does the request state at least one requirement the result must meet?',
      yes: 'It gives a budget, a size, a must-have, a limit or something to exclude',
      no: 'It states no requirement, limit or must-have',
    },
    {
      id: 'handback',
      question: 'Does the request say what should be handed back, or by when?',
      yes: 'It asks for a specific result, such as a recommendation, a shortlist, a number of slides or a summary, or gives a deadline',
      no: 'It does not say what result to hand back or when it is needed',
    },
  ],
  chat: [],
};

export type Scores = Partial<Record<CheckId, number>>;
export type Met = Partial<Record<CheckId, boolean>>;

/** A check turns on at this probability and stays on until it drops below OFF. */
export const ON = 0.55;
export const OFF = 0.4;

/**
 * Turn probabilities into met/unmet. The gap between ON and OFF stops the
 * fill flickering when a borderline prompt is re-scored after a small edit.
 */
export function applyScores(category: TaskCategory, scores: Scores, previous: Met | null): Met {
  const met: Met = {};
  for (const { id } of CHECKS[category]) {
    const score = scores[id];
    if (typeof score !== 'number' || Number.isNaN(score)) {
      met[id] = previous?.[id] ?? false;
      continue;
    }
    met[id] = previous?.[id] ? score >= OFF : score >= ON;
  }
  return met;
}

/** The fill is simply how many of the four checks are met. */
export function qualityReadiness(category: TaskCategory, met: Met): Readiness {
  return CHECKS[category].filter(({ id }) => met[id]).length as Readiness;
}

/**
 * Checks that still count towards the fill but never become the helper line:
 * the guided questions already ask who the piece is for and what it is about.
 */
export const SILENT_CHECKS: ReadonlySet<CheckId> = new Set<CheckId>(['subject', 'audience']);

/** The most useful thing to add next: the first unmet check that has a hint. */
export function nextHint(category: TaskCategory, met: Met): CheckId | null {
  return CHECKS[category].find(({ id }) => !met[id] && !SILENT_CHECKS.has(id))?.id ?? null;
}
