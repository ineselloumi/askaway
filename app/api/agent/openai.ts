import type OpenAI from 'openai';
import { MODELS, modelName, openai } from '@/lib/server/llm';

// The same job as runJob in ./route.ts, on OpenAI's Responses API, for
// chatgpt.askaway.guide. It emits the same events, so the client cannot tell
// the two apart. Differences worth knowing:
//
// - OpenAI's hosted web_search tool both searches and opens pages, so there is
//   no separate fetch tool; opened pages come back as `open_page` actions.
// - Responses are not stored on OpenAI's side (store: false), so a check-in
//   hands the whole item list to the client, reasoning included in encrypted
//   form, exactly as the Claude path hands back its messages.

type Item = OpenAI.Responses.ResponseInputItem;
type Emit = (event: Record<string, unknown>) => void;

const MAX_TOOL_CALLS = 11; // six searches and five pages, as on the Claude path

export interface CheckInSchema {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

interface Options {
  kind: 'web' | 'data';
  system: string;
  checkIn: CheckInSchema;
  isCheckIn: (input: unknown) => input is { headline: string; detail: string; label: string; options: string[] };
  history: { role: 'user' | 'assistant'; content: string }[];
  ask: string;
  resume?: { messages: unknown[]; toolUseId: string; answer: string };
  emit: Emit;
  signal: AbortSignal;
  /** Rounds already spent on unusable questions, so a confused agent cannot loop forever. */
  retries?: number;
}

function pendingCalls(items: Item[]): OpenAI.Responses.ResponseFunctionToolCall[] {
  const answered = new Set(
    items.filter((item) => item.type === 'function_call_output').map((item) => (item as { call_id: string }).call_id),
  );
  return items.filter(
    (item): item is OpenAI.Responses.ResponseFunctionToolCall => item.type === 'function_call' && !answered.has(item.call_id),
  );
}

function openedPage(item: OpenAI.Responses.ResponseOutputItem | Item): string | null {
  if (item.type !== 'web_search_call') return null;
  const action = (item as { action?: { type?: string; url?: unknown } }).action;
  return action?.type === 'open_page' && typeof action.url === 'string' ? action.url : null;
}

/** The write-up is the message after the last tool activity; earlier text is working notes. */
function finalAnswer(output: OpenAI.Responses.ResponseOutputItem[], earlier: Item[]) {
  let start = 0;
  output.forEach((item, index) => {
    if (item.type !== 'message' && item.type !== 'reasoning') start = index + 1;
  });
  const sources = new Map<string, string>();
  let text = '';
  for (const item of output.slice(start)) {
    if (item.type !== 'message') continue;
    for (const part of item.content) {
      if (part.type !== 'output_text') continue;
      text += part.text;
      for (const note of part.annotations) {
        if (note.type === 'url_citation' && !sources.has(note.url)) sources.set(note.url, note.title || note.url);
      }
    }
  }
  for (const item of [...earlier, ...output]) {
    const url = openedPage(item);
    if (url && !sources.has(url)) sources.set(url, url);
  }
  return {
    text: text.trim(),
    sources: [...sources].slice(0, 6).map(([url, title]) => ({ url, title })),
  };
}

export async function runOpenAIJob(options: Options) {
  const { kind, emit, signal } = options;
  let items: Item[];

  if (options.resume) {
    // Carry on from a check-in: answer the pending question(s) and continue.
    items = [...(options.resume.messages as Item[])];
    const asked = pendingCalls(items);
    if (asked.length === 0) {
      emit({ type: 'error', code: 'invalid' });
      return;
    }
    for (const call of asked) {
      items.push({
        type: 'function_call_output',
        call_id: call.call_id,
        output: call.call_id === options.resume.toolUseId ? options.resume.answer : 'No answer. Use your best judgement.',
      });
    }
    emit({ type: 'phase', phase: kind === 'web' ? 'read' : 'data' });
  } else {
    items = [...options.history.map((turn) => ({ role: turn.role, content: turn.content })), { role: 'user', content: options.ask }];
    emit({ type: 'phase', phase: 'plan' });
  }

  let searched = !!options.resume;
  const tools: OpenAI.Responses.Tool[] = [
    { type: 'function', strict: true, ...options.checkIn },
    ...(kind === 'web' ? [{ type: 'web_search' as const }] : []),
  ];

  const stream = openai().responses.stream(
    {
      model: MODELS.agent,
      instructions: options.system,
      input: items,
      tools,
      max_tool_calls: MAX_TOOL_CALLS,
      max_output_tokens: 16000,
      reasoning: { effort: 'medium' },
      store: false,
      include: ['reasoning.encrypted_content', 'web_search_call.action.sources'],
    },
    { signal },
  );

  stream.on('response.output_item.added', (event) => {
    const type = event.item.type;
    if (type === 'web_search_call') emit({ type: 'phase', phase: 'search' });
    // Text before any search is just the agent thinking aloud, not the write-up.
    if (type === 'message') emit({ type: 'phase', phase: kind === 'data' || searched ? 'write' : 'plan' });
    if (type === 'reasoning' && kind === 'data') emit({ type: 'phase', phase: 'data' });
  });

  stream.on('response.output_item.done', (event) => {
    const item = event.item;
    if (item.type !== 'web_search_call') return;
    searched = true;
    const action = (item as { action?: { type?: string; query?: unknown } }).action;
    if (action?.type === 'search' && typeof action.query === 'string') emit({ type: 'search', query: action.query });
    emit({ type: 'phase', phase: 'read' });
    if (openedPage(item)) emit({ type: 'pages', count: 1 });
  });

  const response = await stream.finalResponse();
  const output = response.output as OpenAI.Responses.ResponseOutputItem[];

  const declined = output.some((item) => item.type === 'message' && item.content.some((part) => part.type === 'refusal'));
  if (declined) {
    emit({ type: 'error', code: 'declined' });
    return;
  }

  const question = output.find(
    (item): item is OpenAI.Responses.ResponseFunctionToolCall => item.type === 'function_call' && item.name === options.checkIn.name,
  );
  if (question) {
    let input: unknown = null;
    try {
      input = JSON.parse(question.arguments);
    } catch {
      // Handled below as an unusable question.
    }
    const next = [...items, ...(output as Item[])];
    if (!options.isCheckIn(input)) {
      // Unusable question: tell the agent to decide for itself and keep going.
      if ((options.retries ?? 0) >= 2) {
        emit({ type: 'error', code: 'too-long' });
        return;
      }
      return runOpenAIJob({
        ...options,
        retries: (options.retries ?? 0) + 1,
        resume: { messages: next, toolUseId: question.call_id, answer: 'That question could not be shown. Use your best judgement and finish the job.' },
      });
    }
    emit({
      type: 'checkin',
      question: {
        toolUseId: question.call_id,
        headline: input.headline,
        detail: input.detail,
        label: input.label,
        options: input.options.slice(0, 3),
      },
      resume: { messages: next },
    });
    return;
  }

  if (response.status === 'incomplete' && response.incomplete_details?.reason === 'max_output_tokens') {
    emit({ type: 'error', code: 'too-long' });
    return;
  }

  const answer = finalAnswer(output, items);
  if (!answer.text) {
    emit({ type: 'error', code: 'empty' });
    return;
  }
  emit({ type: 'done', text: answer.text, sources: answer.sources, model: modelName(response.model) });
}
