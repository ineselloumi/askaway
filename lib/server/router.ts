import type { Signals } from '@/lib/guided/routing';

// Asks Jev (TypeSafe AI) to describe a request so the rules in
// lib/guided/routing.ts can choose a Claude model for it. One call, four
// questions, typically 100 to 300 ms. Returns null when Jev is not configured,
// slow or down, and the caller falls back to the simple rule.

const JEV_URL = 'https://api.typesafe.ai/v1/systemone';
const TIMEOUT_MS = 1200;
/** Enough of a long request to judge it; the full text still goes to Claude. */
const MAX_STATE = 12_000;

export function typesafeKey(): string | undefined {
  // `AskAway_API_Key` is the name the key was first saved under.
  return process.env.TYPESAFE_API_KEY || process.env.AskAway_API_Key;
}

const noul = (instructions: string, yes: string, no: string) => ({
  type: 'noul',
  instructions,
  criteria: { true: yes, false: no },
});

const QUESTIONS = {
  depth: {
    type: 'score',
    instructions: 'How much reasoning does a good answer to the latest request need?',
    // Levels are scored 0 to 3 in this order.
    criteria: [
      'Recall, rephrase or reformat. No real reasoning needed',
      'Explain or write something straightforward with one clear answer',
      'Organise several points, compare a few options, or plan something with a few steps',
      'Weigh competing constraints or trade-offs, work through a multi-step problem, or give judgement on a complex situation',
    ],
  },
  stakes: noul(
    'Could a wrong or careless answer to the latest request cause real harm to the person?',
    'It concerns a health, legal, financial, safety or other consequential personal decision',
    'A mistake would be a minor inconvenience',
  ),
  structured: noul(
    'Does the latest request ask for a long or structured piece of work?',
    'It asks for an essay, a report, a detailed plan, a multi-part comparison or similar',
    'A short answer or a short piece of text is enough',
  ),
  rewording: noul(
    'Is the latest request mainly to reword, shorten, lengthen, translate or change the tone of existing text?',
    'It asks to edit or transform text that already exists',
    'It asks for new content, an explanation or a decision',
  ),
};

/** `earlier` gives a follow-up such as "make it shorter" the context it refers to. */
export async function describeRequest(latest: string, earlier: string | null, signal?: AbortSignal): Promise<Signals | null> {
  const key = typesafeKey();
  if (!key || !latest.trim()) return null;

  const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max)}\n[…]` : text);
  const state = earlier
    ? `Earlier in the conversation:\n${clip(earlier, 3000)}\n\nLatest request:\n${clip(latest, MAX_STATE)}`
    : clip(latest, MAX_STATE);

  try {
    const response = await fetch(JEV_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.GUIDED_ROUTER_MODEL || 'jev-latest', state, questions: QUESTIONS }),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]) : AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      console.warn('[router] Jev responded', response.status);
      return null;
    }
    const data = (await response.json()) as {
      answers?: { depth?: { score?: unknown }; stakes?: { noul?: unknown }; structured?: { noul?: unknown }; rewording?: { noul?: unknown } };
    };
    const signals = {
      depth: data.answers?.depth?.score,
      stakes: data.answers?.stakes?.noul,
      structured: data.answers?.structured?.noul,
      rewording: data.answers?.rewording?.noul,
    };
    if (Object.values(signals).some((value) => typeof value !== 'number' || Number.isNaN(value))) return null;
    return signals as Signals;
  } catch (error) {
    console.warn('[router] Jev unavailable:', error instanceof Error ? error.message : error);
    return null;
  }
}

// ── Daily allowance for the largest model ────────────────────────────────────
// Best-effort and per server instance, like the rate limiter: it bounds a bad
// day rather than accounting exactly.
const DAILY_OPUS = Number(process.env.GUIDED_OPUS_DAILY_CAP ?? 40);
let opusDay = '';
let opusUsed = 0;

const today = () => new Date().toISOString().slice(0, 10);

export function opusAllowed(): boolean {
  if (opusDay !== today()) return DAILY_OPUS > 0;
  return opusUsed < DAILY_OPUS;
}

export function recordOpusUse(): void {
  if (opusDay !== today()) {
    opusDay = today();
    opusUsed = 0;
  }
  opusUsed += 1;
}
