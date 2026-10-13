// Graduation: after two completed guided prompts the user gets a one-time
// recap on their next new chat, and from then on lands on the plain input.

export const GRADUATION_THRESHOLD = 2;
const STORAGE_KEY = 'askaway-guided-v1';

export interface GuidedProgress {
  /** Guided prompts that were sent and answered successfully. */
  promptsCompleted: number;
  /** The most recent completed prompts, verbatim, newest last (max 2). */
  recentPrompts: string[];
  /** The recap card has been shown and dismissed. */
  graduationShown: boolean;
  /** False once graduated; "bring the guided setup back" turns it on again. */
  guidedEnabled: boolean;
}

export const initialProgress: GuidedProgress = {
  promptsCompleted: 0,
  recentPrompts: [],
  graduationShown: false,
  guidedEnabled: true,
};

/** Count a guided prompt once its answer has arrived (spec open question 2). */
export function recordCompletedPrompt(progress: GuidedProgress, prompt: string): GuidedProgress {
  const text = prompt.trim();
  if (!text) return progress;
  return {
    ...progress,
    promptsCompleted: progress.promptsCompleted + 1,
    recentPrompts: [...progress.recentPrompts, text].slice(-GRADUATION_THRESHOLD),
  };
}

/** The gate: enough guided prompts, and the recap has not been seen yet. */
export function shouldShowGraduation(progress: GuidedProgress): boolean {
  return progress.promptsCompleted >= GRADUATION_THRESHOLD && !progress.graduationShown;
}

export function dismissGraduation(progress: GuidedProgress): GuidedProgress {
  return { ...progress, graduationShown: true, guidedEnabled: false };
}

export function bringBackGuided(progress: GuidedProgress): GuidedProgress {
  return { ...progress, graduationShown: true, guidedEnabled: true };
}

export type StartMode = 'setup' | 'graduation' | 'plain';

/** What a brand-new chat opens on. */
export function startMode(progress: GuidedProgress): StartMode {
  if (shouldShowGraduation(progress)) return 'graduation';
  return progress.guidedEnabled ? 'setup' : 'plain';
}

/** Quote a prompt on the recap card: verbatim, cut at a word boundary. */
export function quotePrompt(prompt: string, max = 72): string {
  const text = prompt.replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:]+$/, '') + '…';
}

export function parseProgress(raw: string | null): GuidedProgress {
  if (!raw) return initialProgress;
  try {
    const data = JSON.parse(raw) as Partial<GuidedProgress>;
    return {
      promptsCompleted: Number.isFinite(data.promptsCompleted) ? Math.max(0, Number(data.promptsCompleted)) : 0,
      recentPrompts: Array.isArray(data.recentPrompts)
        ? data.recentPrompts.filter((p): p is string => typeof p === 'string').slice(-GRADUATION_THRESHOLD)
        : [],
      graduationShown: data.graduationShown === true,
      guidedEnabled: data.guidedEnabled !== false,
    };
  } catch {
    return initialProgress;
  }
}

export function loadProgress(): GuidedProgress {
  if (typeof window === 'undefined') return initialProgress;
  try {
    return parseProgress(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return initialProgress;
  }
}

export function saveProgress(progress: GuidedProgress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage unavailable (private mode): the flow still works for this session.
  }
}
