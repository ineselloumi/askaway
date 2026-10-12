import { describe, expect, it } from 'vitest';
import { parseAnswer } from '../parseAnswer';

describe('answer parsing', () => {
  it('splits a lead line from the answer', () => {
    const parsed = parseAnswer("Here it is — short enough to paste into Slack:\n\nHi all — I'm out this Friday.");
    expect(parsed.lead).toBe('Here it is — short enough to paste into Slack:');
    expect(parsed.body).toBe("Hi all — I'm out this Friday.");
    expect(parsed.rows).toEqual([]);
  });

  it('keeps everything as body when there is no lead', () => {
    expect(parseAnswer('Just one paragraph.')).toEqual({ lead: '', body: 'Just one paragraph.', rows: [] });
    expect(parseAnswer('- first\n- second\n\nMore').lead).toBe('');
  });

  it('reads comparison rows and marks the ones ruled out', () => {
    const parsed = parseAnswer(
      "Done. I'd go with Linear.\n\nIt fits under your limit.\n\n[[compare]]\nLinear | $14 · monthly | ok\nAsana | $24 · over your limit | out\n[[/compare]]",
    );
    expect(parsed.lead).toBe("Done. I'd go with Linear.");
    expect(parsed.body).toBe('It fits under your limit.');
    expect(parsed.rows).toEqual([
      { name: 'Linear', facts: '$14 · monthly', out: false },
      { name: 'Asana', facts: '$24 · over your limit', out: true },
    ]);
  });

  it('never shows a half-written comparison block', () => {
    expect(parseAnswer('Lead line\n\nBody text\n\n[[compare]]\nLinear | $14').body).toBe('Body text');
  });
});
