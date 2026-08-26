/**
 * SectionPattern layer (Phase 1).
 *
 * A SectionPattern = intent + composition + blocks + variants.
 * Patterns are composed of EXISTING block types only. They build a fresh
 * Block[] where the first block carries `composition` and `sectionId`, so the
 * renderer can lay the group out as one designed section instead of a stack
 * of identical cards.
 */

import type { Block } from '@/types/blocks';
import { generateBlockId } from '@/services/pages';
import type { CompositionId } from '@/lib/design/composition';
import type { BusinessIntent } from '@/lib/blocks/block-meta';

export type SectionCategory =
  | 'start'
  | 'explain'
  | 'show'
  | 'trust'
  | 'sell'
  | 'capture'
  | 'book'
  | 'events'
  | 'community'
  | 'contact';

export interface SectionPattern {
  id: string;
  category: SectionCategory;
  intent: BusinessIntent;
  composition: CompositionId;
  labelKey: string;
  labelFallback: string;
  descKey: string;
  descFallback: string;
  /** Niches this pattern is tuned for (used by READY recommendations). */
  niches?: string[];
  /** Preview wireframe hint. */
  preview: 'split' | 'editorial' | 'overlap' | 'cinema' | 'spotlight' | 'bento' | 'rail' | 'center';
  build: () => Block[];
}

const id = (t: string) => generateBlockId(t);

/** Tag a built group as one designed section. */
function section(composition: CompositionId, blocks: Block[]): Block[] {
  const sectionId = `sec_${Math.random().toString(36).slice(2, 10)}`;
  return blocks.map((b, i) => ({
    ...(b as any),
    sectionId,
    ...(i === 0 ? { composition } : {}),
  })) as Block[];
}

const text = (content: string, style: string, variant?: string, alignment: string = 'left') =>
  ({ id: id('text'), type: 'text', content, style, alignment, ...(variant ? { variant } : {}) }) as unknown as Block;

const button = (label: string, variant?: string) =>
  ({ id: id('button'), type: 'button', title: label, label, url: '', ...(variant ? { variant } : {}) }) as unknown as Block;

const image = (variant?: string) =>
  ({ id: id('image'), type: 'image', url: '', imageUrl: '', ...(variant ? { variant } : {}) }) as unknown as Block;

