import { describe, expect, it } from 'vitest';
import { getAppDomain, getPublicPageUrl } from './url-helpers';

describe('public page addresses', () => {
  it('keeps the profile address when no subpage is selected', () => {
    expect(getPublicPageUrl('alice')).toBe(getAppDomain() + '/alice');
  });

  it('preserves the selected subpage for sharing and QR codes', () => {
    expect(getPublicPageUrl('alice', 'services')).toBe(getAppDomain() + '/alice/p/services');
  });

  it('encodes subpage names as a URL segment', () => {
    expect(getPublicPageUrl('alice', 'Мои услуги')).toBe(getAppDomain() + '/alice/p/' + encodeURIComponent('Мои услуги'));
  });
});
