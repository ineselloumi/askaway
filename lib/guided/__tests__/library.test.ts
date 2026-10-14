import { describe, expect, it } from 'vitest';
import en from '@/messages/guided/en.json';
import { FLOWS, IDEAS } from '../flows';
import {
  CHIPS,
  HINTS,
  HINT_MIN,
  IDEA_CONTENT,
  chipPool,
  chooseHint,
  defaultChips,
  defaultHint,
  hintPool,
  rankChips,
  validIds,
} from '../library';
import { CHECKS, SILENT_CHECKS } from '../quality';
import type { TaskCategory } from '../types';

const chipCopy = en.chips as Record<string, { label: string; starter: string }>;
const hintCopy = en.hints as Record<string, string>;
const CATEGORIES: TaskCategory[] = ['write', 'understand', 'agentic'];

describe('chip and hint library', () => {
  it('has copy for every chip and hint, and nothing extra', () => {
    expect(Object.keys(chipCopy).sort()).toEqual(Object.keys(CHIPS).sort());
    expect(Object.keys(hintCopy).sort()).toEqual(Object.keys(HINTS).sort());
    for (const [id, copy] of Object.entries(chipCopy)) {
      expect(copy.label, id).toBeTruthy();
      expect(copy.starter, id).toBeTruthy();
    }
  });

  it('gives every task type a pool of chips and hints to choose from', () => {
    for (const category of CATEGORIES) {
      expect(chipPool(category).length, category).toBeGreaterThanOrEqual(8);
      expect(hintPool(category).length, category).toBeGreaterThanOrEqual(3);
    }
  });

  it('only uses default chips that exist and fit the task type', () => {
    for (const category of CATEGORIES) {
      for (const [variant, def] of Object.entries(FLOWS[category].variants)) {
        for (const id of def.suggestions) {
          expect(CHIPS[id]?.categories, `${category}/${variant}/${id}`).toContain(category);
        }
      }
    }
  });

  it('has a hint for every check that can become the helper line', () => {
    for (const category of CATEGORIES) {
      for (const check of CHECKS[category]) {
        if (!SILENT_CHECKS.has(check.id)) expect(HINTS[check.id], check.id).toBeTruthy();
      }
    }
  });

  it('gives every idea its own hand-written chips and hints', () => {
    for (const idea of IDEAS) {
      const content = IDEA_CONTENT[idea.id];
      expect(content, idea.id).toBeTruthy();
      expect(content.chips.length, idea.id).toBeGreaterThanOrEqual(3);
      for (const id of content.chips) expect(CHIPS[id], `${idea.id}/${id}`).toBeTruthy();
      for (const id of content.hints) expect(HINTS[id], `${idea.id}/${id}`).toBeTruthy();
      // Ideas rank only their own chips, and offer their own hints first.
      expect(chipPool(idea.category, idea.id)).toEqual(content.chips);
      expect(hintPool(idea.category, idea.id).slice(0, content.hints.length)).toEqual(content.hints);
      expect(defaultHint(idea.id)).toBe(content.hints[0]);
    }
  });

  it('shows defaults before the decision model answers', () => {
    expect(defaultChips(['deadline', 'ask', 'tone'])).toEqual(['deadline', 'ask', 'tone']);
    expect(defaultChips(['deadline', 'ask', 'tone'], 'competitors')).toEqual(['whoWeAre', 'shortlist', 'compareOn']);
    expect(defaultHint(null)).toBeNull();
  });
});

describe('ranking for a specific prompt', () => {
  // Probabilities Jev returned for "Research and compare our top three competitors."
  const competitors = { shortlist: 0.46, compareOn: 0.4, whoWeAre: 0.12, purpose: 0.01 };

  it('orders chips by how much they would improve this prompt', () => {
    expect(rankChips(competitors, IDEA_CONTENT.competitors.chips)).toEqual(['shortlist', 'compareOn', 'whoWeAre']);
  });

  it('keeps the hand-written order when the model has no preference', () => {
    expect(rankChips({}, ['whoWeAre', 'shortlist', 'compareOn', 'purpose'], 2)).toEqual(['whoWeAre', 'shortlist']);
  });

  it('picks the single most important gap', () => {
    expect(chooseHint({ whoWeAre: 0.96, compareOn: 0.04 }, ['whoWeAre', 'compareOn'])).toBe('whoWeAre');
  });

  it('shows no hint when nothing important is missing, or when unsure', () => {
    expect(chooseHint({ none: 0.7, handback: 0.2 }, ['handback'])).toBeNull();
    expect(chooseHint({ handback: HINT_MIN - 0.05, material: 0.2 }, ['handback', 'material'])).toBeNull();
  });

  it('ignores options that are not in the pool', () => {
    expect(chooseHint({ material: 0.9, handback: 0.4 }, ['handback'])).toBe('handback');
  });
});

describe('request validation', () => {
  it('accepts known ids only', () => {
    expect(validIds(['deadline', 'tone'], CHIPS)).toEqual(['deadline', 'tone']);
    expect(validIds(['deadline', 'not-a-chip'], CHIPS)).toBeNull();
    expect(validIds('deadline', CHIPS)).toBeNull();
    expect(validIds(Array(100).fill('tone'), CHIPS)).toBeNull();
  });
});

describe('hints that mirror a passed check', () => {
  it('are skipped in favour of the next most important gap', () => {
    // "Write an email to my manager about": the task is clear, so "say what you want made" must not show.
    const met = { task: true, preference: false };
    const pool = ['task', 'preference', 'material'].filter((id) => !met[id as keyof typeof met]);
    expect(chooseHint({ task: 0.6, preference: 0.2, material: 0.15, none: 0.05 }, pool)).toBeNull();
    expect(chooseHint({ task: 0.5, preference: 0.4, material: 0.1 }, pool)).toBe('preference');
  });
});
