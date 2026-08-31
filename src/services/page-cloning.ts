import type { Json } from '@/platform/supabase/types';
import type { PageData } from '@/types/page';
import { supabase } from '@/platform/supabase/client';
import { trackCurrentUserProductEvent } from '@/services/product-analytics';
import { buildCloneTemplatePayload, type CloneTemplatePayload } from '@/lib/growth/clone-template';
import { getRememberedGrowthReferralCode } from '@/lib/growth/visitor';
import { recordGrowthEvent } from '@/services/viral-growth';
import { logger } from '@/lib/utils/logger';

const PENDING_CLONE_KEY = 'linkmax_pending_page_clone';

async function insertClone(payload: CloneTemplatePayload, userId: string): Promise<string | null> {
  const { data, error } = await supabase.from('user_templates').insert({
    user_id: userId,
    name: payload.name,
    description: payload.description,
    category: payload.category,
    blocks: payload.blocks as unknown as Json,
    theme_settings: payload.themeSettings as unknown as Json,
    is_public: false,
    is_for_sale: false,
    price: 0,
    currency: 'KZT',
  }).select('id').single();

  if (error) {
    logger.debug('Page clone failed', { data: error });
    return null;
  }

  void trackCurrentUserProductEvent('template_cloned', {
    metadata: { sourcePageId: payload.sourcePageId, source: 'public-page' },
  });
  if (payload.sourceReferralCode) {
    void recordGrowthEvent({
      code: payload.sourceReferralCode,
      pageId: payload.sourcePageId,
      eventName: 'template_cloned',
      metadata: { source: 'public-page', attribution: 'clone' },
    });
  }
  return data?.id ?? null;
}

export async function clonePublicPageToUserTemplate(page: Pick<PageData, 'id' | 'blocks' | 'theme' | 'seo' | 'niche'>): Promise<string | null> {
  const payload = buildCloneTemplatePayload(page);
  const referralCode = getRememberedGrowthReferralCode();
  if (referralCode) payload.sourceReferralCode = referralCode;
  const { data } = await supabase.auth.getUser();
  if (!data.user?.id) {
    try {
      window.localStorage.setItem(PENDING_CLONE_KEY, JSON.stringify(payload));
    } catch {
      // Continue to auth even if storage is unavailable.
    }
    return null;
  }
  return insertClone(payload, data.user.id);
}

export async function consumePendingPageClone(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user?.id) return null;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PENDING_CLONE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const payload = JSON.parse(raw) as CloneTemplatePayload;
    const id = await insertClone(payload, data.user.id);
    if (id) window.localStorage.removeItem(PENDING_CLONE_KEY);
    return id;
  } catch (error) {
    logger.debug('Pending page clone could not be consumed', { data: error });
    window.localStorage.removeItem(PENDING_CLONE_KEY);
    return null;
  }
}
