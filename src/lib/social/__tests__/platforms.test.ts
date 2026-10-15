import { describe, expect, it } from 'vitest';

import { detectSocialPlatform, normalizePlatformId } from '../platforms';

describe('detectSocialPlatform', () => {
  it.each([
    ['https://instagram.com/aigerim.nails', 'instagram'],
    ['www.instagram.com/aigerim', 'instagram'],
    ['https://t.me/aigerim_nails', 'telegram'],
    ['tg://resolve?domain=x', 'telegram'],
    ['https://wa.me/77011234567', 'whatsapp'],
    ['https://api.whatsapp.com/send?phone=7701', 'whatsapp'],
    ['https://vm.tiktok.com/ZM123/', 'tiktok'],
    ['https://youtu.be/abc', 'youtube'],
    ['https://twitter.com/x', 'x'],
    ['https://x.com/x', 'x'],
    ['https://fb.me/page', 'facebook'],
    ['https://www.linkedin.com/in/me', 'linkedin'],
    ['https://vk.com/id1', 'vk'],
    ['https://www.threads.net/@me', 'threads'],
    ['https://go.2gis.com/abc', 'twogis'],
    ['https://kaspi.kz/shop/p/x', 'kaspi'],
    ['mailto:hello@lnkmx.my', 'email'],
    ['tel:+77011234567', 'phone'],
  ])('%s → %s', (url, platform) => {
    expect(detectSocialPlatform(url)).toBe(platform);
  });

  it.each(['https://aigerim-nails.kz', 'not a url', '', null, 'https://notinstagram.com'])(
    'returns null for %s',
    (url) => {
      expect(detectSocialPlatform(url as string | null)).toBeNull();
    },
  );
});

describe('normalizePlatformId', () => {
  it('maps legacy ids and rejects unknown ones', () => {
    expect(normalizePlatformId('Twitter')).toBe('x');
    expect(normalizePlatformId('globe')).toBe('website');
    expect(normalizePlatformId('something')).toBeNull();
  });
});
