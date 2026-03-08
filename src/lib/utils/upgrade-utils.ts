/**
 * Upgrade utils — navigates user to /pricing for standardized upgrade flow.
 * No more WhatsApp redirect. Single payment path via Robokassa on /pricing.
 */

export function openPremiumPurchase(): void {
  // Navigate to pricing page — works from any context
  window.location.href = '/pricing';
}
