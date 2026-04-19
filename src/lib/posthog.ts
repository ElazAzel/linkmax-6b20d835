import posthog from 'posthog-js';

export const POSTHOG_KEY = 'phc_zjZKo5DD5eFk8TCkypNFvCndJ6FzCmitFi6iUd6kpuB5';
export const POSTHOG_HOST = 'https://us.i.posthog.com'; // Standard US cloud host, change if using EU

export const POSTHOG_OPTIONS = {
  person_profiles: 'identified_only',
  capture_pageview: false,
  capture_pageleave: true,
  autocapture: true,
} as const;

export function initPostHog() {
  const posthogState = posthog as typeof posthog & { __loaded?: boolean };
  if (typeof window !== 'undefined' && !posthogState.__loaded && !posthog.has_opted_out_capturing()) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      ...POSTHOG_OPTIONS,
    });
  }
}

export { posthog };
