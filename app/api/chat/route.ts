import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { fallbackRoute, isTier, pickModel, type Facts, type Tier } from '@/lib/guided/routing';
import { describeRequest, opusAllowed, recordOpusUse } from '@/lib/server/router';
import {
  IDENTITY,
  MODELS,
  allowRequest,
  claude,
  clientIp,
  isMock,
  modelName,
  sleep,
} from '@/lib/server/claude';

// The plain conversation behind the guided flow: the prompt the user built (or
// typed) goes in as their own message, with the rest of the thread as history.
//
// Answers can look things up on the web when they need to. The answer comes
// back as newline-delimited JSON events, so the client can say what is being
// looked up while it waits:
//
//   { type: 'search', query }   a web search, in the user's words
//   { type: 'open' }            a page is being read (usually a link they shared)
//   { type: 'done', text, model, tier, reason, routed, sources }
//   { type: 'declined' }
//   { type: 'error', code }

export const runtime = 'nodejs';
export const maxDuration = 180;

const MAX_TURNS = 40;
const MAX_TEXT = 100_000; // people paste whole articles
const MAX_ATTACHMENT = 60_000;
const MAX_IMAGES = 5;
const MAX_IMAGE_CHARS = 5 * 1024 * 1024;
// Kept below the job limits in /api/agent: a quick question needs a fact or two,
// and every search and page adds seconds while the person watches the screen.
const MAX_SEARCHES = 3;
const MAX_PAGES = 3;
const MAX_PAGE_TOKENS = 6000;
const MAX_CONTINUATIONS = 3;

interface Turn {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  attachment?: { name: string; text: string };
}

interface ChatRequest {
  action?: 'answer' | 'title';
  messages?: Turn[];
  category?: string;
  /** The tier that answered the previous turn, so follow-ups stay on the same model. */
  previous?: string;
}

const MODEL_FOR: Record<Tier, string> = { haiku: MODELS.chat, sonnet: MODELS.strong, opus: MODELS.deep };
/** More capable tiers are given more room to think. */
const EFFORT_FOR: Record<Tier, 'low' | 'medium'> = { haiku: 'low', sonnet: 'medium', opus: 'medium' };

const FORMAT = `How to answer:
- Start with one short lead-in sentence on its own line (under 15 words) that says what you are handing over, like "Here it is, short enough to paste into a chat:" or "In short: yes, and here is why." Then a blank line, then the answer.
- If they asked for a piece of writing, everything after the blank line is only that text, ready to copy, with no commentary around it.
- Keep it as short as the task allows. Plain text. Use "-" bullets or **bold** only when they really help. No headings and no tables.
- If something essential is missing, make one sensible assumption and name it in the lead-in, or ask one short question instead of answering. Never ask more than one question.
- You can search the web and open pages. Do it only when the answer depends on facts that are recent, local, or that you are not sure of, or when they share a link. Do not search to write, reword, translate or explain text they gave you. When you looked something up, say how recent it is if that matters. Never put links in the text: the pages you used are listed under your answer.`;

// The basic tool variants, as in /api/agent: they also run on the Haiku tier.
const WEB_TOOLS: Anthropic.ToolUnion[] = [
  { type: 'web_search_20250305', name: 'web_search', max_uses: MAX_SEARCHES },
  { type: 'web_fetch_20250910', name: 'web_fetch', max_uses: MAX_PAGES, max_content_tokens: MAX_PAGE_TOKENS },
];

type Emit = (event: Record<string, unknown>) => void;

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function toContent(turn: Turn): Anthropic.MessageParam['content'] {
  let text = turn.content;
  if (turn.attachment?.text) {
    text += `\n\nAttached file "${turn.attachment.name}":\n${turn.attachment.text}`;
  }
  const images = turn.role === 'user' ? turn.images ?? [] : [];
  if (!images.length) return text;

  const blocks: Anthropic.ContentBlockParam[] = [];
  for (const image of images) {
    const match = image.match(/^data:(image\/(?:jpeg|png|gif|webp));base64,(.+)$/);
    if (!match) continue;
    blocks.push({
      type: 'image',
      source: { type: 'base64', media_type: match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: match[2] },
    });
  }
  blocks.push({ type: 'text', text: text || 'Take a look at this.' });
  return blocks;
}

/** The answer is the text after the last web lookup; earlier text is the model getting started. */
function answerFrom(content: Anthropic.ContentBlock[]) {
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
  return { text: text.trim(), sources };
}

/** Pages it opened in full, from every round of the answer. */
function pagesOpened(messages: Anthropic.MessageParam[], sources: Map<string, string>) {
  for (const message of messages) {
    if (message.role !== 'assistant' || !Array.isArray(message.content)) continue;
    for (const block of message.content) {
      if (block.type !== 'web_fetch_tool_result' || block.content.type !== 'web_fetch_result') continue;
      if (!sources.has(block.content.url)) sources.set(block.content.url, block.content.content?.title || block.content.url);
    }
  }
}

