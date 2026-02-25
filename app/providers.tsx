'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init('phc_oihA0NMmOGGbVSLA2ytz83NGR1ooBwmP07hK6iw6RP', {
      api_host: 'https://us.i.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      session_recording: {
        maskAllInputs: false,
      },
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
