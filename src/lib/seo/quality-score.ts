/**
 * Client-side quality score computation
 * Mirrors the server-side save_page_blocks scoring rubric
 */
import type { PageData, ProfileBlock } from '@/types/page';

export interface QualityCheckItem {
  key: string;
  label: string;
  passed: boolean;
  points: number;
}

export function computeQualityScore(pageData: PageData): {
  score: number;
  checks: QualityCheckItem[];
} {
  const profileBlock = pageData.blocks.find(b => b.type === 'profile') as ProfileBlock | undefined;
  const checks: QualityCheckItem[] = [];

  // 1. Has name/title (15pts)
  const hasName = !!(pageData.seo?.title || profileBlock?.name);
  checks.push({ key: 'name', label: 'Укажите имя или название', passed: hasName, points: 15 });

  // 2. Has avatar (10pts)
  const hasAvatar = !!(profileBlock?.avatar);
  checks.push({ key: 'avatar', label: 'Загрузите фото профиля', passed: hasAvatar, points: 10 });

  // 3. Has bio > 50 chars (15pts)
  const bio = typeof profileBlock?.bio === 'string' ? profileBlock.bio : '';
  const textBlocks = pageData.blocks.filter(b => b.type === 'text');
  const longestText = textBlocks.reduce((max, b) => {
    const t = (b as any).text || '';
    return t.length > max.length ? t : max;
  }, bio);
  const hasBio = longestText.length >= 50;
  checks.push({ key: 'bio', label: 'Добавьте описание (от 50 символов)', passed: hasBio, points: 15 });

  // 4. Has niche set (10pts)
  const hasNiche = !!(pageData.niche && pageData.niche !== 'other');
  checks.push({ key: 'niche', label: 'Выберите категорию', passed: hasNiche, points: 10 });

  // 5. Has ≥1 service/pricing item (15pts)
  const hasPricing = pageData.blocks.some(b => b.type === 'pricing');
  checks.push({ key: 'services', label: 'Добавьте хотя бы одну услугу', passed: hasPricing, points: 15 });

  // 6. Has city (10pts)
  const hasCity = !!(pageData.city);
  checks.push({ key: 'city', label: 'Укажите город', passed: hasCity, points: 10 });

  // 7. Has ≥1 social link (10pts)
  const hasSocials = pageData.blocks.some(b => b.type === 'socials');
  checks.push({ key: 'socials', label: 'Добавьте ссылки на соцсети', passed: hasSocials, points: 10 });

  // 8. Has booking or contact (15pts)
  const hasContact = pageData.blocks.some(b =>
    b.type === 'booking' || b.type === 'form' || b.type === 'newsletter'
  ) || !!(pageData.contact_email || pageData.contact_phone || pageData.contact_whatsapp);
  checks.push({ key: 'contact', label: 'Настройте запись или контакт', passed: hasContact, points: 15 });

  const score = checks.reduce((sum, c) => sum + (c.passed ? c.points : 0), 0);

  return { score, checks };
}

export function getSearchReadinessStatus(score: number): {
  status: 'ready' | 'almost' | 'not_ready';
  label: string;
  color: string;
} {
  if (score >= 40) {
    return { status: 'ready', label: 'Готово к поиску', color: 'emerald' };
  }
  if (score >= 20) {
    return { status: 'almost', label: 'Почти готово', color: 'amber' };
  }
  return { status: 'not_ready', label: 'Не готово для поиска', color: 'red' };
}
