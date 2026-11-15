/**
 * Pure helpers of the page settings sections.
 */
import { getAppDomain } from '@/lib/utils/url-helpers';
import { get as getRegistrableDomain } from 'psl';

/** `lnkmx.my` — the public host without protocol, for address prefixes and DNS hints. */
export function getPublicHost(): string {
  return getAppDomain().replace(/^https?:\/\//, '');
}

/**
 * DNS record the owner has to create. A CNAME cannot live on a root domain
 * (`ivan.ru`) at most registrars, so the root gets an ALIAS/ANAME hint.
 */
export function getDnsRecord(domain: string, target: string): { type: string; name: string; value: string; isRoot: boolean } {
  const normalized = domain.toLowerCase().replace(/\.$/, '');
  const registrable = getRegistrableDomain(normalized);
  const isRoot = !registrable || normalized === registrable;
  return {
    type: isRoot ? 'ALIAS / ANAME' : 'CNAME',
    name: isRoot ? '@' : normalized.slice(0, -(registrable.length + 1)),
    value: target,
    isRoot,
  };
}

/** Basic client-side URL validation; the test endpoint performs its own checks. */
export function isValidWebhookUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.includes('.');
  } catch {
    return false;
  }
}

export function generateWebhookSecret(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

const COUNTRY_CODES = ['KZ', 'RU', 'UZ', 'KG', 'BY', 'UA', 'GE', 'AZ', 'TJ', 'TM', 'AM', 'MD', 'TR', 'AE', 'US'] as const;

function flagEmoji(code: string): string {
  return String.fromCodePoint(...[...code].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65));
}

/** Country names in the interface language (Intl), not hardcoded Russian. */
export function getCountryOptions(language: string): Array<{ value: string; label: string }> {
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames([language], { type: 'region' });
  } catch {
    names = null;
  }
  return COUNTRY_CODES.map((code) => {
    let name: string | undefined;
    try {
      name = names?.of(code);
    } catch {
      name = undefined;
    }
    return { value: code, label: `${flagEmoji(code)} ${name || code}` };
  });
}
