import { describe, expect, it } from 'vitest';
import en from '@/messages/guided/en.json';
import { fallbackRoute, pickModel, type Facts, type Signals } from '../routing';

const facts = (over: Partial<Facts> = {}): Facts => ({ chars: 120, hasImages: false, opusAllowed: true, ...over });
const signals = (over: Partial<Signals> = {}): Signals => ({ depth: 0.5, stakes: 0.05, structured: 0.05, rewording: 0.05, ...over });

describe('model routing', () => {
  // Signal values below are what the decision model returned for these real prompts.
  it('sends quick everyday asks to the fast model', () => {
    // "Write a message for me, to my colleague about being out this Friday…"
    expect(pickModel(signals({ depth: 0.84 }), facts())).toEqual({ tier: 'haiku', reason: 'quick' });
    // "What's the capital of Australia?"
    expect(pickModel(signals({ depth: 0 }), facts())).toEqual({ tier: 'haiku', reason: 'quick' });
  });

  it('recognises edits to existing text', () => {
    // "Make this shorter"
    expect(pickModel(signals({ depth: 0.13, rewording: 0.93 }), facts())).toEqual({ tier: 'haiku', reason: 'rewording' });
    // A long article to translate is still an edit, not a reason to upgrade.
    expect(pickModel(signals({ depth: 0.02, rewording: 0.98 }), facts({ chars: 12_000 })).tier).toBe('haiku');
  });

  it('moves up for structured work, real reasoning, and long material', () => {
    // "Write a 1500 word essay for my teacher about the causes of the French Revolution"
    expect(pickModel(signals({ depth: 1.93, structured: 0.99 }), facts())).toEqual({ tier: 'sonnet', reason: 'structured' });
    expect(pickModel(signals({ depth: 2.1 }), facts())).toEqual({ tier: 'sonnet', reason: 'reasoning' });
    expect(pickModel(signals({ depth: 1.1 }), facts({ chars: 9_000 }))).toEqual({ tier: 'sonnet', reason: 'long' });
  });

  it('takes extra care when the answer matters', () => {
    // "My doctor prescribed metformin and I also take ibuprofen daily…"
    expect(pickModel(signals({ depth: 2.32, stakes: 0.96 }), facts())).toEqual({ tier: 'sonnet', reason: 'stakes' });
    // Even a simple question on a risky subject is not left to the fastest model.
    expect(pickModel(signals({ depth: 0.6, stakes: 0.9 }), facts()).tier).toBe('sonnet');
  });

  it('keeps the largest model for deep reasoning on something that matters', () => {
    // "I've been offered a job in another city with 20% more pay but my partner can't move…"
    expect(pickModel(signals({ depth: 3, stakes: 0.95 }), facts())).toEqual({ tier: 'opus', reason: 'careful' });
    // "Should I incorporate my freelance business as an LLC or S-corp?…"
    expect(pickModel(signals({ depth: 2.94, stakes: 0.96 }), facts())).toEqual({ tier: 'opus', reason: 'careful' });
    // A hard multi-constraint problem with nothing personal at stake.
    expect(pickModel(signals({ depth: 2.95 }), facts())).toEqual({ tier: 'opus', reason: 'reasoning' });
    // Deep but not certain, and low stakes: one tier down.
    expect(pickModel(signals({ depth: 2.6 }), facts()).tier).toBe('sonnet');
  });

  it('falls back a tier once the daily allowance for the largest model is used', () => {
    expect(pickModel(signals({ depth: 3, stakes: 0.95 }), facts({ opusAllowed: false }))).toEqual({ tier: 'sonnet', reason: 'careful' });
  });

  it('uses a model that reads photos when photos are attached', () => {
    expect(pickModel(signals({ depth: 0.4 }), facts({ hasImages: true }))).toEqual({ tier: 'sonnet', reason: 'image' });
    expect(pickModel(signals({ depth: 3, stakes: 0.9 }), facts({ hasImages: true })).tier).toBe('opus');
  });

  it('keeps a follow-up on the conversation model unless it needs more', () => {
    // "Make it shorter" after a Sonnet answer stays on Sonnet.
    expect(pickModel(signals({ depth: 0.1, rewording: 0.9 }), facts({ previous: 'sonnet' }))).toEqual({ tier: 'sonnet', reason: 'followup' });
    // A harder follow-up still moves up.
    expect(pickModel(signals({ depth: 3, stakes: 0.9 }), facts({ previous: 'haiku' })).tier).toBe('opus');
    // An Opus conversation past the allowance continues one tier down.
    expect(pickModel(signals({ depth: 0.1 }), facts({ previous: 'opus', opusAllowed: false })).tier).toBe('sonnet');
  });

  it('falls back to the simple rule when the decision model is unavailable', () => {
    expect(fallbackRoute(facts())).toEqual({ tier: 'haiku', reason: 'quick' });
    expect(fallbackRoute(facts({ hasImages: true }))).toEqual({ tier: 'sonnet', reason: 'image' });
    expect(fallbackRoute(facts({ previous: 'sonnet' }))).toEqual({ tier: 'sonnet', reason: 'followup' });
  });

  it('has badge copy for every reason', () => {
    const reasons = en.chat.reasons as Record<string, string>;
    for (const reason of ['quick', 'rewording', 'reasoning', 'structured', 'long', 'stakes', 'careful', 'image', 'followup']) {
      expect(reasons[reason], reason).toBeTruthy();
    }
  });
});
