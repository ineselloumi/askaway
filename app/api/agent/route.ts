import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { BRAND } from '@/lib/brand';
import {
  DEMO_MODEL,
  IDENTITY,
  MODELS,
  allowRequest,
  claude,
  clientIp,
  describeFailure,
  failure,
  isMock,
  modelName,
  sleep,
} from '@/lib/server/llm';
import { runOpenAIJob } from './openai';

// "Do things for me": one job that the model works through on its own. On
// chatgpt.askaway.guide the job runs on OpenAI instead (./openai.ts), with the
// same events. The
// response is a stream of newline-delimited JSON events that the client turns
// into plain-English progress steps.
//
//   { type: 'phase', phase: 'plan' | 'search' | 'read' | 'data' | 'write' }
//   { type: 'search', query }            a web search, in the user's words
//   { type: 'pages', count }             pages opened and read since the last event
//   { type: 'checkin', question, resume } a blocking question; POST again with `resume`
//   { type: 'done', text, model, sources }
//   { type: 'error', code }
//
// The job only ever reads public web pages (and the data the user attached).
// It cannot sign in, pay, send, or reach the user's accounts: no such tools exist here.

export const runtime = 'nodejs';
export const maxDuration = 300;

const MAX_ASK = 20_000;
const MAX_ATTACHMENT = 60_000;
const MAX_HISTORY = 20;
const MAX_RESUME_BYTES = 3_500_000;
const MAX_CONTINUATIONS = 4;
const MAX_SEARCHES = 6;
const MAX_PAGES = 5;
const MAX_PAGE_TOKENS = 6000;
/** OpenAI hands back one item per search, page and reasoning step, so its resumes run longer. */
const MAX_RESUME_ITEMS = BRAND.id === 'chatgpt' ? 150 : 40;

type Kind = 'web' | 'data';

interface AgentRequest {
  ask?: string;
  kind?: Kind;
  job?: string;
  attachment?: { name: string; text: string };
  history?: { role: 'user' | 'assistant'; content: string }[];
  /** The job so far, in the provider's own format: Anthropic messages, or OpenAI input items. */
  resume?: { messages: Anthropic.MessageParam[]; toolUseId: string; answer: string };
}

type Emit = (event: Record<string, unknown>) => void;

const CHECK_IN: Anthropic.Tool = {
  name: 'check_in',
  description:
    'Pause the job and ask the person one multiple-choice question. Use this only when you hit a real fork that you cannot settle from what they asked and that changes the result, for example when an option only qualifies under a condition they never mentioned. Do not use it to confirm things they already said, to ask for preferences you can reasonably assume, or more than once in a job.',
  strict: true,
  input_schema: {
    type: 'object',
    properties: {
      headline: {
        type: 'string',
        description: 'One short sentence saying what you found, e.g. "Two of them only publish annual prices."',
      },
      detail: {
        type: 'string',
        description: 'One or two plain sentences on why it matters, ending with the question.',
      },
      label: { type: 'string', description: 'Two to four words naming the choice, e.g. "Annual-only tools".' },
      options: {
        type: 'array',
        items: { type: 'string' },
        description: 'Two or three answers, two to four words each, e.g. "Include them", "Leave them out".',
      },
    },
    required: ['headline', 'detail', 'label', 'options'],
    additionalProperties: false,
  },
};

const RESULT_FORMAT = `How to hand the result back:
- First line: one short lead-in sentence (under 12 words) that gives the headline, like "Done. I'd go with Linear." Then a blank line.
- Then the answer in a few plain sentences: what you recommend or found, and why it fits what they asked for. Mention a runner-up when you compared options.
- When you compared several options, finish with a block in exactly this shape, one option per line, best first, at most six lines:
[[compare]]
Name | the two or three facts that decided it | ok
Name | why it was ruled out | out
[[/compare]]
- Plain text only. "-" bullets and **bold** are fine when they help. No headings, no tables, no links in the text.
- Be honest about what you could not confirm.`;

// The guided builder asks for this before the job starts; this is the backstop
// for a prompt sent without it.
const OWN_INFORMATION = `If the job rests on the person's own information (their numbers, files, notes, or details about their company, such as "our sales this week") and it is not in their message or an attached file, do not search for it and never make it up. Do not do the job. Instead, hand back two or three short, friendly sentences that say what you need and ask them to paste or type it into their reply, for example "Paste or type your numbers so I have something to work with."`;

