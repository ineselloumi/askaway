// Model routing for the plain conversation. A fast decision model describes
// the request (how much reasoning it needs, what is at stake, and so on) and
// the rules below turn that description into a model tier and a reason the
// badge can show. The fast model is never asked "which model?": it does not
// know the lineup, and task traits stay valid when the lineup changes.

export type Tier = 'haiku' | 'sonnet' | 'opus';

export const TIER_ORDER: Tier[] = ['haiku', 'sonnet', 'opus'];

/** Why a model was picked. Each one has a sentence under `guided.chat.reasons`. */
export type RouteReason =
  | 'quick'
  | 'rewording'
  | 'reasoning'
  | 'structured'
  | 'long'
  | 'stakes'
  | 'careful'
  | 'image'
  | 'followup';

/** What the decision model reports about the request. */
export interface Signals {
  /** 0 (recall or rephrase) to 3 (weigh trade-offs, multi-step judgement), as an expected value. */
  depth: number;
  /** Probability that a careless answer could cause real harm (health, legal, money, safety). */
  stakes: number;
  /** Probability that a long or structured piece of work is wanted. */
  structured: number;
  /** Probability that this is an edit to existing text. */
  rewording: number;
}

/** What the server can measure without a model. */
export interface Facts {
  /** Characters in the request, including any attached file. */
  chars: number;
  hasImages: boolean;
  /** The tier that answered the previous turn of this conversation, if any. */
  previous?: Tier | null;
  /** False once the day's allowance for the largest model is used up. */
  opusAllowed?: boolean;
}

export interface Route {
  tier: Tier;
  reason: RouteReason;
}

export const YES = 0.6;
/** Thresholds sit a little below the midpoints: when unsure, go up a tier. */
export const DEPTH_SONNET = 1.4;
export const DEPTH_OPUS_WITH_STAKES = 2.4;
export const DEPTH_OPUS_ALONE = 2.85;
export const LONG_INPUT = 6000;

const rank = (tier: Tier) => TIER_ORDER.indexOf(tier);

export function pickModel(signals: Signals, facts: Facts): Route {
  const stakes = signals.stakes >= YES;
  const structured = signals.structured >= YES;
  const rewording = signals.rewording >= YES;

  let route: Route;
  if ((stakes && signals.depth >= DEPTH_OPUS_WITH_STAKES) || signals.depth >= DEPTH_OPUS_ALONE) {
    // Deep reasoning on something that matters, or a genuinely multi-constraint decision.
    route = { tier: 'opus', reason: stakes ? 'careful' : 'reasoning' };
  } else if (stakes) {
    route = { tier: 'sonnet', reason: 'stakes' };
  } else if (structured) {
    route = { tier: 'sonnet', reason: 'structured' };
  } else if (signals.depth >= DEPTH_SONNET) {
    route = { tier: 'sonnet', reason: 'reasoning' };
  } else if (facts.chars >= LONG_INPUT && !rewording) {
    route = { tier: 'sonnet', reason: 'long' };
  } else {
    route = { tier: 'haiku', reason: rewording ? 'rewording' : 'quick' };
  }

  // Photos need a model that reads them well.
  if (facts.hasImages && rank(route.tier) < rank('sonnet')) route = { tier: 'sonnet', reason: 'image' };

  // A follow-up stays on the conversation's model unless it clearly needs more.
  if (facts.previous && rank(facts.previous) > rank(route.tier)) route = { tier: facts.previous, reason: 'followup' };

  // The largest model has a daily allowance; past it, the next tier down answers.
  if (route.tier === 'opus' && facts.opusAllowed === false) route = { ...route, tier: 'sonnet' };

  return route;
}

/** The routing used before scoring existed, and whenever the decision model is unavailable. */
export function fallbackRoute(facts: Facts): Route {
  const route: Route = facts.hasImages ? { tier: 'sonnet', reason: 'image' } : { tier: 'haiku', reason: 'quick' };
  if (facts.previous && rank(facts.previous) > rank(route.tier)) {
    return { tier: facts.previous === 'opus' && facts.opusAllowed === false ? 'sonnet' : facts.previous, reason: 'followup' };
  }
  return route;
}

export function isTier(value: unknown): value is Tier {
  return typeof value === 'string' && (TIER_ORDER as string[]).includes(value);
}
