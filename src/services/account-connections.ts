import type { UserIdentity } from '@supabase/supabase-js';
import { supabase } from '@/platform/supabase/client';
import { buildAuthCallbackRedirect } from '@/services/auth-redirects';

export type OAuthAccountProvider = 'google' | 'apple';
export type LinkedAccountProvider = 'email' | OAuthAccountProvider;

export interface LinkedAccount {
  provider: LinkedAccountProvider;
  email?: string;
  linked: boolean;
}

function findIdentity(identities: UserIdentity[], provider: LinkedAccountProvider) {
  return identities.find((identity) => identity.provider === provider);
}

export async function loadLinkedAccounts(): Promise<LinkedAccount[]> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    return [];
  }

  const identities = user.identities || [];
  const googleIdentity = findIdentity(identities, 'google');
  const appleIdentity = findIdentity(identities, 'apple');

  return [
    {
      provider: 'email',
      email: user.email,
      linked: Boolean(findIdentity(identities, 'email') || user.email),
    },
    {
      provider: 'google',
      email: googleIdentity?.identity_data?.email,
      linked: Boolean(googleIdentity),
    },
    {
      provider: 'apple',
      email: appleIdentity?.identity_data?.email,
      linked: Boolean(appleIdentity),
    },
  ];
}

export async function startOAuthAccountLink(provider: OAuthAccountProvider) {
  // Must be called while the user is already signed in. `linkIdentity` attaches
  // the OAuth identity to the current auth.users row instead of creating a new
  // account, so the existing profile/data stay intact.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('Not authenticated — sign in with email first, then link Google.');

  const { error } = await supabase.auth.linkIdentity({
    provider,
    options: {
      redirectTo: buildAuthCallbackRedirect(window.location.origin, '/dashboard/settings'),
    },
  });

  if (error) {
    throw error;
  }
}


export async function unlinkOAuthAccount(provider: OAuthAccountProvider) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error('No active user');
  }

  const identity = user.identities?.find((item) => item.provider === provider);
  if (!identity) {
    return { identityFound: false };
  }

  const { error: unlinkError } = await supabase.auth.unlinkIdentity(identity);
  if (unlinkError) {
    throw unlinkError;
  }

  return { identityFound: true };
}
