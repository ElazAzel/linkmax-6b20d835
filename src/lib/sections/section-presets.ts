/**
 * Section presets — Sprint 2: reusable compositions of existing blocks.
 * Each preset returns a fresh Block[] with unique IDs, ready to seed a new page
 * or be appended to an existing one. No new block types — pure composition.
 */
import type { Block } from '@/types/blocks';
import { generateBlockId } from '@/services/pages';

export type SectionPresetId =
  | 'blank'
  | 'hero'
  | 'about'
  | 'pricing'
  | 'faq'
  | 'contact'
  | 'cta';

export interface SectionPreset {
  id: SectionPresetId;
  labelKey: string;
  labelFallback: string;
  descKey: string;
  descFallback: string;
  build: () => Block[];
}

const id = (t: string) => generateBlockId(t);

export const SECTION_PRESETS: SectionPreset[] = [
  {
    id: 'blank',
    labelKey: 'sections.blank.label',
    labelFallback: 'Пустая',
    descKey: 'sections.blank.desc',
    descFallback: 'Начать с чистого листа',
    build: () => [],
  },
  {
    id: 'hero',
    labelKey: 'sections.hero.label',
    labelFallback: 'Hero — обложка',
    descKey: 'sections.hero.desc',
    descFallback: 'Заголовок, подзаголовок и CTA-кнопка',
    build: () => [
      {
        id: id('text'),
        type: 'text',
        content: 'Заголовок, который продаёт',
        style: 'heading',
        alignment: 'center',
      } as Block,
      {
        id: id('text'),
        type: 'text',
        content: 'Короткое описание оффера. 1–2 предложения о том, что вы предлагаете и для кого.',
        style: 'paragraph',
        alignment: 'center',
      } as Block,
      {
        id: id('button'),
        type: 'button',
        title: 'Узнать подробнее',
        url: '#',
        alignment: 'center',
        width: 'medium',
        size: 'lg',
      } as Block,
    ],
  },
  {
    id: 'about',
    labelKey: 'sections.about.label',
    labelFallback: 'О нас',
    descKey: 'sections.about.desc',
    descFallback: 'Аватар, имя и краткое описание',
    build: () => [
      {
        id: id('text'),
        type: 'text',
        content: 'О нас',
        style: 'heading',
        alignment: 'left',
      } as Block,
      {
        id: id('text'),
        type: 'text',
        content:
          'Мы помогаем клиентам достигать результата. Расскажите о вашей миссии, опыте и подходе в 2–3 абзацах.',
        style: 'paragraph',
        alignment: 'left',
      } as Block,
      {
        id: id('separator'),
        type: 'separator',
        variant: 'solid',
        thickness: 'thin',
        width: 'half',
        spacing: 'md',
      } as Block,
    ],
  },
  {
    id: 'pricing',
    labelKey: 'sections.pricing.label',
    labelFallback: 'Цены',
    descKey: 'sections.pricing.desc',
    descFallback: 'Заголовок и блок с тарифами',
    build: () => [
      {
        id: id('text'),
        type: 'text',
        content: 'Тарифы',
        style: 'heading',
        alignment: 'center',
      } as Block,
      {
        id: id('text'),
        type: 'text',
        content: 'Выберите подходящий план — обновление в любой момент.',
        style: 'paragraph',
        alignment: 'center',
      } as Block,
      {
        id: id('button'),
        type: 'button',
        title: 'Связаться',
        url: '#',
        alignment: 'center',
        width: 'medium',
        size: 'md',
      } as Block,
    ],
  },
  {
    id: 'faq',
    labelKey: 'sections.faq.label',
    labelFallback: 'FAQ',
    descKey: 'sections.faq.desc',
    descFallback: 'Заголовок и список вопросов-ответов',
    build: () => [
      {
        id: id('text'),
        type: 'text',
        content: 'Частые вопросы',
        style: 'heading',
        alignment: 'center',
      } as Block,
      {
        id: id('faq'),
        type: 'faq',
        title: '',
        items: [
          { id: crypto.randomUUID(), question: 'Как начать работу?', answer: 'Свяжитесь с нами — расскажем за 5 минут.' },
          { id: crypto.randomUUID(), question: 'Сколько стоит?', answer: 'Зависит от объёма работ. Бесплатная консультация — на странице «Контакты».' },
          { id: crypto.randomUUID(), question: 'Какие гарантии?', answer: 'Возврат средств в течение 14 дней без вопросов.' },
        ],
      } as Block,
    ],
  },
  {
    id: 'contact',
    labelKey: 'sections.contact.label',
    labelFallback: 'Контакты',
    descKey: 'sections.contact.desc',
    descFallback: 'Заголовок, мессенджеры и карта',
    build: () => [
      {
        id: id('text'),
        type: 'text',
        content: 'Свяжитесь с нами',
        style: 'heading',
        alignment: 'center',
      } as Block,
      {
        id: id('messenger'),
        type: 'messenger',
        title: '',
        messengers: [
          { platform: 'whatsapp', username: '' },
          { platform: 'telegram', username: '' },
        ],
      } as Block,
    ],
  },
  {
    id: 'cta',
    labelKey: 'sections.cta.label',
    labelFallback: 'Призыв к действию',
    descKey: 'sections.cta.desc',
    descFallback: 'Финальный блок с кнопкой',
    build: () => [
      {
        id: id('separator'),
        type: 'separator',
        variant: 'gradient',
        thickness: 'medium',
        width: 'full',
        spacing: 'lg',
      } as Block,
      {
        id: id('text'),
        type: 'text',
        content: 'Готовы начать?',
        style: 'heading',
        alignment: 'center',
      } as Block,
      {
        id: id('button'),
        type: 'button',
        title: 'Оставить заявку',
        url: '#',
        alignment: 'center',
        width: 'full',
        size: 'lg',
      } as Block,
    ],
  },
];

export function getSectionPreset(id: SectionPresetId): SectionPreset | undefined {
  return SECTION_PRESETS.find((s) => s.id === id);
}
