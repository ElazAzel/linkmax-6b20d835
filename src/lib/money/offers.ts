/**
 * Offers (P2 — Money OS)
 *
 * Абстракция `Offer` поверх произвольных продуктов страницы: разовая
 * покупка, подписка, usage-based, гибрид, донат. Оффер живёт независимо
 * от чекаут-провайдера (Robokassa / Paddle / Stripe) — конкретный чекаут
 * подключается через отдельный слой (см. `orders`, edge-функции).
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type OfferInsert = Database['public']['Tables']['offers']['Insert'];
type OfferUpdate = Database['public']['Tables']['offers']['Update'];

export type OfferType = 'one_time' | 'subscription' | 'usage' | 'hybrid' | 'donation';
export type BillingInterval = 'day' | 'week' | 'month' | 'year';

export interface Offer {
  id: string;
  user_id: string;
  page_id: string | null;
  name: string;
  description: string | null;
  offer_type: OfferType;
  price_cents: number;
  currency: string;
  billing_interval: BillingInterval | null;
  usage_config: Record<string, unknown>;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateOfferInput {
  name: string;
  price_cents: number;
  currency?: string;
  offer_type?: OfferType;
  description?: string | null;
  page_id?: string | null;
  billing_interval?: BillingInterval | null;
  usage_config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export function formatOfferPrice(offer: Pick<Offer, 'price_cents' | 'currency' | 'offer_type' | 'billing_interval'>): string {
  const amount = (offer.price_cents / 100).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const suffix =
    offer.offer_type === 'subscription' && offer.billing_interval ? ` / ${offer.billing_interval}` : '';
  return `${amount} ${offer.currency}${suffix}`;
}

export async function listMyOffers(userId: string): Promise<Offer[]> {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as Offer[]) ?? [];
}

export async function listActiveOffersForPage(pageId: string): Promise<Offer[]> {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('page_id', pageId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as Offer[]) ?? [];
}

export async function createOffer(userId: string, input: CreateOfferInput): Promise<Offer> {
  const payload = {
    user_id: userId,
    name: input.name,
    price_cents: input.price_cents,
    currency: input.currency ?? 'KZT',
    offer_type: input.offer_type ?? 'one_time',
    description: input.description ?? null,
    page_id: input.page_id ?? null,
    billing_interval: input.billing_interval ?? null,
    usage_config: input.usage_config ?? {},
    metadata: input.metadata ?? {},
  };
  const { data, error } = await supabase
    .from('offers')
    .insert(payload as OfferInsert)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Offer;
}

export async function updateOffer(id: string, patch: Partial<CreateOfferInput> & { is_active?: boolean }): Promise<Offer> {
  const { data, error } = await supabase
    .from('offers')
    .update(patch as OfferUpdate)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Offer;
}

export async function deleteOffer(id: string): Promise<void> {
  const { error } = await supabase.from('offers').delete().eq('id', id);
  if (error) throw error;
}
