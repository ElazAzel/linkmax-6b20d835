/**
 * Offer Subscriptions & Usage Billing (P2 Monetization)
 * Provider-agnostic abstraction over public.offer_subscriptions + public.usage_events.
 * Payment adapters (Robokassa / Paddle / Stripe) plug in at the checkout layer.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type OfferSubscription = Database['public']['Tables']['offer_subscriptions']['Row'];
type OfferSubscriptionInsert = Database['public']['Tables']['offer_subscriptions']['Insert'];
type OfferSubscriptionUpdate = Database['public']['Tables']['offer_subscriptions']['Update'];
type UsageEvent = Database['public']['Tables']['usage_events']['Row'];
type UsageEventInsert = Database['public']['Tables']['usage_events']['Insert'];

export type BillingInterval = 'day' | 'week' | 'month' | 'year';

function addInterval(from: Date, interval: BillingInterval): Date {
  const d = new Date(from);
  switch (interval) {
    case 'day': d.setUTCDate(d.getUTCDate() + 1); break;
    case 'week': d.setUTCDate(d.getUTCDate() + 7); break;
    case 'month': d.setUTCMonth(d.getUTCMonth() + 1); break;
    case 'year': d.setUTCFullYear(d.getUTCFullYear() + 1); break;
  }
  return d;
}

export async function createOfferSubscription(input: {
  offer_id: string;
  seller_user_id: string;
  customer_user_id?: string | null;
  customer_email?: string | null;
  zone_id?: string | null;
  billing_interval?: BillingInterval;
  provider?: string;
  provider_subscription_id?: string | null;
  status?: OfferSubscription['status'];
  metadata?: Record<string, unknown>;
}): Promise<OfferSubscription> {
  const now = new Date();
  const interval = input.billing_interval ?? 'month';
  const payload: OfferSubscriptionInsert = {
    offer_id: input.offer_id,
    seller_user_id: input.seller_user_id,
    customer_user_id: input.customer_user_id ?? null,
    customer_email: input.customer_email ?? null,
    zone_id: input.zone_id ?? null,
    billing_interval: interval,
    current_period_start: now.toISOString(),
    current_period_end: addInterval(now, interval).toISOString(),
    provider: input.provider ?? 'robokassa',
    provider_subscription_id: input.provider_subscription_id ?? null,
    status: input.status ?? 'active',
    metadata: (input.metadata ?? {}) as never,
  };
  const { data, error } = await supabase
    .from('offer_subscriptions')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function cancelOfferSubscription(id: string, atPeriodEnd = true): Promise<void> {
  const patch: OfferSubscriptionUpdate = atPeriodEnd
    ? { cancel_at_period_end: true }
    : { status: 'canceled', canceled_at: new Date().toISOString() };
  const { error } = await supabase.from('offer_subscriptions').update(patch).eq('id', id);
  if (error) throw error;
}

export async function advanceBillingPeriod(id: string): Promise<OfferSubscription> {
  const { data: sub, error: fetchErr } = await supabase
    .from('offer_subscriptions')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchErr) throw fetchErr;
  const from = new Date(sub.current_period_end);
  const next = addInterval(from, sub.billing_interval as BillingInterval);
  const patch: OfferSubscriptionUpdate = {
    current_period_start: sub.current_period_end,
    current_period_end: next.toISOString(),
  };
  if (sub.cancel_at_period_end) {
    patch.status = 'canceled';
    patch.canceled_at = new Date().toISOString();
  }
  const { data, error } = await supabase
    .from('offer_subscriptions')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function recordUsageEvent(input: {
  seller_user_id: string;
  subscription_id?: string | null;
  offer_id?: string | null;
  customer_user_id?: string | null;
  metric_code: string;
  quantity?: number;
  unit_amount_cents?: number | null;
  currency?: string;
  external_id?: string | null;
  occurred_at?: string;
  metadata?: Record<string, unknown>;
}): Promise<UsageEvent> {
  const payload: UsageEventInsert = {
    seller_user_id: input.seller_user_id,
    subscription_id: input.subscription_id ?? null,
    offer_id: input.offer_id ?? null,
    customer_user_id: input.customer_user_id ?? null,
    metric_code: input.metric_code,
    quantity: input.quantity ?? 1,
    unit_amount_cents: input.unit_amount_cents ?? null,
    currency: input.currency ?? 'KZT',
    external_id: input.external_id ?? null,
    occurred_at: input.occurred_at ?? new Date().toISOString(),
    metadata: (input.metadata ?? {}) as never,
  };
  const { data, error } = await supabase
    .from('usage_events')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function aggregateUsage(
  subscriptionId: string,
  metricCode: string,
  periodStart: string,
  periodEnd: string
): Promise<number> {
  const { data, error } = await supabase.rpc('aggregate_usage', {
    _subscription_id: subscriptionId,
    _metric_code: metricCode,
    _period_start: periodStart,
    _period_end: periodEnd,
  });
  if (error) throw error;
  return Number(data ?? 0);
}

export async function computeCurrentPeriodCharge(subscriptionId: string, metricCode: string): Promise<{
  quantity: number;
  unit_amount_cents: number;
  total_cents: number;
  currency: string;
}> {
  const { data: sub, error } = await supabase
    .from('offer_subscriptions')
    .select('current_period_start,current_period_end,offer_id')
    .eq('id', subscriptionId)
    .single();
  if (error) throw error;

  const { data: offer, error: offerErr } = await supabase
    .from('offers')
    .select('price_cents,currency,usage_config')
    .eq('id', sub.offer_id)
    .single();
  if (offerErr) throw offerErr;

  const quantity = await aggregateUsage(
    subscriptionId,
    metricCode,
    sub.current_period_start,
    sub.current_period_end
  );
  const usageConfig = (offer.usage_config ?? {}) as Record<string, { unit_amount_cents?: number }>;
  const perUnit = usageConfig[metricCode]?.unit_amount_cents ?? offer.price_cents ?? 0;
  return {
    quantity,
    unit_amount_cents: perUnit,
    total_cents: Math.round(quantity * perUnit),
    currency: offer.currency ?? 'KZT',
  };
}