const JOBS: Record<string, string> = {
  research:
    'The job is to research and compare options. Look at several, check them against what the person said has to be true, and recommend one with a runner-up.',
  deck:
    'The job is to build a slide deck. You cannot create a file, so write the deck out in this chat: one line per slide in the form "Slide 1: Title", each followed by two to four short "-" bullets. Add speaker notes only if asked. Look things up when the topic needs public facts.',
  sheet:
    'The job is to make sense of spreadsheet data the person attached or pasted. Work only from that data. If there is no data in the ask, say so and ask them to paste the rows or attach a .csv file.',
  custom: 'Work out what the job needs, do it, and hand back something the person can use straight away.',
};

function systemPrompt(kind: Kind, job: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const reach =
    kind === 'web'
      ? 'You can search the public web and open pages to read them. Search results only show short excerpts, so open the pages that matter (official pricing and product pages first) to confirm the facts your answer rests on. You can only open a page whose exact address appeared in your search results or in the person\'s message, so if an official page has not come up, search for it by name instead of guessing its address. Stop looking once you have enough to answer well.'
      : 'You cannot browse the web in this job. Work only from what the person gave you.';
  return `${IDENTITY}

Right now you are doing a job for the person on your own, while they wait. Today is ${today}.

${JOBS[job] ?? JOBS.custom}

${reach}

${OWN_INFORMATION}

${RESULT_FORMAT}`;
}

function tools(kind: Kind): Anthropic.ToolUnion[] {
  const list: Anthropic.ToolUnion[] = [CHECK_IN];
  if (kind === 'web') {
    // The basic tool variants are used on purpose. The newer "dynamic filtering"
    // variants route every search through code execution, and in testing the
    // agent regularly ran out of searches before it had read anything.
    list.unshift(
      { type: 'web_search_20250305', name: 'web_search', max_uses: MAX_SEARCHES },
      { type: 'web_fetch_20250910', name: 'web_fetch', max_uses: MAX_PAGES, max_content_tokens: MAX_PAGE_TOKENS },
    );
  }
  return list;
}

function isCheckIn(input: unknown): input is { headline: string; detail: string; label: string; options: string[] } {
  if (!input || typeof input !== 'object') return false;
  const value = input as Record<string, unknown>;
  return (
    typeof value.headline === 'string' &&
    typeof value.detail === 'string' &&
    typeof value.label === 'string' &&
    Array.isArray(value.options) &&
    value.options.length >= 2 &&
    value.options.every((option) => typeof option === 'string' && option.length > 0)
  );
}

/** Pages the agent actually opened, across every turn of the job. */
function pagesOpened(messages: Anthropic.MessageParam[], sources: Map<string, string>) {
  for (const message of messages) {
    if (message.role !== 'assistant' || !Array.isArray(message.content)) continue;
    for (const block of message.content) {
      if (block.type !== 'web_fetch_tool_result' || block.content.type !== 'web_fetch_result') continue;
      const url = block.content.url;
      if (!sources.has(url)) sources.set(url, block.content.content?.title || url);
    }
  }
}

/** The write-up is the text after the last tool activity; earlier text is working notes. */
function finalAnswer(content: Anthropic.ContentBlock[], earlier: Anthropic.MessageParam[]) {
  let start = 0;
  content.forEach((block, index) => {
    if (block.type !== 'text' && block.type !== 'thinking' && block.type !== 'redacted_thinking') start = index + 1;
  });
  const sources = new Map<string, string>();
  let text = '';
  for (const block of content.slice(start)) {
    if (block.type !== 'text') continue;
    text += block.text;
    for (const citation of block.citations ?? []) {
      if (citation.type === 'web_search_result_location' && !sources.has(citation.url)) {
        sources.set(citation.url, citation.title || citation.url);
      }
    }
  }
  pagesOpened([...earlier, { role: 'assistant', content }], sources);
  return {
    text: text.trim(),
    sources: [...sources].slice(0, 6).map(([url, title]) => ({ url, title })),
  };
}

