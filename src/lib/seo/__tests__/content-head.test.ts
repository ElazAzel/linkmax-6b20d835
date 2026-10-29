import { afterEach, expect, it, vi } from 'vitest';
import { fetchContentMetadata } from '../content-head';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it('reads product metadata anonymously and never serializes download or owner fields', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://backend.example');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'public-key');
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ title: 'Guide', description: 'Public guide', file_url: 'private-file', owner_id: 'private-owner' }])));
  vi.stubGlobal('fetch', fetchMock);
  expect(await fetchContentMetadata('goods', { id: 'product-id' }, 'ru')).toEqual({ title: 'Guide', description: 'Public guide' });
  expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({ _product_id: 'product-id' }));
});

it('does not read an event when its parent page is not published', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://backend.example');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'public-key');
  const fetchMock = vi.fn().mockResolvedValue(new Response('[]'));
  vi.stubGlobal('fetch', fetchMock);
  expect(await fetchContentMetadata('event', { slug: 'expert', eventId: 'event-id' }, 'ru')).toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0][0]).toContain('is_published=eq.true');
});