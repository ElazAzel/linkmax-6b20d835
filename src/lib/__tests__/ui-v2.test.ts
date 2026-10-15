import { afterEach, describe, expect, it, vi } from 'vitest';
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
describe('linkmax_ui_v2 rollout', () => {
  it('enables the new composition by default and can disable it consistently at build time', async () => {
    vi.stubEnv('VITE_LINKMAX_UI_V2', 'true');
    expect((await import('../ui-v2')).LINKMAX_UI_V2).toBe(true);
    vi.resetModules(); vi.stubEnv('VITE_LINKMAX_UI_V2', 'false');
    expect((await import('../ui-v2')).LINKMAX_UI_V2).toBe(false);
    const { resolveProfileComposition } = await import('../appearance/block-appearance');
    const blocks = [{ type: 'profile' }, { type: 'socials' }, { type: 'image' }];
    expect(resolveProfileComposition(blocks).socials).toBeUndefined();
    expect(resolveProfileComposition(blocks).content).toHaveLength(2);
  });
});
