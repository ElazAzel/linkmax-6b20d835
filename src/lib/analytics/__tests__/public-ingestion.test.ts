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
