export type Readiness = 0 | 1 | 2 | 3 | 4;

export interface ReadinessInput {
  /** Total questions in the current flow (q1 included). */
  total: number;
  /** Questions with at least one answer. A multi-select question counts once. */
  answered: number;
  /** Every question answered and every multi-select confirmed. */
  complete: boolean;
  /** The user typed something of their own into the prompt. */
  hasOwnText: boolean;
}

/**
 * Readiness is count-based (spec open question 1): it rewards added context
 * and never blocks sending.
 *
 * - 4 only when the flow is complete.
 * - Short flows start higher so the last question still lands on 3 before
 *   completion: a 2-question flow goes 2 → 4, a 3-question flow 1 → 2 → 3 → 4.
 * - With no answers, typing your own prompt counts as one step.
 */
export function computeReadiness({ total, answered, complete, hasOwnText }: ReadinessInput): Readiness {
  if (complete && answered > 0) return 4;
  if (answered <= 0) return hasOwnText ? 1 : 0;
  const offset = Math.max(0, 3 - total);
  return Math.min(3, answered + offset) as Readiness;
}

export interface ReadinessStep {
  /** Fill width of the bar inside the button, as a percentage. */
  fillPct: number;
  labelKey: string;
  tone: 'empty' | 'filling' | 'done';
}

/** Visual spec for each readiness step (handoff screen 1e). */
export function readinessStep(step: Readiness): ReadinessStep {
  switch (step) {
    case 0:
      return { fillPct: 0, labelKey: 'guided.builder.readiness.add', tone: 'empty' };
    case 1:
      return { fillPct: 25, labelKey: 'guided.builder.readiness.add', tone: 'filling' };
    case 2:
      return { fillPct: 50, labelKey: 'guided.builder.readiness.getting', tone: 'filling' };
    case 3:
      return { fillPct: 75, labelKey: 'guided.builder.readiness.almost', tone: 'filling' };
    default:
      return { fillPct: 100, labelKey: 'guided.builder.readiness.done', tone: 'done' };
  }
}