async function runJob(body: AgentRequest, kind: Kind, emit: Emit, signal: AbortSignal) {
  const job = body.job && JOBS[body.job] ? body.job : 'custom';

  if (BRAND.id === 'chatgpt') {
    let ask = body.ask ?? '';
    if (body.attachment?.text) ask += `\n\nAttached file "${body.attachment.name}":\n${body.attachment.text}`;
    return runOpenAIJob({
      kind,
      system: systemPrompt(kind, job),
      checkIn: { name: CHECK_IN.name, description: CHECK_IN.description!, parameters: CHECK_IN.input_schema as Record<string, unknown> },
      isCheckIn,
      history: body.history ?? [],
      ask,
      resume: body.resume,
      emit,
      signal,
    });
  }

  let messages: Anthropic.MessageParam[];

  if (body.resume) {
    // Carry on from a check-in: answer the pending question(s) and continue the same turn.
    messages = [...body.resume.messages];
    const pending = messages[messages.length - 1];
    const asked = Array.isArray(pending?.content)
      ? pending.content.filter((block): block is Anthropic.ToolUseBlockParam => block.type === 'tool_use')
      : [];
    if (pending?.role !== 'assistant' || asked.length === 0) {
      emit({ type: 'error', code: 'invalid' });
      return;
    }
    messages.push({
      role: 'user',
      content: asked.map((block) => ({
        type: 'tool_result' as const,
        tool_use_id: block.id,
        content: block.id === body.resume!.toolUseId ? body.resume!.answer : 'No answer. Use your best judgement.',
      })),
    });
    emit({ type: 'phase', phase: kind === 'web' ? 'read' : 'data' });
  } else {
    let ask = body.ask ?? '';
    if (body.attachment?.text) ask += `\n\nAttached file "${body.attachment.name}":\n${body.attachment.text}`;
    messages = [...(body.history ?? []).map((turn) => ({ role: turn.role, content: turn.content })), { role: 'user', content: ask }];
    emit({ type: 'phase', phase: 'plan' });
  }

  let searched = !!body.resume;

  for (let round = 0; round <= MAX_CONTINUATIONS; round++) {
    const stream = claude().messages.stream(
      {
        model: MODELS.agent,
        max_tokens: 16000,
        output_config: { effort: 'medium' },
        system: systemPrompt(kind, job),
        tools: tools(kind),
        messages,
      },
      { signal },
    );

    stream.on('streamEvent', (event) => {
      if (event.type !== 'content_block_start') return;
      const type = event.content_block.type;
      if (type === 'server_tool_use') emit({ type: 'phase', phase: 'search' });
      // Text before any search is just the agent thinking aloud, not the write-up.
      if (type === 'text') emit({ type: 'phase', phase: kind === 'data' || searched ? 'write' : 'plan' });
      if (type === 'thinking' && kind === 'data') emit({ type: 'phase', phase: 'data' });
    });

    stream.on('contentBlock', (block) => {
      if (block.type === 'server_tool_use') {
        searched = true;
        const query = (block.input as { query?: unknown } | null)?.query;
        if (block.name === 'web_search' && typeof query === 'string') emit({ type: 'search', query });
      }
      if (block.type === 'web_search_tool_result') {
        searched = true;
        // Search results are excerpts, not pages read: only opened pages count towards the receipt.
        emit({ type: 'phase', phase: 'read' });
      }
      if (block.type === 'web_fetch_tool_result') {
        searched = true;
        emit({ type: 'phase', phase: 'read' });
        if (block.content.type === 'web_fetch_result') emit({ type: 'pages', count: 1 });
      }
    });

    const message = await stream.finalMessage();

    if (message.stop_reason === 'refusal') {
      emit({ type: 'error', code: 'declined' });
      return;
    }

    // The server-side search loop hit its limit: send the turn back to carry on.
    if (message.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content: message.content });
      continue;
    }

    const question = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use' && block.name === 'check_in',
    );
    if (message.stop_reason === 'tool_use' && question) {
      messages.push({ role: 'assistant', content: message.content });
      if (!isCheckIn(question.input)) {
        // Unusable question: tell the agent to decide for itself and keep going.
        messages.push({
          role: 'user',
          content: message.content
            .filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')
            .map((block) => ({
              type: 'tool_result' as const,
              tool_use_id: block.id,
              is_error: true,
              content: 'That question could not be shown. Use your best judgement and finish the job.',
            })),
        });
        continue;
      }
      emit({
        type: 'checkin',
        question: {
          toolUseId: question.id,
          headline: question.input.headline,
          detail: question.input.detail,
          label: question.input.label,
          options: question.input.options.slice(0, 3),
        },
        resume: { messages },
      });
      return;
    }

    const answer = finalAnswer(message.content, messages);
    if (!answer.text) {
      emit({ type: 'error', code: 'empty' });
      return;
    }
    emit({ type: 'done', text: answer.text, sources: answer.sources, model: modelName(message.model) });
    return;
  }

  emit({ type: 'error', code: 'too-long' });
}