export const SECTION_PATTERNS: SectionPattern[] = [
  // ---------- Start ----------
  {
    id: 'start-editorial',
    category: 'start',
    intent: 'start',
    composition: 'editorial-hero',
    labelKey: 'sectionPatterns.startEditorial.label',
    labelFallback: 'Редакционный герой',
    descKey: 'sectionPatterns.startEditorial.desc',
    descFallback: 'Крупный заголовок, короткий лид и одна кнопка',
    preview: 'editorial',
    build: () =>
      section('editorial-hero', [
        text('Чем я помогаю', 'paragraph', 'label-eyebrow'),
        text('Заголовок, который объясняет ценность за 3 секунды', 'heading', 'display-oversized'),
        text('Одно-два предложения о том, что вы делаете и для кого.', 'paragraph', 'editorial-lead'),
        button('Написать мне', 'button-solid-bold'),
      ]),
  },
  {
    id: 'start-split',
    category: 'start',
    intent: 'start',
    composition: 'split-hero',
    labelKey: 'sectionPatterns.startSplit.label',
    labelFallback: 'Split-герой',
    descKey: 'sectionPatterns.startSplit.desc',
    descFallback: 'Текст слева, фото справа — на мобильном друг под другом',
    preview: 'split',
    build: () =>
      section('split-hero', [
        text('Заголовок с оффером', 'heading', 'display-oversized'),
        image('media-editorial-crop'),
        text('Подзаголовок с конкретной пользой.', 'paragraph', 'editorial-lead'),
        button('Записаться', 'button-solid-bold'),
      ]),
  },
  {
    id: 'start-portrait',
    category: 'start',
    intent: 'start',
    composition: 'overlap-portrait',
    labelKey: 'sectionPatterns.startPortrait.label',
    labelFallback: 'Портрет с наложением',
    descKey: 'sectionPatterns.startPortrait.desc',
    descFallback: 'Фото и карточка имени поверх — для экспертов и мастеров',
    niches: ['expert', 'beauty', 'coach'],
    preview: 'overlap',
    build: () =>
      section('overlap-portrait', [
        image('media-full-bleed'),
        text('Имя · профессия', 'heading', 'metric-big'),
        text('Коротко о себе и о результате для клиента.', 'paragraph', 'editorial-lead'),
      ]),
  },
  // ---------- Explain ----------
  {
    id: 'explain-cinema',
    category: 'explain',
    intent: 'explain',
    composition: 'cinematic-video',
    labelKey: 'sectionPatterns.explainCinema.label',
    labelFallback: 'Кинематографичное видео',
    descKey: 'sectionPatterns.explainCinema.desc',
    descFallback: 'Видео во всю ширину и подпись под ним',
    preview: 'cinema',
    build: () =>
      section('cinematic-video', [
        { id: id('video'), type: 'video', url: '' } as unknown as Block,
        text('Что вы увидите в видео', 'paragraph', 'label-eyebrow', 'center'),
      ]),
  },
  {
    id: 'explain-steps',
    category: 'explain',
    intent: 'explain',
    composition: 'stack',
    labelKey: 'sectionPatterns.explainSteps.label',
    labelFallback: 'Как это работает',
    descKey: 'sectionPatterns.explainSteps.desc',
    descFallback: 'Три шага процесса простым текстом',
    preview: 'center',
    build: () =>
      section('stack', [
        text('Как мы работаем', 'heading'),
        text('1. Знакомство и запрос', 'paragraph'),
        text('2. Работа и обратная связь', 'paragraph'),
        text('3. Результат', 'paragraph'),
      ]),
  },
  // ---------- Show ----------
  {
    id: 'show-spotlight',
    category: 'show',
    intent: 'show',
    composition: 'project-spotlight',
    labelKey: 'sectionPatterns.showSpotlight.label',
    labelFallback: 'Спотлайт проекта',
    descKey: 'sectionPatterns.showSpotlight.desc',
    descFallback: 'Один кейс крупно с описанием',
    niches: ['freelancer', 'creator', 'realtor'],
    preview: 'spotlight',
    build: () =>
      section('project-spotlight', [
        image('media-editorial-crop'),
        text('Название кейса', 'heading'),
        text('Задача, что сделали, результат.', 'paragraph', 'editorial-lead'),
      ]),
  },
  {
    id: 'show-rail',
    category: 'show',
    intent: 'show',
    composition: 'horizontal-projects',
    labelKey: 'sectionPatterns.showRail.label',
    labelFallback: 'Горизонтальная лента работ',
    descKey: 'sectionPatterns.showRail.desc',
    descFallback: 'Свайп по работам — без длинной прокрутки',
    preview: 'rail',
    build: () =>
      section('horizontal-projects', [image(), image(), image()]),
  },
  {
    id: 'show-before-after',
    category: 'show',
    intent: 'show',
    composition: 'stack',
    labelKey: 'sectionPatterns.showBeforeAfter.label',
    labelFallback: 'До / После',
    descKey: 'sectionPatterns.showBeforeAfter.desc',
    descFallback: 'Сравнение результата — для красоты и здоровья',
    niches: ['beauty', 'fitness'],
    preview: 'split',
    build: () =>
      section('stack', [
        text('Результаты', 'heading'),
        { id: id('before_after'), type: 'before_after' } as unknown as Block,
      ]),
  },
  // ---------- Trust ----------
  {
    id: 'trust-bento',
    category: 'trust',
    intent: 'trust',
    composition: 'bento-proof',
    labelKey: 'sectionPatterns.trustBento.label',
    labelFallback: 'Бенто-доказательства',
    descKey: 'sectionPatterns.trustBento.desc',
    descFallback: 'Отзыв + факты о вас в разных плитках',
    preview: 'bento',
    build: () =>
      section('bento-proof', [
        { id: id('testimonial'), type: 'testimonial' } as unknown as Block,
        text('Опыт', 'paragraph', 'metric-big'),
        text('Клиентов', 'paragraph', 'metric-big'),
      ]),
  },
  {
    id: 'trust-authority',
    category: 'trust',
    intent: 'trust',
    composition: 'editorial-hero',
    labelKey: 'sectionPatterns.trustAuthority.label',
    labelFallback: 'Экспертность',
    descKey: 'sectionPatterns.trustAuthority.desc',
    descFallback: 'Опыт, образование, подход — без выдуманных фактов',
    niches: ['expert', 'coach', 'tutor'],
    preview: 'editorial',
    build: () =>
      section('editorial-hero', [
        text('Почему мне доверяют', 'paragraph', 'label-eyebrow'),
        text('Ваш опыт в одной сильной фразе', 'heading', 'display-oversized'),
        text('Добавьте только реальные факты: опыт, обучение, подход.', 'paragraph', 'editorial-lead'),
      ]),
  },
  // ---------- Sell ----------
  {
    id: 'sell-pricing',
    category: 'sell',
    intent: 'sell',
    composition: 'stack',
    labelKey: 'sectionPatterns.sellPricing.label',
    labelFallback: 'Цены',
    descKey: 'sectionPatterns.sellPricing.desc',
    descFallback: 'Прозрачный прайс с одной кнопкой',
    preview: 'center',
    build: () =>
      section('stack', [
        text('Стоимость', 'heading'),
        { id: id('pricing'), type: 'pricing' } as unknown as Block,
        button('Выбрать', 'button-solid-bold'),
      ]),
  },
  {
    id: 'sell-catalog',
    category: 'sell',
    intent: 'sell',
    composition: 'bento-proof',
    labelKey: 'sectionPatterns.sellCatalog.label',
    labelFallback: 'Витрина',
    descKey: 'sectionPatterns.sellCatalog.desc',
    descFallback: 'Товары или услуги плитками',
    niches: ['store', 'food'],
    preview: 'bento',
    build: () =>
      section('bento-proof', [
        text('Каталог', 'heading'),
        { id: id('catalog'), type: 'catalog' } as unknown as Block,
      ]),
  },
  // ---------- Capture ----------
  {
    id: 'capture-form',
    category: 'capture',
    intent: 'capture',
    composition: 'stack',
    labelKey: 'sectionPatterns.captureForm.label',
    labelFallback: 'Заявка',
    descKey: 'sectionPatterns.captureForm.desc',
    descFallback: 'Короткая форма — имя и контакт',
    preview: 'center',
    build: () =>
      section('stack', [
        text('Оставьте заявку', 'heading'),
        { id: id('form'), type: 'form' } as unknown as Block,
      ]),
  },
  {
    id: 'capture-lead-magnet',
    category: 'capture',
    intent: 'capture',
    composition: 'split-hero',
    labelKey: 'sectionPatterns.captureLeadMagnet.label',
    labelFallback: 'Лид-магнит',
    descKey: 'sectionPatterns.captureLeadMagnet.desc',
    descFallback: 'Полезный файл в обмен на контакт',
    preview: 'split',
    build: () =>
      section('split-hero', [
        text('Забрать гайд', 'heading', 'display-oversized'),
        { id: id('download'), type: 'download' } as unknown as Block,
      ]),
  },
  // ---------- Book ----------
  {
    id: 'book-slots',
    category: 'book',
    intent: 'book',
    composition: 'stack',
    labelKey: 'sectionPatterns.bookSlots.label',
    labelFallback: 'Онлайн-запись',
    descKey: 'sectionPatterns.bookSlots.desc',
    descFallback: 'Календарь записи и напоминание об отмене',
    niches: ['beauty', 'expert', 'tutor', 'local-service'],
    preview: 'center',
    build: () =>
      section('stack', [
        text('Записаться', 'heading'),
        { id: id('booking'), type: 'booking' } as unknown as Block,
      ]),
  },
  // ---------- Events ----------
  {
    id: 'events-upcoming',
    category: 'events',
    intent: 'events',
    composition: 'project-spotlight',
    labelKey: 'sectionPatterns.eventsUpcoming.label',
    labelFallback: 'Ближайшее событие',
    descKey: 'sectionPatterns.eventsUpcoming.desc',
    descFallback: 'Дата, место и регистрация',
    niches: ['event', 'creator'],
    preview: 'spotlight',
    build: () =>
      section('project-spotlight', [
        { id: id('event'), type: 'event' } as unknown as Block,
        button('Зарегистрироваться', 'button-solid-bold'),
      ]),
  },
  // ---------- Community ----------
  {
    id: 'community-follow',
    category: 'community',
    intent: 'community',
    composition: 'fullscreen-contact',
    labelKey: 'sectionPatterns.communityFollow.label',
    labelFallback: 'Подписаться',
    descKey: 'sectionPatterns.communityFollow.desc',
    descFallback: 'Соцсети и сообщество крупно',
    preview: 'center',
    build: () =>
      section('fullscreen-contact', [
        text('Присоединяйтесь', 'heading', 'display-oversized', 'center'),
        { id: id('socials'), type: 'socials' } as unknown as Block,
      ]),
  },
  // ---------- Contact ----------
  {
    id: 'contact-fullscreen',
    category: 'contact',
    intent: 'contact',
    composition: 'fullscreen-contact',
    labelKey: 'sectionPatterns.contactFullscreen.label',
    labelFallback: 'Контакт на весь экран',
    descKey: 'sectionPatterns.contactFullscreen.desc',
    descFallback: 'Одно действие: написать в мессенджер',
    preview: 'center',
    build: () =>
      section('fullscreen-contact', [
        text('Давайте обсудим', 'heading', 'display-oversized', 'center'),
        { id: id('messenger'), type: 'messenger' } as unknown as Block,
      ]),
  },
  {
    id: 'contact-map',
    category: 'contact',
    intent: 'contact',
    composition: 'split-hero',
    labelKey: 'sectionPatterns.contactMap.label',
    labelFallback: 'Адрес и карта',
    descKey: 'sectionPatterns.contactMap.desc',
    descFallback: 'Как добраться — для офлайн-услуг',
    niches: ['local-service', 'food', 'beauty'],
    preview: 'split',
    build: () =>
      section('split-hero', [
        text('Как добраться', 'heading'),
        { id: id('map'), type: 'map' } as unknown as Block,
      ]),
  },
];

