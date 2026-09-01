import { beforeEach, describe, expect, it } from 'vitest';

import { clearLocalStorageCache } from './cache-utils';

describe('clearLocalStorageCache', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('removes technical cache entries without deleting preferences or authentication', () => {
    window.localStorage.setItem('linkmax-build-v123', 'stale');
    window.localStorage.setItem('lm.qcache.v1', 'stale');
    window.localStorage.setItem('inkmax_v2_page_cache', 'stale');
    window.localStorage.setItem('inkmax_v2_i18nextLng', 'en');
    window.localStorage.setItem('inkmax_v2_lnkmx_cookie_consent', 'rejected');
    window.localStorage.setItem('inkmax_v2_user_preferences', '{"theme":"dark"}');
    window.localStorage.setItem('sb-access-token', 'session');

    clearLocalStorageCache();

    expect(window.localStorage.getItem('linkmax-build-v123')).toBeNull();
    expect(window.localStorage.getItem('lm.qcache.v1')).toBeNull();
    expect(window.localStorage.getItem('inkmax_v2_page_cache')).toBeNull();
    expect(window.localStorage.getItem('inkmax_v2_i18nextLng')).toBe('en');
    expect(window.localStorage.getItem('inkmax_v2_lnkmx_cookie_consent')).toBe('rejected');
    expect(window.localStorage.getItem('inkmax_v2_user_preferences')).toBe('{"theme":"dark"}');
    expect(window.localStorage.getItem('sb-access-token')).toBe('session');
  });
});
