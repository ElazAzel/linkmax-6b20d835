import { expect, it } from 'vitest';
import { withIndexingHeaders } from '../http-policy';

it('keeps private responses and errors out of the index without changing public content', async () => {
  const request = new Request('https://lnkmx.my/elazart');
  const ok = new Response('profile');
  expect(withIndexingHeaders(request, ok)).toBe(ok);
  const missing = withIndexingHeaders(request, new Response('missing', { status: 404 }));
  expect(missing.status).toBe(404);
  expect(missing.headers.get('X-Robots-Tag')).toContain('noindex');
  const unavailable = withIndexingHeaders(request, new Response('unavailable', { status: 503 }));
  expect(unavailable.headers.get('Retry-After')).toBe('60');
  const dashboard = withIndexingHeaders(new Request('https://lnkmx.my/dashboard'), new Response('private', { headers: { 'Cache-Control': 'public, max-age=3600' } }));
  expect(dashboard.headers.get('Cache-Control')).toBe('private, no-store');
  expect(await dashboard.text()).toBe('private');
});
