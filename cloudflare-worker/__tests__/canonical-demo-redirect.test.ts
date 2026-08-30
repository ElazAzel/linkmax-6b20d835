import { afterEach, describe, expect, it, vi } from 'vitest';

import worker from '../prerender-worker.js';

describe('canonical demo redirect at the edge', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns 301 and preserves attribution query parameters', async () => {
    const originFetch = vi.fn(async () => new Response('origin', { status: 200 }));
    vi.stubGlobal('fetch', originFetch);

    const response = await worker.fetch(
      new Request('https://lnkmx.my/demo_nails?utm_source=founder'),
      {},
      {},
    );

    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('https://lnkmx.my/demo-nails?utm_source=founder');
    expect(originFetch).not.toHaveBeenCalled();
  });

  it('does not redirect an unrelated custom-domain slug', async () => {
    const originFetch = vi.fn(async () => new Response('origin', { status: 200 }));
    vi.stubGlobal('fetch', originFetch);

    const response = await worker.fetch(
      new Request('https://beauty.example/demo_nails'),
      {},
      {},
    );

    expect(response.status).toBe(200);
    expect(originFetch).toHaveBeenCalledOnce();
  });
});
