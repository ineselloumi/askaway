import en from '@/messages/guided/en.json';
import type { AnswerValue, Translate } from '../types';

/** Same lookup rules as LocaleContext's `t`, backed by the English guided strings. */
export const t: Translate = (key, vars) => {
  const found = key
    .replace(/^guided\./, '')
    .split('.')
    .reduce<unknown>((acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined), en);
  let out = typeof found === 'string' ? found : key;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.replace(`{${k}}`, String(v));
  return out;
};

/** A chip answer, resolved the way the UI does it. */
export function pick(prefix: string, optionId: string): AnswerValue {
  return {
    optionId,
    label: t(`${prefix}.options.${optionId}.label`),
    fragment: t(`${prefix}.options.${optionId}.fragment`),
  };
}

export const typed = (text: string): AnswerValue => ({ label: text, fragment: text });

export const WRITE_Q1 = 'guided.flows.write.q1';
export const WRITE_WHO = 'guided.flows.write.variants.email.questions.who';
export const AGENT_Q1 = 'guided.flows.agentic.q1';
export const RESEARCH = 'guided.flows.agentic.variants.research.questions';
