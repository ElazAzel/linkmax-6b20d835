// Mirrors public.block_requires_payment(content): only enabled blocks with a positive price are locked.
export function blockRequiresPayment(content: unknown): boolean {
  if (!content || typeof content !== 'object') return false;
  const style = (content as Record<string, unknown>).blockStyle as Record<string, unknown> | undefined;
  if (!style || String(style.isPaidContent) !== 'true') return false;
  const raw = String(style.paidContentPrice ?? '');
  if (!/^-?[0-9]+(\.[0-9]+)?$/.test(raw)) return false;
  return Number(raw) > 0;
}

export function withoutPaidBlocks<T extends { content?: unknown }>(blocks: T[] | null | undefined): T[] {
  return (blocks ?? []).filter((b) => !blockRequiresPayment(b?.content));
}
