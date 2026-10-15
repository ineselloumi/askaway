import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { BRAND } from '@/lib/brand';

// Shared server-side helpers for the guided flow's API routes (/api/chat,
// /api/agent, /api/readiness). The site's brand (lib/brand.ts) decides whether
// answers come from Anthropic or OpenAI; the routes call `complete()` and do
// not need to know which.

export function getAnthropicKey(): string | undefined {
  // Custom env var name first, to avoid clashing with a key exported in the shell.
  return process.env.ASK_AWAY_ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;
}

export function getOpenAIKey(): string | undefined {
  return process.env.ASK_AWAY_OPENAI_KEY || process.env.OPENAI_API_KEY;
}

/** The key for this site's model provider. */
export function providerKey(): string | undefined {
  return BRAND.id === 'chatgpt' ? getOpenAIKey() : getAnthropicKey();
}

/** With no key (or GUIDED_MOCK=1) the routes return canned responses so the app still demos. */
export function isMock(): boolean {
  return process.env.GUIDED_MOCK === '1' || !providerKey();
}

let cachedClaude: Anthropic | null = null;
export function claude(): Anthropic {
  if (!cachedClaude) cachedClaude = new Anthropic({ apiKey: getAnthropicKey() });
  return cachedClaude;
}

let cachedOpenAI: OpenAI | null = null;
export function openai(): OpenAI {
  if (!cachedOpenAI) cachedOpenAI = new OpenAI({ apiKey: getOpenAIKey() });
  return cachedOpenAI;
}

/**
 * Model choice is made on the server. Conversation answers are routed per
 * request between `chat`, `strong` and `deep` (see lib/guided/routing.ts);
 * jobs always run on `agent`. Each one can be overridden per deployment.
 */
const DEFAULT_MODELS = {
  claude: {
    chat: 'claude-haiku-5-5',
    strong: 'claude-sonnet-5-5',
    deep: 'claude-opus-5-5',
    vision: 'claude-sonnet-5-5',
    agent: 'claude-sonnet-5-5',
  },
  chatgpt: {
    chat: 'gpt-6-luna',
    strong: 'gpt-6.1-sol',
    deep: 'gpt-6-astra',
    vision: 'gpt-6.1-sol',
    agent: 'gpt-6.1-sol',
  },
}[BRAND.id];

export const MODELS = {
  chat: process.env.GUIDED_CHAT_MODEL || DEFAULT_MODELS.chat,
  /** Conversation answers that need more: reasoning, structure, care. */
  strong: process.env.GUIDED_STRONG_MODEL || DEFAULT_MODELS.strong,
  /** Deep reasoning on something that matters. Limited by a daily allowance. */
  deep: process.env.GUIDED_DEEP_MODEL || DEFAULT_MODELS.deep,
  vision: process.env.GUIDED_VISION_MODEL || DEFAULT_MODELS.vision,
  agent: process.env.GUIDED_AGENT_MODEL || DEFAULT_MODELS.agent,
};

/** "claude-sonnet-5-5" → "Sonnet 5.5", "gpt-6.1-sol" → "GPT-6.1 Sol", for the badge under an answer. */
export function modelName(id: string): string {
  const claudeMatch = id.match(/^claude-([a-z]+)-(\d+)(?:-(\d{1,2}))?(?:-\d{6,})?$/);
  if (claudeMatch) {
    const family = claudeMatch[1].charAt(0).toUpperCase() + claudeMatch[1].slice(1);
    return `${family} ${claudeMatch[2]}${claudeMatch[3] ? `.${claudeMatch[3]}` : ''}`;
  }
  const gptMatch = id.replace(/-\d{4}-\d{2}-\d{2}$/, '').match(/^gpt-([\d.]+)(?:-([a-z]+))?$/);
  if (gptMatch) {
    const variant = gptMatch[2] ? ` ${gptMatch[2].charAt(0).toUpperCase()}${gptMatch[2].slice(1)}` : '';
    return `GPT-${gptMatch[1]}${variant}`;
  }
  return BRAND.family;
}

/** Shown under sample answers when no key is set. */
export const DEMO_MODEL = `${BRAND.family} (demo)`;

const POWERED_BY =
  BRAND.id === 'chatgpt' ? "OpenAI's GPT models (the models behind ChatGPT, made by OpenAI)" : 'Claude (made by Anthropic)';
const UNDER_THE_HOOD = BRAND.id === 'chatgpt' ? "OpenAI's GPT models" : 'Claude';

