import { describe, expect, it } from 'vitest';
import {
  bringBackGuided,
  dismissGraduation,
  initialProgress,
  parseProgress,
  quotePrompt,
  recordCompletedPrompt,
  shouldShowGraduation,
  startMode,
} from '../graduation';

describe('graduation gate', () => {
  it('starts on the guided setup', () => {
    expect(startMode(initialProgress)).toBe('setup');
    expect(shouldShowGraduation(initialProgress)).toBe(false);
  });

  it('does not graduate after one guided prompt', () => {
    const one = recordCompletedPrompt(initialProgress, 'Write a message to my colleague');
    expect(one.promptsCompleted).toBe(1);
    expect(startMode(one)).toBe('setup');
  });

  it('shows the recap on the next new chat after two guided prompts', () => {
    const two = recordCompletedPrompt(recordCompletedPrompt(initialProgress, 'First ask'), 'Second ask');
    expect(shouldShowGraduation(two)).toBe(true);
    expect(startMode(two)).toBe('graduation');
    expect(two.recentPrompts).toEqual(['First ask', 'Second ask']);
  });

  it('shows the recap once, then opens on the plain input', () => {
    let progress = recordCompletedPrompt(recordCompletedPrompt(initialProgress, 'a'), 'b');
    progress = dismissGraduation(progress);
    expect(shouldShowGraduation(progress)).toBe(false);
    expect(startMode(progress)).toBe('plain');
    // Further guided prompts never bring the recap back.
    expect(startMode(recordCompletedPrompt(progress, 'c'))).toBe('plain');
  });

  it('brings the guided setup back on request without re-showing the recap', () => {
    let progress = recordCompletedPrompt(recordCompletedPrompt(initialProgress, 'a'), 'b');
    progress = bringBackGuided(dismissGraduation(progress));
    expect(startMode(progress)).toBe('setup');
    expect(shouldShowGraduation(progress)).toBe(false);
  });

  it('ignores empty prompts and keeps only the two most recent', () => {
    let progress = recordCompletedPrompt(initialProgress, '   ');
    expect(progress.promptsCompleted).toBe(0);
    for (const p of ['a', 'b', 'c']) progress = recordCompletedPrompt(progress, p);
    expect(progress.promptsCompleted).toBe(3);
    expect(progress.recentPrompts).toEqual(['b', 'c']);
  });

  it('survives missing or corrupt stored state', () => {
    expect(parseProgress(null)).toEqual(initialProgress);
    expect(parseProgress('{not json')).toEqual(initialProgress);
    expect(parseProgress('{"promptsCompleted":2,"recentPrompts":["a",3,"b"],"graduationShown":true,"guidedEnabled":false}')).toEqual({
      promptsCompleted: 2,
      recentPrompts: ['a', 'b'],
      graduationShown: true,
      guidedEnabled: false,
    });
  });

  it('quotes long prompts verbatim up to a word boundary', () => {
    expect(quotePrompt('Short ask')).toBe('Short ask');
    const long = "Write a short message to my colleague telling them I'm out this Friday and that someone will need to cover";
    const quoted = quotePrompt(long);
    expect(quoted.endsWith('…')).toBe(true);
    expect(long.startsWith(quoted.slice(0, -1))).toBe(true);
    expect(quoted.length).toBeLessThanOrEqual(73);
  });
});
