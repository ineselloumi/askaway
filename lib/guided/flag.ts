/**
 * Feature flag for the guided first-prompt experience.
 *
 * On by default. Set NEXT_PUBLIC_GUIDED_FLOW=off (and redeploy) to roll back
 * to the original Ask Away home page and /assist flow.
 */
export function isGuidedEnabled(): boolean {
  const value = (process.env.NEXT_PUBLIC_GUIDED_FLOW ?? '').trim().toLowerCase();
  return !['off', 'false', '0'].includes(value);
}
