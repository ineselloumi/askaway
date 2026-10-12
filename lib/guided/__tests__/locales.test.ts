import { describe, expect, it } from 'vitest';
import de from '@/messages/guided/de.json';
import en from '@/messages/guided/en.json';
import es from '@/messages/guided/es.json';
import fr from '@/messages/guided/fr.json';
import itMessages from '@/messages/guided/it.json';
import pt from '@/messages/guided/pt.json';
import { builderReducer, builderView, initBuilder } from '../builder';
import { FLOWS, variantKey } from '../flows';
import type { AnswerValue, TaskCategory, Translate } from '../types';

const LOCALES: Record<string, unknown> = { en, fr, es, de, it: itMessages, pt };

const translator = (messages: unknown): Translate => (key, vars) => {
  const found = key
    .replace(/^guided\./, '')
    .split('.')
    .reduce<unknown>((acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined), messages);
  let out = typeof found === 'string' ? found : key;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.replace(`{${k}}`, String(v));
  return out;
};

function keysOf(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') return [prefix];
  return Object.entries(value).flatMap(([key, child]) => keysOf(child, prefix ? `${prefix}.${key}` : key));
}

describe('guided flow translations', () => {
  it('every locale defines exactly the English keys', () => {
    const expected = keysOf(en).sort();
    for (const [code, messages] of Object.entries(LOCALES)) {
      expect(keysOf(messages).sort(), code).toEqual(expected);
    }
  });

  it('every flow composes a complete prompt in every locale', () => {
    for (const [code, messages] of Object.entries(LOCALES)) {
      const t = translator(messages);
      const option = (prefix: string, id: string): AnswerValue => ({
        optionId: id,
        label: t(`${prefix}.options.${id}.label`),
        fragment: t(`${prefix}.options.${id}.fragment`),
      });

      for (const category of Object.keys(FLOWS) as TaskCategory[]) {
        const flow = FLOWS[category];
        for (const q1 of flow.q1.options) {
          let state = builderReducer(initBuilder(category), {
            type: 'answer',
            questionId: 'q1',
            value: option(`guided.flows.${category}.q1`, q1.id),
          });
          for (const question of flow.variants[q1.id].questions) {
            const prefix = `${variantKey(category, q1.id)}.questions.${question.id}`;
            for (const choice of question.multi ? question.options : question.options.slice(0, 1)) {
              state = builderReducer(state, {
                type: question.multi ? 'toggle' : 'answer',
                questionId: question.id,
                value: option(prefix, choice.id),
              });
            }
            if (question.multi) state = builderReducer(state, { type: 'confirm', questionId: question.id });
          }

          const view = builderView(state, t);
          const where = `${code} ${category}/${q1.id}`;
          expect(view.atLastStep, where).toBe(true);
          expect(view.readiness, where).toBe(4);
          // No unresolved message keys or template slots, and no dangling punctuation.
          for (const text of [view.sendText, view.editorText, view.ghost]) {
            expect(text, where).not.toMatch(/guided\.|\{[a-z0-9]+\}/i);
          }
          expect(view.sendText, where).not.toMatch(/[,;:]$/);
          expect(view.sendText.length, where).toBeGreaterThan(10);
          for (const id of flow.variants[q1.id].suggestions) {
            expect(t(`${variantKey(category, q1.id)}.suggestions.${id}.starter`), where).not.toMatch(/guided\./);
          }
        }
      }
    }
  });
});
