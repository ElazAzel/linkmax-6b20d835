import { siteRobots } from './site-policy';

/** Keep error pages and private application URLs out of every crawler's index. */
export function withIndexingHeaders(request: Request, response: Response): Response {
  const privatePage = siteRobots(new URL(request.url).pathname).startsWith('noindex');
  if (!privatePage && response.status < 400) return response;
  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  headers.set('Cache-Control', 'private, no-store');
  if (response.status >= 500 && !headers.has('Retry-After')) headers.set('Retry-After', '60');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
