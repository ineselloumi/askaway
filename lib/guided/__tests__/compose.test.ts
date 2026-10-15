import { describe, expect, it } from 'vitest';
import { builderReducer, builderView, initBuilder, type BuilderState } from '../builder';
import { appendStarter, composePrompt } from '../compose';
import { AGENT_Q1, RESEARCH, WRITE_Q1, WRITE_WHO, pick, t, typed } from './helpers';

const run = (state: BuilderState, ...actions: Parameters<typeof builderReducer>[1][]) =>
  actions.reduce(builderReducer, state);

describe('prompt composition from answers', () => {
  it('shows only a muted outline before anything is answered', () => {
    const composed = composePrompt('write', {}, t);
    expect(composed.text).toBe('');
    expect(composed.ghost).toBe('Write … to … about …');
  });

  it('writes the first answer into the frame and ghosts the rest (screen 1c)', () => {
    const composed = composePrompt('write', { q1: pick(WRITE_Q1, 'email') }, t);
    expect(composed.text).toBe('Write an email');
    expect(composed.ghost).toBe(' to … about …');
    expect(composed.segments.filter((s) => s.kind === 'answer').map((s) => s.text)).toEqual(['an email']);
  });

  it('appends a clause per answer and offers a closer once complete', () => {
    const composed = composePrompt(
      'write',
      { q1: pick(WRITE_Q1, 'email'), who: pick(WRITE_WHO, 'colleague') },
      t,
    );
    expect(composed.text).toBe('Write an email to a colleague');
    expect(composed.closer).toBe(' about ');
    expect(composed.ghost).toBe('what you need to say …');
  });

  it('uses typed answers verbatim', () => {
    const composed = composePrompt('write', { q1: typed('a thank-you card'), who: typed('my aunt') }, t);
    expect(composed.text).toBe('Write a thank-you card for my aunt');
  });

  it('underlines a stand-in word for an unanswered frame slot (screen 2a)', () => {
    const composed = composePrompt('agentic', { q1: pick(AGENT_Q1, 'research') }, t);
    expect(composed.text).toBe('Research and compare options');
    expect(composed.segments.find((s) => s.text === 'options')?.kind).toBe('answer');
    expect(composed.ghost).toBe(' for …. Each one has to …');
  });

  it('joins multi-select answers into one clause (screens 2b and 2c)', () => {
    const composed = composePrompt(
      'agentic',
      {
        q1: pick(AGENT_Q1, 'research'),
        what: typed('project management tools'),
        topic: typed('a 40-person design team'),
        must: [pick(`${RESEARCH}.must`, 'budget'), pick(`${RESEARCH}.must`, 'enterprise'), pick(`${RESEARCH}.must`, 'commit')],
      },
      t,
    );
    expect(composed.text).toBe(
      'Research and compare project management tools for a 40-person design team. Each one has to fit our budget, be ready for enterprise use and offer a flexible contract.',
    );
  });

  it('capitalises a prompt that starts with a typed answer', () => {
    const composed = composePrompt('agentic', { q1: typed('plan a weekend in Lisbon') }, t);
    expect(composed.text).toBe('Plan a weekend in Lisbon for me');
  });

  it('adds "worth knowing" starters as a clause or a new sentence', () => {
    expect(appendStarter('Write a message for me, to my colleague about ', ", in a tone that's ")).toBe(
      "Write a message for me, to my colleague about, in a tone that's ",
    );
    expect(appendStarter('Write a message about Friday', 'The deadline is ')).toBe(
      'Write a message about Friday. The deadline is ',
    );
    expect(appendStarter('Compare tools for me.', 'Give me back ')).toBe('Compare tools for me. Give me back ');
  });
});

