import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { CHECKS, type CheckDef, type Scores } from '@/lib/guided/quality';
import { MODELS, allowRequest, claude, clientIp, getAnthropicKey } from '@/lib/server/claude';

// Scores a prompt-in-progress against four yes/no checks, so the readiness
// fill reflects how useful the prompt is rather than how many chips were
// tapped. Called at every pause in typing, so it has to be fast:
//
//   1. Jev (TypeSafe AI), a decision model that returns a calibrated yes
//      probability per question in a single call.
//   2. Claude Haiku as a fallback when Jev is not configured, slow or down.
//   3. `scores: null`, and the client keeps its count-based fill.

export const runtime = 'nodejs';
export const maxDuration = 15;

const MAX_TEXT = 20_000;
const JEV_URL = 'https://api.typesafe.ai/v1/systemone';
const JEV_TIMEOUT_MS = 1500;
const CLAUDE_TIMEOUT_MS = 6000;

type Category = 'write' | 'understand' | 'agentic';

function typesafeKey(): string | undefined {
  // `AskAway_API_Key` is the name the key was first saved under locally.
  return process.env.TYPESAFE_API_KEY || process.env.AskAway_API_Key;
}

async function askJev(text: string, checks: CheckDef[], signal: AbortSignal): Promise<Scores | null> {
  const key = typesafeKey();
  if (!key) return null;
  const response = await fetch(JEV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.GUIDED_READINESS_MODEL || 'jev-latest',
      state: text,
      questions: Object.fromEntries(
        checks.map((check) => [
          check.id,
          { type: 'noul', instructions: check.question, criteria: { true: check.yes, false: check.no } },
        ]),
      ),
    }),
    signal: AbortSignal.any([signal, AbortSignal.timeout(JEV_TIMEOUT_MS)]),
  });
  if (!response.ok) {
    console.warn('[readiness] Jev responded', response.status);
    return null;
  }
  const data = (await response.json()) as { answers?: Record<string, { noul?: unknown }> };
  const scores: Scores = {};
  for (const check of checks) {
    const value = data.answers?.[check.id]?.noul;
    if (typeof value !== 'number') return null;
    scores[check.id] = value;
  }
  return scores;
}

async function askClaude(text: string, checks: CheckDef[], signal: AbortSignal): Promise<Scores | null> {
  if (!getAnthropicKey()) return null;
  const response = await claude().messages.create(
    {
      model: MODELS.chat,
      max_tokens: 1000,
      output_config: {
        effort: 'low',
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: Object.fromEntries(checks.map((check) => [check.id, { type: 'number' }])),
            required: checks.map((check) => check.id),
            additionalProperties: false,
          },
        },
      },
      system:
        'You judge a request that someone is about to send to an AI assistant. For each question, give the probability from 0 to 1 that the answer is yes. Judge only what the request itself says.',
      messages: [
        {
          role: 'user',
          content: `<request>\n${text}\n</request>\n\n${checks
            .map((check) => `${check.id}: ${check.question}\n  yes = ${check.yes}\n  no = ${check.no}`)
            .join('\n')}`,
        },
      ],
    },
    { signal, timeout: CLAUDE_TIMEOUT_MS, maxRetries: 0 },
  );
  const block = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  if (!block) return null;
  const parsed = JSON.parse(block.text) as Record<string, unknown>;
  const scores: Scores = {};
  for (const check of checks) {
    const value = parsed[check.id];
    if (typeof value !== 'number') return null;
    scores[check.id] = Math.min(1, Math.max(0, value));
  }
  return scores;
}

export async function POST(request: NextRequest) {
  // Generous: one request per pause in typing. Over the limit, the client
  // simply keeps the fill it already has.
  if (!allowRequest(clientIp(request.headers), 'readiness', 90)) {
    return NextResponse.json({ scores: null }, { status: 429 });
  }

  let body: { text?: unknown; category?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const category = body.category as Category;
  const checks = CHECKS[category];
  if (typeof body.text !== 'string' || !checks?.length || body.text.length > MAX_TEXT) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const text = body.text.trim();
  if (!text || process.env.GUIDED_MOCK === '1') return NextResponse.json({ scores: null });

  for (const [source, ask] of [
    ['jev', askJev],
    ['claude', askClaude],
  ] as const) {
    try {
      const scores = await ask(text, checks, request.signal);
      if (scores) return NextResponse.json({ scores, source });
    } catch (error) {
      if (request.signal.aborted) return NextResponse.json({ scores: null });
      console.warn(`[readiness] ${source} failed:`, error instanceof Error ? error.message : error);
    }
  }
  return NextResponse.json({ scores: null });
}
