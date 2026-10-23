import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { inspectHtml } from '../verify-ssr.js';

const run = promisify(execFile);
const script = fileURLToPath(new URL('../verify-ssr.js', import.meta.url));
const graph = { '@context': 'https://schema.org', '@graph': [
  { '@type': 'Person', '@id': 'https://example.com/alice#person', name: 'Alice & Bob' },
  { '@type': 'ProfilePage', mainEntity: { '@id': 'https://example.com/alice#person' } },
] };
const head = `<title>Alice | LinkMAX</title>
  <meta content='Published profile' name='description'>
  <meta content='Alice' property='og:title'>
  <link href='https://example.com/alice' rel='canonical'>
  <script type='application/ld+json'>${JSON.stringify(graph)}</script>`;
const profile = `<html><head>${head}</head><body><h1>Alice &amp; Bob</h1></body></html>`;

test('accepts actual profile SSR with attribute order and entity escaping', () => {
  assert.deepEqual(inspectHtml(profile, { profile: true }).failures, []);
});

test('hydration payload and utility classes do not count as rendered profile content', () => {
  const shell = `<html><head>${head}</head><body><div class='items-center'></div>
    <script>window.hydration = ${JSON.stringify(graph)}</script></body></html>`;
  const failures = inspectHtml(shell, { profile: true }).failures;
  assert.ok(failures.some((failure) => failure.includes('empty client shell')));
  assert.ok(failures.some((failure) => failure.includes('Profile name is absent')));
});

test('unrelated rendered chrome does not count as profile SSR', () => {
  const failures = inspectHtml(profile.replace('<h1>Alice &amp; Bob</h1>', '<nav>LinkMAX</nav>'), { profile: true }).failures;
  assert.ok(failures.some((failure) => failure.includes('Profile name is absent')));
});

test('rejects missing SEO metadata and malformed structured data', () => {
  const failures = inspectHtml('<body>Profile<script type="application/ld+json">{</script></body>', { profile: true }).failures;
  for (const expected of ['title', 'description', 'canonical', 'Open Graph', 'Invalid JSON-LD', 'ProfilePage']) {
    assert.ok(failures.some((failure) => failure.includes(expected)), expected);
  }
});

test('CLI checks HTTP errors, client shells, redirects and request user agent', async (t) => {
  const agents = [];
  const server = createServer((request, response) => {
    agents.push(request.headers['user-agent']);
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (request.url === '/redirect') {
      response.writeHead(302, { Location: '/alice/' });
      response.end();
      return;
    }
    if (request.url === '/error/') response.statusCode = 500;
    if (request.url === '/not-html/') response.setHeader('Content-Type', 'application/json');
    response.end(request.url === '/shell/' ? '<html><body><div class="items-center"></div></body></html>' : profile);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const route of ['/alice/', '/redirect', '/']) {
    const result = await run(process.execPath, [script, base + route]);
    assert.match(result.stdout, /PASS:/);
  }
  for (const route of ['/error/', '/not-html/', '/shell/']) {
    await assert.rejects(run(process.execPath, [script, base + route]), (error) => error.code === 1 && /FAIL:/.test(error.stderr));
  }
  assert.ok(agents.every((agent) => agent.includes('Googlebot')));
});

test('CLI rejects invalid URLs and network failures with a nonzero exit', async () => {
  for (const url of ['invalid-url', 'file:///etc/hosts', 'http://127.0.0.1:0/']) {
    await assert.rejects(run(process.execPath, [script, url]), (error) => error.code === 1 && /FAIL:/.test(error.stderr));
  }
});