describe('prompt builder state', () => {
  it('walks the write flow question by question', () => {
    let state = initBuilder('write');
    expect(builderView(state, t).activeId).toBe('q1');

    state = run(state, { type: 'answer', questionId: 'q1', value: pick(WRITE_Q1, 'email') });
    let view = builderView(state, t);
    expect(view.activeId).toBe('who');
    expect(view.atLastStep).toBe(false);
    expect(view.sendText).toBe('Write an email');

    state = run(state, { type: 'answer', questionId: 'who', value: pick(WRITE_WHO, 'colleague') });
    view = builderView(state, t);
    expect(view.atLastStep).toBe(true);
    // The editor offers the lead-in, but it is not sent unless the user continues it.
    expect(view.editorText).toBe('Write an email to a colleague about ');
    expect(view.sendText).toBe('Write an email to a colleague');
  });

  it('stops rewriting the prompt once the user edits it', () => {
    let state = run(initBuilder('write'), { type: 'answer', questionId: 'q1', value: pick(WRITE_Q1, 'email') });
    state = run(state, { type: 'edit', text: 'Write a short note to Sam' });
    state = run(state, { type: 'answer', questionId: 'who', value: pick(WRITE_WHO, 'customer') });
    const view = builderView(state, t);
    expect(view.sendText).toBe('Write a short note to Sam');
    expect(view.segments).toEqual([]);
  });

  it('keeps a multi-select question open until it is confirmed', () => {
    const must = `${RESEARCH}.must`;
    let state = run(
      initBuilder('agentic'),
      { type: 'answer', questionId: 'q1', value: pick(AGENT_Q1, 'research') },
      { type: 'answer', questionId: 'what', value: typed('electric bikes') },
      { type: 'fill', questionId: 'topic', text: 'our city couriers' },
      { type: 'confirm', questionId: 'topic' },
      { type: 'toggle', questionId: 'must', value: pick(must, 'budget') },
      { type: 'toggle', questionId: 'must', value: pick(must, 'enterprise') },
    );
    expect(builderView(state, t).activeId).toBe('must');

    state = run(state, { type: 'toggle', questionId: 'must', value: pick(must, 'budget') });
    // While picks are still being made the sentence stays open (screen 2b).
    let view = builderView(state, t);
    expect(view.sendText).toBe('Research and compare electric bikes for our city couriers. Each one has to be ready for enterprise use');
    expect(view.ghost).toBe(', and …');

    state = run(state, { type: 'confirm', questionId: 'must' });
    view = builderView(state, t);
    expect(view.atLastStep).toBe(true);
    expect(view.sendText).toBe('Research and compare electric bikes for our city couriers. Each one has to be ready for enterprise use.');
  });

  it('starts the follow-up questions over when the kind of task changes', () => {
    let state = run(
      initBuilder('agentic'),
      { type: 'answer', questionId: 'q1', value: pick(AGENT_Q1, 'research') },
      { type: 'answer', questionId: 'what', value: typed('electric bikes') },
      { type: 'reopen', questionId: 'q1' },
    );
    expect(builderView(state, t).activeId).toBe('q1');
    state = run(state, { type: 'answer', questionId: 'q1', value: pick(AGENT_Q1, 'deck') });
    const view = builderView(state, t);
    expect(view.variantId).toBe('deck');
    expect(view.activeId).toBe('topic');
    expect(view.editorText).toBe('Build a slide deck about ');
    expect(view.sendText).toBe('Build a slide deck about');
  });

  it('asks for the topic as a blank typed straight into the prompt', () => {
    let state = run(
      initBuilder('agentic'),
      { type: 'answer', questionId: 'q1', value: pick(AGENT_Q1, 'research') },
      { type: 'answer', questionId: 'what', value: pick(`${RESEARCH}.what`, 'tools') },
    );
    let view = builderView(state, t);
    expect(view.activeId).toBe('topic');
    expect(view.editorText).toBe('Research and compare software tools for ');
    expect(view.blank).toEqual({ id: 'topic', at: view.editorText.length });
    expect(view.ghost).toBe('e.g. tracking our sales leads …');

    // Typing fills the blank; the prompt keeps composing and the answer is underlined.
    state = run(state, { type: 'fill', questionId: 'topic', text: 'tracking sales leads ' });
    view = builderView(state, t);
    expect(state.promptEdited).toBe(false);
    expect(view.activeId).toBe('topic');
    expect(view.editorText).toBe('Research and compare software tools for tracking sales leads ');
    expect(view.segments.at(-1)).toEqual({ text: 'tracking sales leads ', kind: 'answer' });

    // Confirming moves on; later answers still write into the prompt.
    state = run(
      state,
      { type: 'confirm', questionId: 'topic' },
      { type: 'toggle', questionId: 'must', value: pick(`${RESEARCH}.must`, 'budget') },
      { type: 'confirm', questionId: 'must' },
    );
    view = builderView(state, t);
    expect(view.blank).toBeNull();
    expect(view.atLastStep).toBe(true);
    expect(view.sendText).toBe('Research and compare software tools for tracking sales leads. Each one has to fit our budget.');
  });

  it('does not confirm an empty blank', () => {
    let state = run(
      initBuilder('agentic'),
      { type: 'answer', questionId: 'q1', value: pick(AGENT_Q1, 'deck') },
      { type: 'fill', questionId: 'topic', text: '   ' },
      { type: 'confirm', questionId: 'topic' },
    );
    expect(builderView(state, t).activeId).toBe('topic');
  });

  it('opens an idea chip straight on the last step with its starter prompt', () => {
    const state = initBuilder('agentic', { variant: 'custom', text: 'Map the market for a new product.' });
    const view = builderView(state, t);
    expect(view.atLastStep).toBe(true);
    expect(view.questions).toEqual([]);
    expect(view.sendText).toBe('Map the market for a new product.');
    expect(view.readiness).toBe(3);
  });
});
