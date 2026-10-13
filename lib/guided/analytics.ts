import posthog from 'posthog-js';
import { trackSearch } from '@/lib/pixel';

type Props = Record<string, string | number | boolean | null | undefined>;

/** PostHog event for a step of the guided flow. Never throws (ad blockers, localhost). */
export function track(event: string, props: Props = {}): void {
  try {
    if (typeof window === 'undefined' || window.location.hostname === 'localhost') return;
    posthog.capture(`guided_${event}`, props);
  } catch {
    // Analytics are best-effort.
  }
}

/**
 * Every prompt the user sends. Keeps the Meta Pixel `Search` event that the
 * original Ask Away fired on each submission, and adds the guided context.
 */
export function trackPromptSent(props: Props): void {
  trackSearch();
  track('prompt_sent', props);
}
