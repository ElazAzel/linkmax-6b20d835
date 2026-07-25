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

import { supabase } from '@/integrations/supabase/client';

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
  active_from: string | null;
  expires_at: string | null;
  max_clicks: number | null;
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
  active_from?: string | null;
  expires_at?: string | null;
  max_clicks?: number | null;
}

const SLUG_RE = /^[a-z0-9][a-z0-9_-]{1,63}$/;

export function isValidSmartLinkSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

export function buildSmartLinkUrl(slug: string, origin?: string): string {
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : 'https://lnkmx.my');
  return `${base}/s/${slug}`;
}

export function isValidSmartLinkTargetUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function validateSmartLinkInput(input: Partial<CreateSmartLinkInput>): void {
  if (input.target_url !== undefined && !isValidSmartLinkTargetUrl(input.target_url)) {
    throw new Error('Target URL must use http or https');
  }
  if (input.max_clicks !== undefined && input.max_clicks !== null && (!Number.isInteger(input.max_clicks) || input.max_clicks < 1 || input.max_clicks > 10_000_000)) {
    throw new Error('Click limit must be a whole number from 1 to 10,000,000');
  }
  if (input.active_from && Number.isNaN(Date.parse(input.active_from))) throw new Error('Invalid start date');
  if (input.expires_at && Number.isNaN(Date.parse(input.expires_at))) throw new Error('Invalid expiry date');
  if (input.active_from && input.expires_at && new Date(input.active_from) >= new Date(input.expires_at)) {
    throw new Error('Expiry date must be after the start date');
  }
}

export function getSmartLinkAvailability(link: Pick<SmartLink, 'is_active' | 'active_from' | 'expires_at' | 'max_clicks' | 'click_count'>, now = new Date()): 'active' | 'inactive' | 'scheduled' | 'expired' | 'limit_reached' {
  if (!link.is_active) return 'inactive';
  if (link.active_from && new Date(link.active_from) > now) return 'scheduled';
  if (link.expires_at && new Date(link.expires_at) <= now) return 'expired';
  if (link.max_clicks !== null && link.click_count >= link.max_clicks) return 'limit_reached';
  return 'active';
}

export async function listMySmartLinks(userId: string): Promise<SmartLink[]> {
  const { data, error } = await supabase
    .from('smart_links')
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
  validateSmartLinkInput(input);
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
    active_from: input.active_from ?? null,
    expires_at: input.expires_at ?? null,
    max_clicks: input.max_clicks ?? null,
  };
  const { data, error } = await supabase
    .from('smart_links')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as SmartLink;
}

export async function updateSmartLink(id: string, patch: Partial<CreateSmartLinkInput> & { is_active?: boolean }): Promise<SmartLink> {
  validateSmartLinkInput(patch);
  const { data, error } = await supabase
    .from('smart_links')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as SmartLink;
}

export async function deleteSmartLink(id: string): Promise<void> {
  const { error } = await supabase.from('smart_links').delete().eq('id', id);
  if (error) throw error;
}
