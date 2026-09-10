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

  it('serves the SPA from the bound static assets without an external origin', async () => {
    const originFetch = vi.fn(async () => new Response('unexpected origin', { status: 500 }));
    const assetFetch = vi.fn(async () => new Response('<html>dashboard</html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    }));
    vi.stubGlobal('fetch', originFetch);

    const response = await worker.fetch(
      new Request('https://lnkmx.my/dashboard'),
      { ASSETS: { fetch: assetFetch } },
      {},
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toContain('dashboard');
    expect(assetFetch).toHaveBeenCalledOnce();
    expect(originFetch).not.toHaveBeenCalled();
  });

  it('serves static files directly from the Cloudflare assets binding', async () => {
    const originFetch = vi.fn(async () => new Response('unexpected origin', { status: 500 }));
    const assetFetch = vi.fn(async () => new Response('asset', { status: 200 }));
    vi.stubGlobal('fetch', originFetch);

    const response = await worker.fetch(
      new Request('https://lnkmx.my/assets/app.js'),
      {
        ASSETS: { fetch: assetFetch },
        SUPABASE_PROJECT: 'project-ref',
        SUPABASE_ANON_KEY: 'anon-key',
      },
      {},
    );

    expect(response.status).toBe(200);
    expect(assetFetch).toHaveBeenCalledOnce();
    expect(originFetch).not.toHaveBeenCalled();
  });

  it('exposes immutable release identity from deployment bindings', async () => {
    const response = await worker.fetch(
      new Request('https://lnkmx.my/.well-known/linkmax-release.json'),
      {
        APP_VERSION: '3.1.1',
        APP_ENVIRONMENT: 'production',
        GIT_SHA: '0123456789abcdef',
        CF_VERSION_METADATA: { id: 'cf-version-id' },
      },
      {},
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({
      version: '3.1.1',
      commitSha: '0123456789abcdef',
      environment: 'production',
      cloudflareVersionId: 'cf-version-id',
    });
  });
});
