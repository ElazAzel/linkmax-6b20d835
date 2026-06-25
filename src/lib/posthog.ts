import posthog from 'posthog-js';

export const POSTHOG_KEY = 'phc_zjZKo5DD5eFk8TCkypNFvCndJ6FzCmitFi6iUd6kpuB5';
export const POSTHOG_HOST = 'https://us.i.posthog.com'; // Standard US cloud host, change if using EU

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
