/** Validate and pin webhook destinations before making outbound connections. */
export function parseSafeWebhookUrl(raw: unknown): URL | null {
  if (typeof raw !== 'string' || raw.length > 2048) return null;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || url.username || url.password || !host.includes('.') ||
        host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') ||
        host.includes(':') || /^[0-9.]+$/.test(host)) return null;
    return url;
  } catch {
    return null;
  }
}

function isPublicIPv4(address: string): boolean {
  const parts = address.split('.');
  if (parts.length !== 4 || parts.some(part => !/^(0|[1-9]\d{0,2})$/.test(part) || Number(part) > 255)) return false;
  const [a, b, c] = parts.map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113));
}

/** Reject mixed public/private results and connect only to the chosen address. */
export function selectPublicIPv4(addresses: string[]): string | null {
  return addresses.length && addresses.every(isPublicIPv4) ? addresses[0] : null;
}
