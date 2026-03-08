/**
 * Unified inbound limit checker for CRM free tier.
 *
 * "Inbound" = lead + booking + event_registration created by end-customers.
 * Scope: per owner user_id, per calendar month (UTC).
 * Limit: 50 for free tier, unlimited for paid.
 */

const CRM_FREE_INBOUND_LIMIT = 50;

export interface InboundLimitResult {
  used: number;
  limit: number;
  allowed: boolean;
  isPremium: boolean;
}

/**
 * Check whether a user (page owner) can receive more inbound submissions this month.
 */
export async function checkInboundLimit(
  supabase: any,
  ownerUserId: string
): Promise<InboundLimitResult> {
  // 1. Check if owner is premium (skip limit)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('premium_tier, is_premium, trial_ends_at')
    .eq('id', ownerUserId)
    .single();

  const tier = profile?.premium_tier || 'free';
  const isPremium =
    profile?.is_premium ||
    (profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date());

  if (isPremium || (tier !== 'free' && tier !== 'identity')) {
    return { used: 0, limit: Infinity, allowed: true, isPremium: true };
  }

  // 2. Count all inbound objects for this user this month (UTC)
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const monthStartISO = monthStart.toISOString();

  // Get all page IDs owned by this user
  const { data: pages } = await supabase
    .from('pages')
    .select('id')
    .eq('user_id', ownerUserId);

  const pageIds = (pages || []).map((p: any) => p.id);

  if (pageIds.length === 0) {
    return { used: 0, limit: CRM_FREE_INBOUND_LIMIT, allowed: true, isPremium: false };
  }

  // Count leads (owned by user_id)
  const { count: leadsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', ownerUserId)
    .gte('created_at', monthStartISO);

  // Count bookings across all owner's pages
  const { count: bookingsCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .in('page_id', pageIds)
    .gte('created_at', monthStartISO);

  // Count event registrations across all owner's pages
  const { count: registrationsCount } = await supabase
    .from('event_registrations')
    .select('*', { count: 'exact', head: true })
    .in('page_id', pageIds)
    .gte('created_at', monthStartISO);

  const used = (leadsCount || 0) + (bookingsCount || 0) + (registrationsCount || 0);

  return {
    used,
    limit: CRM_FREE_INBOUND_LIMIT,
    allowed: used < CRM_FREE_INBOUND_LIMIT,
    isPremium: false,
  };
}
