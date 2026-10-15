import { describe, expect, it } from 'vitest';
import en from '@/messages/guided/en.json';
import { CHECKS, OFF, ON, SILENT_CHECKS, applyScores, asksForNumbers, missingMaterial, nextHint, qualityReadiness } from '../quality';
import type { TaskCategory } from '../types';

describe('quality-driven readiness', () => {
  it('asks four checks for every guided task type, each with a hint unless it is silent', () => {
    for (const category of ['write', 'understand', 'agentic'] as TaskCategory[]) {
      expect(CHECKS[category]).toHaveLength(4);
      for (const check of CHECKS[category]) {
        if (SILENT_CHECKS.has(check.id)) continue;
        expect((en.hints as Record<string, string>)[check.id], check.id).toBeTruthy();
      }
    }
  });

  it('fills one step per check met', () => {
    const none = applyScores('write', { task: 0.1, subject: 0.1, audience: 0.1, preference: 0.1 }, null);
    expect(qualityReadiness('write', none)).toBe(0);

    // "Write a message for me, to my colleague": clear task and reader, no topic.
    const two = applyScores('write', { task: 0.97, audience: 0.96, subject: 0.04, preference: 0.22 }, null);
    expect(qualityReadiness('write', two)).toBe(2);
    // Topic and reader still count towards the fill, but are never the hint.
    expect(nextHint('write', two)).toBe('preference');

    const all = applyScores('write', { task: 0.99, audience: 0.98, subject: 0.6, preference: 0.99 }, null);
    expect(qualityReadiness('write', all)).toBe(4);
    expect(nextHint('write', all)).toBeNull();
    // With only silent checks unmet there is no hint, and the default line shows.
    const silent = applyScores('write', { task: 0.9, subject: 0.1, audience: 0.1, preference: 0.9 }, null);
    expect(nextHint('write', silent)).toBeNull();
  });

  it('offers hints in a fixed order, whatever the scores', () => {
    const met = applyScores('agentic', { task: 0.9, subject: 0.2, constraints: 0.1, handback: 0.9 }, null);
    expect(nextHint('agentic', met)).toBe('constraints');
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

  it('holds a job short of done while the information it rests on is missing', () => {
    // "Build a slide deck about our sales numbers of this week for a client pitch…": every check passes, no numbers.
    const all = { task: 0.99, subject: 0.95, constraints: 0.9, handback: 0.9 };
    const missing = applyScores('agentic', { ...all, material: 0.08 }, null);
    expect(missingMaterial('agentic', missing)).toBe(true);
    expect(qualityReadiness('agentic', missing)).toBe(3);

    const included = applyScores('agentic', { ...all, material: 0.9 }, null);
    expect(missingMaterial('agentic', included)).toBe(false);
    expect(qualityReadiness('agentic', included)).toBe(4);

    // An unscored gate never blocks, and other task types have none.
    expect(qualityReadiness('agentic', applyScores('agentic', all, null))).toBe(4);
    expect(missingMaterial('write', applyScores('write', { task: 0.9 }, null))).toBe(false);
  });

  it('asks for numbers or for context, depending on the job', () => {
    expect(asksForNumbers('Build a slide deck about our sales numbers of this week')).toBe(true);
    expect(asksForNumbers('Analyze our Q3 revenue and margins')).toBe(true);
    expect(asksForNumbers('Build a slide deck about our new hiring process for the team')).toBe(false);
    expect(en.builder.needNumbers).toBeTruthy();
    expect(en.builder.needContext).toBeTruthy();
  });
});