/** Scripted run used when no API key is configured, so the flow can still be demoed. */
async function mockJob(body: AgentRequest, kind: Kind, emit: Emit) {
  if (!body.resume) {
    emit({ type: 'phase', phase: 'plan' });
    await sleep(900);
    if (kind === 'web') {
      emit({ type: 'phase', phase: 'search' });
      emit({ type: 'search', query: 'best options compared' });
      await sleep(900);
      emit({ type: 'phase', phase: 'read' });
      emit({ type: 'pages', count: 5 });
      await sleep(900);
      emit({
        type: 'checkin',
        question: {
          toolUseId: 'mock_check_in',
          headline: 'Two of them only publish annual prices.',
          detail: 'Paying yearly makes both cheaper, but you would be committing for twelve months. Want them in or out?',
          label: 'Annual-only options',
          options: ['Include them', 'Leave them out', 'Show me both ways'],
        },
        resume: { messages: [{ role: 'user', content: body.ask ?? '' }, { role: 'assistant', content: [{ type: 'tool_use', id: 'mock_check_in', name: 'check_in', input: {} }] }] },
      });
      return;
    }
    emit({ type: 'phase', phase: 'data' });
    await sleep(1200);
  } else {
    emit({ type: 'phase', phase: 'read' });
    emit({ type: 'pages', count: 4 });
    await sleep(900);
  }
  emit({ type: 'phase', phase: 'write' });
  await sleep(900);
  emit({
    type: 'done',
    model: DEMO_MODEL,
    sources: [],
    text: "Done. I'd go with the first one.\n\nThis is a sample result, because no API key is set. With a key, this is where the recommendation and the reasons behind it would appear.\n\n[[compare]]\nFirst option | fits the budget · well reviewed | ok\nSecond option | cheaper · rougher edges | ok\nThird option | over your limit | out\n[[/compare]]",
  });
}

function invalid(body: AgentRequest): boolean {
  if (body.kind !== 'web' && body.kind !== 'data') return true;
  if (body.attachment && (typeof body.attachment.text !== 'string' || body.attachment.text.length > MAX_ATTACHMENT)) return true;
  if (body.resume) {
    const { messages, toolUseId, answer } = body.resume;
    return (
      !Array.isArray(messages) ||
      messages.length < 2 ||
      messages.length > MAX_RESUME_ITEMS ||
      messages[0]?.role !== 'user' ||
      typeof toolUseId !== 'string' ||
      typeof answer !== 'string' ||
      answer.length === 0 ||
      answer.length > 2000
    );
  }
  if (typeof body.ask !== 'string' || !body.ask.trim() || body.ask.length > MAX_ASK) return true;
  if (body.history) {
    if (!Array.isArray(body.history) || body.history.length > MAX_HISTORY) return true;
    if (body.history.length && body.history[0].role !== 'user') return true;
    for (const turn of body.history) {
      if ((turn.role !== 'user' && turn.role !== 'assistant') || typeof turn.content !== 'string' || turn.content.length > MAX_ASK) return true;
    }
  }
  return false;
}

export async function POST(request: NextRequest) {
  const json = (data: unknown, status: number) =>
    new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

  if (!allowRequest(clientIp(request.headers), 'agent', 6)) return json({ error: 'busy' }, 429);

  let body: AgentRequest;
  try {
    const raw = await request.text();
    if (raw.length > MAX_RESUME_BYTES) return json({ error: 'too-large' }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'invalid' }, 400);
  }
  if (invalid(body)) return json({ error: 'invalid' }, 400);
  const kind = body.kind as Kind;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const emit: Emit = (event) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          open = false;
        }
      };
      try {
        if (isMock()) await mockJob(body, kind, emit);
        else await runJob(body, kind, emit, request.signal);
      } catch (error) {
        const kind = failure(error);
        if (request.signal.aborted || kind === 'aborted') {
          // The person paused or left: nothing to report.
        } else if (kind === 'busy') {
          emit({ type: 'error', code: 'busy' });
        } else {
          console.error('[agent] error', describeFailure(error));
          emit({ type: 'error', code: 'server' });
        }
      } finally {
        open = false;
        try {
          controller.close();
        } catch {
          // Already closed by the client.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
