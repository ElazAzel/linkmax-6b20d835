/**
 * Client-side quality score computation
 * Mirrors the server-side save_page_blocks scoring rubric exactly.
 * 
 * IMPORTANT: If you change scoring logic here, also update:
 * - save_page_blocks() in the DB migration
 * - SearchReadinessCard display
 */
import type { PageData, ProfileBlock } from '@/types/page';

export type ExclusionReason =
  | 'missing_name'
  | 'missing_avatar'
  | 'missing_bio'
  | 'missing_niche'
  | 'missing_city'
  | 'no_services'
  | 'no_socials'
  | 'no_contact'
  | 'low_quality_score'
  | 'unpublished';

export interface QualityCheckItem {
  key: string;
  label: string;
  passed: boolean;
  points: number;
  exclusionReason?: ExclusionReason;
}

export interface QualityBreakdown {
  score: number;
  checks: QualityCheckItem[];
  exclusionReasons: ExclusionReason[];
  isIndexable: boolean;
  serviceCount: number;
}

/** Labels for exclusion reasons — creator-facing, concise Russian */
export const EXCLUSION_LABELS: Record<ExclusionReason, string> = {
  missing_name: 'Укажите имя или название',
  missing_avatar: 'Загрузите фото профиля',
  missing_bio: 'Добавьте описание (от 50 символов)',
  missing_niche: 'Выберите категорию',
  missing_city: 'Укажите город',
  no_services: 'Добавьте хотя бы одну услугу',
  no_socials: 'Добавьте ссылки на соцсети',
  no_contact: 'Настройте запись или контакт',
  low_quality_score: 'Недостаточно данных для видимости в поиске',
  unpublished: 'Страница не опубликована',
};

export const INDEXABLE_THRESHOLD = 25;
export const ALMOST_READY_THRESHOLD = 15;

export function computeQualityScore(pageData: PageData): QualityBreakdown {
  const profileBlock = pageData.blocks.find(b => b.type === 'profile') as ProfileBlock | undefined;
  const checks: QualityCheckItem[] = [];
  const exclusionReasons: ExclusionReason[] = [];
  let serviceCount = 0;

  // 1. Has name/title (15pts)
  const hasName = !!(pageData.seo?.title || profileBlock?.name);
  checks.push({ key: 'name', label: 'Укажите имя или название', passed: hasName, points: 15, exclusionReason: 'missing_name' });
  if (!hasName) exclusionReasons.push('missing_name');

  // 2. Has avatar (10pts)
  const hasAvatar = !!(profileBlock?.avatar);
  checks.push({ key: 'avatar', label: 'Загрузите фото профиля', passed: hasAvatar, points: 10, exclusionReason: 'missing_avatar' });
  if (!hasAvatar) exclusionReasons.push('missing_avatar');

  // 3. Has bio > 50 chars (15pts)
  const bio = typeof profileBlock?.bio === 'string' ? profileBlock.bio : '';
  const textBlocks = pageData.blocks.filter(b => b.type === 'text');
  const longestText = textBlocks.reduce((max, b) => {
    const t = (b as any).text || '';
    return t.length > max.length ? t : max;
  }, bio);
  const hasBio = longestText.length >= 50;
  checks.push({ key: 'bio', label: 'Добавьте описание (от 50 символов)', passed: hasBio, points: 15, exclusionReason: 'missing_bio' });
  if (!hasBio) exclusionReasons.push('missing_bio');

  // 4. Has niche set (10pts)
  const hasNiche = !!(pageData.niche && pageData.niche !== 'other');
  checks.push({ key: 'niche', label: 'Выберите категорию', passed: hasNiche, points: 10, exclusionReason: 'missing_niche' });
  if (!hasNiche) exclusionReasons.push('missing_niche');

  // 5. Has ≥1 service/pricing item (15pts)
  const pricingBlocks = pageData.blocks.filter(b => b.type === 'pricing');
  const hasPricing = pricingBlocks.some(b => {
    const items = (b as any).items || [];
    serviceCount += items.length;
    return items.length > 0;
  });
  checks.push({ key: 'services', label: 'Добавьте хотя бы одну услугу', passed: hasPricing, points: 15, exclusionReason: 'no_services' });
  if (!hasPricing) exclusionReasons.push('no_services');

  // 6. Has city (10pts)
  const hasCity = !!(pageData.city);
  checks.push({ key: 'city', label: 'Укажите город', passed: hasCity, points: 10, exclusionReason: 'missing_city' });
  if (!hasCity) exclusionReasons.push('missing_city');

  // 7. Has ≥1 social link (10pts)
  const hasSocials = pageData.blocks.some(b => b.type === 'socials');
  checks.push({ key: 'socials', label: 'Добавьте ссылки на соцсети', passed: hasSocials, points: 10, exclusionReason: 'no_socials' });
  if (!hasSocials) exclusionReasons.push('no_socials');

  // 8. Has booking or contact (15pts)
  const hasContact = pageData.blocks.some(b =>
    b.type === 'booking' || b.type === 'form' || b.type === 'newsletter'
  ) || !!(pageData.contact_email || pageData.contact_phone || pageData.contact_whatsapp);
  checks.push({ key: 'contact', label: 'Настройте запись или контакт', passed: hasContact, points: 15, exclusionReason: 'no_contact' });
  if (!hasContact) exclusionReasons.push('no_contact');

  const score = checks.reduce((sum, c) => sum + (c.passed ? c.points : 0), 0);

  if (score < INDEXABLE_THRESHOLD) exclusionReasons.push('low_quality_score');
  if (!pageData.isPublished) exclusionReasons.push('unpublished');

  return {
    score,
    checks,
    exclusionReasons,
    isIndexable: score >= INDEXABLE_THRESHOLD && !!pageData.isPublished,
    serviceCount,
  };
}

export function getSearchReadinessStatus(score: number): {
  status: 'ready' | 'almost' | 'not_ready';
  label: string;
  color: string;
} {
  if (score >= INDEXABLE_THRESHOLD) {
    return { status: 'ready', label: 'Готово к поиску', color: 'emerald' };
  }
  if (score >= ALMOST_READY_THRESHOLD) {
    return { status: 'almost', label: 'Почти готово', color: 'amber' };
  }
  return { status: 'not_ready', label: 'Не готово для поиска', color: 'red' };
}