export const SECTION_CATEGORY_ORDER: SectionCategory[] = [
  'start',
  'explain',
  'show',
  'trust',
  'sell',
  'capture',
  'book',
  'events',
  'community',
  'contact',
];

export const SECTION_CATEGORY_LABELS: Record<SectionCategory, { key: string; fallback: string }> = {
  start: { key: 'sectionCategories.start', fallback: 'Начало' },
  explain: { key: 'sectionCategories.explain', fallback: 'Объяснить' },
  show: { key: 'sectionCategories.show', fallback: 'Показать' },
  trust: { key: 'sectionCategories.trust', fallback: 'Доверие' },
  sell: { key: 'sectionCategories.sell', fallback: 'Продать' },
  capture: { key: 'sectionCategories.capture', fallback: 'Заявки' },
  book: { key: 'sectionCategories.book', fallback: 'Запись' },
  events: { key: 'sectionCategories.events', fallback: 'События' },
  community: { key: 'sectionCategories.community', fallback: 'Сообщество' },
  contact: { key: 'sectionCategories.contact', fallback: 'Контакты' },
};

export function getPatternsByCategory(category: SectionCategory): SectionPattern[] {
  return SECTION_PATTERNS.filter((p) => p.category === category);
}

/**
 * Context-aware recommendations for the READY tab: prefers the niche, then
 * fills the intents the page is still missing, in funnel order.
 */
export function recommendPatterns(
  existingBlockTypes: string[],
  niche?: string | null,
  limit = 6,
): SectionPattern[] {
  const present = new Set(existingBlockTypes);
  const scored = SECTION_PATTERNS.map((p) => {
    let score = 0;
    if (niche && p.niches?.includes(niche)) score += 4;
    const buildTypes = p.build().map((b) => b.type);
    const alreadyCovered = buildTypes.some((t) => present.has(t));
    if (!alreadyCovered) score += 3;
    score += Math.max(0, 3 - SECTION_CATEGORY_ORDER.indexOf(p.category) * 0.1);
    return { p, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.p);
}
