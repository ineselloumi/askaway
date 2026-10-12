'use client';

import { useEffect, useRef, useState } from 'react';
import { CHECKS, applyScores, type Met, type Scores } from '@/lib/guided/quality';
import type { TaskCategory } from '@/lib/guided/types';

/** Wait this long after the last keystroke before asking; chip taps ask straight away. */
const TYPING_PAUSE_MS = 450;

/**
 * Which of the four quality checks the prompt meets, according to the fast
 * model behind /api/readiness. Returns null until the first answer arrives, or
 * when the check is unavailable, so the caller can fall back to counting answers.
 * While a newer answer is on its way, the last one stays on screen.
 */
export function useQuality(text: string, category: TaskCategory, typing: boolean): Met | null {
  const [met, setMet] = useState<Met | null>(null);
  const metRef = useRef<Met | null>(null);

  useEffect(() => {
    const update = (next: Met | null) => {
      metRef.current = next;
      setMet(next);
    };

    if (!text.trim()) {
      // Nothing written: nothing is met. Only shown once the check has proved it works.
      if (metRef.current) update(Object.fromEntries(CHECKS[category].map(({ id }) => [id, false])));
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/readiness', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, category }),
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as { scores: Scores | null };
        if (controller.signal.aborted || !data.scores) return;
        update(applyScores(category, data.scores, metRef.current));
      } catch {
        // Offline, aborted or blocked: keep whatever fill is showing.
      }
    }, typing ? TYPING_PAUSE_MS : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // `typing` only sets the delay for this change; it must not re-run the check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, category]);

  return met;
}
