export function isPlatformDomain(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, '');
  return normalized === 'lnkmx.my' || normalized.endsWith('.lnkmx.my');
}
