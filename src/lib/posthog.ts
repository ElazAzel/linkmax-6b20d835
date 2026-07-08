import posthog from 'posthog-js';

export const POSTHOG_KEY = 'phc_zjZKo5DD5eFk8TCkypNFvCndJ6FzCmitFi6iUd6kpuB5';
export const POSTHOG_HOST = 'https://us.i.posthog.com'; // Standard US cloud host, change if using EU

let _posthogInitialized = false;

export function initPostHog() {
  if (_posthogInitialized) return;
  if (typeof window === 'undefined' || posthog.has_opted_out_capturing()) return;

  const existing = (window as typeof window & { posthog?: { __loaded?: boolean } }).posthog;
  if (existing?.__loaded || (posthog as unknown as { __loaded?: boolean }).__loaded) {
    _posthogInitialized = true;
    return;
  }

  _posthogInitialized = true;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
  });
}

export { posthog };
