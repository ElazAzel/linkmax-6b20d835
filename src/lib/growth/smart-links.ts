/**
 * SmartLinks (P1 — Growth OS)
 *
 * Тонкий сервисный слой над таблицей `smart_links`. SmartLink — это ссылка
 * как объект с целью (`goal_event`), атрибуцией (UTM) и downstream-действием
 * (например, авто-создание лида/сделки после клика).
 *
 * Публичный редирект живёт в edge-функции `smartlink-redirect` и вызывает
 * RPC `increment_smart_link_click`, которая атомарно инкрементит счётчик
 * и возвращает target_url. Здесь только CRUD/QoL-хелперы для дашборда.
 */

import { supabase } from '@/platform/supabase/client';

export type SmartLinkDownstreamAction =
  | { type: 'none' }
  | { type: 'create_lead'; pipeline?: string; owner_id?: string }
  | { type: 'open_form'; form_id: string }
  | { type: 'open_booking'; booking_slot_id?: string }
  | { type: 'open_checkout'; offer_id: string };

export interface SmartLink {
  id: string;
  user_id: string;
  page_id: string | null;
  block_id: string | null;
  slug: string;
  target_url: string;
  goal_event: string | null;
  campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  downstream_action: SmartLinkDownstreamAction;
  is_active: boolean;
  click_count: number;
  conversion_count: number;
  last_click_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateSmartLinkInput {
  slug: string;
  target_url: string;
  page_id?: string | null;
  block_id?: string | null;
  goal_event?: string | null;
  campaign?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  downstream_action?: SmartLinkDownstreamAction;
}

const SLUG_RE = /^[a-z0-9][a-z0-9_-]{1,63}$/;

export function isValidSmartLinkSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

export function buildSmartLinkUrl(slug: string, origin?: string): string {
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : 'https://lnkmx.my');
  return `${base}/s/${slug}`;
}

export async function listMySmartLinks(userId: string): Promise<SmartLink[]> {
  const { data, error } = await supabase
    .from('smart_links' as never)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as SmartLink[]) ?? [];
}

export async function createSmartLink(userId: string, input: CreateSmartLinkInput): Promise<SmartLink> {
  if (!isValidSmartLinkSlug(input.slug)) {
    throw new Error('Invalid slug (a-z, 0-9, "-", "_", 2-64 chars, must start with a letter/digit)');
  }
  const payload = {
    user_id: userId,
    slug: input.slug,
    target_url: input.target_url,
    page_id: input.page_id ?? null,
    block_id: input.block_id ?? null,
    goal_event: input.goal_event ?? null,
    campaign: input.campaign ?? null,
    utm_source: input.utm_source ?? null,
    utm_medium: input.utm_medium ?? null,
    utm_campaign: input.utm_campaign ?? null,
    utm_content: input.utm_content ?? null,
    utm_term: input.utm_term ?? null,
    downstream_action: input.downstream_action ?? { type: 'none' },
  };
  const { data, error } = await supabase
    .from('smart_links' as never)
    .insert(payload as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as SmartLink;
}

export async function updateSmartLink(id: string, patch: Partial<CreateSmartLinkInput> & { is_active?: boolean }): Promise<SmartLink> {
  const { data, error } = await supabase
    .from('smart_links' as never)
    .update(patch as never)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as SmartLink;
}

export async function deleteSmartLink(id: string): Promise<void> {
  const { error } = await supabase.from('smart_links' as never).delete().eq('id', id);
  if (error) throw error;
}
