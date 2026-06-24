import posthog from 'posthog-js';

export const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY ?? '';
export const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com';

export function initPostHog() {
  if (typeof window !== 'undefined' && !posthog.has_opted_out_capturing()) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only', // Capture profiles only for logged-in users to save capacity
      capture_pageview: false, // We'll handle this manually for SPA routing
      capture_pageleave: true,
      autocapture: true, // Automatically capture clicks/inputs
    });
  }
}

export { posthog };
