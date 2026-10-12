import Anthropic from '@anthropic-ai/sdk';

// Shared server-side helpers for the guided flow's API routes (/api/chat, /api/agent).

export function getAnthropicKey(): string | undefined {
  // Custom env var name first, to avoid clashing with a key exported in the shell.
  return process.env.ASK_AWAY_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;
}

/** With no key (or GUIDED_MOCK=1) the routes return canned responses so the app still demos. */
export function isMock(): boolean {
  return process.env.GUIDED_MOCK === '1' || !getAnthropicKey();
}

let cached: Anthropic | null = null;
export function claude(): Anthropic {
  if (!cached) cached = new Anthropic({ apiKey: getAnthropicKey() });
  return cached;
}

/**
 * Model choice is made here, on the server. It mirrors the original Ask Away
 * tiering (Haiku for everyday text, Sonnet when there is more to do) on the
 * current model generation. Each one can be overridden per deployment.
 */
export const MODELS = {
  chat: process.env.GUIDED_CHAT_MODEL || 'claude-haiku-5-5',
  vision: process.env.GUIDED_VISION_MODEL || 'claude-sonnet-5-5',
  agent: process.env.GUIDED_AGENT_MODEL || 'claude-sonnet-5-5',
};

/** "claude-sonnet-5-5" → "Sonnet 5.5", for the badge under an answer. */
export function modelName(id: string): string {
  const match = id.match(/^claude-([a-z]+)-(\d+)(?:-(\d{1,2}))?(?:-\d{6,})?$/);
  if (!match) return 'Claude';
  const family = match[1].charAt(0).toUpperCase() + match[1].slice(1);
  return `${family} ${match[2]}${match[3] ? `.${match[3]}` : ''}`;
}

export const IDENTITY = `You are Ask Away, an AI assistant powered by Claude (made by Anthropic). Ask Away helps people who are new to AI learn to ask for what they need: it walks them through building their first prompts, then lets them type on their own.

The people you talk to are usually not technical. Use plain, warm, everyday language. No jargon, no talk of prompts, models or tools unless they ask.

Ask Away was created by an independent developer who prefers to stay anonymous, is not affiliated with any company, and is not making money from it. When someone asks who you are or which tool this is, answer as Ask Away, and say you are powered by Claude if they want to know what is under the hood.

You cannot generate images, send messages or email, sign in to anything, or buy anything. Say so plainly if asked, and offer what you can do instead.`;

// ---------------------------------------------------------------------------
// Rate limiting: in-memory sliding window, best-effort per serverless instance.
// ---------------------------------------------------------------------------
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

export function allowRequest(ip: string, bucket: string, max: number): boolean {
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown';
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
