import { supabase } from '@/platform/supabase/client';
import { getAppDomain } from '@/lib/utils/url-helpers';
import { getGrowthSessionKey, getGrowthVisitorKey } from '@/lib/growth/visitor';
import { logger } from '@/lib/utils/logger';

const GROWTH_EVENT_NAMES = [
  'share_clicked',
  'link_copied',
  'qr_generated',
  'qr_scanned',
  'embed_copied',
  'referral_visit',
  'referral_signup',
  'template_cloned',
  'team_invite_sent',
  'page_published',
  'first_lead_received',
] as const;

type GrowthEventName = typeof GROWTH_EVENT_NAMES[number];

export interface PageGrowthLink {
  id: string;
  code: string;
  pageId: string;
  slug: string;
  shortUrl: string;
  campaign?: string | null;
}

export function addGrowthUtm(url: string, source: string, medium = 'social', campaign = 'linkmax-launch'): string {
  try {
    const target = new URL(url);
    target.searchParams.set('utm_source', source);
    target.searchParams.set('utm_medium', medium);
    target.searchParams.set('utm_campaign', campaign);
    return target.toString();
  } catch {
    return url;
  }
}

interface GrowthLinkRpcResult {
  id: string;
  code: string;
  page_id: string;
  slug: string;
  campaign?: string | null;
}

function toPageGrowthLink(result: GrowthLinkRpcResult): PageGrowthLink {
  return {
    id: result.id,
    code: result.code,
    pageId: result.page_id,
    slug: result.slug,
    shortUrl: `${getAppDomain()}/r/${result.code}`,
    campaign: result.campaign,
  };
}

export async function createPageGrowthLink(pageId: string, campaign = 'launch-kit'): Promise<PageGrowthLink | null> {
  if (!pageId) return null;
  const { data, error } = await supabase.rpc('create_page_growth_link' as any, {
    p_page_id: pageId,
    p_campaign: campaign,
  });
  if (error || !data) {
    logger.debug('Page growth link creation failed', { data: error });
    return null;
  }
  return toPageGrowthLink(data as unknown as GrowthLinkRpcResult);
}

export async function resolvePageGrowthLink(code: string): Promise<PageGrowthLink | null> {
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(code)) return null;
  const { data, error } = await supabase.rpc('resolve_page_growth_link' as any, { p_code: code });
  if (error || !data) {
    logger.debug('Page growth link resolution failed', { data: error });
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return row ? toPageGrowthLink(row as unknown as GrowthLinkRpcResult) : null;
}

export async function recordGrowthEvent(input: {
  code: string;
  eventName: GrowthEventName;
  pageId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(input.code)) return false;
  const { data, error } = await supabase.rpc('record_page_growth_event' as any, {
    p_code: input.code,
    p_event_name: input.eventName,
    p_page_id: input.pageId ?? null,
    p_visitor_key: getGrowthVisitorKey(),
    p_session_key: getGrowthSessionKey(),
    p_metadata: input.metadata ?? {},
  });
  if (error) {
    logger.debug('Page growth event failed', { data: error });
    return false;
  }
  return Boolean((data as { success?: boolean } | null)?.success ?? true);
}

export async function getGrowthMetrics(pageId: string): Promise<{
  shares: number;
  visits: number;
  signups: number;
  clones: number;
  invites: number;
}> {
  if (!pageId) return { shares: 0, visits: 0, signups: 0, clones: 0, invites: 0 };
  const { data, error } = await supabase
    .from('page_growth_events' as any)
    .select('event_name')
    .eq('page_id', pageId);
  if (error) {
    logger.debug('Page growth metrics fetch failed', { data: error });
    return { shares: 0, visits: 0, signups: 0, clones: 0, invites: 0 };
  }
  const rows = (data || []) as unknown as Array<{ event_name: string }>;
  const count = (name: string) => rows.filter((row) => row.event_name === name).length;
  return {
    shares: count('share_clicked'),
    visits: count('referral_visit'),
    signups: count('referral_signup'),
    clones: count('template_cloned'),
    invites: count('team_invite_sent'),
  };
}
