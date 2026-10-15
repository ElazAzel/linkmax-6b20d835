import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';
import { CONTENT_SECURITY_POLICY } from '../content-security-policy';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

/*
 * Blocks embed third-party players and maps in iframes. If the embed host is
 * missing from the SSR document CSP, the block renders blank on
 * every public page without any error the owner can see.
 */
describe('CSP frame-src', () => {
  const csp = CONTENT_SECURITY_POLICY;
  const frameSrc = csp.split(';').map((part) => part.trim()).find((part) => part.startsWith('frame-src')) ?? '';

  it.each([
    ['src/components/blocks/VideoBlock.tsx'],
    ['src/components/blocks/MapBlock.tsx'],
  ])('allows every embed host used by %s', (file) => {
    const hosts = [...read(file).matchAll(/`https:\/\/([a-z0-9.-]+)\//g)].map((match) => `https://${match[1]}`);
    expect(hosts.length).toBeGreaterThan(0);
    for (const host of hosts) expect(frameSrc.split(/\s+/)).toContain(host);
  });

  it('allows the Google Maps redirect target', () => {
    expect(frameSrc.split(/\s+/)).toContain('https://www.google.com');
  });
});