function validate(turns: unknown): turns is Turn[] {
  if (!Array.isArray(turns) || turns.length === 0 || turns.length > MAX_TURNS) return false;
  let images = 0;
  for (const turn of turns) {
    if (!turn || (turn.role !== 'user' && turn.role !== 'assistant')) return false;
    if (typeof turn.content !== 'string' || turn.content.length > MAX_TEXT) return false;
    if (turn.attachment && (typeof turn.attachment.text !== 'string' || turn.attachment.text.length > MAX_ATTACHMENT)) return false;
    for (const image of turn.images ?? []) {
      if (typeof image !== 'string' || image.length > MAX_IMAGE_CHARS) return false;
      images += 1;
    }
  }
  return images <= MAX_IMAGES && turns[0].role === 'user' && turns[turns.length - 1].role === 'user';
}

export async function POST(request: NextRequest) {
  if (!allowRequest(clientIp(request.headers), 'chat', 20)) {
    return bad('busy', 429);
  }

  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return bad('Invalid request.');
  }
  if (!validate(body.messages)) return bad('Invalid request.');
  const turns = body.messages;
  const last = turns[turns.length - 1];

  // ── Conversation title for the history list ───────────────────────────────
  if (body.action === 'title') {
    if (isMock()) return NextResponse.json({ title: last.content.slice(0, 40) });
    try {
      const response = await claude().messages.create({
        model: MODELS.chat,
        max_tokens: 1000,
        output_config: { effort: 'low' },
        system: `Write a title of 3 to 6 words for a conversation that starts with the message below. Plain words, no quotes, no trailing punctuation. Reply with the title only.`,
        messages: [{ role: 'user', content: last.content.slice(0, 2000) }],
      });
      const title = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text.trim();
      return NextResponse.json({ title: title?.replace(/^["'“]|["'”.]$/g, '') ?? null });
    } catch {
      return NextResponse.json({ title: null });
    }
  }

  const hasImages = turns.some((turn) => turn.role === 'user' && (turn.images?.length ?? 0) > 0);
  const facts: Facts = {
    chars: last.content.length + (last.attachment?.text.length ?? 0),
    hasImages,
    previous: isTier(body.previous) ? body.previous : null,
    opusAllowed: opusAllowed(),
  };

  if (isMock()) {
    await sleep(900);
    return NextResponse.json({
      text: `Here is a sample answer, because no API key is set:\n\nYou asked: "${last.content.slice(0, 200)}". Add an Anthropic API key to .env.local and this box will hold a real answer.`,
      model: 'Claude (demo)',
      ...fallbackRoute(facts),
    });
  }

  // Describe the request with the fast decision model, then pick a Claude model for it.
  const earlier = turns.length > 1 ? turns.slice(-3, -1).map((turn) => `${turn.role}: ${turn.content}`).join('\n') : null;
  const described = await describeRequest(
    last.attachment ? `${last.content}\n\n[Attached file: ${last.attachment.name}]` : last.content,
    earlier,
    request.signal,
  );
  const route = described ? pickModel(described, facts) : fallbackRoute(facts);
  const model = route.tier === 'sonnet' && hasImages ? MODELS.vision : MODEL_FOR[route.tier];

  const routed = described ? 'scored' : 'rule';
  const messages: Anthropic.MessageParam[] = turns.map((turn) => ({ role: turn.role, content: toContent(turn) }));

  const answer = async (emit: Emit, signal: AbortSignal) => {
    if (route.tier === 'opus') recordOpusUse();
    for (let round = 0; round <= MAX_CONTINUATIONS; round++) {
      const stream = claude().messages.stream(
        {
          model,
          max_tokens: 16000,
          output_config: { effort: EFFORT_FOR[route.tier] },
          system: `${IDENTITY}\n\n${FORMAT}`,
          tools: WEB_TOOLS,
          messages,
        },
        { signal },
      );
      stream.on('contentBlock', (block) => {
        if (block.type !== 'server_tool_use') return;
        const query = (block.input as { query?: unknown } | null)?.query;
        if (block.name === 'web_search' && typeof query === 'string') emit({ type: 'search', query });
        if (block.name === 'web_fetch') emit({ type: 'open' });
      });
      const response = await stream.finalMessage();

      if (response.stop_reason === 'refusal') return emit({ type: 'declined' });

      // The server-side lookup loop paused: send the turn back to carry on.
      if (response.stop_reason === 'pause_turn') {
        messages.push({ role: 'assistant', content: response.content });
        continue;
      }

      const { text, sources } = answerFrom(response.content);
      if (!text) return emit({ type: 'error', code: 'empty' });
      pagesOpened([...messages, { role: 'assistant', content: response.content }], sources);
      return emit({
        type: 'done',
        text,
        model: modelName(response.model),
        tier: route.tier,
        reason: route.reason,
        routed,
        sources: [...sources].slice(0, 6).map(([url, title]) => ({ url, title })),
      });
    }
    emit({ type: 'error', code: 'too-long' });
  };

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
        await answer(emit, request.signal);
      } catch (error) {
        if (request.signal.aborted || error instanceof Anthropic.APIUserAbortError) {
          // The person left: nothing to report.
        } else if (error instanceof Anthropic.RateLimitError || (error instanceof Anthropic.APIError && error.status === 529)) {
          emit({ type: 'error', code: 'busy' });
        } else {
          console.error('[chat] error', error instanceof Anthropic.APIError ? `${error.status} ${error.message}` : error);
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
