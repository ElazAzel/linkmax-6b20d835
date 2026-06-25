// Shared SSRF guard for outbound user-controlled webhook URLs.
// Rejects non-HTTPS schemes, private/loopback/link-local hosts, and metadata endpoints.

const PRIVATE_HOST_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc[0-9a-f]{2}:/i,
  /^fd[0-9a-f]{2}:/i,
  /^fe80:/i,
  /^metadata\.google\.internal$/i,
];

export function isSafeWebhookUrl(rawUrl: string): { ok: boolean; reason?: string } {
  if (!rawUrl || typeof rawUrl !== "string") return { ok: false, reason: "empty_url" };
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }
  if (parsed.protocol !== "https:") return { ok: false, reason: "non_https_scheme" };
  const host = parsed.hostname.replace(/^\[|\]$/g, "");
  if (!host) return { ok: false, reason: "empty_host" };
  for (const pattern of PRIVATE_HOST_PATTERNS) {
    if (pattern.test(host)) return { ok: false, reason: "private_or_reserved_host" };
  }
  return { ok: true };
}
