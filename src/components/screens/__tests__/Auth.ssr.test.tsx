import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';

const route = vi.hoisted(() => ({ search: '' }));
vi.mock('@/lib/router-compat', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(route.search), vi.fn()],
}));
vi.mock('@/hooks/user/useAuth', () => ({
  useAuth: () => ({
    user: null, deviceAccounts: [],
    signUp: vi.fn(), signIn: vi.fn(), signInWithGoogle: vi.fn(),
    signInWithApple: vi.fn(), signInWithTelegram: vi.fn(),
    switchDeviceAccount: vi.fn(), removeDeviceAccount: vi.fn(), signOut: vi.fn(),
  }),
}));
vi.mock('@/lib/utils/url-helpers', () => ({ getAppDomain: () => 'https://ssr.linkmax.invalid' }));

import Auth from '../Auth';

afterEach(() => {
  vi.unstubAllGlobals();
  route.search = '';
});

describe('Auth server rendering', () => {
  it('renders social login without a browser window', () => {
    vi.stubGlobal('window', undefined);
    const html = renderToString(<Auth />);
    expect(html).toContain('Google');
  });

  it('renders the requested email form without a browser window', () => {
    route.search = 'method=email&mode=signin';
    vi.stubGlobal('window', undefined);
    const html = renderToString(<Auth />);
    expect(html).toContain('<form');
    expect(html).toContain('type="email"');
  });
});