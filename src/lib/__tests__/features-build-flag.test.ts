import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  window.localStorage.removeItem('lm-business-features');
});

it('enables business tools for the whole build even after a browser opt-out', async () => {
  vi.stubEnv('VITE_LINKMAX_BUSINESS', 'true');
  vi.resetModules();
  window.localStorage.setItem('lm-business-features', 'off');
  const { isBusinessFeaturesEnabled } = await import('../features');
  expect(isBusinessFeaturesEnabled()).toBe(true);
});
