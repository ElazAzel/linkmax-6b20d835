import { describe, expect, it } from 'vitest';
import { getSmartLinkAvailability, isValidSmartLinkTargetUrl } from '../smart-links';

const baseLink = {
  is_active: true,
  active_from: null,
  expires_at: null,
  max_clicks: null,
  click_count: 0,
};

describe('smart link lifecycle helpers', () => {
  it('allows only web targets', () => {
    expect(isValidSmartLinkTargetUrl('https://example.com/path')).toBe(true);
    expect(isValidSmartLinkTargetUrl('http://localhost:3000')).toBe(true);
    expect(isValidSmartLinkTargetUrl('javascript:alert(1)')).toBe(false);
    expect(isValidSmartLinkTargetUrl('mailto:test@example.com')).toBe(false);
  });

  it('reports the server-enforced lifecycle states', () => {
    const now = new Date('2026-07-25T12:00:00.000Z');
    expect(getSmartLinkAvailability(baseLink, now)).toBe('active');
    expect(getSmartLinkAvailability({ ...baseLink, is_active: false }, now)).toBe('inactive');
    expect(getSmartLinkAvailability({ ...baseLink, active_from: '2026-07-26T12:00:00.000Z' }, now)).toBe('scheduled');
    expect(getSmartLinkAvailability({ ...baseLink, expires_at: '2026-07-25T11:59:59.000Z' }, now)).toBe('expired');
    expect(getSmartLinkAvailability({ ...baseLink, max_clicks: 10, click_count: 10 }, now)).toBe('limit_reached');
  });
});
