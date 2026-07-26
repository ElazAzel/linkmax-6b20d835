import type { Session, User } from '@supabase/supabase-js';
import { storage } from '@/lib/storage';

const STORAGE_KEY = 'device_auth_accounts';
const MAX_DEVICE_ACCOUNTS = 5;

export interface DeviceAccount {
  userId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
  updatedAt: string;
}

function toDeviceAccount(session: Session): DeviceAccount | null {
  if (!session.user?.id || !session.access_token || !session.refresh_token) return null;

  const user = session.user as User;
  const metadata = user.user_metadata ?? {};

  return {
    userId: user.id,
    email: user.email ?? 'account',
    displayName:
      typeof metadata.full_name === 'string'
        ? metadata.full_name
        : typeof metadata.name === 'string'
          ? metadata.name
          : undefined,
    avatarUrl: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : undefined,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at,
    updatedAt: new Date().toISOString(),
  };
}

function sortAccounts(accounts: DeviceAccount[]) {
  return accounts.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function getDeviceAccounts(): DeviceAccount[] {
  const accounts = storage.get<DeviceAccount[]>(STORAGE_KEY);
  if (!Array.isArray(accounts)) return [];

  return sortAccounts(
    accounts.filter((account) =>
      typeof account.userId === 'string'
      && typeof account.email === 'string'
      && typeof account.accessToken === 'string'
      && typeof account.refreshToken === 'string'
    ),
  ).slice(0, MAX_DEVICE_ACCOUNTS);
}

export function rememberDeviceSession(session: Session | null): DeviceAccount[] {
  const account = session ? toDeviceAccount(session) : null;
  if (!account) return getDeviceAccounts();

  const next = [
    account,
    ...getDeviceAccounts().filter((item) => item.userId !== account.userId),
  ].slice(0, MAX_DEVICE_ACCOUNTS);

  storage.set(STORAGE_KEY, next);
  return next;
}

export function forgetDeviceAccount(userId: string): DeviceAccount[] {
  const next = getDeviceAccounts().filter((account) => account.userId !== userId);
  storage.set(STORAGE_KEY, next);
  return next;
}

export function clearDeviceAccounts(): void {
  storage.remove(STORAGE_KEY);
}
