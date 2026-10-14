import { describe, expect, it } from 'vitest';
import { builderReducer, builderView, initBuilder } from '../builder';
import { computeReadiness, readinessStep } from '../readiness';
import { AGENT_Q1, RESEARCH, WRITE_Q1, WRITE_WHO, pick, t, typed } from './helpers';

describe('readiness step mapping', () => {
  it('is 0 with nothing, and 1 once the user types their own prompt', () => {
    expect(computeReadiness({ total: 2, answered: 0, complete: false, hasOwnText: false })).toBe(0);
    expect(computeReadiness({ total: 2, answered: 0, complete: false, hasOwnText: true })).toBe(1);
  });

  it('maps a two-question flow to 2 then 4 (screens 1c and 1d)', () => {
    expect(computeReadiness({ total: 2, answered: 1, complete: false, hasOwnText: false })).toBe(2);
    expect(computeReadiness({ total: 2, answered: 2, complete: true, hasOwnText: false })).toBe(4);
  });

  it('maps a three-question flow to 1, 2, 3 then 4 (screens 2a to 2c)', () => {
    const at = (answered: number, complete = false) =>
      computeReadiness({ total: 3, answered, complete, hasOwnText: false });
    expect([at(1), at(2), at(3), at(3, true)]).toEqual([1, 2, 3, 4]);
  });

  it('never reaches 4 before the flow is complete', () => {
    expect(computeReadiness({ total: 1, answered: 1, complete: false, hasOwnText: true })).toBe(3);
  });

  it('describes each step as in the spec strip (screen 1e)', () => {
    expect([0, 1, 2, 3, 4].map((s) => readinessStep(s as 0 | 1 | 2 | 3 | 4))).toEqual([
      { fillPct: 0, labelKey: 'guided.builder.readiness.add', tone: 'empty' },
      { fillPct: 25, labelKey: 'guided.builder.readiness.add', tone: 'filling' },
      { fillPct: 50, labelKey: 'guided.builder.readiness.getting', tone: 'filling' },
      { fillPct: 75, labelKey: 'guided.builder.readiness.almost', tone: 'filling' },
      { fillPct: 100, labelKey: 'guided.builder.readiness.done', tone: 'done' },
    ]);
    expect(t(readinessStep(4).labelKey)).toBe("I'm done");
  });

  it('advances one step per answer through the real flows', () => {
    let write = initBuilder('write');
    const writeSteps = [builderView(write, t).readiness];
    write = builderReducer(write, { type: 'answer', questionId: 'q1', value: pick(WRITE_Q1, 'email') });
    writeSteps.push(builderView(write, t).readiness);
    write = builderReducer(write, { type: 'answer', questionId: 'who', value: pick(WRITE_WHO, 'manager') });
    writeSteps.push(builderView(write, t).readiness);
    expect(writeSteps).toEqual([0, 2, 4]);

    let agent = initBuilder('agentic');
    const agentSteps: number[] = [];
    const step = (action: Parameters<typeof builderReducer>[1]) => {
      agent = builderReducer(agent, action);
      agentSteps.push(builderView(agent, t).readiness);
    };
    step({ type: 'answer', questionId: 'q1', value: pick(AGENT_Q1, 'research') });
    step({ type: 'answer', questionId: 'what', value: typed('electric bikes') });
    step({ type: 'toggle', questionId: 'must', value: pick(`${RESEARCH}.must`, 'budget') });
    // A second pick in the same multi-select question does not add a step.
    step({ type: 'toggle', questionId: 'must', value: pick(`${RESEARCH}.must`, 'integrates') });
    step({ type: 'confirm', questionId: 'must' });
    expect(agentSteps).toEqual([1, 2, 3, 3, 4]);
  });
});
