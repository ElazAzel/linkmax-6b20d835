import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';

const auth = vi.hoisted(() => ({ signIn: vi.fn(), signUp: vi.fn(), track: vi.fn() }));
vi.mock('@/lib/router-compat', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams('method=email'), vi.fn()],
}));
vi.mock('@/hooks/user/useAuth', () => ({ useAuth: () => ({
  user: null, signIn: auth.signIn, signUp: auth.signUp,
}) }));
vi.mock('@/services/authFunnel', () => ({ trackAuthEvent: auth.track }));
vi.mock('@/hooks/ui/useSoundEffects', () => ({ useSoundEffects: () => ({ playError: vi.fn(), playSuccess: vi.fn() }) }));
vi.mock('@/components/auth/DeviceAccountSwitcher', () => ({ DeviceAccountSwitcher: () => null }));
vi.mock('@/components/auth/TelegramLoginButton', () => ({ TelegramLoginButton: () => null }));
vi.mock('@/components/translation/LanguageSwitcher', () => ({ LanguageSwitcher: () => null }));
vi.mock('@/components/seo/StaticSEOHead', () => ({ StaticSEOHead: () => null }));
vi.mock('@/lib/utils/url-helpers', () => ({ getAppDomain: () => 'https://linkmax.invalid' }));

import { Auth } from '../Auth';

beforeEach(() => { cleanup(); vi.clearAllMocks(); });

function submitPassword(password: string) {
  render(<Auth />);
  fireEvent.change(screen.getByTestId('access-email-input'), { target: { value: 'visitor@example.invalid' } });
  const input = screen.getByTestId('access-password-input');
  fireEvent.change(input, { target: { value: password } });
  const form = input.closest('form');
  if (!form) throw new Error('Email form missing');
  fireEvent.submit(form);
}

describe('combined email password validation', () => {
  it('classifies password1 as a strength error after failed sign-in and never attempts signup', async () => {
    auth.signIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    submitPassword('password1');
    await waitFor(() => expect(auth.track).toHaveBeenCalledWith('auth_error', {
      method: 'email_access', stage: 'validation', error: 'password_strength',
    }));
    expect(auth.signIn).toHaveBeenCalledWith('visitor@example.invalid', 'password1');
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it('allows a legacy weak password to sign in without applying signup strength rules', async () => {
    auth.signIn.mockResolvedValue({ error: null });
    submitPassword('password1');
    await waitFor(() => expect(auth.track).toHaveBeenCalledWith('auth_success', { method: 'email_signin' }));
    expect(auth.signIn).toHaveBeenCalledWith('visitor@example.invalid', 'password1');
    expect(auth.signUp).not.toHaveBeenCalled();
    expect(auth.track).not.toHaveBeenCalledWith('auth_error', expect.anything());
  });
});