export const IDENTITY = `You are Ask Away, an AI assistant powered by ${POWERED_BY}. Ask Away helps people who are new to AI learn to ask for what they need: it walks them through building their first prompts, then lets them type on their own.

The people you talk to are usually not technical. Use plain, warm, everyday language. No jargon, no talk of prompts, models or tools unless they ask.

Ask Away was created by an independent developer who prefers to stay anonymous, is not affiliated with any company, and is not making money from it. When someone asks who you are or which tool this is, answer as Ask Away, and say you are powered by ${UNDER_THE_HOOD} if they want to know what is under the hood.

You cannot generate images, send messages or email, sign in to anything, or buy anything. Say so plainly if asked, and offer what you can do instead.`;

// ---------------------------------------------------------------------------
// One request, one answer, on whichever provider this site uses.
// ---------------------------------------------------------------------------

export interface Turn {
  role: 'user' | 'assistant';
  text: string;
  /** Data URLs. Only read on user turns. */
  images?: string[];
}

export interface CompleteRequest {
  model: string;
  system: string;
  turns: Turn[];
  maxTokens: number;
  effort: 'low' | 'medium';
  /** Ask for JSON that matches this schema. */
  schema?: Record<string, unknown>;
  signal?: AbortSignal;
  timeout?: number;
  maxRetries?: number;
}

export interface Completion {
  text: string;
  /** The model that actually answered, as reported by the provider. */
  model: string;
  declined: boolean;
}

const IMAGE = /^data:(image\/(?:jpeg|png|gif|webp));base64,(.+)$/;

function claudeContent(turn: Turn): Anthropic.MessageParam['content'] {
  const images = turn.role === 'user' ? turn.images ?? [] : [];
  if (!images.length) return turn.text;
  const blocks: Anthropic.ContentBlockParam[] = [];
  for (const image of images) {
    const match = image.match(IMAGE);
    if (!match) continue;
    blocks.push({
      type: 'image',
      source: { type: 'base64', media_type: match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: match[2] },
    });
  }
  blocks.push({ type: 'text', text: turn.text || 'Take a look at this.' });
  return blocks;
}

function openAIInput(turn: Turn): OpenAI.Responses.EasyInputMessage {
  const images = turn.role === 'user' ? (turn.images ?? []).filter((image) => IMAGE.test(image)) : [];
  if (!images.length) return { role: turn.role, content: turn.text };
  return {
    role: 'user',
    content: [
      ...images.map((image) => ({ type: 'input_image' as const, image_url: image, detail: 'auto' as const })),
      { type: 'input_text' as const, text: turn.text || 'Take a look at this.' },
    ],
  };
}

export async function complete(request: CompleteRequest): Promise<Completion> {
  const options = { signal: request.signal, timeout: request.timeout, maxRetries: request.maxRetries };

  if (BRAND.id === 'chatgpt') {
    const response = await openai().responses.create(
      {
        model: request.model,
        instructions: request.system,
        input: request.turns.map(openAIInput),
        max_output_tokens: request.maxTokens,
        reasoning: { effort: request.effort },
        store: false,
        ...(request.schema && {
          text: { format: { type: 'json_schema' as const, name: 'result', schema: request.schema, strict: true } },
        }),
      },
      options,
    );
    const declined = response.output.some(
      (item) => item.type === 'message' && item.content.some((part) => part.type === 'refusal'),
    );
    return { text: response.output_text.trim(), model: response.model, declined };
  }

  const response = await claude().messages.create(
    {
      model: request.model,
      max_tokens: request.maxTokens,
      output_config: {
        effort: request.effort,
        ...(request.schema && { format: { type: 'json_schema' as const, schema: request.schema } }),
      },
      system: request.system,
      messages: request.turns.map((turn) => ({ role: turn.role, content: claudeContent(turn) })),
    },
    options,
  );
  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();
  return { text, model: response.model, declined: response.stop_reason === 'refusal' };
}

/** How a failed provider call should be reported, whichever SDK threw it. */
export function failure(error: unknown): 'aborted' | 'busy' | 'upstream' | 'server' {
  if (error instanceof Anthropic.APIUserAbortError || error instanceof OpenAI.APIUserAbortError) return 'aborted';
  if (error instanceof Anthropic.RateLimitError || error instanceof OpenAI.RateLimitError) return 'busy';
  if (error instanceof Anthropic.APIError || error instanceof OpenAI.APIError) {
    // Anthropic signals overload with 529; OpenAI with 503.
    return error.status === 529 || error.status === 503 ? 'busy' : 'upstream';
  }
  return 'server';
}

export function describeFailure(error: unknown): string {
  if (error instanceof Anthropic.APIError || error instanceof OpenAI.APIError) return `${error.status} ${error.message}`;
  return error instanceof Error ? error.message : String(error);
}

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
