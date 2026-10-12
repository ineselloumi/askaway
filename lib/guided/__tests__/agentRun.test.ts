import { describe, expect, it } from 'vitest';
import { agentReducer, agentSteps, askWithNotes, createRun, type AgentAction, type AgentRun, type CheckIn } from '../agentRun';

const play = (run: AgentRun, ...actions: AgentAction[]) => actions.reduce(agentReducer, run);

const question: CheckIn = {
  toolUseId: 'toolu_1',
  headline: 'Two of them only publish annual prices.',
  detail: 'Want them in or out?',
  label: 'Annual-only tools',
  options: ['Include them', 'Leave them out'],
};

const started = () =>
  play(createRun('Compare project tools', 'web'), { type: 'request-permission' }, { type: 'allow', at: 1_000 });

describe('agent-run state transitions', () => {
  it('asks permission before doing anything', () => {
    const run = createRun('Compare project tools', 'web');
    expect(run.status).toBe('scoping');
    // Nothing can start a run that has not been allowed.
    expect(play(run, { type: 'allow', at: 1 }).status).toBe('scoping');
    expect(play(run, { type: 'phase', phase: 'search' }).currentStep).toBe(0);

    const asked = play(run, { type: 'request-permission' });
    expect(asked.status).toBe('awaiting-permission');
    expect(play(asked, { type: 'decline' }).status).toBe('scoping');
    expect(play(asked, { type: 'allow', at: 5 }).status).toBe('running');
  });

  it('moves through plain-English steps as work comes in', () => {
    let run = started();
    expect(agentSteps(run).map((s) => s.state)).toEqual(['current', 'pending', 'pending', 'pending']);

    run = play(run, { type: 'phase', phase: 'search' }, { type: 'search', query: 'best project tools for small teams' });
    run = play(run, { type: 'phase', phase: 'read' }, { type: 'pages', count: 5 }, { type: 'pages', count: 4 });
    expect(run.searches).toEqual(['best project tools for small teams']);
    expect(run.pagesRead).toBe(9);
    expect(agentSteps(run).map((s) => s.state)).toEqual(['done', 'done', 'current', 'pending']);
  });

  it('only moves forward, except back out of an early "writing" guess', () => {
    let run = play(started(), { type: 'phase', phase: 'read' });
    expect(play(run, { type: 'phase', phase: 'search' }).currentStep).toBe(2);

    run = play(run, { type: 'phase', phase: 'write' });
    expect(run.currentStep).toBe(3);
    expect(play(run, { type: 'phase', phase: 'search' }).currentStep).toBe(1);
  });

  it('blocks on a check-in and carries on once it is answered', () => {
    let run = play(started(), { type: 'phase', phase: 'read' }, { type: 'check-in', question, at: 61_000 });
    expect(run.status).toBe('blocked');
    expect(run.blockingQuestion).toEqual(question);
    expect(run.durationMs).toBe(60_000);
    // Progress events are ignored while waiting on the user.
    expect(play(run, { type: 'pages', count: 3 }).pagesRead).toBe(0);

    run = play(run, { type: 'answer-check-in', at: 500_000 });
    expect(run.status).toBe('running');
    expect(run.blockingQuestion).toBeNull();
    expect(run.currentStep).toBe(2);
  });

  it('does not count waiting time towards the receipt', () => {
    const run = play(
      started(),
      { type: 'check-in', question, at: 31_000 },
      { type: 'answer-check-in', at: 600_000 },
      { type: 'done', result: 'Done. I would go with Linear.', model: 'Sonnet 5.5', sources: [], at: 630_000 },
    );
    expect(run.status).toBe('done');
    expect(run.durationMs).toBe(60_000);
    expect(run.result).toBe('Done. I would go with Linear.');
    expect(agentSteps(run).every((s) => s.state === 'done')).toBe(true);
  });

  it('pauses, and resuming starts the job again from the top', () => {
    let run = play(
      started(),
      { type: 'phase', phase: 'read' },
      { type: 'pages', count: 6 },
      { type: 'pause', at: 21_000 },
    );
    expect(run.status).toBe('paused');
    expect(run.durationMs).toBe(20_000);

    run = play(run, { type: 'note', text: 'skip the free ones' }, { type: 'resume', at: 90_000 });
    expect(run.status).toBe('running');
    expect(run.currentStep).toBe(0);
    expect(run.pagesRead).toBe(0);
    expect(askWithNotes(run)).toBe('Compare project tools\n\nAlso keep in mind:\n- skip the free ones');
  });

  it('can be retried after a failure, and ignores events once finished', () => {
    let run = play(started(), { type: 'fail', message: 'network', at: 4_000 });
    expect(run.status).toBe('error');
    run = play(run, { type: 'resume', at: 5_000 });
    expect(run.status).toBe('running');
    expect(run.error).toBeNull();

    const done = play(run, { type: 'done', result: 'ok', model: 'Sonnet 5.5', sources: [], at: 6_000 });
    expect(play(done, { type: 'pause', at: 7_000 })).toBe(done);
    expect(play(done, { type: 'fail', message: 'late', at: 7_000 })).toBe(done);
  });

  it('uses a shorter step list for jobs that work on attached data', () => {
    const run = play(createRun('Summarise my sheet', 'data'), { type: 'request-permission' }, { type: 'allow', at: 0 });
    expect(agentSteps(run).map((s) => s.phase)).toEqual(['plan', 'data', 'write']);
    // Web-only phases do not apply to a data job.
    expect(play(run, { type: 'phase', phase: 'search' }).currentStep).toBe(0);
  });
});
