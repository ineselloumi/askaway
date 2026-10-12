import { appendStarter, asList, composePrompt, isAnswered, questionsFor } from './compose';
import { FLOWS, getVariant, variantId } from './flows';
import { computeReadiness, type Readiness } from './readiness';
import type { Answers, AnswerValue, QuestionDef, Segment, TaskCategory, Translate, VariantDef } from './types';

export interface BuilderState {
  category: TaskCategory;
  answers: Answers;
  /** Multi-select questions the user has confirmed with "that's all". */
  confirmed: string[];
  /** A previously answered question the user tapped to change. */
  reopened: string | null;
  /** True once the user types in the prompt. From then on answers stop rewriting it. */
  promptEdited: boolean;
  promptText: string;
  /** Set when the flow started from an idea chip: no questions, just a starter prompt. */
  prefill: { variant: string; text: string } | null;
}

export type BuilderAction =
  | { type: 'answer'; questionId: string; value: AnswerValue }
  | { type: 'toggle'; questionId: string; value: AnswerValue }
  | { type: 'confirm'; questionId: string }
  | { type: 'reopen'; questionId: string }
  | { type: 'edit'; text: string }
  | { type: 'append'; starter: string; composedText: string };

export function initBuilder(category: TaskCategory, prefill?: { variant: string; text: string }): BuilderState {
  return {
    category,
    answers: {},
    confirmed: [],
    reopened: null,
    promptEdited: !!prefill,
    promptText: prefill?.text ?? '',
    prefill: prefill ?? null,
  };
}

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'answer': {
      const previous = asList(state.answers.q1)[0];
      let answers: Answers = { ...state.answers, [action.questionId]: action.value };
      let confirmed = state.confirmed;
      if (action.questionId === 'q1') {
        const before = variantId(state.category, previous?.optionId, !!previous);
        const after = variantId(state.category, action.value.optionId, true);
        // A different kind of task has different follow-up questions: start them over.
        if (before !== after) {
          answers = { q1: action.value };
          confirmed = [];
        }
      }
      return { ...state, answers, confirmed, reopened: null };
    }
    case 'toggle': {
      const current = asList(state.answers[action.questionId]);
      const exists = current.some((v) => v.label === action.value.label);
      const next = exists ? current.filter((v) => v.label !== action.value.label) : [...current, action.value];
      const answers = { ...state.answers };
      if (next.length) answers[action.questionId] = next;
      else delete answers[action.questionId];
      return { ...state, answers };
    }
    case 'confirm': {
      if (!isAnswered(state.answers, action.questionId)) return state;
      const confirmed = state.confirmed.includes(action.questionId)
        ? state.confirmed
        : [...state.confirmed, action.questionId];
      return { ...state, confirmed, reopened: null };
    }
    case 'reopen':
      return {
        ...state,
        reopened: action.questionId,
        confirmed: state.confirmed.filter((id) => id !== action.questionId),
      };
    case 'edit':
      return { ...state, promptEdited: true, promptText: action.text };
    case 'append': {
      const base = state.promptEdited ? state.promptText : action.composedText;
      return { ...state, promptEdited: true, promptText: appendStarter(base, action.starter) };
    }
    default:
      return state;
  }
}

export interface BuilderView {
  questions: QuestionDef[];
  /** The question currently being asked, or null on the last step. */
  activeId: string | null;
  atLastStep: boolean;
  variantId: string | null;
  variant: VariantDef | null;
  /** How many questions are still open (used for the "one more" subtitle). */
  remaining: number;
  readiness: Readiness;
  /** What the prompt editor shows. */
  editorText: string;
  /** Underline spans for the editor; empty once the user has edited the prompt. */
  segments: Segment[];
  /** Muted hint after the text; never sent. */
  ghost: string;
  /** The composed text without the dangling closer (base for suggestion chips). */
  composedText: string;
  /** What actually gets sent. */
  sendText: string;
}

export function builderView(state: BuilderState, t: Translate): BuilderView {
  if (state.prefill) {
    const variant = getVariant(state.category, state.prefill.variant);
    const sendText = state.promptText.trim();
    const added = sendText.length > state.prefill.text.trim().length;
    return {
      questions: [],
      activeId: null,
      atLastStep: true,
      variantId: state.prefill.variant,
      variant,
      remaining: 0,
      readiness: sendText ? (added ? 4 : 3) : 0,
      editorText: state.promptText,
      segments: [],
      ghost: sendText ? '' : t(`guided.flows.${state.category}.empty`),
      composedText: state.promptText,
      sendText,
    };
  }

  const questions = questionsFor(state.category, state.answers);
  const q1 = asList(state.answers.q1)[0];
  const vid = variantId(state.category, q1?.optionId, !!q1);
  const variant = getVariant(state.category, vid);

  const isOpen = (q: QuestionDef) =>
    !isAnswered(state.answers, q.id) || (!!q.multi && !state.confirmed.includes(q.id));
  const firstOpen = questions.find(isOpen)?.id ?? null;
  const activeId = state.reopened ?? firstOpen;
  const atLastStep = activeId === null;
  const answered = questions.filter((q) => isAnswered(state.answers, q.id)).length;
  const remaining = questions.filter(isOpen).length;

  const stillOpen = questions.filter((q) => q.multi && isOpen(q) && isAnswered(state.answers, q.id)).map((q) => q.id);
  const composed = composePrompt(state.category, state.answers, t, stillOpen);
  // An untouched prompt never ends on a dangling comma or colon from a clause template.
  const sendText = state.promptEdited ? state.promptText.trim() : composed.text.replace(/[\s,;:]+$/, '');

  return {
    questions,
    activeId,
    atLastStep,
    variantId: vid,
    variant,
    remaining,
    readiness: computeReadiness({
      total: questions.length,
      answered,
      complete: atLastStep,
      hasOwnText: state.promptEdited && state.promptText.trim().length > 0,
    }),
    editorText: state.promptEdited ? state.promptText : composed.text + (atLastStep ? composed.closer : ''),
    segments: state.promptEdited ? [] : composed.segments,
    ghost: state.promptEdited ? (state.promptText ? '' : composed.ghost) : composed.ghost,
    composedText: composed.text,
    sendText,
  };
}

/** True when the category's flow sends the prompt to the agent rather than the chat. */
export const isAgentic = (category: TaskCategory) => FLOWS[category].category === 'agentic';
