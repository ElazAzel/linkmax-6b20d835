import { describe, it, expect } from 'vitest';
import { PAGE_V2_TABS, getPageV2Tab, pageV2TabHref } from '../page-v2-navigation';

describe('page V2 navigation', () => {
  const allowed = ['editor', 'home', 'business', 'clients', 'settings'];
  it('starts on My Page and preserves explicit overview and business links', () => {
    expect(getPageV2Tab('', '/dashboard/home', allowed)).toBe('editor');
    expect(getPageV2Tab('', '/dashboard', allowed)).toBe('editor');
    expect(getPageV2Tab('?tab=home', '/dashboard/home', allowed)).toBe('home');
    expect(getPageV2Tab('?tab=clients', '/dashboard/home', allowed)).toBe('clients');
    expect(getPageV2Tab('?tab=unknown', '/dashboard/home', allowed)).toBe('editor');
  });
  it('uses the existing TanStack route and exposes the approved five destinations', () => {
    expect(PAGE_V2_TABS.map(tab => tab.id)).toEqual(['editor', 'home', 'add', 'business', 'settings']);
    expect(pageV2TabHref('business')).toBe('/dashboard/home?tab=business');
  });
});
