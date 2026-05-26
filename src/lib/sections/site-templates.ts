/**
 * Site templates — Sprint 1 (Global Plan): ready-made multi-page websites.
 * Each template defines an ordered list of sub-pages built from section presets,
 * so applying a template = batch-create N sub-pages seeded with composed blocks.
 *
 * No new block types and no new editor logic — pure composition over the
 * existing section-presets infrastructure.
 */
import type { Block } from '@/types/blocks';
import { SECTION_PRESETS, type SectionPresetId } from '@/lib/sections/section-presets';

export interface SiteTemplatePage {
  /** URL path segment, e.g. 'about'. Latin/digits/hyphen only, ≤40 chars. */
  path: string;
  /** Translation key for the page title. */
  titleKey: string;
  /** Fallback (Russian base) title if no translation is available. */
  titleFallback: string;
  /** Ordered section presets composed into this page. */
  sections: SectionPresetId[];
}

export type SiteTemplateId =
  | 'services'
  | 'expert'
  | 'cafe'
  | 'school'
  | 'portfolio'
  | 'product-landing';

export interface SiteTemplate {
  id: SiteTemplateId;
  /** i18n key for label. */
  labelKey: string;
  labelFallback: string;
  /** i18n key for description. */
  descKey: string;
  descFallback: string;
  /** Single-emoji-free icon name from lucide; consumer maps it to a component. */
  icon: 'briefcase' | 'user' | 'coffee' | 'graduation-cap' | 'image' | 'rocket';
  /** Optional accent color (Tailwind class), purely cosmetic for the gallery. */
  accent?: string;
  /** Pages to create (in order). Each page seeded with composed section blocks. */
  pages: SiteTemplatePage[];
}

/**
 * Compose a page's seedBlocks by concatenating its section presets.
 * Exported for callers (apply-template service, previews).
 */
export function buildPageBlocks(sections: SectionPresetId[]): Block[] {
  const out: Block[] = [];
  for (const sid of sections) {
    const preset = SECTION_PRESETS.find((s) => s.id === sid);
    if (preset) out.push(...preset.build());
  }
  return out;
}

export const SITE_TEMPLATES: SiteTemplate[] = [
  {
    id: 'services',
    labelKey: 'siteTemplates.services.label',
    labelFallback: 'Услуги',
    descKey: 'siteTemplates.services.desc',
    descFallback: 'Идеально для агентств и сервисов: главная, услуги, цены, контакты',
    icon: 'briefcase',
    accent: 'bg-blue-500/10 text-blue-600',
    pages: [
      {
        path: 'about',
        titleKey: 'siteTemplates.pages.about',
        titleFallback: 'О нас',
        sections: ['about', 'cta'],
      },
      {
        path: 'services',
        titleKey: 'siteTemplates.pages.services',
        titleFallback: 'Услуги',
        sections: ['hero', 'pricing'],
      },
      {
        path: 'contacts',
        titleKey: 'siteTemplates.pages.contacts',
        titleFallback: 'Контакты',
        sections: ['contact'],
      },
    ],
  },
  {
    id: 'expert',
    labelKey: 'siteTemplates.expert.label',
    labelFallback: 'Эксперт',
    descKey: 'siteTemplates.expert.desc',
    descFallback: 'Для коучей, консультантов и менторов: про меня, программы, отзывы, запись',
    icon: 'user',
    accent: 'bg-violet-500/10 text-violet-600',
    pages: [
      {
        path: 'about',
        titleKey: 'siteTemplates.pages.aboutMe',
        titleFallback: 'Обо мне',
        sections: ['about'],
      },
      {
        path: 'programs',
        titleKey: 'siteTemplates.pages.programs',
        titleFallback: 'Программы',
        sections: ['hero', 'pricing', 'cta'],
      },
      {
        path: 'faq',
        titleKey: 'siteTemplates.pages.faq',
        titleFallback: 'FAQ',
        sections: ['faq', 'contact'],
      },
    ],
  },
  {
    id: 'cafe',
    labelKey: 'siteTemplates.cafe.label',
    labelFallback: 'Кафе / Ресторан',
    descKey: 'siteTemplates.cafe.desc',
    descFallback: 'Меню, бронь столика, расположение и контакты',
    icon: 'coffee',
    accent: 'bg-amber-500/10 text-amber-700',
    pages: [
      {
        path: 'menu',
        titleKey: 'siteTemplates.pages.menu',
        titleFallback: 'Меню',
        sections: ['hero', 'pricing'],
      },
      {
        path: 'booking',
        titleKey: 'siteTemplates.pages.booking',
        titleFallback: 'Бронь',
        sections: ['contact', 'cta'],
      },
    ],
  },
  {
    id: 'school',
    labelKey: 'siteTemplates.school.label',
    labelFallback: 'Школа / Курсы',
    descKey: 'siteTemplates.school.desc',
    descFallback: 'Курсы, преподаватели, расписание и приём заявок',
    icon: 'graduation-cap',
    accent: 'bg-emerald-500/10 text-emerald-600',
    pages: [
      {
        path: 'courses',
        titleKey: 'siteTemplates.pages.courses',
        titleFallback: 'Курсы',
        sections: ['hero', 'pricing'],
      },
      {
        path: 'about',
        titleKey: 'siteTemplates.pages.aboutSchool',
        titleFallback: 'О школе',
        sections: ['about', 'faq'],
      },
      {
        path: 'contacts',
        titleKey: 'siteTemplates.pages.contacts',
        titleFallback: 'Контакты',
        sections: ['contact', 'cta'],
      },
    ],
  },
  {
    id: 'portfolio',
    labelKey: 'siteTemplates.portfolio.label',
    labelFallback: 'Портфолио',
    descKey: 'siteTemplates.portfolio.desc',
    descFallback: 'Для фотографов и дизайнеров: работы, обо мне, услуги, связь',
    icon: 'image',
    accent: 'bg-pink-500/10 text-pink-600',
    pages: [
      {
        path: 'works',
        titleKey: 'siteTemplates.pages.works',
        titleFallback: 'Работы',
        sections: ['hero'],
      },
      {
        path: 'about',
        titleKey: 'siteTemplates.pages.aboutMe',
        titleFallback: 'Обо мне',
        sections: ['about'],
      },
      {
        path: 'contact',
        titleKey: 'siteTemplates.pages.contact',
        titleFallback: 'Связь',
        sections: ['contact', 'cta'],
      },
    ],
  },
  {
    id: 'product-landing',
    labelKey: 'siteTemplates.product.label',
    labelFallback: 'Лендинг продукта',
    descKey: 'siteTemplates.product.desc',
    descFallback: 'Hero, преимущества, цены, FAQ и финальный CTA',
    icon: 'rocket',
    accent: 'bg-orange-500/10 text-orange-600',
    pages: [
      {
        path: 'features',
        titleKey: 'siteTemplates.pages.features',
        titleFallback: 'Возможности',
        sections: ['hero', 'about'],
      },
      {
        path: 'pricing',
        titleKey: 'siteTemplates.pages.pricing',
        titleFallback: 'Цены',
        sections: ['pricing', 'faq', 'cta'],
      },
    ],
  },
];

export function getSiteTemplate(id: SiteTemplateId): SiteTemplate | undefined {
  return SITE_TEMPLATES.find((t) => t.id === id);
}
