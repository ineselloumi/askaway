import { describe, expect, it } from 'vitest';
import en from '@/messages/guided/en.json';
import { CHECKS, OFF, ON, applyScores, nextHint, qualityReadiness } from '../quality';
import type { TaskCategory } from '../types';

describe('quality-driven readiness', () => {
  it('asks four checks for every guided task type, each with a hint', () => {
    for (const category of ['write', 'understand', 'agentic'] as TaskCategory[]) {
      expect(CHECKS[category]).toHaveLength(4);
      for (const check of CHECKS[category]) {
        expect((en.builder.hints as Record<string, string>)[check.id], check.id).toBeTruthy();
      }
    }
  });

  it('fills one step per check met', () => {
    const none = applyScores('write', { task: 0.1, subject: 0.1, audience: 0.1, preference: 0.1 }, null);
    expect(qualityReadiness('write', none)).toBe(0);

    // "Write a message for me, to my colleague": clear task and reader, no topic.
    const two = applyScores('write', { task: 0.97, audience: 0.96, subject: 0.04, preference: 0.22 }, null);
    expect(qualityReadiness('write', two)).toBe(2);
    expect(nextHint('write', two)).toBe('subject');

    const all = applyScores('write', { task: 0.99, audience: 0.98, subject: 0.6, preference: 0.99 }, null);
    expect(qualityReadiness('write', all)).toBe(4);
    expect(nextHint('write', all)).toBeNull();
  });

  it('offers hints in a fixed order, whatever the scores', () => {
    const met = applyScores('agentic', { task: 0.9, subject: 0.2, constraints: 0.1, handback: 0.9 }, null);
    expect(nextHint('agentic', met)).toBe('subject');
  });

  it('does not flicker on a borderline score', () => {
    const mid = (ON + OFF) / 2;
    // Not met yet: a middling score is not enough to turn it on.
    expect(applyScores('write', { subject: mid }, null).subject).toBe(false);
    // Already met: the same middling score keeps it on.
    expect(applyScores('write', { subject: mid }, { subject: true }).subject).toBe(true);
    // A clear drop turns it off again.
    expect(applyScores('write', { subject: OFF - 0.05 }, { subject: true }).subject).toBe(false);
  });

  it('keeps the previous answer when a score is missing', () => {
    expect(applyScores('write', {}, { task: true }).task).toBe(true);
    expect(applyScores('write', {}, null).task).toBe(false);
  });
});
