import { NextRequest, NextResponse } from 'next/server';
import { fallbackRoute, isTier, pickModel, type Facts, type Tier } from '@/lib/guided/routing';
import { describeRequest, opusAllowed, recordOpusUse } from '@/lib/server/router';
import {
  DEMO_MODEL,
  IDENTITY,
  MODELS,
  allowRequest,
  clientIp,
  complete,
  describeFailure,
  failure,
  isMock,
  modelName,
  sleep,
  type Turn as ModelTurn,
} from '@/lib/server/llm';

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
- You cannot browse the web in this conversation. If they need live information, say what you can from memory and that it may be out of date.`;

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function toModelTurn(turn: Turn): ModelTurn {
  let text = turn.content;
  if (turn.attachment?.text) {
    text += `\n\nAttached file "${turn.attachment.name}":\n${turn.attachment.text}`;
  }
  return { role: turn.role, text, images: turn.images };
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
      const response = await complete({
        model: MODELS.chat,
        maxTokens: 1000,
        effort: 'low',
        system: `Write a title of 3 to 6 words for a conversation that starts with the message below. Plain words, no quotes, no trailing punctuation. Reply with the title only.`,
        turns: [{ role: 'user', text: last.content.slice(0, 2000) }],
      });
      const title = response.text || null;
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
      text: `Here is a sample answer, because no API key is set:\n\nYou asked: "${last.content.slice(0, 200)}". Add an API key to .env.local and this box will hold a real answer.`,
      model: DEMO_MODEL,
      ...fallbackRoute(facts),
    });
  }

  // Describe the request with the fast decision model, then pick a model for it.
  const earlier = turns.length > 1 ? turns.slice(-3, -1).map((turn) => `${turn.role}: ${turn.content}`).join('\n') : null;
  const described = await describeRequest(
    last.attachment ? `${last.content}\n\n[Attached file: ${last.attachment.name}]` : last.content,
    earlier,
    request.signal,
  );
  const route = described ? pickModel(described, facts) : fallbackRoute(facts);
  const model = route.tier === 'sonnet' && hasImages ? MODELS.vision : MODEL_FOR[route.tier];

  try {
    if (route.tier === 'opus') recordOpusUse();
    const response = await complete({
      model,
      maxTokens: 16000,
      effort: EFFORT_FOR[route.tier],
      system: `${IDENTITY}\n\n${FORMAT}`,
      turns: turns.map(toModelTurn),
    });

    if (response.declined) {
      return NextResponse.json({ declined: true });
    }

    const text = response.text;
    if (!text) return bad('empty', 502);

    return NextResponse.json({
      text,
      model: modelName(response.model),
      tier: route.tier,
      reason: route.reason,
      routed: described ? 'scored' : 'rule',
    });
  } catch (error) {
    const kind = failure(error);
    if (kind === 'busy') return bad('busy', 429);
    if (kind === 'upstream') {
      console.error('[chat] API error', describeFailure(error));
      return bad('upstream', 502);
    }
    console.error('[chat] error', error);
    return bad('server', 500);
  }
}
