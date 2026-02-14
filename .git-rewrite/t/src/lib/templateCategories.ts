import type { TFunction } from 'i18next';

export const TEMPLATE_CATEGORY_KEYS = [
  'all',
  'creators',
  'business',
  'service',
  'realEstate',
  'wedding',
  'personal',
  'experts',
  'premium',
  'other',
] as const;

export type TemplateCategoryKey = (typeof TEMPLATE_CATEGORY_KEYS)[number];

const CATEGORY_ALIASES: Record<string, TemplateCategoryKey> = {
  all: 'all',
  allTemplates: 'all',
  'Все': 'all',
  creators: 'creators',
  Creators: 'creators',
  'Креаторы': 'creators',
  business: 'business',
  Business: 'business',
  'Бизнес': 'business',
  service: 'service',
  Service: 'service',
  'Сервис': 'service',
  realEstate: 'realEstate',
  RealEstate: 'realEstate',
  'Недвижимость': 'realEstate',
  wedding: 'wedding',
  Wedding: 'wedding',
  'Свадьба': 'wedding',
  personal: 'personal',
  Personal: 'personal',
  'Личное': 'personal',
  experts: 'experts',
  Experts: 'experts',
  'Эксперты': 'experts',
  premium: 'premium',
  Premium: 'premium',
  'Премиум': 'premium',
  other: 'other',
  Other: 'other',
  'Другое': 'other',
};

export const normalizeTemplateCategory = (category?: string | null): TemplateCategoryKey => {
  if (!category) return 'other';
  return CATEGORY_ALIASES[category] ?? 'other';
};

export const getTemplateCategoryLabel = (t: TFunction, category?: string | null): string => {
  const key = normalizeTemplateCategory(category);
  return t(`templates.categories.${key}`, key);
};
