import { describe, expect, it } from 'vitest';
import { extractContactsPipeline, extractServicesPipeline, extractSocialsPipeline } from '../extractors';

describe('deterministic input extractors', () => {
  it('parses service names and KZT prices', () => {
    expect(extractServicesPipeline('Маникюр — 5000 KZT\nПедикюр — 7000 KZT')).toMatchObject([
      { title: 'Маникюр', price: 5000, currency: 'KZT' },
      { title: 'Педикюр', price: 7000, currency: 'KZT' },
    ]);
  });

  it('extracts phone, email and Telegram contacts', () => {
    const contacts = extractContactsPipeline('+7 777 123 45 67, hello@example.com, t.me/linkmax_team');

    expect(contacts).toEqual(expect.arrayContaining([
      { platform: 'whatsapp', username: '+77771234567' },
      { platform: 'email', username: 'hello@example.com' },
      { platform: 'telegram', username: 'linkmax_team' },
    ]));
  });

  it('normalizes social handles into clickable URLs', () => {
    expect(extractSocialsPipeline('Instagram: @studio_luna')).toContainEqual({
      platform: 'instagram',
      url: 'https://instagram.com/studio_luna',
    });
  });
});
