'use client';

import { useEffect, useRef, useState } from 'react';
import { CHECKS, applyScores, type Met, type Scores } from '@/lib/guided/quality';
import type { TaskCategory } from '@/lib/guided/types';

/** Wait this long after the last keystroke before asking; chip taps ask straight away. */
const TYPING_PAUSE_MS = 450;

type Probabilities = Record<string, number>;

export interface Quality {
  /** Which of the four checks the prompt meets. Null until the first answer, or when unavailable. */
  met: Met | null;
  /** How useful each candidate chip would be for this prompt. Null when not ranked. */
  chips: Probabilities | null;
  /** How likely each candidate hint is the most important gap. Null when not ranked. */
  hint: Probabilities | null;
}

const EMPTY: Quality = { met: null, chips: null, hint: null };

/**
 * Asks /api/readiness about the prompt at each pause in typing. One call
 * scores the four checks and ranks the candidate chips and hints. While a
 * newer answer is on its way, the last one stays on screen.
 */
export function useQuality(
  text: string,
  category: TaskCategory,
  typing: boolean,
  pools: { chips: string[]; hints: string[] },
): Quality {
  const [quality, setQuality] = useState<Quality>(EMPTY);
  const metRef = useRef<Met | null>(null);
  const poolKey = `${pools.chips.join(',')}|${pools.hints.join(',')}`;

  useEffect(() => {
    const update = (next: Quality) => {
      metRef.current = next.met;
      setQuality(next);
    };

    if (!text.trim()) {
      // Nothing written: nothing is met. Only shown once the check has proved it works.
      if (metRef.current) update({ met: Object.fromEntries(CHECKS[category].map(({ id }) => [id, false])), chips: null, hint: null });
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/readiness', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, category, chips: pools.chips, hints: pools.hints }),
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as { scores: Scores | null; chips?: Probabilities | null; hint?: Probabilities | null };
        if (controller.signal.aborted || !data.scores) return;
        update({
          met: applyScores(category, data.scores, metRef.current),
          chips: data.chips ?? null,
          hint: data.hint ?? null,
        });
      } catch {
        // Offline, aborted or blocked: keep whatever is showing.
      }
    }, typing ? TYPING_PAUSE_MS : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // `typing` only sets the delay for this change; it must not re-run the check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, category, poolKey]);

  return quality;
}
