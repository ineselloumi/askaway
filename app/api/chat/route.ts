import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import {
  IDENTITY,
  MODELS,
  allowRequest,
  claude,
  clientIp,
  isMock,
  languageInstruction,
  modelName,
  sleep,
} from '@/lib/server/claude';

// The plain conversation behind the guided flow: the prompt the user built (or
// typed) goes in as their own message, with the rest of the thread as history.

export const runtime = 'nodejs';
export const maxDuration = 120;

const MAX_TURNS = 40;
const MAX_TEXT = 100_000; // people paste whole articles
const MAX_ATTACHMENT = 60_000;
const MAX_IMAGES = 5;
const MAX_IMAGE_CHARS = 5 * 1024 * 1024;

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
  locale?: string;
}

const FORMAT = `How to answer:
- Start with one short lead-in sentence on its own line (under 15 words) that says what you are handing over, like "Here it is, short enough to paste into a chat:" or "In short: yes, and here is why." Then a blank line, then the answer.
- If they asked for a piece of writing, everything after the blank line is only that text, ready to copy, with no commentary around it.
- Keep it as short as the task allows. Plain text. Use "-" bullets or **bold** only when they really help. No headings and no tables.
- If something essential is missing, make one sensible assumption and name it in the lead-in, or ask one short question instead of answering. Never ask more than one question.
- You cannot browse the web in this conversation. If they need live information, say what you can from memory and that it may be out of date.`;

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
        system: `Write a title of 3 to 6 words for a conversation that starts with the message below. Plain words, no quotes, no trailing punctuation. Reply with the title only.${languageInstruction(body.locale)}`,
        messages: [{ role: 'user', content: last.content.slice(0, 2000) }],
      });
      const title = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text.trim();
      return NextResponse.json({ title: title?.replace(/^["'“]|["'”.]$/g, '') ?? null });
    } catch {
      return NextResponse.json({ title: null });
    }
  }

  const hasImages = turns.some((turn) => turn.role === 'user' && (turn.images?.length ?? 0) > 0);
  const model = hasImages ? MODELS.vision : MODELS.chat;
  const reason = hasImages
    ? 'image'
    : body.category === 'write' || body.category === 'understand'
      ? body.category
      : 'general';

  if (isMock()) {
    await sleep(900);
    return NextResponse.json({
      text: `Here is a sample answer, because no API key is set:\n\nYou asked: "${last.content.slice(0, 200)}". Add an Anthropic API key to .env.local and this box will hold a real answer.`,
      model: 'Claude (demo)',
      reason,
    });
  }

  try {
    const response = await claude().messages.create({
      model,
      max_tokens: 16000,
      output_config: { effort: 'low' },
      system: `${IDENTITY}\n\n${FORMAT}${languageInstruction(body.locale)}`,
      messages: turns.map((turn) => ({ role: turn.role, content: toContent(turn) })),
    });

    if (response.stop_reason === 'refusal') {
      return NextResponse.json({ declined: true });
    }

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();
    if (!text) return bad('empty', 502);

    return NextResponse.json({ text, model: modelName(response.model), reason });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return bad('busy', 429);
    if (error instanceof Anthropic.APIError) {
      console.error('[chat] API error', error.status, error.message);
      return bad('upstream', error.status === 529 ? 429 : 502);
    }
    console.error('[chat] error', error);
    return bad('server', 500);
  }
}
