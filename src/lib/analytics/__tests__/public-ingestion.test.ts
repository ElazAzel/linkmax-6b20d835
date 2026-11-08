import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function loadModule() {
  vi.resetModules();
  return import('../public-ingestion');
}

describe('submitPublicAnalyticsEvent', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the publishable key as a bearer token for anonymous visitors', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
    const { submitPublicAnalyticsEvent } = await loadModule();

    await submitPublicAnalyticsEvent({ pageId: null, eventType: 'landing_view' });

    const [, init] = fetchMock.mock.calls[0];
    const headers = init.headers as Record<string, string>;
    expect(headers.apikey).toBeTruthy();
    expect(headers.Authorization).toBe(`Bearer ${headers.apikey}`);
  });

  it('backs off after a 401 instead of retrying every event', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 401 }));
    const { submitPublicAnalyticsEvent } = await loadModule();

    await expect(submitPublicAnalyticsEvent({ eventType: 'landing_view' })).rejects.toThrow('401');
    await submitPublicAnalyticsEvent({ eventType: 'landing_view' });
    await submitPublicAnalyticsEvent({ eventType: 'landing_view' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('batching', () => {
  const fetchMock = vi.fn();
  const bodies = () => fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body as string));

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends a page view and its impressions as one request', async () => {
    fetchMock.mockResolvedValue(new Response('{"accepted":3}', { status: 200 }));
    const { submitPublicAnalyticsEvent } = await loadModule();

    await Promise.all([
      submitPublicAnalyticsEvent({ pageId: 'p', eventType: 'view' }),
      submitPublicAnalyticsEvent({ pageId: 'p', eventType: 'view', metadata: { blockId: 'a', isBlockImpression: true } }),
      submitPublicAnalyticsEvent({ pageId: 'p', eventType: 'view', metadata: { blockId: 'b', isBlockImpression: true } }),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(bodies()[0].events).toHaveLength(3);
  });

  it('falls back to single events when the deployed function predates batching', async () => {
    fetchMock.mockImplementation(async (_url, init) => {
      const body = JSON.parse(init.body as string);
      return body.events ? new Response('{}', { status: 400 }) : new Response(null, { status: 204 });
    });
    const { submitPublicAnalyticsEvent } = await loadModule();

    await Promise.all([
      submitPublicAnalyticsEvent({ pageId: 'p', eventType: 'view' }),
      submitPublicAnalyticsEvent({ pageId: 'p', eventType: 'click' }),
    ]);
    // One rejected batch, then each event on its own.
    expect(bodies().map((b) => b.eventType ?? 'batch')).toEqual(['batch', 'view', 'click']);

    await Promise.all([
      submitPublicAnalyticsEvent({ pageId: 'p', eventType: 'view' }),
      submitPublicAnalyticsEvent({ pageId: 'p', eventType: 'share' }),
    ]);
    // Remembered for the session: no second batch attempt.
    expect(bodies().slice(3).map((b) => b.eventType)).toEqual(['view', 'share']);
  });

  it('flushes at once with keepalive when the tab is closing', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const { submitPublicAnalyticsEvent } = await loadModule();

    const pending = submitPublicAnalyticsEvent({ pageId: 'p', eventType: 'view' });
    await submitPublicAnalyticsEvent({ pageId: 'p', eventType: 'session_end' }, { keepalive: true });
    await pending;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].keepalive).toBe(true);
    expect(bodies()[0].events.map((e: { eventType: string }) => e.eventType)).toEqual(['view', 'session_end']);
  });

  it('keeps each request under the size limit', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
    const { submitPublicAnalyticsEvent } = await loadModule();
    const big = 'x'.repeat(3000);

    await Promise.all(Array.from({ length: 6 }, (_, i) => submitPublicAnalyticsEvent({ pageId: 'p', eventType: 'view', metadata: { note: big, i } })));

    expect(fetchMock.mock.calls.length).toBeGreaterThan(1);
    for (const [, init] of fetchMock.mock.calls) expect((init.body as string).length).toBeLessThan(16 * 1024);
  });
});
