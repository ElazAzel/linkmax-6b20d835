import { describe, expect, it } from 'vitest';
import {
  buildAuthCallbackRedirect,
  getSafeReturnTo,
  readOAuthParams,
} from '@/services/auth-redirects';

describe('auth redirect helpers', () => {
  it('keeps safe internal return paths', () => {
    expect(getSafeReturnTo('/dashboard/settings')).toBe('/dashboard/settings');
  });

  it('rejects external or protocol-relative return paths', () => {
    expect(getSafeReturnTo('//evil.com')).toBe('/dashboard');
    expect(getSafeReturnTo('https://evil.com')).toBe('/dashboard');
    expect(getSafeReturnTo(null)).toBe('/dashboard');
  });

  it('builds the Supabase callback redirect with a safe returnTo', () => {
    expect(buildAuthCallbackRedirect('https://lnkmx.my', '/dashboard/settings')).toBe(
      'https://lnkmx.my/auth/callback?returnTo=%2Fdashboard%2Fsettings'
    );
  });

  it('normalizes unsafe returnTo while reading OAuth params', () => {
    const location = {
      hash: '#error=access_denied&error_description=Denied',
      search: '?returnTo=//evil.com',
    } as Location;

    expect(readOAuthParams(location)).toEqual({
      error: 'access_denied',
      errorDescription: 'Denied',
      returnTo: '/dashboard',
    });
  });
});
