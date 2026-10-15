import { NextRequest, NextResponse } from 'next/server';
import { CHIPS, HINTS, NO_HINT, NO_HINT_ABOUT, validIds } from '@/lib/guided/library';
import { CHECKS, scoredChecks, type CheckDef, type Scores } from '@/lib/guided/quality';
import { MODELS, allowRequest, clientIp, complete, providerKey } from '@/lib/server/llm';

// Scores a prompt-in-progress against four yes/no checks, so the readiness
// fill reflects how useful the prompt is rather than how many chips were
// tapped. Gates (lib/guided/quality.ts) are scored in the same call. Called
// at every pause in typing, so it has to be fast:
//
//   1. Jev (TypeSafe AI), a decision model that returns a calibrated yes
//      probability per question in a single call.
//   2. The site's fastest model (Claude Haiku or GPT Luna) as a fallback when Jev is not configured, slow or down.
//   3. `scores: null`, and the client keeps its count-based fill.
//
// When the client sends candidate chips and hints, Jev also ranks them in the
// same call: which details would most improve this particular prompt, and the
// single most important thing missing. The model fallback only scores.

export const runtime = 'nodejs';
export const maxDuration = 15;

const MAX_TEXT = 20_000;
const JEV_URL = 'https://api.typesafe.ai/v1/systemone';
const JEV_TIMEOUT_MS = 1500;
const FALLBACK_TIMEOUT_MS = 6000;

type Category = 'write' | 'understand' | 'agentic';

function typesafeKey(): string | undefined {
  // `AskAway_API_Key` is the name the key was first saved under locally.
  return process.env.TYPESAFE_API_KEY || process.env.AskAway_API_Key;
}

type Probabilities = Record<string, number>;

interface Pools {
  chips: string[];
  hints: string[];
}

interface JevResult {
  scores: Scores;
  chips: Probabilities | null;
  hint: Probabilities | null;
}

const choice = (instructions: string, ids: string[], about: (id: string) => string) => ({
  type: 'choice',
  instructions,
  criteria: Object.fromEntries(ids.map((id) => [id, about(id)])),
});

function readProbabilities(answer: unknown): Probabilities | null {
  const p = (answer as { probabilities?: unknown } | undefined)?.probabilities;
  if (!p || typeof p !== 'object') return null;
  const out: Probabilities = {};
  for (const [id, value] of Object.entries(p)) if (typeof value === 'number') out[id] = value;
  return out;
}

async function askJev(text: string, checks: CheckDef[], pools: Pools, signal: AbortSignal): Promise<JevResult | null> {
  const key = typesafeKey();
  if (!key) return null;
  const response = await fetch(JEV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.GUIDED_READINESS_MODEL || 'jev-latest',
      state: text,
      questions: {
        ...Object.fromEntries(
          checks.map((check) => [
            check.id,
            { type: 'noul', instructions: check.question, criteria: { true: check.yes, false: check.no } },
          ]),
        ),
        ...(pools.chips.length > 1 && {
          _chips: choice(
            'Which one detail, if the person added it, would most improve this prompt? Ignore details the prompt already gives.',
            pools.chips,
            (id) => CHIPS[id].about,
          ),
        }),
        ...(pools.hints.length > 0 && {
          _hint: choice(
            'What is the single most important thing missing from this prompt?',
            [...pools.hints, NO_HINT],
            (id) => (id === NO_HINT ? NO_HINT_ABOUT : HINTS[id].about),
          ),
        }),
      },
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
  return { scores, chips: readProbabilities(data.answers?._chips), hint: readProbabilities(data.answers?._hint) };
}

async function askModel(text: string, checks: CheckDef[], signal: AbortSignal): Promise<Scores | null> {
  if (!providerKey()) return null;
  const response = await complete({
    model: MODELS.chat,
    maxTokens: 1000,
    effort: 'low',
    schema: {
      type: 'object',
      properties: Object.fromEntries(checks.map((check) => [check.id, { type: 'number' }])),
      required: checks.map((check) => check.id),
      additionalProperties: false,
    },
    system:
      'You judge a request that someone is about to send to an AI assistant. For each question, give the probability from 0 to 1 that the answer is yes. Judge only what the request itself says.',
    turns: [
      {
        role: 'user',
        text: `<request>\n${text}\n</request>\n\n${checks
          .map((check) => `${check.id}: ${check.question}\n  yes = ${check.yes}\n  no = ${check.no}`)
          .join('\n')}`,
      },
    ],
    signal,
    timeout: FALLBACK_TIMEOUT_MS,
    maxRetries: 0,
  });
  if (!response.text) return null;
  const parsed = JSON.parse(response.text) as Record<string, unknown>;
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

  let body: { text?: unknown; category?: unknown; chips?: unknown; hints?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const category = body.category as Category;
  if (typeof body.text !== 'string' || !CHECKS[category]?.length || body.text.length > MAX_TEXT) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const chips = body.chips === undefined ? [] : validIds(body.chips, CHIPS);
  const hints = body.hints === undefined ? [] : validIds(body.hints, HINTS);
  if (!chips || !hints) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const checks = scoredChecks(category);
  const text = body.text.trim();
  if (!text || process.env.GUIDED_MOCK === '1') return NextResponse.json({ scores: null });

  try {
    const result = await askJev(text, checks, { chips, hints }, request.signal);
    if (result) return NextResponse.json({ ...result, source: 'jev' });
  } catch (error) {
    if (request.signal.aborted) return NextResponse.json({ scores: null });
    console.warn('[readiness] jev failed:', error instanceof Error ? error.message : error);
  }
  try {
    const scores = await askModel(text, checks, request.signal);
    if (scores) return NextResponse.json({ scores, chips: null, hint: null, source: 'model' });
  } catch (error) {
    if (request.signal.aborted) return NextResponse.json({ scores: null });
    console.warn('[readiness] model fallback failed:', error instanceof Error ? error.message : error);
  }
  return NextResponse.json({ scores: null });
}
