// Rejects redirect targets that are commonly abused: non-http(s) schemes,
// embedded credentials, raw IP addresses, localhost/internal hostnames.
export function isSafeRedirectTarget(raw: unknown): boolean {
  if (typeof raw !== 'string' || raw.length > 2048) return false;
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
  if (u.username || u.password) return false;
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  if (!host || !host.includes('.')) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith('[') || host.includes(':')) return false;
  if (host === 'localhost' || /\.(localhost|local|internal|lan|home|corp)$/.test(host)) return false;
  return true;
}
