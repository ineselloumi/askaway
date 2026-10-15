'use client';

import posthog from 'posthog-js';
import { useEffect } from 'react';
import { BRAND } from '@/lib/brand';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      try {
        posthog.init('phc_oihA0NMmOGGbVSLA2ytz83NGR1ooBwmP07hK6iw6RP', {
          api_host: 'https://us.i.posthog.com',
          capture_pageview: true,
          capture_pageleave: true,
          session_recording: {
            maskAllInputs: false,
          },
          on_xhr_error: () => {
            // Silently ignore network errors (e.g. ad blockers)
          },
        });
        // Both sites share one PostHog project: tag every event so recordings can be filtered by site.
        posthog.register({ brand: BRAND.id });
      } catch {
        // PostHog blocked or unavailable — analytics silently disabled
      }
    }
  }, []);

  return <>{children}</>;
}
