import { FLOWS, getVariant, variantId, variantKey } from './flows';
import type { Answers, AnswerValue, ComposedPrompt, QuestionDef, Segment, TaskCategory, Translate } from './types';

/** `t` returns the key itself when a string is missing; treat that as "not defined". */
export function opt(t: Translate, key: string): string {
  const value = t(key);
  return value === key ? '' : value;
}

export function asList(value: AnswerValue | AnswerValue[] | undefined): AnswerValue[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function isAnswered(answers: Answers, questionId: string): boolean {
  return asList(answers[questionId]).length > 0;
}

/** q1 plus the questions of whichever variant q1 selected. */
export function questionsFor(category: TaskCategory, answers: Answers): QuestionDef[] {
  const flow = FLOWS[category];
  const q1 = asList(answers.q1)[0];
  const variant = getVariant(category, variantId(category, q1?.optionId, !!q1));
  // Before q1 is answered, preview the first variant's questions so the next one shows dimmed.
  const preview = variant ?? flow.variants[flow.q1.options[0].id];
  return [flow.q1, ...preview.questions];
}

function joinList(values: string[], t: Translate): Segment[] {
  const sep = t('guided.builder.listSep');
  const and = t('guided.builder.listAnd');
  const out: Segment[] = [];
  values.forEach((value, i) => {
    if (i > 0) out.push({ text: i === values.length - 1 ? and : sep, kind: 'plain' });
    out.push({ text: value, kind: 'answer' });
  });
  return out;
}

/** Split "Write {q1} for me" into literal and placeholder parts. */
function fillTemplate(template: string, fill: (name: string) => Segment[]): Segment[] {
  const out: Segment[] = [];
  template.split(/(\{[a-zA-Z0-9]+\})/).forEach((part) => {
    if (!part) return;
    const match = part.match(/^\{([a-zA-Z0-9]+)\}$/);
    if (match) out.push(...fill(match[1]));
    else out.push({ text: part, kind: 'plain' });
  });
  return out;
}

function capitalizeFirst(segments: Segment[]): Segment[] {
  const first = segments.find((s) => s.text.length > 0);
  if (first) first.text = first.text.charAt(0).toUpperCase() + first.text.slice(1);
  return segments;
}

/**
 * Build the prompt from the answers so far.
 *
 * - Each answered question contributes its fragment, either inside the
 *   variant's frame ("Write {q1} for me") or as an appended clause (", to {v}").
 * - Questions not answered yet contribute to the muted `ghost` tail instead.
 * - Once every question is answered the sentence is closed (`end`) and the
 *   variant's `closer` lead-in is offered for the user to keep typing.
 */
export function composePrompt(
  category: TaskCategory,
  answers: Answers,
  t: Translate,
  /** Multi-select questions that have picks but are not confirmed yet: the sentence stays open. */
  stillOpen: string[] = [],
): ComposedPrompt {
  const q1 = asList(answers.q1)[0];
  const vid = variantId(category, q1?.optionId, !!q1);
  const variant = getVariant(category, vid);

  if (!q1 || !vid || !variant) {
    return { segments: [], text: '', ghost: t(`guided.flows.${category}.empty`), closer: '' };
  }

  const base = variantKey(category, vid);
  const frame = t(`${base}.frame`);
  const inFrame = new Set<string>();

  const segments = fillTemplate(frame, (name) => {
    inFrame.add(name);
    const values = asList(answers[name]);
    if (values.length) return joinList(values.map((v) => v.fragment), t);
    // Unanswered frame slots show a stand-in word, underlined like an answer.
    const placeholder = opt(t, `${base}.placeholders.${name}`);
    return placeholder ? [{ text: placeholder, kind: 'answer' }] : [];
  });

  let ghost = '';
  let allAnswered = true;

  for (const question of variant.questions) {
    const values = asList(answers[question.id]);
    const qKey = `${base}.questions.${question.id}`;
    if (!values.length) {
      allAnswered = false;
      ghost += opt(t, `${qKey}.ghost`);
      continue;
    }
    if (!inFrame.has(question.id)) {
      segments.push(
        ...fillTemplate(t(`${qKey}.clause`), (name) =>
          name === 'v' ? joinList(values.map((v) => v.fragment), t) : [],
        ),
      );
    }
    if (stillOpen.includes(question.id)) {
      allAnswered = false;
      ghost += t('guided.builder.andMore');
    }
  }

  let closer = '';
  if (allAnswered) {
    const end = opt(t, `${base}.end`);
    if (end) segments.push({ text: end, kind: 'plain' });
    closer = opt(t, `${base}.closer`);
    ghost = opt(t, `${base}.closerHint`);
  } else if (!stillOpen.length) {
    ghost += opt(t, `${base}.closerGhost`);
  }

  capitalizeFirst(segments);
  return { segments, text: segments.map((s) => s.text).join(''), ghost, closer };
}

/**
 * Add a "worth knowing" starter to the prompt. Clause starters (", in a tone
 * that's ") attach to the current sentence; sentence starters ("The deadline
 * is ") begin a new one.
 */
export function appendStarter(text: string, starter: string): string {
  if (/^[,;]/.test(starter)) return text.replace(/[\s.,;:]+$/, '') + starter;
  const base = text.replace(/\s+$/, '').replace(/[,;]$/, '');
  if (!base) return starter;
  return base + (/[.!?:]$/.test(base) ? ' ' : '. ') + starter;
}
