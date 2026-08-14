const VISITOR_KEY = 'linkmax_growth_visitor_key';
const SESSION_KEY = 'linkmax_growth_session_key';
const REFERRAL_KEY = 'linkmax_growth_referral_code';

function createKey(prefix: string): string {
  const uuid = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${uuid.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

function readStorage(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // Private browsing or a blocked storage API should not break the page.
  }
}

export function getGrowthVisitorKey(): string {
  if (typeof window === 'undefined') return 'server_visitor';
  const existing = readStorage(window.localStorage, VISITOR_KEY);
  if (existing) return existing;
  const created = createKey('visitor');
  writeStorage(window.localStorage, VISITOR_KEY, created);
  return created;
}

export function getGrowthSessionKey(): string {
  if (typeof window === 'undefined') return 'server_session';
  const existing = readStorage(window.sessionStorage, SESSION_KEY);
  if (existing) return existing;
  const created = createKey('session');
  writeStorage(window.sessionStorage, SESSION_KEY, created);
  return created;
}

export function rememberGrowthReferralCode(code: string): void {
  if (typeof window === 'undefined' || !/^[a-zA-Z0-9_-]{8,64}$/.test(code)) return;
  writeStorage(window.localStorage, REFERRAL_KEY, code);
}

export function getRememberedGrowthReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  const code = readStorage(window.localStorage, REFERRAL_KEY);
  return code && /^[a-zA-Z0-9_-]{8,64}$/.test(code) ? code : null;
}

export function clearRememberedGrowthReferralCode(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(REFERRAL_KEY);
  } catch {
    // Ignore storage failures.
  }
}
